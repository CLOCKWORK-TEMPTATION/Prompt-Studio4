import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans" dir="rtl">
      <Sidebar />
      <main className="flex-1 overflow-auto relative flex flex-col">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
