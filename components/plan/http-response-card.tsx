"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

type HttpResponseCardProps = {
  request: string;
  status: { version: string; code: string; text: string };
  body: Record<string, string>;
  className?: string;
  animate?: boolean;
};

const COLORS = {
  surface: "#0a1628",
  border: "#16263d",
  request: "#c8ccd2",
  statusVersion: "#c8ccd2",
  statusCode: "#ff4d87",
  statusText: "#c8ccd2",
  punct: "#5b6e8a",
  key: "#88a4d0",
  value: "#e8eaed",
  cursor: "#ff4d87",
};

const PER_CHAR_MS = 18;
const PAUSE_AFTER_REQUEST_MS = 200;
const PAUSE_AFTER_STATUS_MS = 300;
const PAUSE_BETWEEN_BODY_LINES_MS = 150;

type Segment = { text: string; color: string; bold?: boolean };
type BodyLine = { segments: Segment[]; length: number };
type Computed = {
  statusSegments: Segment[];
  statusTotal: number;
  bodyLines: BodyLine[];
};

function buildSegments(
  status: { version: string; code: string; text: string },
  body: Record<string, string>,
): Computed {
  const entries = Object.entries(body);
  const longestKey = Math.max(0, ...entries.map(([k]) => k.length + 2));

  const statusSegments: Segment[] = [
    { text: status.version, color: COLORS.statusVersion },
    { text: "  ", color: COLORS.statusVersion },
    { text: status.code, color: COLORS.statusCode, bold: true },
    { text: "  ", color: COLORS.statusVersion },
    { text: status.text, color: COLORS.statusText },
  ];
  const statusTotal = statusSegments.reduce((a, s) => a + s.text.length, 0);

  const bodyLines: BodyLine[] = entries.map(([key, value], i) => {
    const keyToken = `"${key}"`;
    const padding = " ".repeat(longestKey - keyToken.length);
    const isLast = i === entries.length - 1;
    const segments: Segment[] = [
      { text: "  ", color: COLORS.punct },
      { text: keyToken, color: COLORS.key },
      { text: padding, color: COLORS.punct },
      { text: " : ", color: COLORS.punct },
      { text: `"${value}"`, color: COLORS.value },
    ];
    if (!isLast) segments.push({ text: ",", color: COLORS.punct });
    const length = segments.reduce((a, s) => a + s.text.length, 0);
    return { segments, length };
  });

  return { statusSegments, statusTotal, bodyLines };
}

function renderPartialSegments(segs: Segment[], charsToShow: number, keyPrefix: string) {
  const out: React.ReactNode[] = [];
  let consumed = 0;
  for (let i = 0; i < segs.length; i++) {
    if (consumed >= charsToShow) break;
    const seg = segs[i];
    if (!seg) break;
    const remaining = charsToShow - consumed;
    const visible = seg.text.slice(0, Math.min(seg.text.length, remaining));
    out.push(
      <span
        key={`${keyPrefix}-${i}`}
        style={{ color: seg.color, fontWeight: seg.bold ? 600 : undefined }}
      >
        {visible}
      </span>,
    );
    consumed += seg.text.length;
  }
  return out;
}

function FullStaticContent({ request, computed }: { request: string; computed: Computed }) {
  return (
    <>
      <span style={{ color: COLORS.request }}>{request}</span>
      {"\n\n"}
      {renderPartialSegments(computed.statusSegments, computed.statusTotal, "fs-status")}
      {"\n\n"}
      <span style={{ color: COLORS.punct }}>{"{"}</span>
      {"\n"}
      {computed.bodyLines.map((line, i) => (
        <span key={`fs-bl-${i}`}>
          {renderPartialSegments(line.segments, line.length, `fs-bl-${i}`)}
          {"\n"}
        </span>
      ))}
      <span style={{ color: COLORS.punct }}>{"}"}</span>
      {" "}
      <span style={{ color: COLORS.cursor }} aria-hidden>
        ▍
      </span>
    </>
  );
}

