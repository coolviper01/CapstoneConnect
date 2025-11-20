import { consultations } from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import TalkingPoints from "./talking-points";

export default async function ConsultationDetailPage({ params }: { params: { id: string } }) {
  const consultation = consultations.find((c) => c.id === params.id);

  if (!consultation) {
    notFound();
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

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
                <span>{new Date(consultation.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{consultation.startTime} - {consultation.endTime}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{consultation.venue}</span>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Students</p>
                  <ul className="text-muted-foreground">
                    {consultation.students.map(s => <li key={s.id}>{s.name}</li>)}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <TalkingPoints consultation={consultation} />
          
        </div>
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Discussion Notes</CardTitle>
              <CardDescription>
                Collaboratively record notes during the consultation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea defaultValue={consultation.notes} className="min-h-[200px]" placeholder="Start typing notes here..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Record attendance with digital signatures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {consultation.students.map(student => (
                <div key={student.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium">{student.name}</span>
                  <Input 
                    className="w-64" 
                    placeholder="Type name to sign" 
                    defaultValue={consultation.attendees?.find(a => a.studentId === student.id)?.signature}
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button>Save Attendance</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
