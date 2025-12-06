'use client';

import { Header } from '@/src/components/layout/Header';
// import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { AuthGuard } from '@/src/features/auth/components/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900">
        {/* Persistent Sidebar */}
        <aside className="hidden w-64 border-r bg-background md:block">
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
             <div className="mx-auto max-w-5xl">
                {children}
             </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}