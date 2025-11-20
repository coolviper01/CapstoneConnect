
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { doc } from "firebase/firestore";
import { useFirestore, updateDocumentNonBlocking } from "@/firebase";
import type { Consultation } from "@/lib/types";

const formSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required"),
});

interface ScheduleConsultationFormProps {
  consultation: Consultation;
  onFinished: () => void;
}

export function ScheduleConsultationForm({ consultation, onFinished }: ScheduleConsultationFormProps) {
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: "",
      endTime: "",
      venue: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const consultationRef = doc(firestore, "consultations", consultation.id);
    
    const updateData: Partial<Consultation> = {
        date: values.date.toISOString().split('T')[0],
        startTime: values.startTime,
        endTime: values.endTime,
        venue: values.venue,
        status: "Scheduled",
    };

    updateDocumentNonBlocking(consultationRef, updateData);

    form.reset();
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
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
                <FormControl><Input type="time" {...field} /></FormControl>
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
                <FormControl><Input type="time" {...field} /></FormControl>
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
                <FormControl><Input placeholder="e.g., Innovation Hub or Google Meet link" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <Button type="submit">Schedule & Approve</Button>
      </form>
    </Form>
  );
}
