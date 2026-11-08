import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "Updates & Changelog — Karachi Rush",
  description:
    "See what is new in Karachi Rush: physics improvements, circuit landmarks, audio engine tuning, and updates.",
};

export default function ChangelogPage() {
  return (
    <>
      <link rel="stylesheet" href="/page.css" />
      <SiteHeader current="changelog" />

      <main className="wrap">
        <h1>Updates &amp; Changelog</h1>
        <p className="lede">
          Everything that has been tuned, built, and polished in Karachi Rush,
          newest first. The game runs and updates in your browser automatically —
          there is never anything to install or download.
        </p>

        <section className="log">
          <h2>Website &amp; Companion Guides Launch</h2>
          <p>
            <time dateTime="2026-11-08">8 November 2026</time>
          </p>
          <ul>
            <li>
              <strong>Comprehensive Editorial Pages:</strong> Launched dedicated
              sections for <Link href="/how-to-play">How to Play</Link>,{" "}
              <Link href="/tracks">Tracks &amp; Districts</Link>,{" "}
              <Link href="/autos">The Autos</Link>,{" "}
              <Link href="/about">About</Link>, and{" "}
              <Link href="/contact">Contact</Link>.
            </li>
            <li>
              <strong>Direct Developer Inquiries:</strong> Established direct email
              contact channel at <code>contact@karachirush.com</code> for bugs,
              driver feedback, and portal inquiries.
            </li>
            <li>
              <strong>Clean URL Routing:</strong> Next.js App Router subpages are
              now available with clean semantic paths.
            </li>
          </ul>
        </section>

        <section className="log">
          <h2>The Karachi Circuit Overhaul: 3 Districts &amp; Night Lights</h2>
          <p>
            <time dateTime="2026-11-07">7 November 2026</time>
          </p>
          <ul>
            <li>
              <strong>Continuous 3-District Lap Progression:</strong> The 2.9 km
              circuit now transitions dynamically each lap: Saddar by daylight,
              II Chundrigar at golden hour, and Clifton under the sea-breeze night.
            </li>
            <li>
              <strong>Active Dynamic Headlights:</strong> In Night mode, your
              auto-rickshaw now casts functional spotlight cones illuminating the
              asphalt and upcoming hazards.
            </li>
            <li>
              <strong>Urban Landmarks Added:</strong> Modeled landmark silhouettes
              along the road, including Empress Market clocktower, Chaar Minar,
              Habib Bank Plaza, Boulton Market, and Mazar-e-Quaid.
            </li>
            <li>
              <strong>Hazard Spacing Guarantee:</strong> Implemented stratified
              deterministic obstacle placement with a guaranteed minimum spacing of
              over 38 meters between traps for fair, skill-based gameplay.
            </li>
          </ul>
        </section>

        <section className="log">
          <h2>Procedural Audio Engine &amp; Trike Physics</h2>
          <p>
            <time dateTime="2026-11-01">1 November 2026</time>
          </p>
          <ul>
            <li>
              <strong>Real-Time Web Audio Synthesis:</strong> Replaced static audio
              samples with live mathematical frequency synthesis. Engine RPM
              modulates between 24 Hz and 180 Hz for an authentic 2-stroke Tuk-Tuk
              hum.
            </li>
            <li>
              <strong>Dynamic Drift Mechanic:</strong> Holding drift breaks rear
              traction into a controllable power-slide while charging your Nitro
              bar at 16% per second.
            </li>
            <li>
              <strong>Persistent Bank &amp; Economy:</strong> Added local storage
              persistence for earned coins and vehicle unlocks across sessions.
            </li>
          </ul>
        </section>

        <Link className="play" href="/">
          Back to the Game ›
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}

