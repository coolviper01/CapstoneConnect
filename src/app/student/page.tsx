
'use client';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock, MapPin, Hourglass, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, where, arrayUnion, doc } from "firebase/firestore";
import type { Consultation, Student, CapstoneProject } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from 'react';

export default function StudentDashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const studentQuery = useMemoFirebase(() => user ? query(collection(firestore, "students"), where("id", "==", user.uid)) : null, [firestore, user]);
  const { data: studentData, isLoading: isLoadingStudent } = useCollection<Student>(studentQuery);
  const student = useMemo(() => studentData?.[0], [studentData]);

  const consultationsQuery = useMemoFirebase(
    () => (user && student?.status === 'Active') ? query(
        collection(firestore, "consultations"), 
        where("studentIds", "array-contains", user.uid)
    ) : null,
    [firestore, user, student?.status]
  );
  const { data: studentConsultations, isLoading: isLoadingConsultations } = useCollection<Consultation>(consultationsQuery);

  const potentialProjectQuery = useMemoFirebase(() => {
    if (!student || !student.subjectId || !student.block || !student.groupNumber || student.status !== 'Active') return null;
    return query(
        collection(firestore, 'capstoneProjects'),
        where('subjectId', '==', student.subjectId),
        where('block', '==', student.block),
        where('groupNumber', '==', student.groupNumber)
    );
  }, [firestore, student]);

  const { data: potentialProjects, isLoading: isLoadingProjects } = useCollection<CapstoneProject>(potentialProjectQuery);
  const projectToJoin = useMemo(() => {
      if (!potentialProjects || !user) return null;
      // Find a project where the current user is NOT already a member
      return potentialProjects.find(p => !p.studentIds.includes(user.uid));
  }, [potentialProjects, user]);

  if (!isLoadingStudent && student?.status === 'Pending Approval') {
    router.replace('/student/pending');
    return (
        <div className="flex flex-col gap-6 items-center justify-center h-full">
            <p>Your account is pending approval. Redirecting...</p>
        </div>
    );
  }

  const handleJoinProject = () => {
    if (!projectToJoin || !user) return;
    const projectRef = doc(firestore, 'capstoneProjects', projectToJoin.id);
    updateDocumentNonBlocking(projectRef, {
        studentIds: arrayUnion(user.uid)
    });
    toast({
        title: "Project Joined!",
        description: `You have been added to "${projectToJoin.title}".`
    });
  };

  const renderContent = () => {
    if (isLoadingStudent || isLoadingConsultations || isLoadingProjects) {
      return Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
            <div className="text-sm text-muted-foreground pt-1"><Skeleton className="h-4 w-1/2" /></div>
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
    
    if (projectToJoin) {
        return (
            <Card className="md:col-span-2 lg:col-span-3 bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle>A Project is Waiting for You!</CardTitle>
                    <CardDescription>Your group leader has already registered a project. Join now to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold text-lg">{projectToJoin.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{projectToJoin.details}</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleJoinProject}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Join Project
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    if (!studentConsultations || studentConsultations.length === 0) {
      return (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardContent className="flex flex-col items-center justify-center text-center p-16">
            <h3 className="text-xl font-semibold">No Consultations Found</h3>
            <p className="text-muted-foreground mt-2">You can request consultations from the 'My Projects' page for approved projects.</p>
             <Button asChild className="mt-4">
                <Link href="/student/projects">Go to My Projects</Link>
             </Button>
          </CardContent>
        </Card>
      );
    }

    return studentConsultations.sort((a, b) => (new Date(b.date || 0) as any) - (new Date(a.date || 0) as any)).map(consultation => (
      <Card key={consultation.id} className="flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{consultation.capstoneTitle}</CardTitle>
              <CardDescription>{consultation.blockGroupNumber}</CardDescription>
            </div>
            <Badge variant={consultation.status === 'Scheduled' ? 'default' : 'secondary'}>
              {consultation.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 text-sm">
           {consultation.status === 'Scheduled' || consultation.status === 'Completed' ? (
             <>
                <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{consultation.date ? new Date(consultation.date).toLocaleDateString() : 'TBD'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{consultation.startTime && consultation.endTime ? `${consultation.startTime} - ${consultation.endTime}` : 'TBD'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{consultation.venue || 'TBD'}</span>
                </div>
             </>
           ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
                <Hourglass className="h-4 w-4" />
                <span>Pending confirmation and schedule by the adviser.</span>
            </div>
           )}
        </CardContent>
        {(consultation.status === 'Scheduled' || consultation.status === 'Completed') && (
          <CardFooter>
            <Button asChild className="w-full" variant="secondary">
              <Link href={`/student/consultations/${consultation.id}`}>
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    ));
  };

  return (
    <div className="flex flex-col gap-6">
        <PageHeader title="My Consultations" description="Here are your requested and scheduled capstone appointments." />
        <div className="grid gap-6 md:grid-cols-2 lg:col-span-3">
          {renderContent()}
        </div>
    </div>
  );
}

    