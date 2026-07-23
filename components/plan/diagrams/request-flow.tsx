"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScrollableFigure } from "../scrollable-figure";

type Phase =
  | "idle"
  | "enter"
  | "l1"
  | "arrow1"
  | "l2"
  | "arrow2"
  | "l3"
  | "final"
  | "done";

const TIMINGS: Record<Exclude<Phase, "idle" | "done">, number> = {
  enter: 200,
  l1: 1000,
  arrow1: 300,
  l2: 1000,
  arrow2: 300,
  l3: 1000,
  final: 700,
};

const LAYERS = [
  {
    label: "Layer 1",
    title: "The doorway for AI assistants",
    body:
      "The doorway responds: that costs X — send it to this address. The assistant pays, the doorway hands over the data, the transaction is logged.",
    caption: "Doorway returns 402 — payment required",
  },
  {
    label: "Layer 2",
    title: "Handling the payment",
    body:
      "Settles in stablecoin pegged to the US dollar, across multiple networks. Pricing fixed (50¢ per report) or flexible (up to 50¢ depending on length).",
    caption: "Settled on Solana in 400ms",
  },
  {
    label: "Layer 3",
    title: "The permanent record",
    body:
      "Every transaction recorded on TideChain — a verifiable receipt of what was sold, when, and to whom. Recording has near-zero marginal cost.",
    caption: "Anchored to TideChain — gasless, immutable",
  },
] as const;

const FINAL_CAPTION =
  "Total time: 600ms · Total cost: $0.005 · Audit trail: permanent";

const PACKET_LABEL: Record<Phase, string> = {
  idle: "GET seat61/eurostar",
  enter: "GET seat61/eurostar",
  l1: "GET seat61/eurostar",
  arrow1: "$0.005 USDC payment",
  l2: "$0.005 USDC payment",
  arrow2: "Receipt hash: 0x7a3f…",
  l3: "Receipt hash: 0x7a3f…",
  final: "Receipt hash: 0x7a3f…",
  done: "Receipt hash: 0x7a3f…",
};

const LIVE_TEXT: Record<Phase, string> = {
  idle: "",
  enter: "Request packet ready",
  l1: "Doorway returns 402 — payment required",
  arrow1: "Forwarding payment to settlement layer",
  l2: "Settled on Solana in 400ms",
  arrow2: "Anchoring receipt to TideChain",
  l3: "Anchored to TideChain — gasless, immutable",
  final: "Total time: 600 milliseconds, total cost: 5 thousandths of a dollar, audit trail: permanent",
  done: "Total time: 600 milliseconds, total cost: 5 thousandths of a dollar, audit trail: permanent",
};

const RUNNING_PHASES: Phase[] = ["enter", "l1", "arrow1", "l2", "arrow2", "l3", "final"];
const LAYER_LIT: Record<Phase, [boolean, boolean, boolean]> = {
  idle:   [false, false, false],
  enter:  [false, false, false],
  l1:     [true,  false, false],
  arrow1: [true,  false, false],
  l2:     [true,  true,  false],
  arrow2: [true,  true,  false],
  l3:     [true,  true,  true ],
  final:  [true,  true,  true ],
  done:   [true,  true,  true ],
};

function activeLayerIndex(phase: Phase): 0 | 1 | 2 {
  if (phase === "enter" || phase === "l1") return 0;
  if (phase === "arrow1" || phase === "l2") return 1;
  return 2; // arrow2 / l3 / final / done — and idle (irrelevant, packet hidden)
}

type RunCtx = { cancelled: boolean; timers: ReturnType<typeof setTimeout>[] };

