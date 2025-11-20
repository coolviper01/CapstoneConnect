'use client';

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
import { doc } from "firebase/firestore";
import { updateDocumentNonBlocking, useFirestore } from "@/firebase";
import { TagInput } from "@/components/ui/tag-input";
import type { Subject } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  yearLevel: z.string().min(1, "Year level is required"),
  blocks: z.array(z.string()).min(1, "At least one block is required"),
});

interface EditSubjectFormProps {
  subject: Subject;
  onFinished: () => void;
}

export function EditSubjectForm({ subject, onFinished }: EditSubjectFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subject.name,
      yearLevel: subject.yearLevel,
      blocks: subject.blocks,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const subjectDoc = doc(firestore, "subjects", subject.id);
    
    updateDocumentNonBlocking(subjectDoc, values);

    toast({
      title: "Subject Updated!",
      description: `The subject "${values.name}" has been successfully updated.`,
    });
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
        <FormField
          control={form.control}
          name="yearLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year Level</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 4th Year" {...field} />
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
                    {...field}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter a block and press Enter..."
                  />
              </FormControl>
               <FormDescription>
                  Press Enter or comma to add a block.
                </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}
