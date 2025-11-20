
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc } from "firebase/firestore";
import type { CapstoneProject, Subject } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  projectId: z.string().min(1, "You must select a project."),
  date: z.date({ required_error: "A date is required." }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required"),
  agenda: z.string().optional(),
});

export default function SchedulePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const projectsQuery = useMemoFirebase(
    () => user ? query(
      collection(firestore, "capstoneProjects"), 
      where("adviserId", "==", user.uid),
      where("status", "==", "Approved")
    ) : null,
    [firestore, user]
  );
  const { data: projects, isLoading: isLoadingProjects } = useCollection<CapstoneProject>(projectsQuery);

  const subjectsQuery = useMemoFirebase(
    () => collection(firestore, "subjects"),
    [firestore]
  );
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<Subject>(subjectsQuery);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: "",
      startTime: "",
      endTime: "",
      venue: "",
      agenda: "",
    },
  });

  const selectedProjectId = form.watch('projectId');
  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  const selectedSubject = subjects?.find(s => s.id === selectedProject?.subjectId);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedProject || !user || !selectedSubject) {
        toast({ variant: "destructive", title: "Error", description: "Selected project or subject not found or user not logged in."});
        return;
    }

    const consultationsCol = collection(firestore, "consultations");
    
    // Generate a 6-digit random code
    const attendanceCode = Math.floor(100000 + Math.random() * 900000).toString();

    await addDoc(consultationsCol, {
      capstoneProjectId: selectedProject.id,
      capstoneTitle: selectedProject.title,
      projectDetails: selectedProject.details, // Ensure projectDetails is copied
      semester: selectedSubject.semester, 
      academicYear: selectedSubject.academicYear,
      blockGroupNumber: selectedSubject.blocks.join(', '),
      studentIds: selectedProject.studentIds,
      advisorId: selectedProject.adviserId,
      date: values.date.toISOString().split('T')[0],
      startTime: values.startTime,
      endTime: values.endTime,
      venue: values.venue,
      agenda: values.agenda || "Adviser-scheduled session.",
      status: "Scheduled",
      discussionPoints: [],
      attendees: [],
      attendanceCode: attendanceCode,
      isAttendanceOpen: false,
    });

    toast({
      title: "Consultation Scheduled!",
      description: "The new consultation has been added to the dashboard.",
    });
    form.reset();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Schedule a New Consultation" description="Fill out the form below to create a new consultation appointment for an approved project." />
      <Card>
        <CardHeader>
          <CardTitle>Consultation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Select Approved Project</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                                  {isLoadingProjects ? <Skeleton className="h-5 w-[250px]" /> : <SelectValue placeholder="Choose a project to schedule..." />}
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {isLoadingProjects || isLoadingSubjects ? <SelectItem value="loading" disabled>Loading projects...</SelectItem> : 
                              projects?.map(project => (
                                  <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                              ))}
                              {!isLoadingProjects && projects?.length === 0 && <div className="p-4 text-sm text-muted-foreground">No approved projects assigned to you.</div>}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />

              {selectedProject && (
                 <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">{selectedProject.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{selectedProject.details}</p>
                    </CardContent>
                </Card>
              )}


              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
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
                              date < new Date(new Date().setDate(new Date().getDate() - 1))
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
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Innovation Hub or Google Meet link" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="agenda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agenda (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Topics to discuss..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={!selectedProject}>Schedule Consultation</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    