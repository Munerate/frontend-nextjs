import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border-2 border-black px-2.5 py-0.5 text-xs font-bold",
  {
    variants: {
      variant: {
        main: "bg-neo-main text-white",
        b: "bg-field-b text-white",
        neutral: "bg-white text-black",
        ink: "bg-black text-white",
      },
    },
    defaultVariants: { variant: "main" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
