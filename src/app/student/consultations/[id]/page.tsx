'use client';
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Consultation, Student, DiscussionPoint } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function StudentConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const firestore = useFirestore();
  const { toast } = useToast();
  const consultationRef = useMemoFirebase(() => doc(firestore, "consultations", id), [firestore, id]);
  const { data: consultation, isLoading } = useDoc<Consultation>(consultationRef);

  const [discussionPoints, setDiscussionPoints] = useState<DiscussionPoint[]>([]);

  useEffect(() => {
    if (consultation) {
      setDiscussionPoints(Array.isArray(consultation.discussionPoints) ? consultation.discussionPoints : []);
    }
  }, [consultation]);

  const updateDiscussionPoint = (id: string, response: string) => {
    const newPoints = discussionPoints.map(p => p.id === id ? { ...p, studentResponse: response } : p);
    setDiscussionPoints(newPoints);
  }

  const updateDiscussionStatus = (id: string, status: 'To Do' | 'On-going' | 'Done') => {
    const newPoints = discussionPoints.map(p => p.id === id ? { ...p, status: status } : p);
    setDiscussionPoints(newPoints);
  }

  const saveUpdates = () => {
    if (consultationRef) {
      updateDocumentNonBlocking(consultationRef, { discussionPoints: discussionPoints });
      toast({ title: 'Updates Saved!', description: 'Your responses have been saved.' });
    }
  }
  
  const getStatusBadgeVariant = (status: DiscussionPoint['status']) => {
    switch (status) {
      case 'Done':
        return 'default';
      case 'On-going':
        return 'secondary';
      case 'To Do':
        return 'outline';
    }
  };

  if (isLoading) {
    return (
       <div className="flex flex-col gap-6">
          <PageHeader title={<Skeleton className="h-9 w-3/4" />} />
          <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col gap-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-1/4" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /></CardContent></Card>
              </div>
              <div className="md:col-span-2 flex flex-col gap-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
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
      <PageHeader title={consultation.capstoneTitle} />
      
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
        </div>
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Discussion Points & Action Items</CardTitle>
              <CardDescription>
                Review comments from your adviser and update your progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(discussionPoints && discussionPoints.length > 0) ? discussionPoints.map((point, index) => (
                <div key={point.id} className="grid gap-4 p-4 border rounded-lg">
                   <div>
                     <p className="text-sm font-semibold mb-2">Adviser's Comment #{index + 1}</p>
                     <p className="text-sm bg-muted p-3 rounded-md">{point.adviserComment || "No comment from adviser."}</p>
                   </div>
                   
                   <div className="grid gap-2">
                     <label className="text-sm font-semibold">Your Response / Update</label>
                     <Textarea 
                       value={point.studentResponse || ""}
                       onChange={(e) => updateDiscussionPoint(point.id, e.target.value)}
                       placeholder="Describe the activity you made or provide an update..."
                     />
                   </div>
                   
                   <div className="flex justify-between items-center">
                     <div className="grid gap-2">
                        <label className="text-sm font-semibold">Status</label>
                        <Select
                            value={point.status}
                            onValueChange={(value: 'To Do' | 'On-going' | 'Done') => updateDiscussionStatus(point.id, value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="To Do">To Do</SelectItem>
                                <SelectItem value="On-going">On-going</SelectItem>
                                <SelectItem value="Done">Done</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                      <Badge variant={getStatusBadgeVariant(point.status)} className="mt-auto">{point.status}</Badge>
                   </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-8">No discussion points from the adviser for this consultation yet.</p>
              )}
            </CardContent>
            {(discussionPoints && discussionPoints.length > 0) && (
              <CardFooter>
                <Button onClick={saveUpdates}>Save My Updates</Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
