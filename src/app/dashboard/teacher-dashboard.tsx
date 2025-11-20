
'use client';
import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Check, X } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, doc, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import type { CapstoneProject, Consultation, Advisor, Student } from '@/lib/types';
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
    const [studentToApprove, setStudentToApprove] = useState<Student | null>(null);


    // --- QUERIES ---
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
    
    // --- New Query for Pending Students ---
    const teacherSubjectsQuery = useMemoFirebase(() => user ? query(collection(firestore, "subjects"), where("teacherId", "==", user.uid)) : null, [firestore, user]);
    const { data: teacherSubjects, isLoading: isLoadingSubjects } = useCollection(teacherSubjectsQuery);
    const teacherSubjectIds = useMemo(() => teacherSubjects?.map(s => s.id) || [], [teacherSubjects]);

    const pendingStudentsQuery = useMemoFirebase(() => {
        if (teacherSubjectIds.length === 0) return null;
        return query(
            collection(firestore, "students"), 
            where("subjectId", "in", teacherSubjectIds),
            where("status", "==", "Pending Approval")
        );
    }, [firestore, teacherSubjectIds]);
    const { data: pendingStudents, isLoading: isLoadingPendingStudents } = useCollection<Student>(pendingStudentsQuery);
    // --- End New Query ---

    const projectIds = useMemo(() => allProjects?.map(p => p.id) || [], [allProjects]);

    const consultationsQuery = useMemoFirebase(() => {
        if (!projectIds || projectIds.length === 0) return null;
        return query(collection(firestore, "consultations"), where("capstoneProjectId", "in", projectIds))
    }, [firestore, projectIds]);

    const { data: consultations, isLoading: isLoadingConsultations } = useCollection<Consultation>(consultationsQuery);

    const advisorsQuery = useMemoFirebase(() => collection(firestore, "advisors"), [firestore]);
    const { data: advisors, isLoading: isLoadingAdvisors } = useCollection<Advisor>(advisorsQuery);
    
    const handleApproveProject = (project: CapstoneProject) => {
        const projectRef = doc(firestore, 'capstoneProjects', project.id);
        const data = { status: 'Pending Adviser Approval' };
        updateDoc(projectRef, data).catch(e => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: projectRef.path, operation: 'update', requestResourceData: data }));
        });
        toast({ title: "Project Approved!", description: `"${project.title}" has been forwarded to the adviser.` });
        setProjectToApprove(null);
    };

    const handleRejectProject = () => {
        if (!projectToReject) return;
        const projectRef = doc(firestore, 'capstoneProjects', projectToReject.id);
        const data = { status: 'Rejected', rejectionReason: rejectionReason };
        updateDoc(projectRef, data).catch(e => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: projectRef.path, operation: 'update', requestResourceData: data }));
        });
        toast({ variant: "destructive", title: "Project Rejected", description: `"${projectToReject.title}" has been rejected.` });
        setProjectToReject(null);
        setRejectionReason("");
    };

    const handleApproveStudent = async (student: Student) => {
        if (!firestore) return;
        const { id: toastId } = toast({ title: "Approving student..." });
    
        const batch = writeBatch(firestore);
        
        const studentRef = doc(firestore, 'students', student.id);
        const studentUpdateData = { status: 'Active' };
        batch.update(studentRef, studentUpdateData);
        
        let wasAddedToProject = false;
        let projectTitle = '';

        try {
            if (student.subjectId && student.block && student.groupNumber) {
                const projectsQuery = query(
                    collection(firestore, 'capstoneProjects'),
                    where('subjectId', '==', student.subjectId),
                    where('block', '==', student.block),
                    where('groupNumber', '==', student.groupNumber)
                );
                const projectSnapshot = await getDocs(projectsQuery);

                if (!projectSnapshot.empty) {
                    const projectDoc = projectSnapshot.docs[0];
                    const projectData = projectDoc.data();
                    projectTitle = projectData.title;
                    
                    if (!projectData.studentIds.includes(student.id)) {
                        const newStudentIds = [...projectData.studentIds, student.id];
                        batch.update(projectDoc.ref, { studentIds: newStudentIds });
                        wasAddedToProject = true;
                    }
                }
            }

            await batch.commit();

            if (wasAddedToProject) {
                toast({ id: toastId, title: "Student Approved & Added to Project!", description: `${student.name} has been added to "${projectTitle}".` });
            } else {
                toast({ id: toastId, title: "Student Approved!", description: `${student.name} is now an active student.` });
            }

        } catch (error) {
             const permissionError = new FirestorePermissionError({
                path: studentRef.path, // Path for the primary operation that might fail
                operation: 'update',
                requestResourceData: studentUpdateData,
            });
            errorEmitter.emit('permission-error', permissionError);

             toast({
                id: toastId,
                variant: "destructive",
                title: "Approval Failed",
                description: "Could not approve the student. You may not have the required permissions.",
            });
        } finally {
            setStudentToApprove(null);
        }
    };


    const getAdviserName = (adviserId: string) => {
        return advisors?.find(a => a.id === adviserId)?.name || 'N/A';
    }
    
    const getSubjectName = (subjectId?: string) => {
        if (!subjectId) return 'N/A';
        return teacherSubjects?.find(s => s.id === subjectId)?.name || 'N/A';
    }

    const isLoading = isUserLoading || isLoadingPendingProjects || isLoadingAllProjects || isLoadingConsultations || isLoadingAdvisors || isLoadingSubjects || isLoadingPendingStudents;

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
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="approvals">
                        Project Approvals
                        {pendingProjects && pendingProjects.length > 0 && 
                            <Badge className="ml-2">{pendingProjects.length}</Badge>
                        }
                    </TabsTrigger>
                     <TabsTrigger value="students">
                        Student Approvals
                        {pendingStudents && pendingStudents.length > 0 && 
                            <Badge className="ml-2">{pendingStudents.length}</Badge>
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
                
                <TabsContent value="students">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Student Registrations</CardTitle>
                            <CardDescription>Approve students who have registered for your subjects.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {(!pendingStudents || pendingStudents.length === 0) ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No pending student registrations.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Block & Group</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingStudents.map(student => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell>{student.email}</TableCell>
                                                <TableCell>{getSubjectName(student.subjectId)}</TableCell>
                                                <TableCell>{student.block} - Grp {student.groupNumber}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => setStudentToApprove(student)}>
                                                         <Check className="mr-2 h-4 w-4" /> Approve
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
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

            {/* Project Approve Confirmation Dialog */}
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
                        <AlertDialogAction onClick={() => handleApproveProject(projectToApprove!)}>
                            Yes, Approve Project
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Project Reject Confirmation Dialog */}
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
                        <AlertDialogAction onClick={handleRejectProject} disabled={!rejectionReason}>
                           Confirm Rejection
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             {/* Student Approve Confirmation Dialog */}
            <AlertDialog open={!!studentToApprove} onOpenChange={() => setStudentToApprove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve this student?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will grant {studentToApprove?.name} access to the platform. They may be automatically added to a project if one exists for their group.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleApproveStudent(studentToApprove!)}>
                            Yes, Approve Student
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
