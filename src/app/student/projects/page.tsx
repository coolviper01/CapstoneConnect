
'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Clock, Check, X, HelpCircle, CalendarPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Subject, CapstoneProject, Student } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RegisterProjectForm } from './register-project-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


export default function StudentProjectsPage() {
  const [isRegisterDialogOpen, setRegisterDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const studentQuery = useMemoFirebase(() => user ? query(collection(firestore, "students"), where("id", "==", user.uid)) : null, [firestore, user]);
  const { data: studentData, isLoading: isLoadingStudent } = useCollection<Student>(studentQuery);
  const student = useMemo(() => studentData?.[0], [studentData]);

  const subjectsQuery = useMemoFirebase(
    () => collection(firestore, "subjects"),
    [firestore]
  );
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<Subject>(subjectsQuery);

  const projectsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, "capstoneProjects"), where("studentIds", "array-contains", user.uid)) : null,
    [firestore, user]
  );
  const { data: projects, isLoading: isLoadingProjects } = useCollection<CapstoneProject>(projectsQuery);
  
  if (!isUserLoading && user && !isLoadingStudent && student && !student.subjectId) {
      router.push('/register/student/group-details');
      return (
        <div className="flex flex-col gap-8 items-center justify-center h-full">
            <p>Redirecting to complete your registration...</p>
        </div>
      );
  }

  const handleRegisterClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setRegisterDialogOpen(true);
  };
  
  const activeProject = projects?.find(p => p.status !== 'Rejected');
  const userHasActiveProject = !!activeProject;
  
  const getStatusIcon = (status: CapstoneProject['status']) => {
    switch (status) {
        case 'Approved':
            return <Check className="h-4 w-4 text-green-500" />;
        case 'Pending Adviser Approval':
        case 'Pending Teacher Approval':
            return <Clock className="h-4 w-4 text-yellow-500" />;
        case 'Rejected':
            return <X className="h-4 w-4 text-red-500" />;
        default:
            return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  }
  
  const getBadgeVariant = (status: CapstoneProject['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Pending Adviser Approval':
      case 'Pending Teacher Approval':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const renderMyProjects = () => {
    if (isLoadingProjects || isUserLoading) {
      return <Card><CardHeader><Skeleton className="h-6 w-3/4 mb-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
    }
    if (projects && projects.length > 0) {
      return (
        <div className="space-y-4">
        {projects.map(project => {
            const subject = subjects?.find(s => s.id === project.subjectId);
            return (
              <Card key={project.id} className={cn(
                project.status === 'Rejected' ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'
              )}>
                <CardHeader>
                  <div className='flex justify-between items-start'>
                      <div>
                          <CardTitle>{project.title}</CardTitle>
                          {subject && <CardDescription>Registered under: {subject.name}</CardDescription>}
                      </div>
                      <Badge variant={getBadgeVariant(project.status)}>
                          <div className="flex items-center gap-2">
                              {getStatusIcon(project.status)}
                              {project.status}
                          </div>
                      </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{project.details}</p>
                   {project.status === 'Rejected' && project.rejectionReason && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTitle>Rejection Reason</AlertTitle>
                      <AlertDescription>{project.rejectionReason}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                {project.status === 'Approved' && (
                  <CardFooter>
                    <Button asChild>
                      <Link href={`/student/request-consultation?projectId=${project.id}`}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Request Consultation
                      </Link>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )
        })}
        </div>
      )
    }
    return null;
  }
  
  const renderAvailableSubjects = () => {
     if (isLoadingSubjects || isLoadingStudent) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-full" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (!subjects || subjects.length === 0) {
      return (
         <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p>No subjects are available for registration yet. Check back later.</p>
        </div>
      )
    }
    
    return (
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map(subject => (
           <Card key={subject.id} className="flex flex-col">
            <CardHeader>
                <CardTitle>{subject.name}</CardTitle>
                <CardDescription>{subject.yearLevel} • {subject.academicYear} • {subject.semester}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-wrap gap-2">
                {subject.blocks.map(block => (
                  <Badge key={block} variant="secondary">{block}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button className="w-full" onClick={() => handleRegisterClick(subject)} disabled={userHasActiveProject}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Register Project
                            </Button>
                        </TooltipTrigger>
                        {userHasActiveProject && (
                            <TooltipContent>
                                <p>You already have an active or pending project.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </CardFooter>
          </Card>
        ))}
       </div>
    );
  }

  if (isUserLoading || isLoadingStudent) {
     return <Skeleton className="h-96 w-full" />
  }

  if (!user || !student) {
    return <div>You must be logged in to view this page.</div>;
  }

  return (
    <div className="flex flex-col gap-8">
       <PageHeader
        title="My Capstone Project"
        description="Register your project for a subject or view your current registration status."
      />
      
      {userHasActiveProject ? (
          <Alert>
            <AlertTitle>Project Registration Submitted</AlertTitle>
            <AlertDescription>
                You have an active or pending capstone project. You can view its status below.
            </AlertDescription>
          </Alert>
      ) : (
        projects && projects.length > 0 && (
            <Alert variant="destructive">
                <AlertTitle>Project Rejected</AlertTitle>
                <AlertDescription>
                    Your previous project submission was rejected. Please review the feedback below and submit a new registration.
                </AlertDescription>
            </Alert>
        )
      )}

      {renderMyProjects()}
      
      <div className="space-y-4">
        <h2 className="font-headline text-2xl font-bold">Available Subjects for Registration</h2>
        {renderAvailableSubjects()}
      </div>

      {selectedSubject && (
        <Dialog open={isRegisterDialogOpen} onOpenChange={setRegisterDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Register Project for {selectedSubject.name}</DialogTitle>
              <DialogDescription>
                Fill out the details below to register your capstone project for approval.
              </DialogDescription>
            </DialogHeader>
            <RegisterProjectForm 
                subject={selectedSubject} 
                student={student} 
                onFinished={() => setRegisterDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
