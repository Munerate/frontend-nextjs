"use client";

import { useState } from "react";
import Link from "next/link";
import AuthDialog from "./AuthDialog";
import { User } from "@supabase/supabase-js";

export default function HeaderAuth({ user }: { user: User | null }) {
  const [isOpen, setIsOpen] = useState(false);

  if (user) {
    return (
      <Link
        href="/sites"
        className="rounded-md bg-neo-main px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-neo-main px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80"
      >
        Sign in
      </button>
      <AuthDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
