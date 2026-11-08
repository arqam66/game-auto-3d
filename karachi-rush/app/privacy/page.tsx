import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "Privacy Policy — Karachi Rush",
  description:
    "Plain-English privacy policy for the Karachi Rush browser game: no accounts, no tracking database, local progress stays on your machine.",
};

export default function PrivacyPage() {
  return (
    <>
      <link rel="stylesheet" href="/page.css" />
      <SiteHeader current="privacy" />

      <main className="wrap">
        <h1>Privacy Policy</h1>
        <p className="updated">Last updated 8 November 2026.</p>

        <p className="lede">
          This policy covers the Karachi Rush website and the 3D racing game on it.
          The short version: there are no user accounts, no passwords, no behavioral
          profiling databases, and your game progress stays entirely on your own
          device.
        </p>

        <h2>What is stored on your own device</h2>
        <p>
          Your coin bank balance, unlocked vehicles, selected difficulty mode, and best
          lap times are stored strictly in your browser&apos;s <code>localStorage</code>{" "}
          on your machine.
        </p>
        <p>
          This data never leaves your computer or phone. We do not collect it, we cannot
          read it, and we cannot restore it if you clear your browser cookies or site
          storage.
        </p>

        <h2>Server logs and analytics</h2>
        <p>
          When you request the web page, standard HTTP web server logs may temporarily
          record basic request metadata (such as IP address, user-agent, and requested
          file) for operational diagnostic purposes and DDOS prevention. These logs are
          regularly cycled and deleted.
        </p>
        <p>
          We do not sell, rent, or trade your personal data to any third-party brokers.
        </p>

        <h2>Cookies and third-party services</h2>
        <p>
          Karachi Rush does not use tracking cookies to track your behavior across other
          websites. If hosted on a third-party gaming portal (such as CrazyGames,
          Poki, or itch.io), that specific platform&apos;s own independent privacy policy
          and terms apply to their site container.
        </p>

        <h2>Contacting Us</h2>
        <p>
          If you have questions or requests regarding this policy, feel free to reach out
          directly via the <Link href="/contact">contact page</Link> or by email at{" "}
          <a href="mailto:contact@karachirush.com">contact@karachirush.com</a>.
        </p>

        <Link className="play" href="/">
          Return to Play ›
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}

