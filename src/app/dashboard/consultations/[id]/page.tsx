'use client';
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, FileText, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import TalkingPoints from "./talking-points";
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Consultation, Attendee, Student, DiscussionPoint } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function ConsultationDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firestore = useFirestore();
  const { toast } = useToast();
  const consultationRef = useMemoFirebase(() => doc(firestore, "consultations", id), [firestore, id]);
  const { data: consultation, isLoading } = useDoc<Consultation>(consultationRef);
  
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [discussionPoints, setDiscussionPoints] = useState<DiscussionPoint[]>([]);

  useEffect(() => {
    if (consultation) {
      setAttendees(Array.isArray(consultation.attendees) ? consultation.attendees : []);
      setDiscussionPoints(Array.isArray(consultation.discussionPoints) ? consultation.discussionPoints : []);
    }
  }, [consultation]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  const handleSignatureChange = (studentId: string, signature: string) => {
    const newAttendees = [...attendees];
    const attendeeIndex = newAttendees.findIndex(a => a.studentId === studentId);
    if (attendeeIndex > -1) {
        newAttendees[attendeeIndex].signature = signature;
    } else {
        newAttendees.push({ studentId, signature });
    }
    setAttendees(newAttendees);
  };

  const saveAttendance = () => {
     if (consultationRef) {
      updateDocumentNonBlocking(consultationRef, { attendees: attendees });
      toast({ title: 'Attendance Saved!', description: 'The attendance record has been updated.' });
    }
  };
  
  const addDiscussionPoint = () => {
    const newPoint: DiscussionPoint = {
      id: new Date().toISOString(), // simple unique id
      adviserComment: "",
      status: 'To Do'
    };
    const newPoints = [...discussionPoints, newPoint];
    setDiscussionPoints(newPoints);
  }

  const updateDiscussionPoint = (id: string, comment: string) => {
    const newPoints = discussionPoints.map(p => p.id === id ? { ...p, adviserComment: comment } : p);
    setDiscussionPoints(newPoints);
  }

  const removeDiscussionPoint = (id: string) => {
    const newPoints = discussionPoints.filter(p => p.id !== id);
    setDiscussionPoints(newPoints);
    updateDocumentNonBlocking(consultationRef, { discussionPoints: newPoints });
  }

  const saveDiscussionPoints = () => {
    if (consultationRef) {
      updateDocumentNonBlocking(consultationRef, { discussionPoints: discussionPoints });
      toast({ title: 'Discussion Points Saved!', description: 'Your comments have been updated.' });
    }
  }


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
              <CardTitle>Discussion Points</CardTitle>
              <CardDescription>
                Add comments and action items for the students. Changes are saved when you click the save button.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {discussionPoints.map((point, index) => (
                <div key={point.id} className="flex items-start gap-2">
                  <span className="font-bold text-muted-foreground pt-2">{index + 1}.</span>
                  <Textarea 
                    value={point.adviserComment}
                    onChange={(e) => updateDiscussionPoint(point.id, e.target.value)}
                    className="flex-1"
                    placeholder="Enter discussion point or action item..."
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeDiscussionPoint(point.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
               <Button variant="outline" onClick={addDiscussionPoint}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Point
              </Button>
            </CardContent>
             <CardFooter>
              <Button onClick={saveDiscussionPoints}>Save Discussion Points</Button>
            </CardFooter>
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
    

    