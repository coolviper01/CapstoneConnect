
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { collection, query, doc, setDoc } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Subject, Advisor, Student } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  title: z.string().min(5, "Project title must be at least 5 characters."),
  details: z.string().min(20, "Project details must be at least 20 characters."),
  adviserId: z.string().min(1, "You must select an adviser."),
});

interface RegisterProjectFormProps {
  subject: Subject;
  student: Student;
  onFinished: () => void;
}

export function RegisterProjectForm({ subject, student, onFinished }: RegisterProjectFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const advisorsQuery = useMemoFirebase(() => query(collection(firestore, 'advisors')), [firestore]);
  const { data: advisors, isLoading: isLoadingAdvisers } = useCollection<Advisor>(advisorsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      details: "",
      adviserId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!student.block || !student.groupNumber) {
        toast({ variant: 'destructive', title: "Missing Information", description: "Your block or group number is missing."});
        return;
    }

    const projectsCol = collection(firestore, "capstoneProjects");
    const newProjectRef = doc(projectsCol); // Create a reference with a new ID
    
    await setDoc(newProjectRef, {
      id: newProjectRef.id, // Explicitly save the ID within the document
      ...values,
      studentIds: [student.id],
      subjectId: subject.id,
      teacherId: subject.teacherId,
      block: student.block,
      groupNumber: student.groupNumber,
      status: 'Pending Teacher Approval',
    });

    toast({
      title: "Project Submitted for Approval!",
      description: `Your project "${values.title}" has been sent to the teacher for review.`,
    });
    form.reset();
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., AI-Powered Plant Disease Detection" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Details</FormLabel>
              <FormControl>
                <Textarea
                    placeholder="Provide a detailed description of your project, including objectives, scope, and proposed technologies."
                    className="min-h-[150px]"
                    {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="adviserId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Select Adviser</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                {isLoadingAdvisers ? <Skeleton className="h-5 w-[250px]" /> : <SelectValue placeholder="Choose an adviser for your project" />}
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {isLoadingAdvisers ? <SelectItem value="loading" disabled>Loading advisers...</SelectItem> : 
                            advisors?.map(adviser => (
                                <SelectItem key={adviser.id} value={adviser.id}>{adviser.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <Button type="submit">Submit for Approval</Button>
      </form>
    </Form>
  );
}
