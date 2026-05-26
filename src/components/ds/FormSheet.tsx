import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  destructive?: boolean;
  side?: "right" | "bottom";
  size?: "sm" | "md" | "lg";
  hideFooter?: boolean;
}

const sizeClass = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
};

/**
 * Standard sheet used for create/edit forms across the app.
 * - On mobile: slides from the bottom.
 * - On desktop: slides from the right with constrained width.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  submitting,
  submitDisabled,
  destructive,
  side = "right",
  size = "md",
  hideFooter,
}: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "flex flex-col gap-0 p-0",
          side === "right" && sizeClass[size],
          side === "bottom" && "max-h-[92vh] rounded-t-3xl",
        )}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-sm">{description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {!hideFooter && (
          <SheetFooter className="px-5 py-3 border-t border-border bg-muted/30 flex-row gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {cancelLabel}
            </Button>
            {onSubmit && (
              <Button
                type="button"
                variant={destructive ? "destructive" : "default"}
                className="flex-1"
                onClick={onSubmit}
                disabled={submitting || submitDisabled}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {submitLabel}
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
