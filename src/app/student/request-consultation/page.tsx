'use server';

import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestConsultationForm } from './request-consultation-form';

function RequestConsultationPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <PageHeader
        title="Request a Consultation"
        description="Provide an agenda for your consultation. Your adviser will schedule the date and time."
      />
      <Suspense fallback={<FormSkeleton />}>
        <RequestConsultationForm />
      </Suspense>
    </div>
  );
}

function FormSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
    )
}

export default RequestConsultationPage;
