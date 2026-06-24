// The Munerate logo: three rounded bars of increasing height (a bar chart).
// Built as inline SVG so it (a) inverts with the theme — the tile uses the
// accent field colour with white bars — and (b) doubles as a loading indicator: with
// `animated`, the bars rise and fall like an equaliser via staggered CSS
// keyframes (see `bar-bounce` in globals.css). No hooks → usable from server
// and client components alike.

type BrandMarkProps = {
  /** Pixel size of the square mark. */
  size?: number;
  /** Animate the bars as an equaliser loader. */
  animated?: boolean;
  /** Render the rounded background tile (the "app icon" look). */
  tile?: boolean;
  /** Accessible label; when set the SVG is exposed as an image to AT. */
  title?: string;
  className?: string;
};

// Bottom-aligned bars (baseline y≈19 in a 24×24 box), increasing in height.
const BARS = [
  { x: 5, y: 13, h: 6 },
  { x: 10.3, y: 9, h: 10 },
  { x: 15.6, y: 5, h: 14 },
];

export default function BrandMark({
  size = 28,
  animated = false,
  tile = true,
  title,
  className,
}: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      {title ? <title>{title}</title> : null}
      {tile ? (
        <rect x="0" y="0" width="24" height="24" rx="6" fill="var(--field-b)" />
      ) : null}
      {BARS.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width="3.4"
          height={b.h}
          rx="1.7"
          fill={tile ? "#fff" : "currentColor"}
          stroke="#000"
          strokeWidth="1.2"
          paintOrder="stroke"
          data-brandmark-bar=""
          style={{
            transformBox: "fill-box",
            transformOrigin: "bottom",
            animation: animated
              ? `bar-bounce 0.9s ${i * 0.15}s ease-in-out infinite`
              : undefined,
          }}
        />
      ))}
    </svg>
  );
}
