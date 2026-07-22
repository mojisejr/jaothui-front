import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import { V2Layout } from "../components/v2";

type PublicNextPage = NextPage & {
  publicPage?: boolean;
};

const supportTopics = [
  {
    title: "App review and public browsing",
    body: "JAOTHUI Mobile can be reviewed without signing in. Open the app, browse the home screen, review news and events, and search public buffalo records.",
  },
  {
    title: "LINE sign-in",
    body: "LINE sign-in is optional and is used for JAOTHUI account profile features. If a sign-in issue occurs, include your device model, iOS version, and the time of the attempt.",
  },
  {
    title: "Bitkub NEXT wallet link",
    body: "Bitkub NEXT wallet linking is optional and is used to connect a JAOTHUI account to wallet-based member or certificate records. Do not send private keys or seed phrases to support.",
  },
  {
    title: "Buffalo and certificate data",
    body: "For corrections to buffalo, farm, certificate, or pedigree information, include the microchip number or certificate reference so JAOTHUI can locate the record.",
  },
];

const requestChecklist = [
  "Your name and contact email.",
  "Device model and iOS version if the issue is app-related.",
  "A short description of what happened and what you expected.",
  "Relevant microchip, certificate, member, or wallet-link reference if applicable.",
  "Screenshots are helpful, but never send passwords, private keys, or recovery phrases.",
];

const SupportPage: PublicNextPage = () => {
  return (
    <>
      <Head>
        <title>Support | JAOTHUI Mobile</title>
        <meta
          name="description"
          content="Support information for JAOTHUI Mobile, including app review, LINE sign-in, Bitkub NEXT wallet linking, and buffalo certificate help."
        />
      </Head>

      <V2Layout hideNav className="max-w-4xl">
        <section className="flex w-full flex-col gap-8 px-5 py-10 mobileM:px-6 tabletS:px-10 tabletS:py-14">
          <header className="rounded-[28px] border border-border-soft bg-surface px-5 py-8 shadow-gold tabletS:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">
              JAOTHUI Mobile
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight tabletS:text-5xl">
              Support
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Need help with JAOTHUI Mobile, public buffalo records, LINE sign-in,
              Bitkub NEXT wallet linking, or account/profile information? Contact
              the JAOTHUI team and include enough detail for us to investigate.
            </p>
          </header>

          <section className="rounded-[24px] border border-border-soft bg-surface p-5 tabletS:p-7">
            <h2 className="text-2xl font-semibold text-accent">Contact JAOTHUI</h2>
            <p className="mt-3 leading-7 text-muted">
              Email support at{" "}
              <a
                href="mailto:nonthasak.l@gmail.com"
                className="font-semibold text-accent underline"
              >
                nonthasak.l@gmail.com
              </a>
              . We usually review support requests related to app access,
              certificate records, account profile, and wallet-linking issues.
            </p>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Help topics
              </p>
              <h2 className="mt-2 text-2xl font-semibold">What we can help with</h2>
            </div>

            <div className="grid gap-4 tabletS:grid-cols-2">
              {supportTopics.map((topic) => (
                <article
                  key={topic.title}
                  className="rounded-[22px] border border-border-soft bg-surface p-5"
                >
                  <h3 className="text-lg font-semibold text-accent">{topic.title}</h3>
                  <p className="mt-3 leading-7 text-muted">{topic.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-border-soft bg-surface p-5 tabletS:p-7">
            <h2 className="text-2xl font-semibold text-accent">
              Information to include
            </h2>
            <ul className="mt-4 space-y-3">
              {requestChecklist.map((item) => (
                <li key={item} className="leading-7 text-muted">
                  <span className="mr-2 text-accent">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[24px] border border-border-soft bg-surface p-5 tabletS:p-7">
            <h2 className="text-2xl font-semibold text-accent">Privacy</h2>
            <p className="mt-3 leading-7 text-muted">
              Review how JAOTHUI Mobile handles public browsing, LINE sign-in,
              Bitkub NEXT wallet linking, and account data in the{" "}
              <Link href="/privacy" className="font-semibold text-accent underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <nav className="flex flex-col gap-3 tabletS:flex-row">
            <a
              href="mailto:nonthasak.l@gmail.com"
              className="rounded-card border border-accent bg-accent px-5 py-3 text-center font-semibold text-background transition-colors hover:bg-accent-hover"
            >
              Email support
            </a>
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

SupportPage.publicPage = true;

export default SupportPage;
