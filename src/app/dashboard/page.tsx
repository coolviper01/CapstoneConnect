
'use client';
import AdviserDashboard from './adviser-dashboard';
import TeacherDashboard from './teacher-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import StudentDashboardPage from '../student/page';
import { useFirebase } from '@/firebase';

export default function DashboardPage() {
  const { role, isRoleLoading } = useFirebase();

  if (isRoleLoading) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="grid gap-1">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-6 w-96" />
                </div>
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  if (role === 'adviser') {
    return <AdviserDashboard />;
  }

  if (role === 'teacher') {
    return <TeacherDashboard />;
  }
  
  if (role === 'student') {
    // This case might happen if a student navigates here directly.
    // The main student dashboard is at /student, so we render that.
    return <StudentDashboardPage />;
  }


  return <div>Error: User role could not be determined. Please try logging in again.</div>;
}
