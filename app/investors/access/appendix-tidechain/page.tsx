import { PageShell } from "@/components/plan/page-shell";
import { getSection } from "@/lib/plan-data/sections";

export default function AppendixTidechainPage() {
  const section = getSection("appendix-tidechain");
  if (!section) throw new Error("Missing appendix-tidechain section");

  return (
    <PageShell section={section}>
      <div className="prose-plan max-w-prose">
        <h2>A.1 Why use TideChain?</h2>
        <p>
          TideChain is well-suited for this because of how it&apos;s built. It can be customised
          with new features and it can be configured to let people record information at near-zero
          marginal cost.
        </p>
        <p>
          Other blockchains like Ethereum or Solana require you to pay a fee in cryptocurrency every
          time you record something. TideChain can be set up to skip these fees entirely, using rate
          limits (caps on how often any single account can post) to prevent spam instead.
        </p>

        <h2>A.2 The custom record-keeping module</h2>
        <p>We&apos;ll build a new module for TideChain to handle our recording needs. It has three main functions:</p>
        <ul>
          <li>
            <strong>Record an access.</strong> Saves a content fingerprint, where it came from, who
            accessed it, what they paid, what level of access, and the time — as a permanent
            searchable entry.
          </li>
          <li>
            <strong>Look up history.</strong> Lets people query the chain to retrieve all access
            records for a given piece of content or all access by a given user.
          </li>
          <li>
            <strong>Register a data source.</strong> Lets data providers register their identity on
            the chain.
          </li>
        </ul>

        <h2>A.3 Near-zero recording cost</h2>
        <p>
          Instead of charging cryptocurrency for each record, the chain limits how many records any
          one account can submit per time window. This means Munerate can record thousands of
          transactions a day at near-zero marginal cost, with no cryptocurrency balance required.
        </p>
        <blockquote>
          The people who run TideChain (called validators) are paid through a share of Munerate&apos;s
          revenue, which works because the system has high profit margins at scale.
        </blockquote>

        <h2>A.4 What is NOT on the blockchain</h2>
        <p>
          The actual data content never goes onto TideChain. Only fingerprints and metadata are
          recorded. The chain is a proof layer, not a storage layer. The full content stays in our
          regular database, served via our normal web service. This keeps the chain fast and avoids
          concerns about putting licensed content on a public ledger.
        </p>
      </div>
    </PageShell>
  );
}
