import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@zeyn/ui/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-none border px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      tone: {
        default: "border-border bg-muted text-muted-foreground",
        brand: "border-brand/30 bg-brand/10 text-brand",
        primary: "border-foreground/20 bg-foreground/5 text-foreground",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
);

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
