
'use client';
import { useMemo, useState, useEffect } from 'react';
import { useFirebase } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import AdviserDashboard from './adviser-dashboard';
import TeacherDashboard from './teacher-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const [role, setRole] = useState<'adviser' | 'teacher' | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    const determineRole = async () => {
      if (user && firestore) {
        setIsRoleLoading(true);
        const adviserDoc = await getDoc(doc(firestore, "advisors", user.uid));
        if (adviserDoc.exists()) {
          setRole('adviser');
          setIsRoleLoading(false);
          return;
        }
        const teacherDoc = await getDoc(doc(firestore, "teachers", user.uid));
        if (teacherDoc.exists()) {
          setRole('teacher');
          setIsRoleLoading(false);
          return;
        }
        setRole(null);
        setIsRoleLoading(false);
      }
    };

    if (!isUserLoading) {
      determineRole();
    }
  }, [user, firestore, isUserLoading]);

  if (isUserLoading || isRoleLoading) {
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

  return <div>Error: User role could not be determined.</div>;
}
