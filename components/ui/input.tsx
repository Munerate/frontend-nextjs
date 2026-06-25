import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-neo border-2 border-neo-frame bg-neo-card px-4 text-sm font-medium text-neo-ink shadow-neo transition-all placeholder:text-neo-ink/40 focus-visible:-translate-x-[1px] focus-visible:-translate-y-[1px] focus-visible:shadow-neo-lg focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
