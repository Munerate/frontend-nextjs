"use client";

// The conversion CTA: capture an email to "Claim" the site. On submit we record
// the claim (waitlist analytics) and kick off a passwordless magic-link signup.
// The confirmation email lands the user on /sites/new?domain=<url>, which
// auto-creates their site + tag and emails the install instructions. Outcome:
// claim the site → confirm email → drop in middleware → track every AI agent →
// get paid.

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { claimSite } from "@/app/(dashboard)/sites/actions";
import { track } from "@/lib/track";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailCapture({ url }: { url: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "submitting" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("Please enter a valid email address.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      track("claim_submit_invalid", { domain: url, reason: "invalid_email" });
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const normalizedEmail = trimmed.toLowerCase();
      const email_domain = normalizedEmail.split("@")[1] ?? null;
      track("claim_submit_attempt", { domain: url, email_domain });

      // Provision the site + account server-side and send a SINGLE install email
      // that carries a one-click magic login link. No separate OTP/sign-in email
      // is sent — the install email is the only message the user receives.
      const result = await claimSite(normalizedEmail, url);
      if ("error" in result) {
        track("claim_submit_error", { domain: url, error_code: result.error });
        setErrorMsg(
          result.error === "invalid_email"
            ? "Please enter a valid email address."
            : "Something went wrong. Please try again."
        );
        setStatus("error");
        return;
      }
      track(
        "claimed",
        { domain: url, email_domain, flow: "claim" },
        { immediate: true }
      );
      setStatus("success");
    } catch {
      track("claim_submit_error", { domain: url, error_code: "unknown" });
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="max-w-xl rounded-neo border-2 border-field-b bg-neo-card p-5 shadow-neo-white"
      >
        <p className="font-display text-lg font-extrabold text-field-b">
          Check your inbox.
        </p>
        <p className="font-text mt-1 text-sm font-medium text-white/75">
          We&apos;ve claimed <span className="font-bold text-white">{url}</span> and
          emailed your install steps to{" "}
          <span className="font-bold text-white">{email.trim()}</span>. Open it to
          drop in the middleware and sign in to your dashboard — then AI agents
          start paying you.
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
        <Button
          type="submit"
          variant="b"
          size="lg"
          className="whitespace-nowrap"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Claiming…" : "Claim"}
        </Button>
      </form>

      {status === "error" && (
        <p
          id="claim-email-error"
          role="alert"
          className="font-text mt-2 text-sm font-medium text-field-b"
        >
          {errorMsg}
        </p>
      )}

      <p className="font-text mt-3 text-xs font-normal text-white/50">
        No spam, no card. Just your install link and a heads-up when agents start
        paying.
      </p>
    </div>
  );
}
