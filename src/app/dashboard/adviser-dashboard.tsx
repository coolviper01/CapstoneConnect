
'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Calendar, Clock, MapPin, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Consultation, CapstoneProject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function AdviserDashboard() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [projectToApprove, setProjectToApprove] = useState<CapstoneProject | null>(null);
  const [projectToReject, setProjectToReject] = useState<CapstoneProject | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Queries for consultations
  const consultationsQuery = useMemoFirebase(
    () => user ? query(
      collection(firestore, 'consultations'),
      where('advisorId', '==', user.uid)
    ) : null,
    [firestore, user]
  );
  const { data: consultations, isLoading: isLoadingConsultations } = useCollection<Consultation>(consultationsQuery);

  const upcomingConsultations = useMemo(() => consultations?.filter(c => new Date(c.date) >= new Date()), [consultations]);
  const pastConsultations = useMemo(() => consultations?.filter(c => new Date(c.date) < new Date()), [consultations]);

  // Queries for project approvals
  const pendingProjectsQuery = useMemoFirebase(
    () => user ? query(
        collection(firestore, "capstoneProjects"),
        where("adviserId", "==", user.uid),
        where("status", "==", "Pending Adviser Approval")
    ) : null,
    [firestore, user]
  );
  const { data: pendingProjects, isLoading: isLoadingProjects } = useCollection<CapstoneProject>(pendingProjectsQuery);

  const handleApprove = (project: CapstoneProject) => {
    if (!project) return;
    const projectRef = doc(firestore, 'capstoneProjects', project.id);
    updateDocumentNonBlocking(projectRef, { status: 'Approved' });
    toast({ title: "Project Approved!", description: `"${project.title}" is now approved.` });
    setProjectToApprove(null);
  };

  const handleReject = () => {
    if (!projectToReject) return;
    const projectRef = doc(firestore, 'capstoneProjects', projectToReject.id);
    updateDocumentNonBlocking(projectRef, { status: 'Rejected', rejectionReason: rejectionReason });
    toast({ variant: "destructive", title: "Project Rejected", description: `"${projectToReject.title}" has been rejected.` });
    setProjectToReject(null);
    setRejectionReason("");
  };

  const renderConsultationList = (consultationsToRender: Consultation[] | undefined, loading: boolean) => {
    if (loading) {
      return Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 text-sm">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ));
    }

    if (!consultationsToRender || consultationsToRender.length === 0) {
      return (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardContent className="flex flex-col items-center justify-center text-center p-16">
            <h3 className="text-xl font-semibold">No consultations here.</h3>
            <p className="text-muted-foreground mt-2">There are no consultations in this category.</p>
          </CardContent>
        </Card>
      );
    }

    return consultationsToRender.map(consultation => (
      <Card key={consultation.id} className="flex flex-col">
        <CardHeader>
          <CardTitle>{consultation.capstoneTitle}</CardTitle>
          <CardDescription>{consultation.blockGroupNumber}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(consultation.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{consultation.startTime} - {consultation.endTime}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{consultation.venue}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="secondary">
            <Link href={`/dashboard/consultations/${consultation.id}`}>
              View Details <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    ));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Adviser Dashboard" description="Manage your capstone project approvals and consultations." />
      
      <Tabs defaultValue="approvals">
        <TabsList>
            <TabsTrigger value="approvals">
                Pending Approvals
                {pendingProjects && pendingProjects.length > 0 && 
                    <Badge className="ml-2">{pendingProjects.length}</Badge>
                }
            </TabsTrigger>
            <TabsTrigger value="consultations">My Consultations</TabsTrigger>
        </TabsList>
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Project Approvals</CardTitle>
              <CardDescription>Review and approve or reject capstone projects that have selected you as an adviser.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? <Skeleton className="h-40 w-full" /> : 
                (!pendingProjects || pendingProjects.length === 0) ? (
                  <div className="text-center py-12 text-muted-foreground">
                      <p>No pending project approvals at this time.</p>
                  </div>
              ) : (
                  <div className="grid gap-6">
                      {pendingProjects.map(project => (
                          <Card key={project.id} className="bg-muted/30">
                              <CardHeader>
                                  <CardTitle>{project.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <p className="text-sm">{project.details}</p>
                              </CardContent>
                              <CardFooter className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setProjectToReject(project)}>
                                      <X className="mr-2 h-4 w-4" /> Reject
                                  </Button>
                                  <Button onClick={() => setProjectToApprove(project)}>
                                      <Check className="mr-2 h-4 w-4" /> Approve
                                  </Button>
                              </CardFooter>
                          </Card>
                      ))}
                  </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="consultations">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-headline font-bold mb-4">Upcoming Consultations</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {renderConsultationList(upcomingConsultations, isLoadingConsultations)}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-headline font-bold mb-4">Past Consultations</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {renderConsultationList(pastConsultations, isLoadingConsultations)}
                </div>
              </div>
            </div>
        </TabsContent>
      </Tabs>
      
       {/* Approve Confirmation Dialog */}
      <AlertDialog open={!!projectToApprove} onOpenChange={() => setProjectToApprove(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Approve this project?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will mark the project as fully approved and allow the students to schedule consultations. Are you sure?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleApprove(projectToApprove!)}>
                      Yes, Approve Project
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      {/* Reject Confirmation Dialog */}
      <AlertDialog open={!!projectToReject} onOpenChange={() => setProjectToReject(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Reject this project?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Please provide a reason for rejecting this project. This feedback will be shown to the student.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                  <Textarea
                      placeholder="Type your rejection reason here..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                  />
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReject} disabled={!rejectionReason}>
                      Confirm Rejection
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
