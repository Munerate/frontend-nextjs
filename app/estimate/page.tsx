import Link from "next/link";
import Brand from "@/components/Brand";
import EstimateDashboard from "@/components/EstimateDashboard";

export default async function EstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  const clean =
    typeof url === "string"
      ? url.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
      : "";

  return (
    <main className="flex flex-1 flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Brand href="/" />
        <Link href="/" className="text-sm font-medium text-accent">
          Back home
        </Link>
      </header>

      {clean ? (
        <EstimateDashboard url={clean} />
      ) : (
        <section className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            No URL provided
          </h1>
          <p className="mt-4 text-white/70">
            Please enter a domain on the home page to see the estimate.
          </p>
        </section>
      )}
    </main>
  );
}
