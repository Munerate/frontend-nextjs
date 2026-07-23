"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "code";

type RequestResponse = {
  ok?: boolean;
  status?: "sent" | "unrecognised";
  error?: string;
};

type Props = {
  from?: string;
  onUnrecognisedChange?: (unrecognised: boolean) => void;
};

export function GateForm({ from, onUnrecognisedChange }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unrecognised, setUnrecognised] = useState(false);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (step === "code") {
      codeInputRef.current?.focus();
    }
  }, [step]);

  function setUnrecognisedState(next: boolean) {
    setUnrecognised(next);
    onUnrecognisedChange?.(next);
  }

  async function submitEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const res = await fetch("/api/investors/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => null)) as RequestResponse | null;

      if (data?.status === "unrecognised") {
        setUnrecognisedState(true);
        return;
      }

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Could not send code. Try again shortly.");
        return;
      }

      setUnrecognisedState(false);
      setStep("code");
      setNotice(`Sent to ${email}.`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function submitCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/investors/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "That code is invalid or expired.");
        return;
      }
      const dest = from && from.startsWith("/investors/access") ? from : "/investors/access";
      router.replace(dest);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await fetch("/api/investors/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setNotice(`Resent to ${email}.`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="surface rounded-xl p-6 sm:p-8 animate-rise-in">
      {step === "email" ? (
        <form onSubmit={submitEmail} className="flex flex-col gap-4" noValidate>
          <label className="text-sm text-ink-200" htmlFor="email">
            Principal email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (unrecognised) setUnrecognisedState(false);
            }}
            placeholder="your@email.com"
            className="input"
          />
          <button type="submit" className="btn-primary" disabled={pending || email.length === 0}>
            {pending ? "Sending…" : "Access →"}
          </button>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {unrecognised ? (
            <p className="text-sm text-red-400 leading-relaxed">
              This email isn&apos;t recognised. To request access, contact{" "}
              <a
                className="underline decoration-red-400/40 underline-offset-2 hover:decoration-red-400"
                href="mailto:adam@munerate.com?subject=Munerate%20access%20request"
              >
                adam@munerate.com
              </a>{" "}
              directly.
            </p>
          ) : (
            <p className="text-xs text-ink-300 leading-relaxed">
              We&apos;ll email a six-digit code. Access is limited to a small list of principals; if
              you&apos;re not on it yet,{" "}
              <a
                className="text-tide-300 hover:text-tide-200"
                href="mailto:adam@munerate.com?subject=Munerate%20access%20request"
              >
                reach out
              </a>
              .
            </p>
          )}
        </form>
      ) : (
        <form onSubmit={submitCode} className="flex flex-col gap-4" noValidate>
          <div className="flex items-baseline justify-between">
            <label className="text-sm text-ink-200" htmlFor="code">
              Six-digit code
            </label>
            <button type="button" onClick={() => setStep("email")} className="btn-ghost text-xs">
              ← change email
            </button>
          </div>
          <input
            id="code"
            ref={codeInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="input font-mono tracking-[0.4em] text-center text-lg"
          />
          <button type="submit" className="btn-primary" disabled={pending || code.length !== 6}>
            {pending ? "Verifying…" : "Enter →"}
          </button>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {!error && notice ? <p className="text-xs text-ink-300">{notice}</p> : null}
          <button type="button" onClick={resend} className="btn-ghost text-xs self-start" disabled={pending}>
            Resend code
          </button>
        </form>
      )}
    </div>
  );
}
