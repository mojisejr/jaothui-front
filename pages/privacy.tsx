import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import { V2Layout } from "../components/v2";

type PublicNextPage = NextPage & {
  publicPage?: boolean;
};

const updatedAt = "July 22, 2026";

const dataSections = [
  {
    title: "Public browsing",
    body: "You can browse public JAOTHUI Mobile content, including buffalo information, public certificate details, news, and events without signing in.",
  },
  {
    title: "LINE account sign-in",
    body: "If you choose to sign in with LINE, JAOTHUI may receive and store account identifiers and profile information such as LINE user ID, display name, profile image URL, and email address when LINE provides it.",
  },
  {
    title: "Bitkub NEXT wallet linking",
    body: "If you choose to connect Bitkub NEXT, JAOTHUI may receive and store your wallet address, related email address when provided, verification status, and the link between that wallet and your JAOTHUI account.",
  },
  {
    title: "Member and buffalo records",
    body: "When your account is linked to existing JAOTHUI records, the app may show member, farm, certificate, and owned buffalo information associated with your linked identity.",
  },
  {
    title: "Technical information",
    body: "JAOTHUI may process basic technical information such as session tokens, request metadata, and server logs to keep the service secure, reliable, and functional.",
  },
];

const purposeSections = [
  "Provide public buffalo search, certificate, news, and event features.",
  "Create and manage optional JAOTHUI account sessions.",
  "Connect optional LINE and Bitkub NEXT identities to JAOTHUI member records.",
  "Protect the service, troubleshoot issues, and improve app reliability.",
  "Respond to support and privacy requests.",
];

const sharingSections = [
  "JAOTHUI does not sell personal data.",
  "JAOTHUI does not use personal data for third-party advertising tracking in the current mobile app.",
  "Service providers may process data only as needed to operate authentication, hosting, database, wallet-linking, analytics, security, or support infrastructure.",
  "Data may be disclosed if required by law, regulation, or a valid legal process.",
];

const retentionSections = [
  "Account, identity, and wallet-link records are kept while they are needed to provide JAOTHUI account features.",
  "Technical logs are kept only as long as needed for security, troubleshooting, and service operations.",
  "You may request access, correction, or deletion where applicable by contacting JAOTHUI support.",
];

const PrivacyPage: PublicNextPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy | JAOTHUI Mobile</title>
        <meta
          name="description"
          content="Privacy Policy for JAOTHUI Mobile, including LINE sign-in, Bitkub NEXT wallet linking, and public buffalo information."
        />
      </Head>

      <V2Layout hideNav className="max-w-4xl">
        <section className="flex w-full flex-col gap-8 px-5 py-10 mobileM:px-6 tabletS:px-10 tabletS:py-14">
          <header className="rounded-[28px] border border-border-soft bg-surface px-5 py-8 shadow-gold tabletS:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">
              JAOTHUI Mobile
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight tabletS:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              JAOTHUI Mobile helps users discover, review, and manage Thai buffalo
              heritage information. This policy explains how JAOTHUI handles data
              for public browsing, optional LINE sign-in, and optional Bitkub NEXT
              wallet linking.
            </p>
            <p className="mt-5 text-sm text-muted">Last updated: {updatedAt}</p>
          </header>

          <section className="rounded-[24px] border border-border-soft bg-surface p-5 tabletS:p-7">
            <h2 className="text-2xl font-semibold text-accent">Who we are</h2>
            <p className="mt-3 leading-7 text-muted">
              JAOTHUI Mobile is provided by RFC CHAMPIONSHIP COMPANY LIMITED for
              the JAOTHUI Thai buffalo platform. The app presents public buffalo
              information and optional member account features connected to the
              JAOTHUI service at{" "}
              <Link href="/" className="font-semibold text-accent underline">
                www.jaothui.com
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Data we process
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Information used by the app</h2>
            </div>

            <div className="grid gap-4 tabletS:grid-cols-2">
              {dataSections.map((section) => (
                <article
                  key={section.title}
                  className="rounded-[22px] border border-border-soft bg-surface p-5"
                >
                  <h3 className="text-lg font-semibold text-accent">{section.title}</h3>
                  <p className="mt-3 leading-7 text-muted">{section.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 tabletS:grid-cols-3">
            <article className="rounded-[22px] border border-border-soft bg-surface p-5 tabletS:col-span-2">
              <h2 className="text-2xl font-semibold text-accent">How we use information</h2>
              <ul className="mt-4 space-y-3">
                {purposeSections.map((item) => (
                  <li key={item} className="leading-7 text-muted">
                    <span className="mr-2 text-accent">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-[22px] border border-border-soft bg-surface p-5">
              <h2 className="text-2xl font-semibold text-accent">Your choice</h2>
              <p className="mt-4 leading-7 text-muted">
                LINE sign-in and Bitkub NEXT wallet linking are optional. Public
                browsing features can be reviewed without signing in.
              </p>
            </article>
          </section>

          <section className="rounded-[24px] border border-border-soft bg-surface p-5 tabletS:p-7">
            <h2 className="text-2xl font-semibold text-accent">Sharing and tracking</h2>
            <ul className="mt-4 space-y-3">
              {sharingSections.map((item) => (
                <li key={item} className="leading-7 text-muted">
                  <span className="mr-2 text-accent">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[24px] border border-border-soft bg-surface p-5 tabletS:p-7">
            <h2 className="text-2xl font-semibold text-accent">Retention and requests</h2>
            <ul className="mt-4 space-y-3">
              {retentionSections.map((item) => (
                <li key={item} className="leading-7 text-muted">
                  <span className="mr-2 text-accent">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[24px] border border-border-soft bg-surface p-5 tabletS:p-7">
            <h2 className="text-2xl font-semibold text-accent">Contact</h2>
            <p className="mt-3 leading-7 text-muted">
              For privacy questions, support requests, or account data requests,
              contact JAOTHUI at{" "}
              <a
                href="mailto:nonthasak.l@gmail.com"
                className="font-semibold text-accent underline"
              >
                nonthasak.l@gmail.com
              </a>
              .
            </p>
          </section>

          <nav className="flex flex-col gap-3 tabletS:flex-row">
            <Link
              href="/support"
              className="rounded-card border border-accent bg-accent px-5 py-3 text-center font-semibold text-background transition-colors hover:bg-accent-hover"
            >
              Contact support
            </Link>
            <Link
              href="/"
              className="rounded-card border border-accent bg-transparent px-5 py-3 text-center font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
            >
              Back to JAOTHUI
            </Link>
          </nav>
        </section>
      </V2Layout>
    </>
  );
};

PrivacyPage.publicPage = true;

export default PrivacyPage;
