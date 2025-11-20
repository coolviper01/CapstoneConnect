
'use client';

import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard, BookOpenCheck } from "lucide-react";
import { useFirebase } from "@/firebase";
import { usePathname } from "next/navigation";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUserLoading } = useFirebase();
  const pathname = usePathname();
  const isPendingPage = pathname.includes('/student/pending');

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
        <Logo />
        <nav className="ml-auto flex items-center gap-4">
           <Button variant="outline" asChild disabled={isUserLoading || isPendingPage}>
            <Link href="/student">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                My Consultations
            </Link>
           </Button>
           <Button variant="outline" asChild disabled={isUserLoading || isPendingPage}>
            <Link href="/student/projects">
                <BookOpenCheck className="mr-2 h-4 w-4" />
                My Projects
            </Link>
           </Button>
          <UserNav />
        </nav>
      </header>
      <main className="flex-1 p-4 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
