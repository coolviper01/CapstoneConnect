
'use client';

import { useSearchParams, useRouter, notFound } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where, addDoc } from 'firebase/firestore';
import type { CapstoneProject, Subject, Consultation } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Hourglass } from 'lucide-react';

const formSchema = z.object({
  agenda: z.string().min(20, 'Please provide a more detailed agenda (min. 20 characters).'),
});

export default function RequestConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const projectRef = useMemoFirebase(() => projectId ? doc(firestore, 'capstoneProjects', projectId) : null, [firestore, projectId]);
  const { data: project, isLoading: isLoadingProject } = useDoc<CapstoneProject>(projectRef);
  
  const subjectsQuery = useMemoFirebase(() => collection(firestore, 'subjects'), [firestore]);
  const { data: subjects } = useCollection<Subject>(subjectsQuery);

  // Query for open or pending consultations for this project
  const existingConsultationsQuery = useMemoFirebase(() => {
    if (!projectId) return null;
    return query(
        collection(firestore, 'consultations'),
        where('capstoneProjectId', '==', projectId),
        where('status', 'in', ['Scheduled', 'Pending Approval'])
    );
  }, [firestore, projectId]);
  const { data: existingConsultations, isLoading: isLoadingExisting } = useCollection<Consultation>(existingConsultationsQuery);

  const subject = React.useMemo(() => {
    if (!project || !subjects) return null;
    return subjects.find(s => s.id === project.subjectId);
  }, [project, subjects]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agenda: '',
    },
  });
  
  if (!projectId) {
    notFound();
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!project || !user || !subject) {
      toast({ variant: 'destructive', title: 'Error', description: 'Project, subject, or user not found.' });
      return;
    }

    if (project.status !== 'Approved') {
       toast({ variant: 'destructive', title: 'Error', description: 'Consultations can only be requested for approved projects.' });
       return;
    }

    if (existingConsultations && existingConsultations.length > 0) {
      toast({ variant: 'destructive', title: 'Open Consultation Exists', description: 'You already have an open or pending consultation for this project.' });
      return;
    }

    const consultationsCol = collection(firestore, 'consultations');
    
    // Generate a 6-digit random code
    const attendanceCode = Math.floor(100000 + Math.random() * 900000).toString();

    await addDoc(consultationsCol, {
      capstoneProjectId: project.id,
      capstoneTitle: project.title,
      projectDetails: project.details, // Ensure projectDetails is copied
      semester: subject.semester,
      academicYear: subject.academicYear,
      blockGroupNumber: subject.blocks.join(', '),
      studentIds: project.studentIds,
      advisorId: project.adviserId,
      agenda: values.agenda,
      status: 'Pending Approval',
      discussionPoints: [],
      attendees: [],
      attendanceCode: attendanceCode,
      isAttendanceOpen: false,
    });

    toast({
      title: 'Consultation Request Sent!',
      description: 'Your request has been sent to the adviser for approval and scheduling.',
    });
    
    router.push('/student');
  }
  
  const renderProjectInfo = () => {
    if (isLoadingProject) {
        return <Skeleton className="h-24 w-full" />
    }
    
    if (!project) {
        return <p>Project details not found.</p>
    }
    
    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>You are requesting a consultation for this project.</CardDescription>
            </CardHeader>
        </Card>
    )
  }

  const hasExistingConsultation = existingConsultations && existingConsultations.length > 0;
  const existingConsultationStatus = hasExistingConsultation ? existingConsultations[0].status : null;


  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <PageHeader
        title="Request a Consultation"
        description="Provide an agenda for your consultation. Your adviser will schedule the date and time."
      />

      {renderProjectInfo()}

      {isLoadingExisting ? <Skeleton className="h-24 w-full" /> : hasExistingConsultation && (
        <Alert>
            <Hourglass className="h-4 w-4" />
            <AlertTitle>
              {existingConsultationStatus === 'Scheduled' 
                ? 'Open Consultation in Progress' 
                : 'Request Awaiting Approval'}
            </AlertTitle>
            <AlertDescription>
              {existingConsultationStatus === 'Scheduled'
                ? 'This project already has an open consultation. You must wait for the adviser to close it before you can request a new one.'
                : 'You have a pending consultation request for this project. Please wait for your adviser to schedule it.'}
            </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
          <CardDescription>What would you like to discuss during this consultation?</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="agenda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agenda / Topics to Discuss</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly list the topics you want to discuss (e.g., progress update, specific challenges, next steps)."
                        className="min-h-[150px]"
                        {...field}
                        disabled={hasExistingConsultation}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingProject || isLoadingExisting || hasExistingConsultation}>
                Send Request
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
