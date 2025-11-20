
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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { CapstoneProject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  date: z.date({ required_error: 'A date is required.' }),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(1, 'Venue is required'),
  agenda: z.string().min(10, 'Please provide a brief agenda for the consultation.'),
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
      startTime: '',
      endTime: '',
      venue: '',
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
      date: values.date.toISOString().split('T')[0],
      startTime: values.startTime,
      endTime: values.endTime,
      venue: values.venue,
      agenda: values.agenda,
      status: 'Pending Approval',
    });

    toast({
      title: 'Consultation Request Sent!',
      description: 'Your request has been sent to the adviser for approval.',
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
        description="Propose a schedule for your capstone project consultation."
      />

      {renderProjectInfo()}

      <Card>
        <CardHeader>
          <CardTitle>Proposed Schedule & Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Proposed Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setDate(new Date().getDate()))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue / Meeting Link</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Innovation Hub or Google Meet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="agenda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agenda / Topics to Discuss</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly list the topics you want to discuss (e.g., progress update, specific challenges, next steps)."
                        className="min-h-[120px]"
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
