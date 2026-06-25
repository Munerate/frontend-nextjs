import Link from "next/link";
import BrandMark from "@/components/BrandMark";

const SIZES = {
  sm: { text: "text-lg", mark: 22 },
  md: { text: "text-xl", mark: 28 },
  lg: { text: "text-2xl", mark: 32 },
  xl: { text: "text-3xl sm:text-4xl", mark: 40 },
} as const;

type BrandProps = {
  /** Wrap the brand in a link to this href. Omit to render a plain element. */
  href?: string;
  /** Text size of the wordmark. */
  size?: keyof typeof SIZES;
  className?: string;
  /** Render the rounded "app icon" tile behind the mark (default true). */
  tile?: boolean;
  /** Tile + bar fills, forwarded to BrandMark (the landing logo uses a pink tile
   *  with blue bars). */
  tileFill?: string;
  barFill?: string;
};

// Wordmark inherits `currentColor` so it reads correctly on any colour-field
// band (set the text colour on the parent). The mark carries the brand.
export default function Brand({
  href,
  size = "md",
  className,
  tile = true,
  tileFill,
  barFill,
}: BrandProps) {
  const content = (
    <>
      <BrandMark size={SIZES[size].mark} tile={tile} tileFill={tileFill} barFill={barFill} />
      <span className={`font-brand font-bold tracking-tight ${SIZES[size].text}`}>
        Munerate
      </span>
    </>
  );

  const base = `inline-flex items-center gap-2 ${className ?? ""}`;

  if (href) {
    return (
      <Link href={href} className={base}>
        {content}
      </Link>
    );
  }

  return <span className={base}>{content}</span>;
}
