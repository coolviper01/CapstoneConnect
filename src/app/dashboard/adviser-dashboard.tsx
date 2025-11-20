
'use client';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Check, X, FileText, Users, PlusCircle, Trash2, Bot, Copy, QrCode, Play, Square, CheckCircle, ThumbsUp, ThumbsDown, Lock, Printer } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Consultation, CapstoneProject, Attendee, DiscussionPoint, Student, Advisor } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScheduleConsultationForm } from './schedule-consultation-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QRCode from "react-qr-code";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ConsultationReport } from './consultation-report';


function ConsultationDetail({ consultation, advisor, setOpen }: { consultation: Consultation, advisor?: Advisor, setOpen: (isOpen: boolean) => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const consultationRef = useMemoFirebase(() => doc(firestore, "consultations", consultation.id), [firestore, consultation.id]);

    const studentIds = useMemo(() => consultation.studentIds || [], [consultation.studentIds]);
    const studentsQuery = useMemoFirebase(() => {
        if (studentIds.length === 0) return null;
        return query(collection(firestore, 'students'), where('id', 'in', studentIds));
    }, [firestore, studentIds]);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

    const [discussionPoints, setDiscussionPoints] = useState<DiscussionPoint[]>([]);
    const [rejectionPoint, setRejectionPoint] = useState<DiscussionPoint | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isReportOpen, setReportOpen] = useState(false);

    useEffect(() => {
        if (consultation) {
            setDiscussionPoints(Array.isArray(consultation.discussionPoints) ? consultation.discussionPoints : []);
            // GUARANTEE: Ensure attendance code exists.
            if (!consultation.attendanceCode) {
                 const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                 updateDoc(consultationRef, { attendanceCode: newCode });
            }
        }
    }, [consultation, consultationRef]);

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');
    
    const addDiscussionPoint = () => {
        const newPoint: DiscussionPoint = { id: new Date().toISOString(), adviserComment: "", status: 'To Do', category: 'Documentation' };
        setDiscussionPoints(prev => [...prev, newPoint]);
    };

    const updateDiscussionPoint = (id: string, comment: string) => {
        setDiscussionPoints(prev => prev.map(p => p.id === id ? { ...p, adviserComment: comment } : p));
    };
    
    const updateDiscussionPointCategory = (id: string, category: 'Documentation' | 'Prototype') => {
        setDiscussionPoints(prev => prev.map(p => p.id === id ? { ...p, category: category } : p));
    };

    const removeDiscussionPoint = (id: string) => {
        const newPoints = discussionPoints.filter(p => p.id !== id);
        setDiscussionPoints(newPoints);
        updateDoc(consultationRef, { discussionPoints: newPoints });
    };

    const saveDiscussionPoints = async () => {
        if (consultationRef) {
            await updateDoc(consultationRef, { discussionPoints });
            toast({ title: 'Discussion Points Saved!', description: 'Your comments have been updated.' });
        }
    };
    
    const toggleAttendance = async () => {
        if (consultationRef) {
            const newStatus = !consultation.isAttendanceOpen;
            await updateDoc(consultationRef, { isAttendanceOpen: newStatus });
            toast({ 
                title: newStatus ? 'Attendance Started!' : 'Attendance Stopped!', 
                description: newStatus ? 'Students can now check in.' : 'Students can no longer check in.' 
            });
        }
    };

    const handleUpdateReview = async (pointId: string, status: 'Approved' | 'Rejected') => {
        const newPoints = discussionPoints.map(p => {
            if (p.id === pointId) {
                return { ...p, studentUpdateStatus: status, adviserFeedback: status === 'Approved' ? '' : p.adviserFeedback };
            }
            return p;
        });
        setDiscussionPoints(newPoints);
        await updateDoc(consultationRef, { discussionPoints: newPoints });
        toast({ title: `Update ${status}`, description: `The student's update has been marked as ${status.toLowerCase()}.` });
    };

    const handleRejectWithReason = async () => {
        if (!rejectionPoint || !rejectionReason || !consultationRef) return;

        const newPoints = discussionPoints.map(p => {
            if (p.id === rejectionPoint.id) {
                return { ...p, studentUpdateStatus: 'Rejected' as const, adviserFeedback: rejectionReason };
            }
            return p;
        });

        setDiscussionPoints(newPoints);
        await updateDoc(consultationRef, { discussionPoints: newPoints });
        toast({ title: `Update Rejected`, description: `The student's update has been rejected with feedback.` });
        setRejectionPoint(null);
        setRejectionReason("");
    };

    const getStatusBadgeVariant = (status: DiscussionPoint['studentUpdateStatus']) => {
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

    const handleCloseConsultation = async () => {
        if (consultationRef) {
            await updateDoc(consultationRef, { status: 'Completed' });
            toast({
                title: "Consultation Closed",
                description: "This consultation has been marked as completed."
            });
        }
    };

    const hasPendingUpdates = discussionPoints.some(p => p.studentUpdateStatus === 'Pending');
    const isConsultationClosed = consultation.status === 'Completed';


    return (
        <div className="relative pt-12">
             <Button variant="ghost" size="icon" className="absolute top-0 right-0" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </Button>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Consultation Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{consultation.date ? new Date(consultation.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Not Scheduled"}</span></div>
                            <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><span>{consultation.startTime && consultation.endTime ? `${consultation.startTime} - ${consultation.endTime}` : 'Not Scheduled'}</span></div>
                            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{consultation.venue || 'Not Scheduled'}</span></div>
                            
                            {isLoadingStudents && <Skeleton className="h-10 w-full" />}
                            {!isLoadingStudents && students && students.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <Users className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="font-medium">Students</p>
                                        <ul className="text-muted-foreground">{students.map(s => <li key={s.id}>{s.name}</li>)}</ul>
                                    </div>
                                </div>
                            )}
                            {!isLoadingStudents && (!students || students.length === 0) && (
                            <div className="flex items-start gap-3">
                                    <Users className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="font-medium">Students</p>
                                        <p className="text-muted-foreground">No students assigned.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance</CardTitle>
                            <CardDescription>Manage student check-in for this session.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        {!isConsultationClosed && (
                            <div className="bg-muted p-4 rounded-lg flex flex-col items-center gap-4">
                                {consultation.isAttendanceOpen && consultation.attendanceCode && (
                                    <>
                                        <div style={{ height: "auto", margin: "0 auto", maxWidth: 128, width: "100%" }}>
                                            <QRCode
                                                size={256}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                value={consultation.attendanceCode}
                                                viewBox={`0 0 256 256`}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Manual Code</p>
                                            <p className="text-2xl font-bold tracking-widest">{consultation.attendanceCode}</p>
                                        </div>
                                    </>
                                )}
                                <Button onClick={toggleAttendance} variant={consultation.isAttendanceOpen ? 'destructive' : 'default'} className="w-full">
                                    {consultation.isAttendanceOpen ? <><Square className="mr-2 h-4 w-4"/>Stop Attendance</> : <><Play className="mr-2 h-4 w-4"/>Start Attendance</>}
                                </Button>
                            </div>
                        )}
                            <div className="space-y-2">
                                <h4 className="font-medium">Present Students</h4>
                                {isLoadingStudents && <Skeleton className="h-10 w-full" />}
                                {!isLoadingStudents && (!consultation.attendees || consultation.attendees.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-2">No students have checked in yet.</p>
                                )}
                                {!isLoadingStudents && consultation.attendees && consultation.attendees.length > 0 && (
                                    <ul className="space-y-2">
                                        {consultation.attendees.map(attendee => {
                                            const student = students?.find(s => s.id === attendee.studentId);
                                            return (
                                                <li key={attendee.studentId} className="flex items-center gap-3 text-sm">
                                                    <Avatar className="h-8 w-8"><AvatarImage src={student?.avatarUrl} /><AvatarFallback>{getInitials(attendee.name)}</AvatarFallback></Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{attendee.name}</p>
                                                        <p className="text-xs text-muted-foreground">Checked in at {new Date(attendee.timestamp).toLocaleTimeString()}</p>
                                                    </div>
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-semibold">Discussion Points</CardTitle>
                            { !isConsultationClosed ? (
                                <CardDescription>Add comments and action items for the students. Review their updates here.</CardDescription>
                            ) : (
                                <CardDescription>This consultation is closed. View the summary below.</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {discussionPoints.map((point, index) => (
                                <div key={point.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                    <span className="font-bold text-muted-foreground pt-2">{index + 1}.</span>
                                    <div className="flex-1 grid gap-3">
                                        <Textarea value={point.adviserComment} onChange={(e) => updateDiscussionPoint(point.id, e.target.value)} className="flex-1" placeholder="Enter discussion point or action item..." readOnly={isConsultationClosed} />
                                        <div className='flex items-center gap-2'>
                                            <span className="text-xs font-semibold text-muted-foreground">CATEGORY</span>
                                            <Select
                                                value={point.category}
                                                onValueChange={(value: 'Documentation' | 'Prototype') => updateDiscussionPointCategory(point.id, value)}
                                                disabled={isConsultationClosed}
                                            >
                                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                                    <SelectValue placeholder="Set category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Documentation">Documentation</SelectItem>
                                                    <SelectItem value="Prototype">Prototype</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {point.studentResponse && (
                                            <div className='bg-muted/50 p-3 rounded-md space-y-3'>
                                                <div className='flex justify-between items-center'>
                                                    <h4 className="font-semibold text-sm">Student's Update</h4>
                                                    {point.studentUpdateStatus && <Badge variant={getStatusBadgeVariant(point.studentUpdateStatus)}>{point.studentUpdateStatus}</Badge>}
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{point.studentResponse}</p>
                                                
                                                {point.studentUpdateStatus === 'Pending' && !isConsultationClosed && (
                                                    <div className="flex justify-end gap-2 pt-2 border-t">
                                                        <Button size="sm" variant="outline" onClick={() => setRejectionPoint(point)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                                                        <Button size="sm" onClick={() => handleUpdateReview(point.id, 'Approved')}><Check className="mr-2 h-4 w-4" /> Approve</Button>
                                                    </div>
                                                )}
                                                
                                                {point.studentUpdateStatus === 'Rejected' && point.adviserFeedback && (
                                                    <Alert variant="destructive" className="mt-2">
                                                        <AlertTitle>Your Feedback</AlertTitle>
                                                        <AlertDescription>{point.adviserFeedback}</AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {!isConsultationClosed && <Button variant="ghost" size="icon" onClick={() => removeDiscussionPoint(point.id)}><Trash2 className="h-4 w-4" /></Button>}
                                </div>
                            ))}
                            {!isConsultationClosed && <Button variant="outline" onClick={addDiscussionPoint}><PlusCircle className="mr-2 h-4 w-4" /> Add Point</Button>}
                        </CardContent>
                        <CardFooter className='flex justify-between'>
                        {!isConsultationClosed ? (
                            <>
                                <Button onClick={saveDiscussionPoints}>Save Discussion Points</Button>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleCloseConsultation}
                                                    disabled={hasPendingUpdates}
                                                >
                                                    <Lock className="mr-2 h-4 w-4" /> Close Consultation
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        {hasPendingUpdates && (
                                            <TooltipContent>
                                                <p>You must approve or reject all pending student updates first.</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            </>
                        ) : (
                            <Button onClick={() => setReportOpen(true)}><Printer className="mr-2 h-4 w-4" /> Print Report</Button>
                        )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
            
            <AlertDialog open={!!rejectionPoint} onOpenChange={() => setRejectionPoint(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject Student Update?</AlertDialogTitle>
                        <AlertDialogDescription>Please provide a reason for rejecting this update. This will be shown to the student.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        placeholder="e.g., The implementation is incomplete, please fix..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRejectWithReason} disabled={!rejectionReason}>Confirm Rejection</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Dialog open={isReportOpen} onOpenChange={setReportOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Consultation Report</DialogTitle>
                        <DialogDescription>
                            This is a printable summary of the completed consultation.
                        </DialogDescription>
                    </DialogHeader>
                    {advisor && <ConsultationReport consultation={consultation} advisor={advisor} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ConsultationCard({ consultation }: { consultation: Consultation }) {
  const [open, setOpen] = useState(false);
  const getBadgeVariant = (status: Consultation['status']): "default" | "secondary" | "outline" | "destructive" => {
    switch(status) {
        case 'Scheduled': return 'default';
        case 'Completed': return 'secondary';
        case 'Pending Approval': return 'outline';
        case 'Cancelled': return 'destructive';
        default: return 'secondary';
    }
  }

  const firestore = useFirestore();
  
  const advisorDocRef = useMemoFirebase(() => {
      if (!consultation.advisorId) return null;
      return doc(firestore, 'advisors', consultation.advisorId);
  }, [firestore, consultation.advisorId]);
  const { data: advisor } = useDoc<Advisor>(advisorDocRef);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-semibold">{consultation.capstoneTitle}</CardTitle>
                <CardDescription>{consultation.blockGroupNumber}</CardDescription>
            </div>
            <Badge variant={getBadgeVariant(consultation.status)}>{consultation.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 text-sm">
          <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{consultation.date ? new Date(consultation.date).toLocaleDateString() : 'Not Scheduled'}</span></div>
          <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><span>{consultation.startTime && consultation.endTime ? `${consultation.startTime} - ${consultation.endTime}`: 'Not Scheduled'}</span></div>
          <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{consultation.venue || 'Not Scheduled'}</span></div>
        </CardContent>
        <CardFooter>
          <CollapsibleTrigger asChild>
            <Button className="w-full" variant="secondary"><FileText className="mr-2 h-4 w-4" />{open ? 'Hide Details' : 'View Details'}</Button>
          </CollapsibleTrigger>
        </CardFooter>
      </Card>
      {open && 
        <CollapsibleContent>
            <ConsultationDetail consultation={consultation} advisor={advisor} setOpen={setOpen} />
        </CollapsibleContent>
      }
    </Collapsible>
  )
}

export default function AdviserDashboard() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [projectToApprove, setProjectToApprove] = useState<CapstoneProject | null>(null);
  const [projectToReject, setProjectToReject] = useState<CapstoneProject | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestToSchedule, setRequestToSchedule] = useState<Consultation | null>(null);

  // --- QUERIES ---
  const consultationsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'consultations'), where('advisorId', '==', user.uid)) : null,
    [firestore, user]
  );
  const { data: allConsultations, isLoading: isLoadingConsultations } = useCollection<Consultation>(consultationsQuery);

  const pendingProjectsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, "capstoneProjects"), where("adviserId", "==", user.uid), where("status", "==", "Pending Adviser Approval")) : null,
    [firestore, user]
  );
  const { data: pendingProjects, isLoading: isLoadingProjects } = useCollection<CapstoneProject>(pendingProjectsQuery);

  
  // --- MEMOIZED DATA ---
  const scheduledConsultations = useMemo(() => allConsultations?.filter(c => c.status === 'Scheduled').sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()), [allConsultations]);
  const pastConsultations = useMemo(() => allConsultations?.filter(c => c.status === 'Completed' || c.status === 'Cancelled').sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()), [allConsultations]);
  const pendingConsultationRequests = useMemo(() => allConsultations?.filter(c => c.status === 'Pending Approval'), [allConsultations]);

  // --- HANDLERS ---
  const handleApproveProject = async (project: CapstoneProject) => {
    if (!project) return;
    const projectRef = doc(firestore, 'capstoneProjects', project.id);
    await updateDoc(projectRef, { status: 'Approved' });
    toast({ title: "Project Approved!", description: `"${project.title}" is now approved.` });
    setProjectToApprove(null);
  };

  const handleRejectProject = async () => {
    if (!projectToReject) return;
    const projectRef = doc(firestore, 'capstoneProjects', projectToReject.id);
    await updateDoc(projectRef, { status: 'Rejected', rejectionReason: rejectionReason });
    toast({ variant: "destructive", title: "Project Rejected", description: `"${projectToReject.title}" has been rejected.` });
    setProjectToReject(null);
    setRejectionReason("");
  };
  
  const handleScheduleSuccess = () => {
    toast({ title: 'Consultation Scheduled!', description: 'The consultation has been added to the calendar.'});
    setRequestToSchedule(null);
  }
  
  // --- RENDER FUNCTIONS ---
  const renderConsultationList = (consultationsToRender: Consultation[] | undefined, loading: boolean, emptyMessage: string) => {
    if (loading) {
      return Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
      ));
    }
    if (!consultationsToRender || consultationsToRender.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground"><p>{emptyMessage}</p></div>
      );
    }
    return (
        <div className="grid gap-6">
            {consultationsToRender.map(c => (
              <ConsultationCard 
                key={c.id} 
                consultation={c} 
              />
            ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Adviser Dashboard" description="Manage your capstone project approvals and consultations." />
      
      <Tabs defaultValue="approvals">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="approvals">
                Project Approvals
                {pendingProjects && pendingProjects.length > 0 && <Badge className="ml-2">{pendingProjects.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="requests">
                Consultation Requests
                {pendingConsultationRequests && pendingConsultationRequests.length > 0 && <Badge className="ml-2">{pendingConsultationRequests.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="consultations">My Consultations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="approvals">
          <Card>
            <CardHeader><CardTitle>Pending Project Approvals</CardTitle><CardDescription>Review projects that have selected you as an adviser.</CardDescription></CardHeader>
            <CardContent>
              {isLoadingProjects ? <Skeleton className="h-40 w-full" /> : 
                (!pendingProjects || pendingProjects.length === 0) ? (
                  <div className="text-center py-12 text-muted-foreground"><p>No pending project approvals.</p></div>
              ) : (
                  <div className="grid gap-6">
                      {pendingProjects.map(project => (
                          <Card key={project.id} className="bg-muted/30"><CardHeader><CardTitle>{project.title}</CardTitle></CardHeader>
                              <CardContent><p className="text-sm">{project.details}</p></CardContent>
                              <CardFooter className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setProjectToReject(project)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                                  <Button onClick={() => setProjectToApprove(project)}><Check className="mr-2 h-4 w-4" /> Approve</Button>
                              </CardFooter>
                          </Card>
                      ))}
                  </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
            <Card>
                <CardHeader><CardTitle>Pending Consultation Requests</CardTitle><CardDescription>Students have requested consultations for these projects. Please review and schedule.</CardDescription></CardHeader>
                <CardContent>
                {isLoadingConsultations ? <Skeleton className="h-40 w-full" /> : 
                    (!pendingConsultationRequests || pendingConsultationRequests.length === 0) ? (
                        <div className="text-center py-12 text-muted-foreground"><p>No pending consultation requests.</p></div>
                    ) : (
                        <div className="grid gap-6">
                            {pendingConsultationRequests.map(request => (
                                <Card key={request.id} className="bg-muted/30">
                                    <CardHeader><CardTitle>{request.capstoneTitle}</CardTitle></CardHeader>
                                    <CardContent>
                                        <p className="font-semibold text-sm mb-2">Proposed Agenda:</p>
                                        <p className="text-sm whitespace-pre-wrap">{request.agenda}</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-end">
                                        <Button onClick={() => setRequestToSchedule(request)}><Calendar className="mr-2 h-4 w-4" /> Schedule</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="consultations">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-headline font-bold mb-4">Open Consultations</h2>
                {renderConsultationList(scheduledConsultations, isLoadingConsultations, "No open consultations.")}
              </div>
              <div>
                <h2 className="text-2xl font-headline font-bold mb-4">Closed Consultations</h2>
                {renderConsultationList(pastConsultations, isLoadingConsultations, "No past consultations found.")}
              </div>
            </div>
        </TabsContent>
      </Tabs>
      
       {/* Approve Project Dialog */}
      <AlertDialog open={!!projectToApprove} onOpenChange={() => setProjectToApprove(null)}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Approve this project?</AlertDialogTitle><AlertDialogDescription>This will allow students to request consultations. Are you sure?</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleApproveProject(projectToApprove!)}>Yes, Approve Project</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      {/* Reject Project Dialog */}
      <AlertDialog open={!!projectToReject} onOpenChange={() => setProjectToReject(null)}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Reject this project?</AlertDialogTitle><AlertDialogDescription>Please provide a reason for rejection. This will be shown to the student.</AlertDialogDescription></AlertDialogHeader>
              <div className="grid gap-4 py-4"><Textarea placeholder="Type your rejection reason here..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} /></div>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRejectProject} disabled={!rejectionReason}>Confirm Rejection</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      {/* Schedule Consultation Dialog */}
      <Dialog open={!!requestToSchedule} onOpenChange={() => setRequestToSchedule(null)}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Schedule Consultation</DialogTitle>
                  <DialogDescription>Set the date, time, and venue for this consultation.</DialogDescription>
              </DialogHeader>
              {requestToSchedule && <ScheduleConsultationForm consultation={requestToSchedule} onFinished={handleScheduleSuccess} />}
          </DialogContent>
      </Dialog>
    </div>
  );
}

    