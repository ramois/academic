import { useState, type ReactNode } from 'react';
import { useAuthStore } from '../../../stores';
import { Header } from '../../organisms/Header';
import { Sidebar } from '../../organisms/Sidebar';

type MainLayoutProps = {
  children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100/80">
      <Header onMenuClick={user ? () => setSidebarOpen((o) => !o) : undefined} />
      <div className="flex flex-1">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
