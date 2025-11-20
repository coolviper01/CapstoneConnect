
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { PageHeader } from "@/components/page-header";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-4 ml-auto">
          <UserNav />
        </div>
      </header>
      <main className="flex-1 p-4 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
