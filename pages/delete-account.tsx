import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import { V2Layout } from "../components/v2";

type PublicNextPage = NextPage & {
  publicPage?: boolean;
};

const deletedItems = [
  "JAOTHUI account sign-in identity associations, including optional LINE or Sign in with Apple associations.",
  "Optional Bitkub NEXT wallet associations connected to the JAOTHUI account.",
  "Account email address, display name, and avatar URL held by the JAOTHUI account service.",
];

const retainedAuditItems = [
  "Non-personal Account ID and role, retained only as an audit anchor and authorization-history context.",
  "Account deletion status and deletion timestamp.",
  "Deletion policy version applied to the request.",
];

const DeleteAccountPage: PublicNextPage = () => {
  return (
    <>
      <Head>
        <title>Delete Account | JAOTHUI Mobile</title>
        <meta
          name="description"
          content="Start an account and data deletion request for JAOTHUI Mobile through JAOTHUI support."
        />
      </Head>

      <V2Layout hideNav className="max-w-4xl">
        <section className="flex w-full flex-col gap-8 px-5 py-10 mobileM:px-6 tabletS:px-10 tabletS:py-14">
          <header className="rounded-[28px] border border-border-soft bg-surface px-5 py-8 shadow-gold tabletS:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">
              JAOTHUI Mobile
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight tabletS:text-5xl">
              Delete your account
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              This public page lets JAOTHUI Mobile users start an account and data
              deletion request without reinstalling the app. JAOTHUI Mobile is
              provided by RFC CHAMPIONSHIP COMPANY LIMITED.
            </p>
          </header>

          <section className="rounded-[24px] border border-border-soft bg-surface p-5 tabletS:p-7">
            <h2 className="text-2xl font-semibold text-accent">Start a request</h2>
            <p className="mt-3 leading-7 text-muted">
              Email JAOTHUI support to request deletion. Before an account is
              deleted, support will verify that the requester controls the account.
              Do not send account IDs, login credentials, passwords, wallet
              addresses, private keys, recovery phrases, or one-time passwords.
            </p>
            <a
              href="mailto:nonthasak.l@gmail.com?subject=JAOTHUI%20Mobile%20account%20deletion%20request"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-card border border-accent bg-accent px-5 py-3 text-center font-semibold text-background transition-colors hover:bg-accent-hover"
            >
              Email support to start deletion
            </a>
          </section>

          <section className="grid gap-4 tabletS:grid-cols-2">
            <article className="rounded-[22px] border border-border-soft bg-surface p-5">
              <h2 className="text-2xl font-semibold text-accent">What is deleted</h2>
              <ul className="mt-4 space-y-3">
                {deletedItems.map((item) => (
                  <li key={item} className="leading-7 text-muted">
                    <span className="mr-2 text-accent">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-[22px] border border-border-soft bg-surface p-5">
              <h2 className="text-2xl font-semibold text-accent">Audit record retained</h2>
              <p className="mt-3 leading-7 text-muted">
                JAOTHUI retains a minimal non-personal audit record to document
                deletion and authorization history. It does not retain account
                profile, identity, or wallet association data for this purpose.
              </p>
              <ul className="mt-4 space-y-3">
                {retainedAuditItems.map((item) => (
                  <li key={item} className="leading-7 text-muted">
                    <span className="mr-2 text-accent">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="rounded-[24px] border border-border-soft bg-surface p-5 tabletS:p-7">
            <h2 className="text-2xl font-semibold text-accent">Delete in the app</h2>
            <p className="mt-3 leading-7 text-muted">
              If you still have access to JAOTHUI Mobile, you can also sign in,
              open Profile, and select Delete account. This request page remains
              available if you no longer have the app installed.
            </p>
          </section>

          <nav className="flex flex-col gap-3 tabletS:flex-row">
            <Link
              href="/support"
              className="rounded-card border border-accent bg-transparent px-5 py-3 text-center font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
            >
              View support information
            </Link>
            <Link
              href="/privacy"
              className="rounded-card border border-accent bg-transparent px-5 py-3 text-center font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
            >
              Review Privacy Policy
            </Link>
          </nav>
        </section>
      </V2Layout>
    </>
  );
};

DeleteAccountPage.publicPage = true;

export default DeleteAccountPage;
