import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "Contact — Karachi Rush",
  description:
    "How to reach the developer of Karachi Rush about bugs, ideas, performance, or business.",
};

export default function ContactPage() {
  return (
    <>
      <link rel="stylesheet" href="/page.css" />
      <SiteHeader current="contact" />

      <main className="wrap">
        <h1>Contact</h1>
        <p className="lede">
          Karachi Rush is made by an independent developer, and every email is read
          and answered directly.
        </p>

        <h2>Email</h2>
        <p>
          <strong>
            <a href="mailto:contact@karachirush.com">contact@karachirush.com</a>
          </strong>
        </p>
        <p>
          Expect a reply within a few days. If you are reporting a bug or performance
          issue, the most helpful things to include are:
        </p>
        <ul>
          <li>What you were doing when it happened (lap number, vehicle selected, etc.).</li>
          <li>
            Your browser and device (for example “Chrome 131 on Windows 11” or
            “Safari on iPhone 15”).
          </li>
          <li>
            A screenshot or short screen recording, if there was a visual glitch or
            collision issue.
          </li>
        </ul>

        <h2>What to write about</h2>
        <ul>
          <li>
            <strong>Bugs &amp; Glitches</strong> — a race that refused to start,
            rickshaw getting wedged on a curb, or unexpected physics wobbles.
          </li>
          <li>
            <strong>Ideas &amp; Suggestions</strong> — new Karachi neighborhoods
            (Tariq Road, Burns Road food street, Lyari Expressway), new vehicle
            tunes, or custom paint styles.
          </li>
          <li>
            <strong>Performance Feedback</strong> — frame rates on low-end laptops,
            smartphones, or older tablets.
          </li>
          <li>
            <strong>Business &amp; Portals</strong> — licensing, game portal
            features, or educational showcases.
          </li>
        </ul>

        <h2>Before you write</h2>
        <p>
          The <Link href="/how-to-play">how to play</Link> page covers the questions
          that come up most often: driving mechanics, drift timing, how the bank
          economy works, and what to check if you don&apos;t hear engine audio.
        </p>
        <p>
          Your saved coins, unlocked vehicles, and best lap times live strictly in
          your local browser storage. If you clear your browser cookies or site data,
          your progress resets on that device.
        </p>

        <Link className="play" href="/">
          Back to the Grid ›
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}

