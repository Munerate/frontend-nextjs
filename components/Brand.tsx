import Link from "next/link";

const SIZES = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
} as const;

type BrandProps = {
  /** Wrap the brand in a link to this href. Omit to render a plain element. */
  href?: string;
  /** Text size of the wordmark. */
  size?: keyof typeof SIZES;
  className?: string;
};

export default function Brand({ href, size = "md", className }: BrandProps) {
  const content = (
    <>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
        M
      </span>
      <span className={`brand-gradient font-bold tracking-tight ${SIZES[size]}`}>
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
