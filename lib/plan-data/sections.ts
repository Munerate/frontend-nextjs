export type Section = {
  /** Distinguishes numbered chapters from appendices and references for nav + page-shell rendering. */
  kind: "section" | "appendix" | "reference";
  /** Display label — "01"–"09" for sections, "A"/"B" for appendices, empty for references. */
  label: string;
  slug: string;
  href: string;
  title: string;
  shortTitle: string;
  lede: string;
};

export const SECTIONS: readonly Section[] = [
  {
    kind: "section",
    label: "01",
    slug: "",
    href: "/investors/access",
    title: "Executive Summary",
    shortTitle: "Executive Summary",
    lede: "Content is priced for online humans. AI assistants are a different kind of customer.",
  },
  {
    kind: "section",
    label: "02",
    slug: "problem",
    href: "/investors/access/problem",
    title: "The Problem",
    shortTitle: "Problem",
    lede: "Content access is for humans, software can't pay... & there is no record of what was used.",
  },
  {
    kind: "section",
    label: "03",
    slug: "solution",
    href: "/investors/access/solution",
    title: "The Solution: Munerate",
    shortTitle: "Solution",
    lede: "Doorway for AI assistants, payment in stablecoin, and record of every access.",
  },
  {
    kind: "section",
    label: "04",
    slug: "product",
    href: "/investors/access/product",
    title: "The Product",
    shortTitle: "Product",
    lede: "Paywall for AI assistants — endpoint for agents, self-serve for content providers.",
  },
  {
    kind: "section",
    label: "05",
    slug: "business-model",
    href: "/investors/access/business-model",
    title: "Business Model and Financial Projections",
    shortTitle: "Business Model",
    lede: "Payment-rail economics on the traffic that was previously extracted for free.",
  },
  {
    kind: "section",
    label: "06",
    slug: "team",
    href: "/investors/access/team",
    title: "Team and Resources",
    shortTitle: "Team",
    lede: "Three core functions, one killer team. AI tooling is real leverage now.",
  },
  {
    kind: "section",
    label: "07",
    slug: "gtm",
    href: "/investors/access/gtm",
    title: "Go-to-Market Strategy",
    shortTitle: "Go-to-Market",
    lede: "Three integration modes running in parallel. Distribution, not sales.",
  },
  {
    kind: "section",
    label: "08",
    slug: "competition",
    href: "/investors/access/competition",
    title: "Competitive Landscape",
    shortTitle: "Competition",
    lede: "A category that barely existed a year ago is now crowded and consolidating fast.",
  },
  {
    kind: "section",
    label: "09",
    slug: "risks",
    href: "/investors/access/risks",
    title: "Risks and Mitigations",
    shortTitle: "Risks",
    lede: "What could go wrong, and what we have in place to absorb it.",
  },
  {
    kind: "appendix",
    label: "A",
    slug: "appendix-tidechain",
    href: "/investors/access/appendix-tidechain",
    title: "The TideChain Layer",
    shortTitle: "TideChain",
    lede: "What TideChain is, why it exists, and what stays off it.",
  },
  {
    kind: "appendix",
    label: "B",
    slug: "appendix-technical-build",
    href: "/investors/access/appendix-technical-build",
    title: "What we're building it with",
    shortTitle: "Technical build",
    lede: "The stack, the surfaces, and the operational primitives that ship in v1.",
  },
  {
    kind: "reference",
    label: "",
    slug: "citations",
    href: "/investors/access/citations",
    title: "Sources",
    shortTitle: "Citations",
    lede: "Every externally-verifiable claim in this plan, with source and accessed date.",
  },
] as const;

/** Number of numbered chapters (excludes appendices). Used in the page-shell "of NN" indicator. */
export const SECTION_COUNT = SECTIONS.filter((s) => s.kind === "section").length;

export function getSection(slug: string): Section | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

export function getAdjacent(slug: string): { prev: Section | null; next: Section | null } {
  const i = SECTIONS.findIndex((s) => s.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? (SECTIONS[i - 1] ?? null) : null,
    next: i < SECTIONS.length - 1 ? (SECTIONS[i + 1] ?? null) : null,
  };
}
