"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Brand from "@/components/Brand";
import { MobileNavDrawer } from "./mobile-nav-drawer";

export function TopBar({ email }: { email: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/investors/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
    // Return focus to the hamburger so keyboard users land somewhere sensible.
    hamburgerRef.current?.focus();
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b hairline bg-ink-900/85 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger — visible only below the lg breakpoint, where the
              inline aside in app/investors/access/layout.tsx is hidden. */}
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="-ml-1 rounded-md p-2 text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-50 lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path
                d="M3 5h12M3 9h12M3 13h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <Brand
            href="/investors/access"
            size="sm"
            className="text-ink-50"
            tile
            tileFill="var(--field-a)"
            barFill="var(--neo-on-primary)"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-[11px] text-ink-300 sm:inline">{email}</span>
          <button onClick={logout} disabled={pending} className="btn-ghost text-xs">
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>
      <MobileNavDrawer isOpen={drawerOpen} onClose={closeDrawer} email={email} />
    </>
  );
}
