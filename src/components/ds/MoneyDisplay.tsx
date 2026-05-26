import { cn } from "@/lib/utils";

interface MoneyDisplayProps {
  value: number;
  hidden?: boolean;
  variant?: "default" | "positive" | "negative" | "muted";
  size?: "sm" | "md" | "lg" | "xl";
  showSign?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl md:text-3xl",
};

const variantMap = {
  default: "text-foreground",
  positive: "text-success",
  negative: "text-destructive",
  muted: "text-muted-foreground",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);

export function MoneyDisplay({
  value,
  hidden,
  variant = "default",
  size = "md",
  showSign,
  className,
}: MoneyDisplayProps) {
  const display = hidden
    ? "R$ ••••"
    : showSign && value > 0
      ? `+${fmt(value)}`
      : fmt(value);

  return (
    <span
      className={cn(
        "font-semibold tabular-nums tracking-tight",
        sizeMap[size],
        variantMap[variant],
        className,
      )}
    >
      {display}
    </span>
  );
}
