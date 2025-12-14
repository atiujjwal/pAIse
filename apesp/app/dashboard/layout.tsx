import { Sidebar } from "@/src/components/layout/Sidebar";
import { TopNav } from "@/src/components/layout/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Fixed Sidebar */}
      <div className="hidden w-72 flex-col border-r border-border bg-card md:flex shadow-sm z-20">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
