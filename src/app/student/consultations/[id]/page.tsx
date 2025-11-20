
'use client';
import { useParams } from "next/navigation";
import Link from 'next/link';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, FileText, Code, QrCode, ScanLine, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, query, where, arrayUnion } from "firebase/firestore";
import type { Consultation, Student, DiscussionPoint, Attendee } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

function AttendanceScanner({ onCodeScanned, onClose }: { onCodeScanned: (code: string) => void; onClose: () => void; }) {
  const webcamRef = useRef<Webcam>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(image, 0, 0, image.width, image.height);
          const imageData = context.getImageData(0, 0, image.width, image.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            onCodeScanned(code.data);
            onClose();
          }
        }
      };
    }
  }, [webcamRef, onCodeScanned, onClose]);
  
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (webcamRef.current && webcamRef.current.video) {
            webcamRef.current.video.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to scan a QR code.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);
  
  useEffect(() => {
    const interval = setInterval(() => {
        if(hasCameraPermission) {
            capture();
        }
    }, 500); // Check for QR code every 500ms
    return () => clearInterval(interval);
  }, [capture, hasCameraPermission]);

  return (
    <div className="flex flex-col items-center gap-4">
        {hasCameraPermission === null && <p>Requesting camera permission...</p>}
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>Please allow camera access to use the scanner.</AlertDescription>
            </Alert>
        )}
        <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full rounded-md"
            videoConstraints={{ facingMode: "environment" }}
        />
        <p className="text-sm text-muted-foreground">Point your camera at the QR code</p>
    </div>
  );
}


