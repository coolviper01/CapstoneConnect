
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
import { addDocumentNonBlocking, useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { CapstoneProject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

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
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agenda: '',
    },
  });
  
  if (!projectId) {
    notFound();
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!project || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Project or user not found.' });
      return;
    }

    if (project.status !== 'Approved') {
       toast({ variant: 'destructive', title: 'Error', description: 'Consultations can only be requested for approved projects.' });
       return;
    }

    const consultationsCol = collection(firestore, 'consultations');
    
    addDocumentNonBlocking(consultationsCol, {
      capstoneProjectId: project.id,
      capstoneTitle: project.title,
      projectDetails: project.details,
      studentIds: project.studentIds,
      advisorId: project.adviserId,
      agenda: values.agenda,
      status: 'Pending Approval',
      semester: '',
      academicYear: '',
      blockGroupNumber: ''
    });

    toast({
      title: 'Consultation Request Sent!',
      description: 'Your request has been sent to the adviser for approval and scheduling.',
    });
    
    router.push('/student/projects');
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

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <PageHeader
        title="Request a Consultation"
        description="Provide an agenda for your consultation. Your adviser will schedule the date and time."
      />

      {renderProjectInfo()}

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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingProject}>
                Send Request
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
