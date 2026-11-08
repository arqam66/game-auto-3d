import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "Terms of Use — Karachi Rush",
  description:
    "Terms of use for Karachi Rush: a free, indie browser racing game.",
};

export default function TermsPage() {
  return (
    <>
      <link rel="stylesheet" href="/page.css" />
      <SiteHeader current="terms" />

      <main className="wrap">
        <h1>Terms of Use</h1>
        <p className="updated">Last updated 8 November 2026.</p>

        <p className="lede">
          These terms govern the use of the Karachi Rush website and game. By playing
          the game or accessing the site, you agree to these simple terms.
        </p>

        <h2>Using the Game</h2>
        <p>
          Karachi Rush is free to play for personal, non-commercial entertainment. You do
          not need an account or subscription.
        </p>
        <p>You agree not to:</p>
        <ul>
          <li>
            Attempt to disrupt, exploit, overload, or mount denial-of-service attacks
            against the hosting servers.
          </li>
          <li>
            Redistribute, frame, or sell the game codebase or proprietary assets
            without prior permission.
          </li>
          <li>
            Decompile or reverse-engineer the project for unauthorized commercial
            duplication.
          </li>
        </ul>

        <h2>Your In-Game Progress</h2>
        <p>
          Coins collected and rickshaws unlocked exist purely as numeric entries in your
          local browser storage. They carry zero real-world monetary value, cannot be
          purchased with real money, cannot be exchanged, and are not backed by any
          remote database.
        </p>

        <h2>Disclaimer of Warranties</h2>
        <p>
          The game is provided &ldquo;as is&rdquo; without warranties of any kind. While
          we strive for optimal performance across all browsers and devices, we do not
          guarantee error-free or uninterrupted operation on every hardware configuration.
        </p>

        <h2>Intellectual Property &amp; Trademarks</h2>
        <p>
          Karachi Rush is an independent fictional work celebrating the streetscape of
          Karachi, Pakistan. Any artistic depictions of vehicles or public landmarks are
          stylized representations created for cultural homage and entertainment.
        </p>

        <Link className="play" href="/">
          Back to the Game ›
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}

