"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";

// Re-fetches the server component (latest events) without a full navigation.
export default function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() => start(() => router.refresh())}
      disabled={pending}
      title="Fetch latest data"
      className="font-text flex items-center gap-1.5 rounded-neo border-2 border-neo-frame px-3 py-1.5 text-sm font-semibold text-neo-ink transition-colors hover:bg-neo-card disabled:opacity-60"
    >
      {pending ? (
        <BrandMark size={16} animated tile={false} title="Refreshing" />
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      )}
      {pending ? "Refreshing…" : "Refresh"}
    </button>
  );
}
