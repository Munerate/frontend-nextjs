"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VariantProps } from "class-variance-authority";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The submit button's variant is configurable so the form sits correctly on
// different surfaces: the landing's pink CTA panel passes "neutral" (white, no
// blue-on-pink), while the legacy dark /scan page keeps the default blue ("b").
export default function LandingHero({
  buttonVariant = "b",
  buttonLabel = "Scan free →",
  className,
}: {
  buttonVariant?: VariantProps<typeof buttonVariants>["variant"];
  buttonLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [domain, setDomain] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    router.push(`/analyze${clean ? `?domain=${encodeURIComponent(clean)}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row",
        className,
      )}
    >
      <Input
        type="text"
        inputMode="url"
        placeholder="yourdomain.com"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        className="flex-1"
        aria-label="Your domain"
      />
      <Button type="submit" variant={buttonVariant} size="lg" className="whitespace-nowrap">
        {buttonLabel}
      </Button>
    </form>
  );
}
