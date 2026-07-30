"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthDialog from "@/components/AuthDialog";
import { createSiteForCurrentUser, sendInstallEmail } from "@/app/(dashboard)/sites/actions";

export default function LandingForm({ user }: { user: any }) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!domain) return;
    
    if (!user) {
      // Unauthenticated users will need to sign in first. 
      // After signing in, they will land on /sites. 
      // We could ideally pass the domain along in a cookie or URL state, but 
      // for simplicity in this V1, let's just open AuthDialog.
      setIsAuthOpen(true);
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await createSiteForCurrentUser(domain);
      if ("error" in result) {
        alert(result.error);
        setLoading(false);
        return;
      }

      if (result.created) {
        await sendInstallEmail(result.id);
      }
      
      router.push(`/sites/${result.id}?tab=installation`);
    } catch {
      alert("An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-neo-ink sm:text-5xl lg:text-6xl">
        Check bots activity on your website
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        See exactly which AI agents are scanning and scraping your content in real-time.
      </p>
      
      <form onSubmit={handleSubmit} className="mt-10 flex w-full flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Enter your domain (e.g. example.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          required
          className="flex-1 rounded-md border border-gray-300 px-5 py-4 text-lg text-neo-ink outline-none transition-colors placeholder:text-gray-400 focus:border-neo-main focus:ring-2 focus:ring-neo-main"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-neo-main px-8 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-black/80 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Get Started"}
        </button>
      </form>
      
      <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
