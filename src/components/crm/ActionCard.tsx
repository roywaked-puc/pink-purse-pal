import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  icon: LucideIcon;
  emoji?: string;
  title: string;
  count: number;
  description: string;
  onClick: () => void;
  tone?: 'primary' | 'warning' | 'success' | 'danger' | 'info' | 'muted';
}

const tones: Record<NonNullable<ActionCardProps['tone']>, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  danger: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
  info: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400',
  muted: 'bg-muted text-muted-foreground border-border',
};

export function ActionCard({
  icon: Icon,
  emoji,
  title,
  count,
  description,
  onClick,
  tone = 'primary',
}: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left w-full p-4 rounded-xl border bg-card shadow-soft transition-all hover:shadow-elevated hover:-translate-y-0.5',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center border',
            tones[tone],
          )}
        >
          {emoji ? <span className="text-lg">{emoji}</span> : <Icon className="w-5 h-5" />}
        </div>
        <span className="text-3xl font-bold tabular-nums">{count}</span>
      </div>
      <p className="font-semibold text-sm text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
    </button>
  );
}
