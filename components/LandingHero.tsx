"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VariantProps } from "class-variance-authority";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import BrandMark from "@/components/BrandMark";
import { cn } from "@/lib/utils";

// Loose "is this a domain?" check: after stripping any protocol and path, the
// host must be at least two dot-separated labels (e.g. example.com). Accepts
// subdomains (a.b.c) and inputs with a path/slashes; rejects bare strings with
// no dot. Intentionally not strict about TLDs.
function looksLikeDomain(input: string): boolean {
  const host = input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host);
}

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
  // `pending` stays true through the navigation, so the button shows its
  // scanning state until /estimate commits — no artificial timeout needed.
  const [pending, start] = useTransition();

  const valid = looksLikeDomain(domain);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return; // guards keyboard submit (Enter) too
    const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    start(() => {
      router.push(`/estimate?url=${encodeURIComponent(clean)}`);
    });
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
      <Button
        type="submit"
        variant={buttonVariant}
        size="lg"
        disabled={pending}
        aria-busy={pending}
        aria-disabled={!valid}
        className={cn("whitespace-nowrap", !valid && "pointer-events-none")}
      >
        {pending ? (
          <>
            <BrandMark size={18} animated tile={false} barFill="currentColor" title="Scanning" />
            Scanning…
          </>
        ) : (
          buttonLabel
        )}
      </Button>
    </form>
  );
}
