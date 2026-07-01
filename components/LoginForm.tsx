"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import Brand from "@/components/Brand";

// Passwordless auth. Step 1: enter email → Supabase sends an email with both a
// magic link and a code. Step 2: type the code → verifyOtp signs you in.
// (The magic link still works too and lands on /auth/callback.) This mirrors the
// Claim flow in EmailCapture, which relies on the link to carry site context.
export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/sites";

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(() => {
    const err = params.get("error");
    if (!err) return null;
    return err === "missing_code"
      ? "That link was invalid or expired. Enter your email to get a fresh code."
      : err;
  });

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = getSupabaseClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      // flow: "login" is surfaced as {{ .Data.flow }} in the email template so
      // the confirm-signup email shows the OTP code (this form has a paste UI).
      options: { shouldCreateUser: true, emailRedirectTo, data: { flow: "login" } },
    });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = getSupabaseClient();
    const addr = email.trim().toLowerCase();
    const token = code.trim();
    // Returning users get an "email" (magic link) OTP; brand-new users get a
    // "signup" OTP from the confirm-signup template. We don't know which the
    // address is, so try "email" first and fall back to "signup".
    let { error } = await supabase.auth.verifyOtp({ email: addr, token, type: "email" });
    if (error) {
      ({ error } = await supabase.auth.verifyOtp({ email: addr, token, type: "signup" }));
    }
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  const inputClass =
    "font-text rounded-neo border-2 border-neo-frame bg-neo-canvas px-3 py-2 text-sm text-neo-ink outline-none transition-colors placeholder:text-neo-ink/40 focus:border-neo-main";
  const buttonClass =
    "font-display rounded-neo border-2 border-neo-frame bg-neo-main px-3 py-2.5 text-sm font-extrabold uppercase tracking-tight text-neo-on-primary shadow-neo transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60";

  return (
    <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-neo-canvas p-6 text-neo-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-black/40 via-transparent to-black/50"
      />
      <div className="w-full max-w-sm rounded-neo border-4 border-neo-frame bg-neo-card p-7 shadow-neo-lg">
        <Brand size="lg" tileFill="var(--field-a)" barFill="#ffffff" />
        <h1 className="font-display mt-5 text-2xl font-extrabold uppercase leading-[0.95] tracking-tight">
          {step === "email" ? "Sign in" : "Enter your code"}
        </h1>
        <p className="font-text mt-1 mb-6 text-sm font-medium text-neo-ink/60">
          {step === "email" ? (
            "We'll email you a one-time code — no password needed."
          ) : (
            <>
              We sent a code to{" "}
              <span className="font-bold text-neo-ink">{email.trim()}</span>. Enter
              it below to sign in.
            </>
          )}
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="flex flex-col gap-3">
            <input
              type="email"
              required
              autoFocus
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <button type="submit" disabled={busy} className={buttonClass}>
              {busy ? "…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="flex flex-col gap-3">
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder="12345678"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`${inputClass} text-center text-lg tracking-[0.5em]`}
            />
            <button type="submit" disabled={busy} className={buttonClass}>
              {busy ? "…" : "Verify & sign in"}
            </button>
          </form>
        )}

        {msg && <p className="font-text mt-3 text-sm text-neo-ink/80">{msg}</p>}

        <button
          onClick={() => {
            if (step === "code") {
              setStep("email");
              setCode("");
              setMsg(null);
            }
          }}
          disabled={step === "email"}
          className="font-text mt-4 text-sm font-semibold text-field-b transition-colors hover:text-field-b/80 disabled:opacity-0"
        >
          Use a different email
        </button>
      </div>
    </main>
  );
}
