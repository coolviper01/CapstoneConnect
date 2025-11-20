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
import { collection } from "firebase/firestore";
import { addDocumentNonBlocking, useFirestore } from "@/firebase";
import type { Subject } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z.string().min(5, "Project title must be at least 5 characters."),
  details: z.string().min(20, "Project details must be at least 20 characters."),
});

interface RegisterProjectFormProps {
  subject: Subject;
  studentId: string;
  onFinished: () => void;
}

export function RegisterProjectForm({ subject, studentId, onFinished }: RegisterProjectFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      details: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const projectsCol = collection(firestore, "capstoneProjects");
    
    addDocumentNonBlocking(projectsCol, {
      ...values,
      studentIds: [studentId],
      subjectId: subject.id,
      teacherId: subject.teacherId,
    });

    toast({
      title: "Project Registered!",
      description: `Your project "${values.title}" has been registered for ${subject.name}.`,
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
        <Button type="submit">Register Project</Button>
      </form>
    </Form>
  );
}
