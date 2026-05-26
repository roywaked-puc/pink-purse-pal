import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  icon,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-3", className)}>
      <div className="flex items-start gap-2 min-w-0">
        {icon && (
          <span className="text-primary mt-0.5 shrink-0" aria-hidden>
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base md:text-lg font-semibold text-foreground leading-tight truncate">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
