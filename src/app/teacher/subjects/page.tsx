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
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateSubjectForm } from './create-subject-form';
import { useUser } from '@/firebase';

export default function SubjectsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { user, isUserLoading } = useUser();

  if (isUserLoading || !user) {
    // You can return a loading spinner or skeleton here
    return <div>Loading...</div>;
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
              <PlusCircle className="mr-2" />
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
      
      {/* Subject list will be implemented in Phase 2 */}
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <p>Your created subjects will appear here.</p>
      </div>
    </div>
  );
}
