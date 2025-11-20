
'use client';
import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Check, X } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { CapstoneProject, Consultation, Advisor } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';

export default function TeacherDashboard() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [projectToApprove, setProjectToApprove] = useState<CapstoneProject | null>(null);
    const [projectToReject, setProjectToReject] = useState<CapstoneProject | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const pendingProjectsQuery = useMemoFirebase(
        () => user ? query(
            collection(firestore, "capstoneProjects"), 
            where("teacherId", "==", user.uid), 
            where("status", "==", "Pending Teacher Approval")
        ) : null,
        [firestore, user]
    );
    const { data: pendingProjects, isLoading: isLoadingPendingProjects } = useCollection<CapstoneProject>(pendingProjectsQuery);

    const allProjectsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, "capstoneProjects"), where("teacherId", "==", user.uid)) : null,
        [firestore, user]
    );
    const { data: allProjects, isLoading: isLoadingAllProjects } = useCollection<CapstoneProject>(allProjectsQuery);

    const projectIds = useMemo(() => allProjects?.map(p => p.id) || [], [allProjects]);

    const consultationsQuery = useMemoFirebase(() => {
        if (!projectIds || projectIds.length === 0) return null;
        // Firestore 'in' queries are limited to 30 elements. 
        // For a teacher dashboard, this might be a concern in a large-scale app.
        // For this context, we assume it's acceptable.
        return query(collection(firestore, "consultations"), where("capstoneProjectId", "in", projectIds))
    }, [firestore, projectIds]);

    const { data: consultations, isLoading: isLoadingConsultations } = useCollection<Consultation>(consultationsQuery);

    const advisorsQuery = useMemoFirebase(() => collection(firestore, "advisors"), [firestore]);
    const { data: advisors, isLoading: isLoadingAdvisors } = useCollection<Advisor>(advisorsQuery);
    
    const handleApprove = (project: CapstoneProject) => {
        const projectRef = doc(firestore, 'capstoneProjects', project.id);
        updateDocumentNonBlocking(projectRef, { status: 'Pending Adviser Approval' });
        toast({ title: "Project Approved!", description: `"${project.title}" has been forwarded to the adviser.` });
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

    const getAdviserName = (adviserId: string) => {
        return advisors?.find(a => a.id === adviserId)?.name || 'N/A';
    }

    const isLoading = isUserLoading || isLoadingPendingProjects || isLoadingAllProjects || isLoadingConsultations || isLoadingAdvisors;

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="grid gap-1">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-6 w-96" />
                    </div>
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Teacher Dashboard"
                description="Monitor project approvals and view all consultations for your subjects."
            />

            <Tabs defaultValue="approvals">
                <TabsList>
                    <TabsTrigger value="approvals">
                        Pending Approvals
                        {pendingProjects && pendingProjects.length > 0 && 
                            <Badge className="ml-2">{pendingProjects.length}</Badge>
                        }
                    </TabsTrigger>
                    <TabsTrigger value="consultations">All Consultations</TabsTrigger>
                </TabsList>
                <TabsContent value="approvals">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Project Approvals</CardTitle>
                            <CardDescription>Review and approve or reject capstone projects submitted by students for your subjects.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(!pendingProjects || pendingProjects.length === 0) ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No pending project approvals at this time.</p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {pendingProjects.map(project => (
                                        <Card key={project.id} className="bg-muted/30">
                                            <CardHeader>
                                                <CardTitle>{project.title}</CardTitle>
                                                <CardDescription>Adviser: {getAdviserName(project.adviserId)}</CardDescription>
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
                     <Card>
                        <CardHeader>
                            <CardTitle>Consultation History</CardTitle>
                            <CardDescription>A log of all consultations for projects under your supervision.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Project Title</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Adviser</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {consultations && consultations.length > 0 ? (
                                        consultations.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.capstoneTitle}</TableCell>
                                                <TableCell>{c.date ? new Date(c.date).toLocaleDateString() : 'N/A'}</TableCell>
                                                <TableCell>{getAdviserName(c.advisorId!)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={c.status === 'Completed' ? 'secondary' : 'default'}>{c.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No consultations found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Approve Confirmation Dialog */}
            <AlertDialog open={!!projectToApprove} onOpenChange={() => setProjectToApprove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve this project?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will forward the project to the selected adviser for their final approval. Are you sure?
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