export function HttpResponseCard({
  request,
  status,
  body,
  className,
  animate = false,
}: HttpResponseCardProps) {
  const computed = buildSegments(status, body);

  // When animate=false, initialise state to "fully revealed" so the first paint
  // already shows everything (no flash before the effect runs).
  const [requestChars, setRequestChars] = useState(() => (animate ? 0 : request.length));
  const [statusChars, setStatusChars] = useState(() => (animate ? 0 : computed.statusTotal));
  const [completedLines, setCompletedLines] = useState(() =>
    animate ? 0 : computed.bodyLines.length,
  );
  const [currentLineChars, setCurrentLineChars] = useState(0);
  const [showOpenBrace, setShowOpenBrace] = useState(!animate);
  const [showCloseBrace, setShowCloseBrace] = useState(!animate);

  useEffect(() => {
    if (!animate) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setRequestChars(request.length);
      setStatusChars(computed.statusTotal);
      setCompletedLines(computed.bodyLines.length);
      setShowOpenBrace(true);
      setShowCloseBrace(true);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          if (!cancelled) resolve();
        }, ms);
        timers.push(t);
      });

    async function run() {
      // Phase 1: request line, char by char
      for (let i = 1; i <= request.length; i++) {
        if (cancelled) return;
        setRequestChars(i);
        await wait(PER_CHAR_MS);
      }
      if (cancelled) return;
      await wait(PAUSE_AFTER_REQUEST_MS);

      // Phase 2: status line, char by char (color picks up from segment metadata)
      for (let i = 1; i <= computed.statusTotal; i++) {
        if (cancelled) return;
        setStatusChars(i);
        await wait(PER_CHAR_MS);
      }
      if (cancelled) return;
      await wait(PAUSE_AFTER_STATUS_MS);

      // Phase 3: open brace, then each body line, with inter-line pauses
      if (cancelled) return;
      setShowOpenBrace(true);

      for (let lineIdx = 0; lineIdx < computed.bodyLines.length; lineIdx++) {
        const line = computed.bodyLines[lineIdx];
        if (!line) continue;
        for (let i = 1; i <= line.length; i++) {
          if (cancelled) return;
          setCurrentLineChars(i);
          await wait(PER_CHAR_MS);
        }
        if (cancelled) return;
        setCompletedLines(lineIdx + 1);
        setCurrentLineChars(0);
        if (lineIdx < computed.bodyLines.length - 1) {
          await wait(PAUSE_BETWEEN_BODY_LINES_MS);
        }
      }
      if (cancelled) return;

      setShowCloseBrace(true);
    }

    run();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // Deliberately empty: animation must run once per mount, even if props
    // change later (which they don't in our usage).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cursor = (
    <span className="animate-blink" style={{ color: COLORS.cursor }} aria-hidden>
      ▍
    </span>
  );

  const requestDone = requestChars >= request.length;
  const statusDone = statusChars >= computed.statusTotal;
  const inProgressLine =
    completedLines < computed.bodyLines.length ? computed.bodyLines[completedLines] : undefined;

  const visible = (
    <>
      <span style={{ color: COLORS.request }}>{request.slice(0, requestChars)}</span>

      {requestDone && (
        <>
          {"\n\n"}
          {renderPartialSegments(computed.statusSegments, statusChars, "status")}
        </>
      )}

      {statusDone && showOpenBrace && (
        <>
          {"\n\n"}
          <span style={{ color: COLORS.punct }}>{"{"}</span>
          {"\n"}
          {computed.bodyLines.slice(0, completedLines).map((line, i) => (
            <span key={`bl-${i}`}>
              {renderPartialSegments(line.segments, line.length, `bl-${i}`)}
              {"\n"}
            </span>
          ))}
          {inProgressLine && currentLineChars > 0 && (
            <span key={`blip-${completedLines}`}>
              {renderPartialSegments(
                inProgressLine.segments,
                currentLineChars,
                `blip-${completedLines}`,
              )}
            </span>
          )}
        </>
      )}

      {showCloseBrace && (
        <>
          <span style={{ color: COLORS.punct }}>{"}"}</span>
          {" "}
        </>
      )}

      {cursor}
    </>
  );

  // Shared pre-element classes — both the sizer and the visible overlay must
  // use the same typography/padding so dimensions match exactly.
  // whitespace-pre-wrap (rather than pre) lets long lines wrap on mobile when
  // the card's column is narrower than the longest JSON line. break-words is
  // a defensive backstop for unusually narrow viewports where even the URL
  // line wouldn't fit on its own. On desktop the content fits within
  // max-w-prose without wrapping, so the visual treatment is unchanged.
  const PRE_BASE =
    "font-mono text-[13px] leading-6 whitespace-pre-wrap break-words m-0 px-5 py-6 sm:px-6";

  return (
    <div
      // min-w-0 prevents the inner whitespace-pre block from inflating the
      // card past its parent's width on mobile (which would push horizontal
      // scroll up to the page level instead of staying inside the visible pre).
      className={clsx("rounded-xl border shadow-card overflow-hidden relative min-w-0", className)}
      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
    >
      {/* Sizer: invisible copy of the final content. Reserves the box's height
          and width so the typewriter animation never causes layout shift. */}
      <pre
        aria-hidden
        className={clsx(PRE_BASE, "invisible pointer-events-none")}
      >
        <FullStaticContent request={request} computed={computed} />
      </pre>
      {/* Visible overlay — contains either the static or progressively-typed content. */}
      <pre
        className={clsx(PRE_BASE, "absolute inset-0")}
        style={{ color: COLORS.value }}
      >
        {visible}
      </pre>
    </div>
  );
}
