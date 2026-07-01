"use client";

import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function SignOut() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await getSupabaseClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
      className="font-text flex w-full items-center gap-2.5 rounded-neo px-2.5 py-2 text-sm font-semibold text-neo-ink transition-colors hover:bg-neo-card"
    >
      <svg className="h-4 w-4 text-field-b" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Sign out
    </button>
  );
}
