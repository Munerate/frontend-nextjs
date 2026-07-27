"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function SiteSwitcher({ sites }: { sites: { id: string, domain: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSiteId = pathname.match(/\/sites\/([^\/]+)/)?.[1];
  const activeSite = sites.find(s => s.id === currentSiteId);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-neo border-2 border-neo-frame bg-neo-canvas px-3 py-1.5 text-sm font-semibold text-neo-ink hover:bg-neo-card"
      >
        {activeSite ? (
          <>
            <img
              src={`https://favicon.im/${activeSite.domain}`}
              alt={`${activeSite.domain} favicon`}
              loading="lazy"
              className="h-4 w-4 shrink-0 rounded-sm"
            />
            {activeSite.domain}
          </>
        ) : (
          "All Sites"
        )}
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-neo border-2 border-neo-frame bg-neo-paper shadow-neo z-50">
          <div className="py-1">
            <Link
              href="/sites"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-neo-ink hover:bg-neo-card font-semibold"
            >
              All Sites
            </Link>
            {sites.map(s => (
              <Link
                key={s.id}
                href={`/sites/${s.id}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-neo-ink hover:bg-neo-card"
              >
                <img
                  src={`https://favicon.im/${s.domain}`}
                  alt={`${s.domain} favicon`}
                  loading="lazy"
                  className="h-4 w-4 shrink-0 rounded-sm"
                />
                <span className="truncate">{s.domain}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