export default function StudentConsultationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const consultationRef = useMemoFirebase(() => doc(firestore, "consultations", id), [firestore, id]);
  const { data: consultation, isLoading, error } = useDoc<Consultation>(consultationRef);

  const [discussionPoints, setDiscussionPoints] = useState<DiscussionPoint[]>([]);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const studentIds = useMemo(() => consultation?.studentIds || [], [consultation]);
  const studentsQuery = useMemoFirebase(() => {
    if (studentIds.length === 0) return null;
    return query(collection(firestore, 'students'), where('id', 'in', studentIds));
  }, [firestore, studentIds]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  
  const hasAttended = useMemo(() => {
    if (!user || !consultation?.attendees) return false;
    return consultation.attendees.some(a => a.studentId === user.uid);
  }, [user, consultation?.attendees]);

  useEffect(() => {
    if (consultation) {
      setDiscussionPoints(Array.isArray(consultation.discussionPoints) ? consultation.discussionPoints : []);
    }
  }, [consultation]);

  const updateDiscussionPoint = (id: string, response: string) => {
    const newPoints = discussionPoints.map(p => p.id === id ? { ...p, studentResponse: response, studentUpdateStatus: 'Pending' as const } : p);
    setDiscussionPoints(newPoints);
  }

  const updateDiscussionStatus = (id: string, status: 'To Do' | 'On-going' | 'Done') => {
    const newPoints = discussionPoints.map(p => p.id === id ? { ...p, status: status } : p);
    setDiscussionPoints(newPoints);
  }

  const saveUpdates = () => {
    if (consultationRef) {
      updateDocumentNonBlocking(consultationRef, { discussionPoints: discussionPoints });
      toast({ title: 'Updates Saved!', description: 'Your responses have been saved and sent for adviser review.' });
    }
  }
  
  const handleCheckIn = (code: string) => {
    if (!user || !consultation || !consultation.isAttendanceOpen) {
        toast({ variant: "destructive", title: "Attendance is not open", description: "The adviser has not started the attendance session."});
        return;
    }

    if (code.trim() === consultation.attendanceCode) {
        const newAttendee: Attendee = {
            studentId: user.uid,
            name: user.displayName || "Unknown Student",
            timestamp: new Date().toISOString()
        };
        updateDocumentNonBlocking(consultationRef, {
            attendees: arrayUnion(newAttendee)
        });
        toast({ title: "Attendance Recorded!", description: "You have successfully checked in." });
        setManualCode("");
        setScannerOpen(false);
    } else {
        toast({ variant: "destructive", title: "Invalid Code", description: "The attendance code is incorrect."});
    }
  };

  const getStatusBadgeVariant = (status: DiscussionPoint['status']) => {
    switch (status) {
      case 'Done':
        return 'default';
      case 'On-going':
        return 'secondary';
      case 'To Do':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getUpdateStatusBadgeVariant = (status: DiscussionPoint['studentUpdateStatus']) => {
    switch (status) {
        case 'Approved':
            return 'default';
        case 'Pending':
            return 'secondary';
        case 'Rejected':
            return 'destructive';
        default:
            return 'outline';
    }
  };
  
  const getCategoryIcon = (category: DiscussionPoint['category']) => {
    switch(category) {
        case 'Documentation':
            return <FileText className="h-4 w-4" />;
        case 'Prototype':
            return <Code className="h-4 w-4" />;
        default:
            return null;
    }
  }

  if (isLoading || isLoadingStudents) {
    return (
       <div className="flex flex-col gap-6">
          <PageHeader title={<Skeleton className="h-9 w-3/4" />} description={<Skeleton className="h-6 w-1/2" />} />
          <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col gap-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-1/4" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /></CardContent></Card>
              </div>
              <div className="md:col-span-2 flex flex-col gap-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
              </div>
          </div>
       </div>
    )
  }

  if (!consultation || error) {
    return (
        <div className="flex flex-col gap-6 items-center">
            <PageHeader title="Consultation Not Found" />
             <Alert variant="destructive" className="max-w-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error 404</AlertTitle>
                <AlertDescription>
                    The consultation with ID "{id}" does not exist or you may not have permission to view it.
                </AlertDescription>
            </Alert>
            <Button asChild>
                <Link href="/student">Back to My Consultations</Link>
            </Button>
        </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={consultation.capstoneTitle} description="Consultation Details" />
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Consultation Info</CardTitle>
              <CardDescription>{consultation.blockGroupNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{consultation.date ? new Date(consultation.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Not Scheduled"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{consultation.startTime && consultation.endTime ? `${consultation.startTime} - ${consultation.endTime}` : 'Not Scheduled'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{consultation.venue || 'Not Scheduled'}</span>
              </div>
              {students && students.length > 0 && (
                 <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                    <p className="font-medium">Students</p>
                    <ul className="text-muted-foreground">
                        {students.map(s => <li key={s.id}>{s.name}</li>)}
                    </ul>
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Attendance Check-in</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  {hasAttended ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>You are Checked In!</AlertTitle>
                        <AlertDescription>
                            Your attendance for this consultation has been recorded.
                        </AlertDescription>
                      </Alert>
                  ) : consultation.isAttendanceOpen ? (
                      <>
                          <Button className="w-full" onClick={() => setScannerOpen(true)}><QrCode className="mr-2 h-4 w-4"/> Scan QR Code</Button>
                          <div className="flex items-center gap-2">
                            <hr className="flex-grow border-t"/>
                            <span className="text-xs text-muted-foreground">OR</span>
                            <hr className="flex-grow border-t"/>
                          </div>
                          <div className="space-y-2">
                             <Input 
                                placeholder="Enter 6-digit code" 
                                value={manualCode} 
                                onChange={(e) => setManualCode(e.target.value)}
                                maxLength={6}
                              />
                             <Button className="w-full" variant="secondary" onClick={() => handleCheckIn(manualCode)} disabled={manualCode.length !== 6}>Submit Code</Button>
                          </div>
                      </>
                  ) : (
                      <Alert>
                          <ScanLine className="h-4 w-4" />
                          <AlertTitle>Attendance Closed</AlertTitle>
                          <AlertDescription>
                              The attendance session is not currently active.
                          </AlertDescription>
                      </Alert>
                  )}
              </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Discussion Points & Action Items</CardTitle>
              <CardDescription>
                Review comments from your adviser and update your progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(discussionPoints && discussionPoints.length > 0) ? discussionPoints.map((point, index) => (
                <div key={point.id} className="grid gap-4 p-4 border rounded-lg">
                   <div>
                     <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold">Adviser's Comment #{index + 1}</p>
                        <Badge variant="outline" className="flex items-center gap-1.5">
                            {getCategoryIcon(point.category)}
                            {point.category}
                        </Badge>
                     </div>
                     <p className="text-sm bg-muted p-3 rounded-md">{point.adviserComment || "No comment from adviser."}</p>
                   </div>
                   
                   <div className="grid gap-2">
                     <label className="text-sm font-semibold">Your Response / Update</label>
                     {point.studentUpdateStatus === 'Rejected' && point.adviserFeedback && (
                        <Alert variant="destructive">
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>Adviser Feedback</AlertTitle>
                            <AlertDescription>{point.adviserFeedback}</AlertDescription>
                        </Alert>
                     )}
                     <Textarea 
                       value={point.studentResponse || ""}
                       onChange={(e) => updateDiscussionPoint(point.id, e.target.value)}
                       placeholder="Describe the activity you made or provide an update..."
                       readOnly={point.studentUpdateStatus === 'Approved' || point.studentUpdateStatus === 'Pending'}
                     />
                   </div>
                   
                   <div className="flex justify-between items-center">
                     <div className="grid gap-2">
                        <label className="text-sm font-semibold">Status</label>
                        <Select
                            value={point.status}
                            onValueChange={(value: 'To Do' | 'On-going' | 'Done') => updateDiscussionStatus(point.id, value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="To Do">To Do</SelectItem>
                                <SelectItem value="On-going">On-going</SelectItem>
                                <SelectItem value="Done">Done</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                      <div className="flex flex-col items-end gap-2">
                        {point.studentUpdateStatus && (
                            <Badge variant={getUpdateStatusBadgeVariant(point.studentUpdateStatus)}>
                                Update: {point.studentUpdateStatus}
                            </Badge>
                        )}
                        <Badge variant={getStatusBadgeVariant(point.status)}>{point.status}</Badge>
                      </div>
                   </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-8">No discussion points from the adviser for this consultation yet.</p>
              )}
            </CardContent>
            {(discussionPoints && discussionPoints.length > 0) && (
              <CardFooter>
                <Button onClick={saveUpdates}>Save & Submit Updates</Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      <Dialog open={isScannerOpen} onOpenChange={setScannerOpen}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Scan Attendance QR Code</DialogTitle>
                <DialogDescription>Point your camera to the QR code displayed by your adviser.</DialogDescription>
            </DialogHeader>
            <AttendanceScanner onCodeScanned={handleCheckIn} onClose={() => setScannerOpen(false)} />
          </DialogContent>
      </Dialog>
    </div>
  );
}
