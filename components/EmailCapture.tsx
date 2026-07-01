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
import { getSupabaseClient } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailCapture({ url }: { url: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "submitting" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("Please enter a valid email address.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const supabase = getSupabaseClient();
      const normalizedEmail = trimmed.toLowerCase();

      // Record the claim (waitlist analytics). Non-fatal if it fails.
      await supabase.from("claims").insert({ email: normalizedEmail, url });

      // Passwordless signup: send a magic-link verification email. Clicking it
      // lands on /sites/new?domain=<url>, which auto-creates the site + tag and
      // emails the install instructions.
      const next = `/sites/new?domain=${encodeURIComponent(url)}`;
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        // flow: "claim" is surfaced in the email template as {{ .Data.flow }} so
        // the confirm-signup email renders link-only (no OTP code) — the Claim
        // flow completes by clicking the link, there's nowhere to paste a code.
        // domain is surfaced as {{ .Data.domain }} so the email names the exact
        // site being claimed.
        options: { shouldCreateUser: true, emailRedirectTo, data: { flow: "claim", domain: url } },
      });
      if (error) {
        setErrorMsg(error.message || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
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
          We sent a confirmation link to{" "}
          <span className="font-bold text-white">{email.trim()}</span>. Click it to
          claim <span className="font-bold text-white">{url}</span> — we&apos;ll set
          up your site and email your install so AI agents start paying you.
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
