"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingHero() {
  const router = useRouter();
  const [domain, setDomain] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    router.push(`/scan${clean ? `?domain=${encodeURIComponent(clean)}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="text"
        inputMode="url"
        placeholder="yourdomain.com"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        className="flex-1 rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text-h outline-none focus:border-accent"
      />
      <button
        type="submit"
        className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white whitespace-nowrap"
      >
        Scan
      </button>
    </form>
  );
}
