import { redirect } from "next/navigation";
import { addDomain, createSiteForCurrentUser } from "./actions";

export default async function NewSitePage({
  searchParams,
}: PageProps<"/sites/new">) {
  const { error, domain } = await searchParams;

  // Coming from the landing page (domain pre-filled and no prior error): create
  // the site immediately and drop the user straight onto its dashboard.
  if (typeof domain === "string" && domain && !error) {
    const result = await createSiteForCurrentUser(domain);
    if ("id" in result) {
      // The dashboard layout reads cookies (auth.getUser) so it's dynamic and
      // re-fetches the sidebar sites on this navigation — no revalidate needed.
      // (revalidatePath is illegal during render; calling it here crashed the page.)
      redirect(`/sites/${result.id}`);
    }
    redirect(`/sites/new?error=${encodeURIComponent(result.error)}`);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-text-h">Add a domain</h1>
      <p className="mt-1 mb-6 text-sm text-text">
        Enter the domain you want to monitor. We&apos;ll generate a verification token and your
        site tag.
      </p>
      <form action={addDomain} className="flex flex-col gap-3">
        <input
          name="domain"
          required
          defaultValue={typeof domain === "string" ? domain : undefined}
          placeholder="example.com"
          autoComplete="off"
          className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-h outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Add domain
        </button>
      </form>
      {error && (
        <p className="mt-3 text-sm text-red-500">
          {error === "invalid" ? "Please enter a valid domain." : String(error)}
        </p>
      )}
    </div>
  );
}
