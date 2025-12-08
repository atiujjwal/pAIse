import { Sidebar } from "@/src/components/layout/Sidebar";
import { TopNav } from "@/src/components/layout/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50/50">
      {/* Fixed Sidebar */}
      <div className="hidden w-72 flex-col border-r border-slate-100 bg-white md:flex">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav /> {/* <-- Profile Section lives here */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
