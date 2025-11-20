
'use client';

import { useState } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { collection } from "firebase/firestore";
import { addDocumentNonBlocking, useFirestore, useUser } from "@/firebase";
import { TagInput } from '@/components/ui/tag-input';

const formSchema = z.object({
  name: z.string().min(3, "Subject name must be at least 3 characters."),
  yearLevel: z.string().min(1, "Year level is required."),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Academic year must be in YYYY-YYYY format."),
  semester: z.string().min(1, "Semester is required."),
  blocks: z.array(z.string()).min(1, "You must specify at least one block/section."),
});

interface CreateSubjectFormProps {
  onFinished: () => void;
}

export function CreateSubjectForm({ onFinished }: CreateSubjectFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      yearLevel: "",
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      semester: "",
      blocks: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: "Error", description: "You must be logged in to create a subject."});
        return;
    }

    const subjectsCol = collection(firestore, "subjects");
    
    addDocumentNonBlocking(subjectsCol, {
      ...values,
      teacherId: user.uid,
    });

    toast({
      title: "Subject Created!",
      description: `The subject "${values.name}" has been added.`,
    });
    form.reset();
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Capstone Project 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="academicYear"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Academic Year</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., 2024-2025" {...field} />
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
                <FormControl>
                    <Input placeholder="e.g., 1st Semester" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="yearLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year Level</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 4" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="blocks"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Blocks / Sections</FormLabel>
                <FormControl>
                    <TagInput
                        placeholder="Type a block/section and press Enter..."
                        value={field.value}
                        onChange={field.onChange}
                    />
                </FormControl>
                <FormDescription>
                    List the class blocks or sections taking this subject (e.g., 4A, 4B).
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />
        <Button type="submit">Create Subject</Button>
      </form>
    </Form>
  );
}
