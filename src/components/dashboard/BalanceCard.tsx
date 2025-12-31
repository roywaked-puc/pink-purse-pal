import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface BalanceCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'accent';
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function BalanceCard({ title, value, icon: Icon, variant = 'primary' }: BalanceCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl shadow-soft animate-fade-in",
        variant === 'primary' && "bg-primary text-primary-foreground",
        variant === 'secondary' && "bg-card border border-border text-card-foreground",
        variant === 'accent' && "bg-accent text-accent-foreground"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "p-2 rounded-lg",
          variant === 'primary' && "bg-primary-foreground/20",
          variant === 'secondary' && "bg-primary/10",
          variant === 'accent' && "bg-primary/15"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn(
          "text-sm font-medium",
          variant === 'primary' && "text-primary-foreground/90",
          variant === 'secondary' && "text-muted-foreground",
          variant === 'accent' && "text-accent-foreground/80"
        )}>
          {title}
        </span>
      </div>
      <p className="text-2xl font-bold">{formatCurrency(value)}</p>
    </div>
  );
}
