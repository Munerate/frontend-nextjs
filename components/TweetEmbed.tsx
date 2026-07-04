"use client";

import { useEffect, useRef } from "react";

// Renders an embedded tweet. We ship the tweet's text as a native <blockquote>
// so it's readable (and crawlable) even before Twitter's widget script loads,
// then let widgets.js upgrade it into the interactive card on the client.
declare global {
  interface Window {
    twttr?: { widgets?: { load?: (el?: HTMLElement) => void } };
  }
}

const WIDGETS_SRC = "https://platform.twitter.com/widgets.js";

export default function TweetEmbed({
  url,
  text,
  author,
}: {
  url: string;
  text: string;
  author: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function render() {
      window.twttr?.widgets?.load?.(ref.current ?? undefined);
    }
    if (window.twttr?.widgets) {
      render();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${WIDGETS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", render);
      return () => existing.removeEventListener("load", render);
    }
    const script = document.createElement("script");
    script.src = WIDGETS_SRC;
    script.async = true;
    script.addEventListener("load", render);
    document.body.appendChild(script);
  }, []);

  return (
    <div ref={ref}>
      <blockquote className="twitter-tweet" data-conversation="none">
        <p className="whitespace-pre-line font-text leading-7 text-neo-ink/90">
          {text}
        </p>
        <footer className="mt-3 font-text text-sm text-neo-ink/60">
          — {author}{" "}
          <a href={url} className="underline">
            view on X
          </a>
        </footer>
      </blockquote>
    </div>
  );
}
