import Link from "next/link";
import Brand from "@/components/Brand";
import { Button } from "@/components/ui/button";

// Shared chrome for the blog index and post pages: the same sticky top bar and
// footer used on the landing page, so blog pages feel native to the app.
export default function BlogShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col bg-neo-canvas text-neo-ink">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/20 px-6 py-4 text-white backdrop-blur-md sm:px-10 md:py-5">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Brand
            href="/"
            size="lg"
            className="text-white"
            tile
            tileFill="var(--field-a)"
            barFill="var(--neo-on-primary)"
          />
          <div className="flex items-center gap-3">
            <Button asChild variant="neutral" size="sm">
              <Link href="/blogs">Blog</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/demo">Live demo</Link>
            </Button>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-neo-line bg-neo-canvas px-6 py-8 text-neo-ink sm:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Brand
            href="/"
            size="sm"
            className="text-neo-ink"
            tile
            tileFill="var(--field-a)"
            barFill="var(--neo-on-primary)"
          />
          <span className="font-text text-xs font-medium text-neo-ink/50">
            © {2026} Munerate
          </span>
        </div>
      </footer>
    </main>
  );
}
