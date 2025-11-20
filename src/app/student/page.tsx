
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock, MapPin, Hourglass } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Consultation } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function StudentDashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const consultationsQuery = useMemoFirebase(
    () => user ? query(
        collection(firestore, "consultations"), 
        where("studentIds", "array-contains", user.uid)
    ) : null,
    [firestore, user]
  );
  const { data: studentConsultations, isLoading } = useCollection<Consultation>(consultationsQuery);

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
            <div className="text-sm text-muted-foreground pt-1"><Skeleton className="h-4 w-1/2" /></div>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 text-sm">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ));
    }

    if (!studentConsultations || studentConsultations.length === 0) {
      return (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardContent className="flex flex-col items-center justify-center text-center p-16">
            <h3 className="text-xl font-semibold">No Consultations Found</h3>
            <p className="text-muted-foreground mt-2">You can request consultations from the 'My Projects' page for approved projects.</p>
             <Button asChild className="mt-4">
                <Link href="/student/projects">Go to My Projects</Link>
             </Button>
          </CardContent>
        </Card>
      );
    }

    return studentConsultations.sort((a, b) => (new Date(b.date || 0) as any) - (new Date(a.date || 0) as any)).map(consultation => (
      <Card key={consultation.id} className="flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{consultation.capstoneTitle}</CardTitle>
              <CardDescription>{consultation.blockGroupNumber}</CardDescription>
            </div>
            <Badge variant={consultation.status === 'Scheduled' ? 'default' : 'secondary'}>
              {consultation.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 text-sm">
           {consultation.status === 'Scheduled' || consultation.status === 'Completed' ? (
             <>
                <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{consultation.date ? new Date(consultation.date).toLocaleDateString() : 'TBD'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{consultation.startTime && consultation.endTime ? `${consultation.startTime} - ${consultation.endTime}` : 'TBD'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{consultation.venue || 'TBD'}</span>
                </div>
             </>
           ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
                <Hourglass className="h-4 w-4" />
                <span>Pending confirmation and schedule by the adviser.</span>
            </div>
           )}
        </CardContent>
        {(consultation.status === 'Scheduled' || consultation.status === 'Completed') && (
          <CardFooter>
            <Button asChild className="w-full" variant="secondary">
              <Link href={`/student/consultations/${consultation.id}`}>
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    ));
  };

  return (
    <div className="flex flex-col gap-6">
        <PageHeader title="My Consultations" description="Here are your requested and scheduled capstone appointments." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {renderContent()}
        </div>
    </div>
  );
}
