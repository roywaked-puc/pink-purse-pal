import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 px-4 pt-6 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
