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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { students as allStudents, advisors } from "@/lib/data";

const formSchema = z.object({
  semester: z.string().min(1, "Semester is required"),
  academicYear: z.string().min(1, "Academic Year is required"),
  capstoneTitle: z.string().min(1, "Capstone Title is required"),
  blockGroupNumber: z.string().min(1, "Block/Group Number is required"),
  date: z.date({ required_error: "A date is required." }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required"),
  projectDetails: z.string().min(10, "Please provide more details about the project."),
});

export default function SchedulePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      semester: "",
      academicYear: "",
      capstoneTitle: "",
      blockGroupNumber: "",
      startTime: "",
      endTime: "",
      venue: "",
      projectDetails: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const consultationsCol = collection(firestore, "consultations");
    
    // In a real app, you'd have a way to select students.
    // For now, we'll assign the first two students from the static list.
    const assignedStudents = allStudents.slice(0, 2);
    
    // In a real app, this would be the logged-in advisor's ID
    const assignedAdvisor = advisors[0];
    
    addDocumentNonBlocking(consultationsCol, {
      ...values,
      date: values.date.toISOString().split('T')[0], // format date as YYYY-MM-DD
      status: "Scheduled",
      students: assignedStudents,
      studentIds: assignedStudents.map(s => s.id),
      advisorId: assignedAdvisor.id,
      advisor: assignedAdvisor,
    });

    toast({
      title: "Consultation Scheduled!",
      description: "The new consultation has been added to the dashboard.",
    });
    form.reset();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Schedule a New Consultation" description="Fill out the form below to create a new consultation appointment." />
      <Card>
        <CardHeader>
          <CardTitle>Consultation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="capstoneTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capstone Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., AI-Powered Recommendation System" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="blockGroupNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Block/Group Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., BSCS-4A, Group 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a semester" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="1st Semester">1st Semester</SelectItem>
                            <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                            <SelectItem value="Summer">Summer</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an academic year" />
                            </Trigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="2024-2025">2024-2025</SelectItem>
                            <SelectItem value="2023-2024">2023-2024</SelectItem>
                            </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>

              <FormField
                control={form.control}
                name="projectDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed description of the capstone project, including objectives, scope, and technologies used."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This information will be used to generate suggested talking points.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Schedule Consultation</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
