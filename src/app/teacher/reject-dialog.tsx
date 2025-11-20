
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { CapstoneProject } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface RejectDialogProps {
  project: CapstoneProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RejectDialog({ project, open, onOpenChange }: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleReject = () => {
    if (!reason.trim()) {
        toast({
            variant: 'destructive',
            title: 'Reason required',
            description: 'Please provide a reason for rejecting the project.',
        });
        return;
    }
    const projectRef = doc(firestore, 'capstoneProjects', project.id);
    updateDocumentNonBlocking(projectRef, { 
        status: 'Rejected',
        rejectionReason: reason 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Project: {project.title}</DialogTitle>
          <DialogDescription>
            Please provide a clear reason for rejecting this project. This feedback will be shown to the student.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., The project scope is too broad and needs to be narrowed down."
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">Cancel</Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleReject}>
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
