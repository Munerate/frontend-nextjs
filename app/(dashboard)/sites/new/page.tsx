import { redirect } from "next/navigation";
import { addDomain, createSiteForCurrentUser, sendInstallEmail } from "./actions";

export default async function NewSitePage({
  searchParams,
}: PageProps<"/sites/new">) {
  const { error, domain } = await searchParams;

  // Coming from the landing page (domain pre-filled and no prior error): create
  // the site immediately and drop the user straight onto its dashboard.
  if (typeof domain === "string" && domain && !error) {
    const result = await createSiteForCurrentUser(domain);
    if ("id" in result) {
      // First time claiming this domain → email the install instructions.
      if (result.created) {
        await sendInstallEmail(result.id);
      }
      // The dashboard layout reads cookies (auth.getUser) so it's dynamic and
      // re-fetches the sidebar sites on this navigation — no revalidate needed.
      // (revalidatePath is illegal during render; calling it here crashed the page.)
      redirect(`/sites/${result.id}`);
    }
    redirect(`/sites/new?error=${encodeURIComponent(result.error)}`);
  }

  return (
    <div className="max-w-md rounded-neo border-4 border-neo-frame bg-neo-card p-7 shadow-neo-lg">
      <h1 className="font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-tight text-neo-ink">
        Add a domain
      </h1>
      <p className="font-text mt-1 mb-6 text-sm font-medium text-neo-ink/60">
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
          className="font-text rounded-neo border-2 border-neo-frame bg-neo-canvas px-3 py-2 text-sm text-neo-ink outline-none transition-colors placeholder:text-neo-ink/40 focus:border-neo-main"
        />
        <button
          type="submit"
          className="font-display self-start rounded-neo border-2 border-neo-frame bg-neo-main px-4 py-2.5 text-sm font-extrabold uppercase tracking-tight text-neo-on-primary shadow-neo transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          Add domain
        </button>
      </form>
      {error && (
        <p className="font-text mt-3 text-sm text-field-b">
          {error === "invalid" ? "Please enter a valid domain." : String(error)}
        </p>
      )}
    </div>
  );
}
