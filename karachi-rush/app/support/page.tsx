import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "Support — Karachi Rush",
  description:
    "Help and FAQ for Karachi Rush: controls, crashes, unlocking cities, vehicles, and how to reach the developer.",
};

export default function SupportPage() {
  return (
    <>
      <link rel="stylesheet" href="/page.css" />
      <SiteHeader current="support" />

      <main className="wrap">
        <h1>Support</h1>
        <p className="lede">
          Stuck on a lap, can’t unlock Gurugram, or just want to understand the
          controls? Here are the most common questions about Karachi Rush.
        </p>

        <h2>Controls</h2>
        <ul>
          <li>
            <strong>Steer:</strong> Arrow keys / A-D or left stick.
          </li>
          <li>
            <strong>Accelerate / Brake:</strong> Up-Down / W-S or triggers.
          </li>
          <li>
            <strong>Drift:</strong> Spacebar / Shift.
          </li>
          <li>
            <strong>Nitro:</strong> N key / Control / face button when the nitro
            bar has charge.
          </li>
          <li>
            <strong>Horn:</strong> H key — a courteous Karachi auto-rickshaw honk.
          </li>
          <li>
            <strong>Camera:</strong> C cycles Chase / Hood / Cinematic.
          </li>
          <li>
            <strong>Pause:</strong> P or Escape.
          </li>
        </ul>

        <h2>Unlocking Gurugram · Delhi NCR</h2>
        <p>
          Gurugram is the second circuit and costs <strong>5,000 coins</strong>.
          Collect coins during races (each is worth more on higher difficulties),
          then open the garage, cycle to Gurugram with ‹ ›, and tap
          <strong>UNLOCK FOR 5,000</strong>. Once unlocked it appears in the city
          picker and you can race it like Karachi.
        </p>

        <h2>Crashes &amp; the Warden</h2>
        <p>
          Crash twice in a single run and the Warden (chase mini-boss) is summoned.
          The Warden drives the same circuit and will bust you if it closes to
          within a few metres — keep your nose clean and your line tight.
        </p>

        <h2>Vehicles &amp; Upgrades</h2>
        <p>
          Start with the Chingchi Classic (free). Earn coins to buy more rickshaws
          in the garage, then spend coins on Top Speed, Acceleration, Handling, and
          Nitro upgrades (3 levels each). Every vehicle can be fully upgraded.
        </p>

        <h2>Still need help?</h2>
        <p>
          Email <strong><a href="mailto:support@karachirush.com">support@karachirush.com</a></strong>
          and include what you were doing, your browser/device, and a screenshot if
          there was a visual glitch. Every email is read.
        </p>

        <p>
          <Link href="/">← Back to Play</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
