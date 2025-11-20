
'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Calendar, Clock, MapPin, Check, X, FileText } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Consultation, CapstoneProject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScheduleConsultationForm } from './schedule-consultation-form';

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
  const scheduledConsultations = useMemo(() => allConsultations?.filter(c => c.status === 'Scheduled'), [allConsultations]);
  const pastConsultations = useMemo(() => allConsultations?.filter(c => c.status === 'Completed' || c.status === 'Cancelled' || (c.date && new Date(c.date) < new Date())), [allConsultations]);
  const pendingConsultationRequests = useMemo(() => allConsultations?.filter(c => c.status === 'Pending Approval'), [allConsultations]);

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {consultationsToRender.map(c => (
            <Card key={c.id} className="flex flex-col">
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
                <Button asChild className="w-full" variant="secondary">
                    <Link href={`/dashboard/consultations/${c.id}`}><FileText className="mr-2 h-4 w-4" />View Details</Link>
                </Button>
                </CardFooter>
            </Card>
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
