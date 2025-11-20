'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateSubjectForm } from './create-subject-form';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditSubjectForm } from './edit-subject-form';
import { DeleteSubjectDialog } from './delete-subject-dialog';

export default function SubjectsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const subjectsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, "subjects"), where("teacherId", "==", user.uid)) : null,
    [firestore, user]
  );
  const { data: subjects, isLoading } = useCollection<Subject>(subjectsQuery);

  const handleEditClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditDialogOpen(true);
  };
  
  const handleDeleteClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setDeleteDialogOpen(true);
  };

  const renderContent = () => {
    if (isLoading || isUserLoading) {
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
         <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p>You haven't created any subjects yet. Click "Create Subject" to get started.</p>
        </div>
      )
    }

    return (
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map(subject => (
           <Card key={subject.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{subject.name}</CardTitle>
                <CardDescription>{subject.yearLevel}</CardDescription>
              </div>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(subject)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteClick(subject)} className="text-destructive">
                     <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

  if (isUserLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Subjects" description="Manage the subjects you are teaching." >
          <Skeleton className="h-10 w-36" />
        </PageHeader>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    // This should ideally not be reached if the layout protects the route
    return <div>You must be logged in to view this page.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Subjects"
        description="Manage the subjects you are teaching."
      >
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
              <DialogDescription>
                Fill out the details below to add a new subject.
              </DialogDescription>
            </DialogHeader>
            <CreateSubjectForm teacherId={user.uid} onFinished={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>
      
      {renderContent()}

      {selectedSubject && (
        <>
          <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Subject</DialogTitle>
                <DialogDescription>
                  Make changes to your subject details below.
                </DialogDescription>
              </DialogHeader>
              <EditSubjectForm 
                subject={selectedSubject} 
                onFinished={() => {
                  setEditDialogOpen(false);
                  setSelectedSubject(null);
                }} 
              />
            </DialogContent>
          </Dialog>

          <DeleteSubjectDialog
            open={isDeleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            subject={selectedSubject}
            onFinished={() => {
              setDeleteDialogOpen(false);
              setSelectedSubject(null);
            }}
          />
        </>
      )}
    </div>
  );
}
