'use client';
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import TalkingPoints from "./talking-points";
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Consultation, Attendee, Student } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState, useEffect, useCallback } from "react";
import { debounce } from 'lodash';
import { useToast } from "@/hooks/use-toast";

export default function ConsultationDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firestore = useFirestore();
  const { toast } = useToast();
  const consultationRef = useMemoFirebase(() => doc(firestore, "consultations", id), [firestore, id]);
  const { data: consultation, isLoading } = useDoc<Consultation>(consultationRef);
  
  const [notes, setNotes] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);

  useEffect(() => {
    if (consultation) {
      setNotes(consultation.notes || "");
      // Ensure attendees is always an array
      setAttendees(Array.isArray(consultation.attendees) ? consultation.attendees : []);
    }
  }, [consultation]);


  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  // Debounced function to save notes to Firestore
  const debouncedSaveNotes = useCallback(
    debounce((newNotes: string) => {
      if (consultationRef) {
        // Use non-blocking update for better UX
        setDocumentNonBlocking(consultationRef, { notes: newNotes }, { merge: true });
      }
    }, 1000), // 1-second debounce delay
    [consultationRef]
  );

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    debouncedSaveNotes(newNotes);
  };
  
  const handleSignatureChange = (studentId: string, signature: string) => {
    setAttendees(prevAttendees => {
        const newAttendees = [...prevAttendees];
        const attendeeIndex = newAttendees.findIndex(a => a.studentId === studentId);
        if (attendeeIndex > -1) {
            newAttendees[attendeeIndex].signature = signature;
        } else {
            newAttendees.push({ studentId, signature });
        }
        return newAttendees;
    });
  };

  const saveAttendance = () => {
     if (consultationRef) {
      setDocumentNonBlocking(consultationRef, { attendees: attendees }, { merge: true });
      toast({ title: 'Attendance Saved!', description: 'The attendance record has been updated.' });
    }
  };

  if (isLoading) {
    return (
       <div className="flex flex-col gap-6">
          <PageHeader title={<Skeleton className="h-9 w-3/4" />}><Skeleton className="h-10 w-44" /></PageHeader>
          <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col gap-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-1/4" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></CardContent></Card>
              </div>
              <div className="md:col-span-2 flex flex-col gap-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-32" /></CardFooter></Card>
              </div>
          </div>
       </div>
    )
  }

  if (!consultation) {
    notFound();
  }
  
  const studentList: Student[] = Array.isArray(consultation.students) ? consultation.students : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={consultation.capstoneTitle}>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Download PDF Report
        </Button>
      </PageHeader>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Consultation Info</CardTitle>
              <CardDescription>{consultation.blockGroupNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{consultation.date ? new Date(consultation.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Not Scheduled"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{consultation.startTime && consultation.endTime ? `${consultation.startTime} - ${consultation.endTime}` : 'Not Scheduled'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{consultation.venue || 'Not Scheduled'}</span>
              </div>
              {studentList.length > 0 && (
                 <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                    <p className="font-medium">Students</p>
                    <ul className="text-muted-foreground">
                        {studentList.map(s => <li key={s.id}>{s.name}</li>)}
                    </ul>
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <TalkingPoints consultation={consultation} />
          
        </div>
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Discussion Notes</CardTitle>
              <CardDescription>
                This editor is collaborative. Notes are saved automatically as you type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={notes}
                onChange={handleNotesChange}
                className="min-h-[200px]" 
                placeholder="Start typing notes here..." 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Record attendance by having students type their name to sign.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentList.map(student => (
                <div key={student.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium">{student.name}</span>
                  <Input 
                    className="w-64" 
                    placeholder="Type name to sign" 
                    value={attendees.find(a => a.studentId === student.id)?.signature || ''}
                    onChange={(e) => handleSignatureChange(student.id, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button onClick={saveAttendance}>Save Attendance</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
    