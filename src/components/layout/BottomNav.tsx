import { Home, ArrowLeftRight, Calendar, FileText, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Agenda é o item CORE — posicionado ao centro e em destaque
const navItems = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: ArrowLeftRight, label: 'Movimentações', path: '/movimentacoes' },
  { icon: Calendar, label: 'Agenda', path: '/agendamentos', highlight: true },
  { icon: FileText, label: 'Relatórios', path: '/relatorios' },
  { icon: Settings, label: 'Config', path: '/configuracoes' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated z-50">
      <div className="flex items-center justify-around h-16 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          if (item.highlight) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full"
              >
                <div
                  className={cn(
                    '-mt-6 w-14 h-14 rounded-full flex items-center justify-center shadow-elevated transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/90 text-primary-foreground hover:bg-primary',
                  )}
                >
                  <item.icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium mt-1',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
