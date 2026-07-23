import { redirect } from "next/navigation";
import { getCurrentEmail } from "@/lib/auth/session";
import { GateConsole } from "@/components/gate/gate-console";
import Brand from "@/components/Brand";

export const dynamic = "force-dynamic";

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const email = await getCurrentEmail();
  if (email) {
    const dest =
      from && from.startsWith("/investors/access") ? from : "/investors/access";
    redirect(dest);
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-black">
      {/* Background painting — object-cover crops to any viewport; the gradient
          shade darkens it so the gate form stays legible (matches the landing/
          estimate background treatment). */}
      <img
        src="/prainter.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/65 to-black/85"
      />
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <Brand
            href="/"
            size="md"
            className="text-white"
            tile
            tileFill="var(--field-a)"
            barFill="var(--neo-on-primary)"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">Principal</span>
        </header>

        <section className="my-auto flex flex-col gap-8 py-16">
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-display-md text-ink-50 text-balance">
              Access requires verification.
            </h1>
            <p className="text-ink-200 text-balance leading-relaxed">
              Munerate is in private review. Enter your principal email and we&apos;ll send a one-time code.
            </p>
          </div>

          <GateConsole from={from} />
        </section>

        <footer className="flex items-center justify-between text-[11px] font-mono text-ink-300">
          <span>munerate.com</span>
          <span>x402 / email-otp</span>
        </footer>
      </div>
    </main>
  );
}
