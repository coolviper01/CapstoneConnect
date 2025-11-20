
'use client';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Check, X, FileText, Users, PlusCircle, Trash2, Bot, Copy } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Consultation, CapstoneProject, Attendee, DiscussionPoint, Student } from '@/lib/types';
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
import { Input } from "@/components/ui/input";
import { getTalkingPoints } from '@/app/dashboard/consultations/actions';

function ConsultationDetail({ consultation }: { consultation: Consultation }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const consultationRef = useMemoFirebase(() => doc(firestore, "consultations", consultation.id), [firestore, consultation.id]);

    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [discussionPoints, setDiscussionPoints] = useState<DiscussionPoint[]>([]);
    const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
    const [isAIPending, setIsAIPending] = useState(true);
    const [aiError, setAiError] = useState<string | null>(null);

    useEffect(() => {
        if (consultation) {
            setAttendees(Array.isArray(consultation.attendees) ? consultation.attendees : []);
            setDiscussionPoints(Array.isArray(consultation.discussionPoints) ? consultation.discussionPoints : []);
        }
    }, [consultation]);
    
    useEffect(() => {
        const fetchTalkingPoints = async () => {
          if (!consultation) return;
          setIsAIPending(true);
          setAiError(null);
          
          const {
            semester,
            academicYear,
            capstoneTitle,
            blockGroupNumber,
            date,
            startTime,
            endTime,
            venue,
            projectDetails
          } = consultation;

          const result = await getTalkingPoints({
            semester,
            academicYear,
            capstoneTitle,
            blockGroupNumber,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            startTime: startTime || '',
            endTime: endTime || '',
            venue: venue || '',
            projectDetails
          });
    
          if (result.success && result.talkingPoints) {
            setTalkingPoints(result.talkingPoints);
          } else {
            setAiError(result.error || "An unknown error occurred.");
          }
          setIsAIPending(false);
        };
        fetchTalkingPoints();
  }, [consultation]);

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');
    
    const handleSignatureChange = (studentId: string, signature: string) => {
        const newAttendees = [...attendees];
        const attendeeIndex = newAttendees.findIndex(a => a.studentId === studentId);
        if (attendeeIndex > -1) {
            newAttendees[attendeeIndex].signature = signature;
        } else {
            newAttendees.push({ studentId, signature });
        }
        setAttendees(newAttendees);
    };

    const saveAttendance = () => {
        if (consultationRef) {
            updateDocumentNonBlocking(consultationRef, { attendees });
            toast({ title: 'Attendance Saved!', description: 'The attendance record has been updated.' });
        }
    };

    const addDiscussionPoint = () => {
        const newPoint: DiscussionPoint = { id: new Date().toISOString(), adviserComment: "", status: 'To Do' };
        setDiscussionPoints(prev => [...prev, newPoint]);
    };

    const updateDiscussionPoint = (id: string, comment: string) => {
        setDiscussionPoints(prev => prev.map(p => p.id === id ? { ...p, adviserComment: comment } : p));
    };

    const removeDiscussionPoint = (id: string) => {
        const newPoints = discussionPoints.filter(p => p.id !== id);
        setDiscussionPoints(newPoints);
        updateDocumentNonBlocking(consultationRef, { discussionPoints: newPoints });
    };

    const saveDiscussionPoints = () => {
        if (consultationRef) {
            updateDocumentNonBlocking(consultationRef, { discussionPoints });
            toast({ title: 'Discussion Points Saved!', description: 'Your comments have been updated.' });
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
    };

    const studentList: Student[] = Array.isArray(consultation.students) ? consultation.students : [];

    return (
        <div className="grid md:grid-cols-3 gap-6 pt-6">
            <div className="md:col-span-1 flex flex-col gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Consultation Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{consultation.date ? new Date(consultation.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Not Scheduled"}</span></div>
                        <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><span>{consultation.startTime && consultation.endTime ? `${consultation.startTime} - ${consultation.endTime}` : 'Not Scheduled'}</span></div>
                        <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{consultation.venue || 'Not Scheduled'}</span></div>
                        {studentList.length > 0 && (<div className="flex items-start gap-3"><Users className="h-4 w-4 text-muted-foreground mt-1" /><div><p className="font-medium">Students</p><ul className="text-muted-foreground">{studentList.map(s => <li key={s.id}>{s.name}</li>)}</ul></div></div>)}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div className="space-y-1.5"><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />Suggested Talking Points</CardTitle><CardDescription>AI-generated topics to discuss.</CardDescription></div>
                        {!isAIPending && talkingPoints.length > 0 && (<Button variant="ghost" size="icon" onClick={() => copyToClipboard(talkingPoints.join('\n'))}><Copy className="h-4 w-4" /><span className="sr-only">Copy all points</span></Button>)}
                    </CardHeader>
                    <CardContent>
                        {isAIPending ? <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-[80%]" /></div> :
                         aiError ? <p className="text-sm text-destructive">{aiError}</p> :
                         talkingPoints.length > 0 ? (<ul className="space-y-3">{talkingPoints.map((point, index) => (<li key={index} className="flex items-start gap-3 text-sm"><Check className="h-4 w-4 mt-0.5 text-primary shrink-0" /><span>{point}</span></li>))}</ul>) :
                         <p className="text-sm text-muted-foreground">No talking points generated.</p>}
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 flex flex-col gap-6">
                <Card>
                    <CardHeader><CardTitle>Discussion Points</CardTitle><CardDescription>Add comments and action items for the students.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        {discussionPoints.map((point, index) => (
                            <div key={point.id} className="flex items-start gap-2">
                                <span className="font-bold text-muted-foreground pt-2">{index + 1}.</span>
                                <Textarea value={point.adviserComment} onChange={(e) => updateDiscussionPoint(point.id, e.target.value)} className="flex-1" placeholder="Enter discussion point or action item..." />
                                <Button variant="ghost" size="icon" onClick={() => removeDiscussionPoint(point.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" onClick={addDiscussionPoint}><PlusCircle className="mr-2 h-4 w-4" /> Add Point</Button>
                    </CardContent>
                    <CardFooter><Button onClick={saveDiscussionPoints}>Save Discussion Points</Button></CardFooter>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Attendance</CardTitle><CardDescription>Record attendance by having students type their name to sign.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        {studentList.map(student => (
                            <div key={student.id} className="flex items-center gap-4">
                                <Avatar><AvatarImage src={student.avatarUrl} alt={student.name} /><AvatarFallback>{getInitials(student.name)}</AvatarFallback></Avatar>
                                <span className="flex-1 font-medium">{student.name}</span>
                                <Input className="w-64" placeholder="Type name to sign" value={attendees.find(a => a.studentId === student.id)?.signature || ''} onChange={(e) => handleSignatureChange(student.id, e.target.value)} />
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter><Button onClick={saveAttendance}>Save Attendance</Button></CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default function AdviserDashboard() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [projectToApprove, setProjectToApprove] = useState<CapstoneProject | null>(null);
  const [projectToReject, setProjectToReject] = useState<CapstoneProject | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestToSchedule, setRequestToSchedule] = useState<Consultation | null>(null);
  const [openConsultations, setOpenConsultations] = useState<Record<string, boolean>>({});

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

  const studentIds = useMemo(() => {
    const ids = new Set<string>();
    allConsultations?.forEach(c => c.studentIds?.forEach(id => ids.add(id)));
    return Array.from(ids);
  }, [allConsultations]);

  const studentsQuery = useMemoFirebase(() => {
    if (studentIds.length === 0) return null;
    return query(collection(firestore, 'students'), where('id', 'in', studentIds));
  }, [firestore, studentIds]);
  const { data: students } = useCollection<Student>(studentsQuery);
  
  // --- MEMOIZED DATA ---
  const consultationsWithStudents = useMemo(() => {
    if (!allConsultations || !students) return allConsultations;
    return allConsultations.map(c => ({
      ...c,
      students: c.studentIds?.map(id => students.find(s => s.id === id)).filter(Boolean) as Student[] || []
    }));
  }, [allConsultations, students]);

  const scheduledConsultations = useMemo(() => consultationsWithStudents?.filter(c => c.status === 'Scheduled'), [consultationsWithStudents]);
  const pastConsultations = useMemo(() => consultationsWithStudents?.filter(c => c.status === 'Completed' || c.status === 'Cancelled' || (c.date && new Date(c.date) < new Date())), [consultationsWithStudents]);
  const pendingConsultationRequests = useMemo(() => consultationsWithStudents?.filter(c => c.status === 'Pending Approval'), [consultationsWithStudents]);

  // --- HANDLERS ---
  const handleApproveProject = (project: CapstoneProject) => {
    if (!project) return;
    const projectRef = doc(firestore, 'capstoneProjects', project.id);
    updateDocumentNonBlocking(projectRef, { status: 'Approved' });
    toast({ title: "Project Approved!", description: `"${project.title}" is now approved.` });
    setProjectToApprove(null);
  };

  const handleRejectProject = () => {
    if (!projectToReject) return;
    const projectRef = doc(firestore, 'capstoneProjects', projectToReject.id);
    updateDocumentNonBlocking(projectRef, { status: 'Rejected', rejectionReason: rejectionReason });
    toast({ variant: "destructive", title: "Project Rejected", description: `"${projectToReject.title}" has been rejected.` });
    setProjectToReject(null);
    setRejectionReason("");
  };
  
  const handleScheduleSuccess = () => {
    toast({ title: 'Consultation Scheduled!', description: 'The consultation has been added to the calendar.'});
    setRequestToSchedule(null);
  }
  
  const toggleConsultation = (id: string) => {
    setOpenConsultations(prev => ({ ...prev, [id]: !prev[id] }));
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
            <Collapsible key={c.id} open={openConsultations[c.id]} onOpenChange={() => toggleConsultation(c.id)}>
              <Card>
                  <CardHeader>
                      <CardTitle>{c.capstoneTitle}</CardTitle>
                      <CardDescription>{c.blockGroupNumber}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 text-sm">
                  <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{c.date ? new Date(c.date).toLocaleDateString() : 'Not Scheduled'}</span></div>
                  <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><span>{c.startTime && c.endTime ? `${c.startTime} - ${c.endTime}`: 'Not Scheduled'}</span></div>
                  <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{c.venue || 'Not Scheduled'}</span></div>
                  </CardContent>
                  <CardFooter>
                    <CollapsibleTrigger asChild>
                      <Button className="w-full" variant="secondary"><FileText className="mr-2 h-4 w-4" />{openConsultations[c.id] ? 'Hide Details' : 'View Details'}</Button>
                    </CollapsibleTrigger>
                  </CardFooter>
                  <CollapsibleContent>
                    <ConsultationDetail consultation={c} />
                  </CollapsibleContent>
              </Card>
            </Collapsible>
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
                <h2 className="text-2xl font-headline font-bold mb-4">Scheduled Consultations</h2>
                {renderConsultationList(scheduledConsultations, isLoadingConsultations, "No upcoming consultations scheduled.")}
              </div>
              <div>
                <h2 className="text-2xl font-headline font-bold mb-4">Past Consultations</h2>
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

    