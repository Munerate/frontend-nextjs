"use client";

// An in-place editable number for the "Monthly visits" stat. It's a hidden
// easter egg: the number looks identical to the static stat until clicked, then
// it becomes a digits-only inline field. Committing calls onCommit with the new
// value; the parent recomputes the whole pipeline. Not the bordered Input
// primitive — this must look like editing the figure in place, not a form field.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/format";

const MAX_VISITS = 100_000_000_000;

export default function EditableVisits({
  value,
  onCommit,
  className,
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function begin() {
    setDraft(String(Math.round(value)));
    setEditing(true);
  }

  function commit() {
    const n = parseInt(draft, 10);
    if (!Number.isNaN(n) && n > 0) onCommit(Math.min(n, MAX_VISITS));
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        aria-label="Monthly visits"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") setEditing(false);
        }}
        className={cn(
          className,
          "w-full border-0 border-b-2 border-white/40 bg-transparent p-0 outline-none",
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={begin}
      aria-label={`Monthly visits: ${fmtInt(value)}. Click to edit.`}
      className={cn(className, "w-full cursor-text text-left")}
    >
      {fmtInt(value)}
    </button>
  );
}
