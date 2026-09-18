import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { MoneyDisplay } from '@/components/ds/MoneyDisplay';

interface BalanceCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'accent';
  hidden?: boolean;
  /** Quando informado, o card vira um botão que abre o detalhamento. */
  onClick?: () => void;
}

export function BalanceCard({ title, value, icon: Icon, variant = 'primary', hidden, onClick }: BalanceCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        "p-4 rounded-xl shadow-soft animate-fade-in",
        onClick && "text-left w-full transition-transform active:scale-[0.98] hover:shadow-md",
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
      <MoneyDisplay value={value} hidden={hidden} size="xl" className="font-bold" />
    </Wrapper>
  );
}
