'use client';

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
import { deleteDocumentNonBlocking, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Subject } from "@/lib/types";
import { doc } from "firebase/firestore";

interface DeleteSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject;
  onFinished: () => void;
}

export function DeleteSubjectDialog({ open, onOpenChange, subject, onFinished }: DeleteSubjectDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = () => {
    const subjectDoc = doc(firestore, "subjects", subject.id);
    deleteDocumentNonBlocking(subjectDoc);
    toast({
      title: "Subject Deleted",
      description: `"${subject.name}" has been removed.`,
    });
    onFinished();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the subject
            <span className="font-semibold"> {subject.name}</span> and remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onFinished}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
