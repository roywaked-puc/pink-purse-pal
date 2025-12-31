import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 px-4 pt-6 max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
