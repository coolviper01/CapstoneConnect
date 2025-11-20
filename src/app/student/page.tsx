'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Consultation } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboardPage() {
  const firestore = useFirestore();
  // In a real app, this would be filtered for the logged-in student.
  // For now, we'll show all scheduled consultations.
  const consultationsQuery = useMemoFirebase(
    () => query(collection(firestore, "consultations"), where("status", "==", "Scheduled")),
    [firestore]
  );
  const { data: studentConsultations, isLoading } = useCollection<Consultation>(consultationsQuery);

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
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
            <h3 className="text-xl font-semibold">No Upcoming Consultations</h3>
            <p className="text-muted-foreground mt-2">Check back later for scheduled appointments.</p>
          </CardContent>
        </Card>
      );
    }

    return studentConsultations.map(consultation => (
      <Card key={consultation.id} className="flex flex-col">
        <CardHeader>
          <CardTitle>{consultation.capstoneTitle}</CardTitle>
          <CardDescription>{consultation.blockGroupNumber}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 text-sm">
           <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(consultation.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{consultation.startTime} - {consultation.endTime}</span>
          </div>
          <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{consultation.venue}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="secondary">
            <Link href={`/dashboard/consultations/${consultation.id}`}>
              View Details <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-4 ml-auto">
          <UserNav />
        </div>
      </header>
      <main className="flex-1 p-4 sm:px-6 sm:py-8">
        <PageHeader title="My Consultations" description="Here are your upcoming capstone consultations." />
        <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