export function RequestFlow() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [packetTop, setPacketTop] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);
  const layerRefs = [layer1Ref, layer2Ref, layer3Ref] as const;

  const runRef = useRef<RunCtx | null>(null);
  const hasAutoStarted = useRef(false);

  // Detect prefers-reduced-motion + desktop breakpoint, with live updates.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionMq.matches);
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionMq.addEventListener("change", motionHandler);

    const desktopMq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(desktopMq.matches);
    const desktopHandler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    desktopMq.addEventListener("change", desktopHandler);

    return () => {
      motionMq.removeEventListener("change", motionHandler);
      desktopMq.removeEventListener("change", desktopHandler);
    };
  }, []);

  // If reduced motion is set, jump straight to the lit end-state.
  useEffect(() => {
    if (reducedMotion) setPhase("done");
  }, [reducedMotion]);

  // Position the packet whenever phase or viewport changes. useLayoutEffect
  // so the layer refs are populated (offsetTop reads only work after layout).
  useLayoutEffect(() => {
    if (phase === "idle") {
      const l1 = layer1Ref.current;
      if (l1) setPacketTop(l1.offsetTop - 22);
      return;
    }

    const idx = activeLayerIndex(phase);
    const ref = layerRefs[idx]?.current;
    if (!ref) return;

    if (phase === "enter") {
      // Sit ~22px above the L1 top edge — gives us a small downward slide on
      // the enter → l1 transition.
      setPacketTop(ref.offsetTop - 22);
      return;
    }

    if (isDesktop) {
      // Desktop: vertically centred against the active layer (right-side badge).
      setPacketTop(ref.offsetTop + ref.offsetHeight / 2);
    } else {
      // Mobile: hovering above the active layer's top edge.
      setPacketTop(ref.offsetTop);
    }
  }, [phase, isDesktop]);

  // Auto-start once on first scroll into view.
  useEffect(() => {
    if (reducedMotion) return;
    if (hasAutoStarted.current) return;
    if (!containerRef.current) return;

    const target = containerRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !hasAutoStarted.current) {
          hasAutoStarted.current = true;
          obs.disconnect();
          start();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(target);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Esc skips to the final state while running.
  useEffect(() => {
    if (!RUNNING_PHASES.includes(phase)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancel();
        setPhase("done");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Tear down any in-flight timers if the component unmounts mid-animation.
  useEffect(() => () => cancel(), []);

  function cancel() {
    if (runRef.current) {
      runRef.current.cancelled = true;
      runRef.current.timers.forEach((t) => clearTimeout(t));
      runRef.current = null;
    }
  }

  function start() {
    cancel();
    const ctx: RunCtx = { cancelled: false, timers: [] };
    runRef.current = ctx;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          if (!ctx.cancelled) resolve();
        }, ms);
        ctx.timers.push(t);
      });

    (async () => {
      setPhase("enter");
      await wait(TIMINGS.enter);
      if (ctx.cancelled) return;

      setPhase("l1");
      await wait(TIMINGS.l1);
      if (ctx.cancelled) return;

      setPhase("arrow1");
      await wait(TIMINGS.arrow1);
      if (ctx.cancelled) return;

      setPhase("l2");
      await wait(TIMINGS.l2);
      if (ctx.cancelled) return;

      setPhase("arrow2");
      await wait(TIMINGS.arrow2);
      if (ctx.cancelled) return;

      setPhase("l3");
      await wait(TIMINGS.l3);
      if (ctx.cancelled) return;

      setPhase("final");
      await wait(TIMINGS.final);
      if (ctx.cancelled) return;

      setPhase("done");
    })();
  }

  const isRunning = RUNNING_PHASES.includes(phase);
  const showPacket = phase !== "idle";
  const packetVisible = phase !== "idle" && phase !== "done";
  const showFinalCaption = phase === "final" || phase === "done";
  const arrow1Drawn = ["arrow1", "l2", "arrow2", "l3", "final", "done"].includes(phase);
  const arrow2Drawn = ["arrow2", "l3", "final", "done"].includes(phase);
  const lit = LAYER_LIT[phase];

  const buttonLabel =
    phase === "idle"
      ? "▶ Watch a request"
      : isRunning
        ? "↻ Running…"
        : "↻ Replay";

  return (
    <ScrollableFigure>
      <div className="flex flex-col">
      {/* Button — hidden when reduced motion is set */}
      {!reducedMotion && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (!isRunning) start();
            }}
            disabled={isRunning}
            aria-label="Watch the request flow"
            className="inline-flex items-center gap-2 rounded-md border border-tide-400/40 bg-tide-300/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-tide-200 transition-colors hover:border-tide-300 hover:bg-tide-300/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonLabel}
          </button>
        </div>
      )}

      {/* Polite live region — announces caption transitions to screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {LIVE_TEXT[phase]}
      </div>

      {/* Layer column with absolutely-positioned packet overlay */}
      <div ref={containerRef} className="relative">
        {/* Packet indicator */}
        {showPacket && (
          <div
            aria-hidden
            className={[
              "pointer-events-none absolute z-10",
              // Mobile: centred above the active layer.
              "left-1/2 -translate-x-1/2 -translate-y-[calc(100%+8px)]",
              // Desktop: right-aligned, vertically centred on the active layer.
              "sm:left-auto sm:right-3 sm:translate-x-0 sm:-translate-y-1/2",
              "transition-[top,opacity] duration-300 ease-in-out",
              packetVisible ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{ top: `${packetTop}px` }}
          >
            <div className="rounded-full border border-tide-400/70 bg-ink-950/95 px-3 py-1.5 font-mono text-[11px] text-tide-200 shadow-card whitespace-nowrap backdrop-blur-sm">
              {PACKET_LABEL[phase]}
            </div>
          </div>
        )}

        <LayerCard ref={layer1Ref} index={0} lit={lit[0]} />
        <ArrowConnector drawn={arrow1Drawn} />
        <LayerCard ref={layer2Ref} index={1} lit={lit[1]} />
        <ArrowConnector drawn={arrow2Drawn} />
        <LayerCard ref={layer3Ref} index={2} lit={lit[2]} />
      </div>

      {/* Reserved-height final caption row */}
      <div
        className={[
          "mt-6 min-h-5 text-center font-mono text-[11px] text-ink-300",
          "transition-opacity duration-500 ease-in-out",
          showFinalCaption ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {FINAL_CAPTION}
      </div>
      </div>
    </ScrollableFigure>
  );
}

type LayerCardProps = { index: 0 | 1 | 2; lit: boolean };

const LayerCard = forwardRef<HTMLDivElement, LayerCardProps>(function LayerCard(
  { index, lit },
  ref,
) {
  const layer = LAYERS[index];
  return (
    <div
      ref={ref}
      className={[
        "rounded-lg border p-5 transition-[border-color,background-color,opacity] duration-300 ease-in-out",
        lit
          ? "border-tide-400/60 bg-tide-300/[0.04] opacity-100"
          : "border-ink-600 bg-ink-900/60 opacity-70",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <div
          className={[
            "font-mono text-[10px] uppercase tracking-[0.22em] transition-colors duration-300",
            lit ? "text-tide-300" : "text-ink-300",
          ].join(" ")}
        >
          {layer.label}
        </div>
        <h3 className="text-base font-medium text-ink-50">{layer.title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-200">{layer.body}</p>
      {/* Caption row — min-height reserved so it doesn't push layout when fading in. */}
      <div
        className={[
          "mt-3 min-h-5 font-mono text-[11px] text-tide-200",
          "transition-opacity duration-300 ease-in-out",
          lit ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {layer.caption}
      </div>
    </div>
  );
});

function ArrowConnector({ drawn }: { drawn: boolean }) {
  return (
    <div
      className="relative mx-auto my-2 h-10 w-px overflow-hidden"
      aria-hidden
    >
      {/* Base muted dashes — always visible */}
      <div className="absolute inset-0 border-l border-dashed border-ink-500" />
      {/* Teal overlay — grows from 0 to full height as the arrow "draws" */}
      <div
        className="absolute left-0 right-0 top-0 border-l border-dashed border-tide-300 transition-[height] duration-300 ease-in-out"
        style={{ height: drawn ? "100%" : "0%" }}
      />
    </div>
  );
}
