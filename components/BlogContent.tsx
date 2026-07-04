import type { Block } from "@/lib/blog";
import TweetEmbed from "@/components/TweetEmbed";

// Renders a post's typed blocks with the neobrutalist type scale. Kept as a
// plain server component — no client JS needed for static article content.
export default function BlogContent({ blocks }: { blocks: Block[] }) {
  return (
    <div className="font-text flex flex-col gap-6 text-neo-ink/90">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="font-display mt-6 text-2xl font-bold text-neo-ink sm:text-3xl"
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="font-display mt-2 text-xl font-bold text-neo-ink"
              >
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="text-base leading-7 sm:text-lg sm:leading-8">
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="flex flex-col gap-2 pl-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3 leading-7">
                    <span className="mt-[10px] h-2 w-2 shrink-0 bg-field-b" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-neo border-2 border-neo-frame bg-neo-card p-4 font-mono text-sm text-neo-ink shadow-neo-sm"
              >
                <code>{block.text}</code>
              </pre>
            );
          case "tweet":
            return (
              <TweetEmbed
                key={i}
                url={block.url}
                text={block.text}
                author={block.author}
              />
            );
          case "faq":
            return (
              <div key={i} className="flex flex-col gap-5">
                {block.items.map((item, j) => (
                  <div key={j}>
                    <h3 className="font-display text-lg font-bold text-neo-ink">
                      {item.q}
                    </h3>
                    <p className="mt-1 leading-7">{item.a}</p>
                  </div>
                ))}
              </div>
            );
        }
      })}
    </div>
  );
}
