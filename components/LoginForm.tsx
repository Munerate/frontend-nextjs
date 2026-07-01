"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import Brand from "@/components/Brand";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/sites";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(() => {
    const err = params.get("error");
    if (!err) return null;
    return err === "missing_code"
      ? "Confirmation link was invalid or expired. Try signing in or sign up again."
      : err;
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = getSupabaseClient();
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            },
          });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    if (mode === "signup") {
      setMsg("Account created. Check your inbox and click the confirmation link — it'll sign you in and pick up where you left off.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-neo-canvas p-6 text-neo-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-black/40 via-transparent to-black/50"
      />
      <div className="w-full max-w-sm rounded-neo border-4 border-neo-frame bg-neo-card p-7 shadow-neo-lg">
        <Brand size="lg" tileFill="var(--field-a)" barFill="#ffffff" />
        <h1 className="font-display mt-5 text-2xl font-extrabold uppercase leading-[0.95] tracking-tight">
          {mode === "signin" ? "Welcome back" : "Get started"}
        </h1>
        <p className="font-text mt-1 mb-6 text-sm font-medium text-neo-ink/60">
          {mode === "signin" ? "Sign in to your dashboard." : "Create an account."}
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-text rounded-neo border-2 border-neo-frame bg-neo-canvas px-3 py-2 text-sm text-neo-ink outline-none transition-colors placeholder:text-neo-ink/40 focus:border-neo-main"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-text rounded-neo border-2 border-neo-frame bg-neo-canvas px-3 py-2 text-sm text-neo-ink outline-none transition-colors placeholder:text-neo-ink/40 focus:border-neo-main"
          />
          <button
            type="submit"
            disabled={busy}
            className="font-display rounded-neo border-2 border-neo-frame bg-neo-main px-3 py-2.5 text-sm font-extrabold uppercase tracking-tight text-neo-on-primary shadow-neo transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        {msg && <p className="font-text mt-3 text-sm text-neo-ink/80">{msg}</p>}
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="font-text mt-4 text-sm font-semibold text-field-b transition-colors hover:text-field-b/80"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
