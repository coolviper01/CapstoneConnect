
'use client';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Home, CalendarPlus, LayoutDashboard, BookMarked } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import Link from "next/link";
import { useFirebase } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, firestore } = useFirebase();
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    if (user && firestore) {
      const checkRole = async () => {
        const teacherDoc = await getDoc(doc(firestore, "teachers", user.uid));
        if (teacherDoc.exists()) {
          setIsTeacher(true);
        }
      };
      checkRole();
    }
  }, [user, firestore]);
  
  const menuItems = isTeacher ? (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Dashboard">
          <Link href="/dashboard">
            <LayoutDashboard />
            Dashboard
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Subjects">
          <Link href="/dashboard/subjects">
            <BookMarked />
            Subjects
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  ) : (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Dashboard">
          <Link href="/dashboard">
            <LayoutDashboard />
            Dashboard
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Schedule Consultation">
          <Link href="/dashboard/schedule">
            <CalendarPlus />
            Schedule
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to Home">
                  <Link href="/">
                    <Home />
                    Home
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="md:hidden"/>
          <div className="flex items-center gap-4 ml-auto">
             <UserNav />
          </div>
        </header>
        <main className="flex flex-1 flex-col p-4 sm:px-6 sm:py-0 gap-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
