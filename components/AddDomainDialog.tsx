"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSiteForCurrentUser, sendInstallEmail } from "@/app/(dashboard)/sites/actions";

export default function AddDomainDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    
    try {
      const domain = String(formData.get("domain") ?? "");
      const result = await createSiteForCurrentUser(domain);
      
      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.created) {
        await sendInstallEmail(result.id);
      }
      
      setIsOpen(false);
      router.refresh();
      router.push(`/sites/${result.id}`);
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="font-display flex items-center gap-2 rounded-neo border-2 border-neo-frame bg-neo-main px-3 py-1.5 text-sm font-extrabold uppercase tracking-tight text-neo-on-primary shadow-neo transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" />
        Add Site
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-neo border-4 border-neo-frame bg-neo-card p-7 shadow-neo-lg">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-neo-ink/60 hover:text-neo-ink transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h1 className="font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-tight text-neo-ink">
              Add a domain
            </h1>
            <p className="font-text mt-1 mb-6 text-sm font-medium text-neo-ink/60">
              Enter the domain you want to monitor. We&apos;ll generate a verification token and your
              site tag.
            </p>
            <form action={handleSubmit} className="flex flex-col gap-3">
              <input
                name="domain"
                required
                placeholder="example.com"
                autoComplete="off"
                className="font-text rounded-neo border-2 border-neo-frame bg-neo-canvas px-3 py-2 text-sm text-neo-ink outline-none transition-colors placeholder:text-neo-ink/40 focus:border-neo-main"
              />
              <button
                type="submit"
                disabled={loading}
                className="font-display self-start rounded-neo border-2 border-neo-frame bg-neo-main px-4 py-2.5 text-sm font-extrabold uppercase tracking-tight text-neo-on-primary shadow-neo transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              >
                {loading ? "Adding..." : "Add domain"}
              </button>
            </form>
            {error && (
              <p className="font-text mt-3 text-sm text-field-b">
                {error === "invalid" ? "Please enter a valid domain." : String(error)}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
