import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "The Autos — Karachi Rush Garage",
  description:
    "Meet the four custom auto-rickshaws of Karachi Rush: Baba Auto, Karachi Queen, Hassan Special, and Bhatta Express.",
};

export default function AutosPage() {
  return (
    <>
      <link rel="stylesheet" href="/page.css" />
      <SiteHeader current="autos" />

      <main className="wrap">
        <h1>The Rickshaw Garage</h1>
        <p className="lede">
          Every vehicle in Karachi Rush is inspired by authentic Pakistani road culture,
          featuring hand-painted truck-art motifs, customized liveries, and distinct
          performance characteristics.
        </p>

        <Link className="play" href="/">
          Pick Your Auto ›
        </Link>

        <h2 id="garage">The Lineup</h2>

        <div className="card">
          <h3>
            Baba Auto <span className="tier">STARTER</span>
          </h3>
          <p className="updated">
            Classic Forest Green &amp; White · Free from the start · Top Speed: 42 km/h · Acceleration: 11 m/s²
          </p>
          <p>
            The quintessential Karachi rickshaw seen across every corner of the metropolis.
            Agile, forgiving, and dependable. It won&apos;t shatter speed records, but its
            balanced handling makes it the perfect vehicle for learning apexes and
            mastering the rhythm of the circuit.
          </p>
        </div>

        <div className="card">
          <h3>
            Karachi Queen <span className="tier">STREET EDITION</span>
          </h3>
          <p className="updated">
            Crimson &amp; Ivory · 2,500 coins to unlock · Top Speed: 46 km/h · Acceleration: 12.5 m/s²
          </p>
          <p>
            Inspired by the vibrant, hand-painted minibuses that race along MA Jinnah Road.
            Equipped with a tuned exhaust and sharper steering geometry. The Karachi Queen
            punches above its weight, letting you dive-bomb rivals down the inside of
            Saddar&apos;s tight corners.
          </p>
        </div>

        <div className="card">
          <h3>
            Hassan Special <span className="tier">TUNED PROTOTYPE</span>
          </h3>
          <p className="updated">
            Electric Cyan &amp; Midnight Navy · 4,500 coins to unlock · Top Speed: 48 km/h · Acceleration: 13 m/s²
          </p>
          <p>
            A bespoke workshop build featuring lightweight aluminum framework and stiffened
            rear leaf springs. Delivers razor-sharp turn-in and superior drift recovery,
            making it a lethal weapon for carving up the long sweeper onto II Chundrigar Road.
          </p>
        </div>

        <div className="card">
          <h3>
            Bhatta Express <span className="tier">CHAMPIONSHIP KING</span>
          </h3>
          <p className="updated">
            Turbo Gold &amp; Obsidian Carbon · 10,000 coins to unlock · Top Speed: 50 km/h · Acceleration: 14 m/s²
          </p>
          <p>
            The undisputed king of the Karachi underground circuit. Unlocked only by true
            veterans with 10,000 coins in the bank. Boasting a monstrous +24 km/h Nitro
            afterburner bonus and aggressive top-end power, the Bhatta Express leaves a
            trail of sparks and smoke all the way to Sea View.
          </p>
        </div>

        <h2>Garage Specs Comparison</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Price</th>
                <th>Top Speed</th>
                <th>Acceleration</th>
                <th>Handling</th>
                <th>Nitro Bonus</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Baba Auto</strong></td>
                <td>Free</td>
                <td>42 km/h</td>
                <td>11.0</td>
                <td>1.00x</td>
                <td>+18 km/h</td>
              </tr>
              <tr>
                <td><strong>Karachi Queen</strong></td>
                <td>2,500 coins</td>
                <td>46 km/h</td>
                <td>12.5</td>
                <td>1.10x</td>
                <td>+20 km/h</td>
              </tr>
              <tr>
                <td><strong>Hassan Special</strong></td>
                <td>4,500 coins</td>
                <td>48 km/h</td>
                <td>13.0</td>
                <td>1.15x</td>
                <td>+22 km/h</td>
              </tr>
              <tr>
                <td><strong>Bhatta Express</strong></td>
                <td>10,000 coins</td>
                <td>50 km/h</td>
                <td>14.0</td>
                <td>1.20x</td>
                <td>+24 km/h</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Meet Your 7 AI Competitors</h2>
        <p>
          You don&apos;t race in an empty city. Lining up on the grid alongside you are
          seven fierce competitors, each with unique livery colors, custom target lanes,
          and driving skill levels:
        </p>
        <ul>
          <li><strong>Tariq</strong> (Navy &amp; Beige) — Skill 0.96 (Tactical overtaker)</li>
          <li><strong>Zain</strong> (Sunset Orange &amp; Slate) — Skill 0.93 (Aggressive drifter)</li>
          <li><strong>Farhan</strong> (Ruby Red &amp; Cream) — Skill 0.91 (Late-braking specialist)</li>
          <li><strong>Bilal</strong> (Teal &amp; Forest) — Skill 0.88 (Smooth line runner)</li>
          <li><strong>Usman</strong> (Purple &amp; Silver) — Skill 0.85 (Midfield contender)</li>
          <li><strong>Imran</strong> (Kelly Green &amp; Deep Pine) — Skill 0.82 (Tenacious defender)</li>
          <li><strong>Hassam</strong> (Sand &amp; Charcoal) — Skill 0.79 (Spirited rookie)</li>
        </ul>

        <Link className="play" href="/">
          Enter the Race ›
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}

