import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-neo border-2 border-neo-frame font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-frame disabled:pointer-events-none disabled:opacity-50 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-neo-main text-neo-on-primary shadow-neo hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-lg",
        b: "bg-field-b text-neo-on-accent shadow-neo hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-lg",
        bDark:
          "bg-field-b text-neo-on-accent border-white shadow-neo-white hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-lg-white",
        neutral:
          "bg-white text-black shadow-neo hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-lg",
        ink: "bg-black text-white shadow-neo hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-lg",
        ghost: "border-transparent shadow-none hover:bg-neo-ink/5",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button, buttonVariants };
