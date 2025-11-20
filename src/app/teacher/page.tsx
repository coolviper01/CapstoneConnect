'use client';
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { Check, Search, X, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Consultation } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function TeacherDashboardPage() {
  const firestore = useFirestore();
  const consultationsQuery = useMemoFirebase(() => collection(firestore, 'consultations'), [firestore]);
  const { data: consultations, isLoading } = useCollection<Consultation>(consultationsQuery);
  const { toast } = useToast();

  const handleStatusChange = async (id: string, status: 'Approved' | 'Cancelled') => {
    if (!firestore) return;
    const docRef = doc(firestore, 'consultations', id);
    try {
      await updateDoc(docRef, { status });
      toast({
        title: "Status Updated",
        description: `Consultation has been ${status.toLowerCase()}.`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the consultation status.",
      });
    }
  };


  const getBadgeVariant = (status: Consultation['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Scheduled':
        return 'secondary';
      case 'Completed':
        return 'outline';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const renderTableRows = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-9 w-40 ml-auto" /></TableCell>
        </TableRow>
      ));
    }

    if (!consultations || consultations.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                    No consultations found.
                </TableCell>
            </TableRow>
        );
    }

    return consultations.map((consultation) => (
      <TableRow key={consultation.id}>
        <TableCell className="font-medium">{consultation.capstoneTitle}</TableCell>
        <TableCell className="hidden sm:table-cell">{consultation.advisor.name}</TableCell>
        <TableCell className="hidden md:table-cell">{new Date(consultation.date).toLocaleDateString()}</TableCell>
        <TableCell className="hidden lg:table-cell">{consultation.startTime} - {consultation.endTime}</TableCell>
        <TableCell>
          <Badge variant={getBadgeVariant(consultation.status)}>
            {consultation.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex gap-2 justify-end">
            <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/consultations/${consultation.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
                </Link>
            </Button>
            <Button variant="default" size="sm" onClick={() => handleStatusChange(consultation.id, 'Approved')} disabled={consultation.status === 'Approved'}>
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleStatusChange(consultation.id, 'Cancelled')} disabled={consultation.status === 'Cancelled'}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <>
        <PageHeader title="Teacher Dashboard" description="Oversee and manage all capstone consultations." />
        <Card>
            <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>All Consultations</CardTitle>
                <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by title..." className="pl-8 sm:w-[300px]" />
                </div>
                <Select>
                    <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Capstone Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Adviser</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {renderTableRows()}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      </>
  );
}
