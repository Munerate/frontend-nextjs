"use client";

// The conversion CTA: capture an email to "Claim" the site. UI-only for now —
// validates client-side and shows a success state. The real work (email auth +
// self-serve install of the tracking middleware that monitors this site's
// AI-agent traffic ongoing) is wired by the co-dev at the INTEGRATION POINT
// below. Copy points at that outcome: claim the site → drop in middleware →
// track every AI agent → get paid.

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailCapture({ url }: { url: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      return;
    }
    setStatus("success");
    // ────────────────────────────────────────────────────────────────────────
    // INTEGRATION POINT (co-dev): swap this stub for the real flow —
    // kick off email auth for `trimmed` and start the self-serve install of the
    // tracking middleware for `url`, e.g.
    //   await claimSite({ email: trimmed, url });
    // Consider adding a "submitting" status here with a loading spinner (reuse
    // the BrandMark-in-button idiom from LandingHero), and setStatus("error")
    // with a server message on failure.
    // ────────────────────────────────────────────────────────────────────────
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="max-w-xl rounded-neo border-2 border-field-b bg-neo-card p-5 shadow-neo-white"
      >
        <p className="font-display text-lg font-extrabold text-field-b">
          You&apos;re on the list.
        </p>
        <p className="font-text mt-1 text-sm font-medium text-white/75">
          We&apos;ll email <span className="font-bold text-white">{email.trim()}</span>{" "}
          your one-line install for{" "}
          <span className="font-bold text-white">{url}</span> so AI agents start
          paying you.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-white md:text-2xl">
        Start getting paid
      </h2>
      <p className="font-text mt-1 max-w-xl text-sm font-medium text-white/70">
        Install <span className="font-bold text-white">Munerate</span> to monetize AI on <span className="font-bold text-white">{url}</span>
        — we&apos;ll track every AI agent that hits your content
        and turn it into revenue.
      </p>

      <form
        onSubmit={submit}
        noValidate
        className="mt-4 flex w-full max-w-lg flex-col gap-3 sm:flex-row"
      >
        <div className="flex-1">
          <label htmlFor="claim-email" className="sr-only">
            Email address
          </label>
          <Input
            id="claim-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            aria-invalid={status === "error"}
            aria-describedby={status === "error" ? "claim-email-error" : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            className={status === "error" ? "border-field-b" : undefined}
          />
        </div>
        <Button type="submit" variant="b" size="lg" className="whitespace-nowrap">
          Claim
        </Button>
      </form>

      {status === "error" && (
        <p
          id="claim-email-error"
          role="alert"
          className="font-text mt-2 text-sm font-medium text-field-b"
        >
          Please enter a valid email address.
        </p>
      )}

      <p className="font-text mt-3 text-xs font-normal text-white/50">
        No spam, no card. Just your install link and a heads-up when agents start
        paying.
      </p>
    </div>
  );
}
