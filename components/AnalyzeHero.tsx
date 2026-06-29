"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AnalyzeHero() {
  const router = useRouter();
  const [domain, setDomain] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    router.push(`/analyze${clean ? `?domain=${encodeURIComponent(clean)}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
      <Input
        type="text"
        inputMode="url"
        placeholder="yourdomain.com"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        className="flex-1"
        aria-label="Your domain"
      />
      <Button type="submit" variant="b" size="lg" className="whitespace-nowrap">
        Analyze →
      </Button>
    </form>
  );
}
