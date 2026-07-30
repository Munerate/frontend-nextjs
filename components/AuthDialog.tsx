"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { track, clientIdentify } from "@/lib/track";
import Brand from "@/components/Brand";
import { X } from "lucide-react";

function nextKind(next: string): "sites" | "sites_new" | "other" {
  if (next.startsWith("/sites/new") || next.includes("mode=new")) return "sites_new";
  if (next.startsWith("/sites")) return "sites";
  return "other";
}

function authErrorCode(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("rate") || m.includes("too many")) return "rate_limited";
  if (m.includes("expired")) return "otp_expired";
  if (m.includes("invalid") || m.includes("token")) return "otp_invalid";
  if (m.includes("network") || m.includes("fetch")) return "network";
  return "unknown";
}

export default function AuthDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/sites";
  const next_kind = nextKind(next);

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const email_domain = email.trim().toLowerCase().split("@")[1] ?? null;
    track("login_send_code_attempt", { next_kind, email_domain });
    setMsg(null);
    const supabase = getSupabaseClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true, emailRedirectTo, data: { flow: "login" } },
    });
    setBusy(false);
    if (error) {
      track("login_send_code_error", { next_kind, error_code: authErrorCode(error.message) });
      setMsg(error.message);
      return;
    }
    track("login_send_code_success", { next_kind, email_domain });
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    track("login_verify_attempt", { next_kind, code_len: code.trim().length });
    setMsg(null);
    const supabase = getSupabaseClient();
    const addr = email.trim().toLowerCase();
    const token = code.trim();
    let { error } = await supabase.auth.verifyOtp({ email: addr, token, type: "email" });
    if (error) {
      ({ error } = await supabase.auth.verifyOtp({ email: addr, token, type: "signup" }));
    }
    setBusy(false);
    if (error) {
      track("login_verify_error", { next_kind, error_code: authErrorCode(error.message) });
      setMsg(error.message);
      return;
    }
    await clientIdentify(supabase, { next_kind, otp_type: "code" });
    onClose();
    router.push(next);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-md border border-neo-line bg-white px-3 py-2 text-sm text-neo-ink outline-none transition-colors placeholder:text-gray-400 focus:border-neo-main focus:ring-1 focus:ring-neo-main";
  const buttonClass =
    "w-full rounded-md bg-neo-main px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed";

  const dialogContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-xl border border-neo-line bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="mb-6 flex justify-center">
          <Brand size="md" className="text-neo-ink" />
        </div>

        <h2 className="text-center text-xl font-bold text-neo-ink">
          {step === "email" ? "Sign in" : "Enter your code"}
        </h2>
        
        <p className="mt-2 mb-6 text-center text-sm text-gray-500">
          {step === "email" ? (
            "We'll email you a one-time code — no password needed."
          ) : (
            <>
              We sent a code to <span className="font-semibold text-neo-ink">{email.trim()}</span>.
            </>
          )}
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="flex flex-col gap-4">
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
              {busy ? "Sending..." : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="flex flex-col gap-4">
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
              {busy ? "Verifying..." : "Verify & sign in"}
            </button>
          </form>
        )}

        {msg && <p className="mt-4 text-center text-sm text-red-500">{msg}</p>}

        {step === "code" && (
          <button
            onClick={() => {
              track("login_use_different_email", { next_kind });
              setStep("email");
              setCode("");
              setMsg(null);
            }}
            className="mx-auto mt-4 block text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
          >
            Use a different email
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
