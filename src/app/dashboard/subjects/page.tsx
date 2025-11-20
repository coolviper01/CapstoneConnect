
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateSubjectForm } from './create-subject-form';


export default function TeacherSubjectsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const subjectsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, "subjects"), where("teacherId", "==", user.uid)) : null,
    [firestore, user]
  );
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<Subject>(subjectsQuery);

  const renderContent = () => {
    if (isUserLoading || isLoadingSubjects) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    if (!subjects || subjects.length === 0) {
      return (
        <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
          <h3 className="text-xl font-semibold">No Subjects Found</h3>
          <p className="mt-2 mb-4">Get started by creating your first subject.</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
             <PlusCircle className="mr-2 h-4 w-4" /> Create Subject
          </Button>
        </div>
      )
    }
    
    return (
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map(subject => (
           <Card key={subject.id}>
            <CardHeader>
                <CardTitle>{subject.name}</CardTitle>
                <CardDescription>{subject.yearLevel} • {subject.academicYear} • {subject.semester}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {subject.blocks.map(block => (
                  <Badge key={block} variant="secondary">{block}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
       </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="My Subjects"
        description="Manage the subjects you offer for capstone projects."
      >
        <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Subject
        </Button>
      </PageHeader>
      
      {renderContent()}

      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>Create a New Subject</DialogTitle>
            <DialogDescription>
                Fill out the details below to add a new subject for project registration.
            </DialogDescription>
            </DialogHeader>
            <CreateSubjectForm 
                onFinished={() => setCreateDialogOpen(false)} 
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
