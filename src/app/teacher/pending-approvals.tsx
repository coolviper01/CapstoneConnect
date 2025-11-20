
'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { CapstoneProject, Subject, Advisor } from '@/lib/types';
import { Check, X } from 'lucide-react';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { RejectDialog } from './reject-dialog';

export function PendingApprovals() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [rejectingProject, setRejectingProject] = useState<CapstoneProject | null>(null);

  const projectsQuery = useMemoFirebase(
    () => user ? query(
        collection(firestore, "capstoneProjects"), 
        where("teacherId", "==", user.uid),
        where("status", "==", "Pending Teacher Approval")
    ) : null,
    [firestore, user]
  );
  const { data: projects, isLoading: isLoadingProjects } = useCollection<CapstoneProject>(projectsQuery);

  const subjectsQuery = useMemoFirebase(() => collection(firestore, "subjects"), [firestore]);
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<Subject>(subjectsQuery);

  const advisorsQuery = useMemoFirebase(() => collection(firestore, "advisors"), [firestore]);
  const { data: advisors, isLoading: isLoadingAdvisors } = useCollection<Advisor>(advisorsQuery);
  
  const handleApprove = (projectId: string) => {
    const projectRef = doc(firestore, 'capstoneProjects', projectId);
    updateDocumentNonBlocking(projectRef, { status: 'Pending Adviser Approval' });
  };
  
  const handleReject = (project: CapstoneProject) => {
    setRejectingProject(project);
  };
  
  const finishRejection = () => {
    setRejectingProject(null);
  };

  const isLoading = isUserLoading || isLoadingProjects || isLoadingSubjects || isLoadingAdvisors;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Project Approvals</CardTitle>
          <CardDescription>Review and approve student capstone project registrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!projects || projects.length === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>Pending Project Approvals</CardTitle>
          <CardDescription>Review and approve student capstone project registrations.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-center h-24 rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No pending approvals at this time.</p>
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Project Approvals</CardTitle>
          <CardDescription>Review and approve student capstone project registrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.map(project => {
            const subject = subjects?.find(s => s.id === project.subjectId);
            const adviser = advisors?.find(a => a.id === project.adviserId);

            return (
              <Card key={project.id} className="shadow-none">
                 <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className='text-lg'>{project.title}</CardTitle>
                            <CardDescription>
                                {subject ? `For subject: ${subject.name}` : <Skeleton className="h-4 w-40 mt-1" />}
                            </CardDescription>
                        </div>
                        <Badge variant="secondary">{project.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{project.details}</p>
                  <p className="text-muted-foreground">
                    Selected Adviser: {adviser ? adviser.name : <Skeleton className="h-4 w-24 inline-block" />}
                  </p>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                    <Button size="sm" variant="destructive" onClick={() => handleReject(project)}>
                        <X className="mr-2 h-4 w-4" />
                        Reject
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(project.id)}>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                    </Button>
                </CardFooter>
              </Card>
            );
          })}
        </CardContent>
      </Card>
       {rejectingProject && (
        <RejectDialog 
          project={rejectingProject}
          open={!!rejectingProject}
          onOpenChange={(isOpen) => !isOpen && finishRejection()}
        />
      )}
    </>
  );
}
