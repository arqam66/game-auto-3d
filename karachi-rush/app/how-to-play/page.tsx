import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "How to Play — Karachi Rush",
  description:
    "Controls, driving mechanics, drift slides, nitro boost, and obstacle guides for Karachi Rush auto-rickshaw championship.",
};

export default function HowToPlayPage() {
  return (
    <>
      <link rel="stylesheet" href="/page.css" />
      <SiteHeader current="how-to-play" />

      <main className="wrap">
        <h1>How to play Karachi Rush</h1>
        <p className="lede">
          Eight auto-rickshaws, three iconic Karachi districts, and no speed limits
          on the sprint to Sea View. Everything you need to know is on this page —
          the game itself runs right in your browser with zero downloads.
        </p>

        <Link className="play" href="/">
          Play Karachi Rush ›
        </Link>

        <h2 id="controls">Controls</h2>
        <h3>Keyboard</h3>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
                <th>In-Game Effect</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <kbd>↑</kbd> or <kbd>W</kbd>
                </td>
                <td>Accelerate / Gas</td>
                <td>Full throttle forward acceleration</td>
              </tr>
              <tr>
                <td>
                  <kbd>↓</kbd> or <kbd>S</kbd>
                </td>
                <td>Brake / Reverse</td>
                <td>Decelerate sharply; hold when stopped to reverse</td>
              </tr>
              <tr>
                <td>
                  <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd>
                </td>
                <td>Steer Left / Right</td>
                <td>Turns the front fork with authentic suspension roll</td>
              </tr>
              <tr>
                <td>
                  <kbd>Space</kbd> or <kbd>Shift</kbd> (hold)
                </td>
                <td>Power Drift</td>
                <td>Breaks rear traction into a slide; recharges Nitro bar</td>
              </tr>
              <tr>
                <td>
                  <kbd>N</kbd> or <kbd>Ctrl</kbd>
                </td>
                <td>Nitro Boost</td>
                <td>Unleashes rocket boost beyond normal vehicle top speed</td>
              </tr>
              <tr>
                <td>
                  <kbd>P</kbd>
                </td>
                <td>Pause / Resume</td>
                <td>Brings up the in-race pause menu</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Mobile &amp; Touch Controls</h3>
        <p>
          On phones and tablets, touch controls activate automatically:
        </p>
        <ul>
          <li>
            <strong>Left thumb:</strong> Steering buttons (◀ / ▶) to guide your
            rickshaw through traffic.
          </li>
          <li>
            <strong>Right thumb:</strong> Gas (🚀), Brake (🛑), Drift (💨), and
            Nitro (⚡) buttons.
          </li>
        </ul>

        <h2 id="mechanics">Core Mechanics</h2>

        <h3>1. The Trike Physics Model</h3>
        <p>
          An auto-rickshaw is not a four-wheel sedan. With a single front steering
          wheel and two driven rear wheels, weight transfer is abrupt. If you turn
          at full throttle, the chassis tilts on its springs. If you tap the brakes
          while already committed to a corner, the back end will step out.
        </p>

        <h3>2. Drifting &amp; Nitro Economy</h3>
        <p>
          Holding <kbd>Space</kbd> or <kbd>Shift</kbd> during high-speed turns cuts
          lateral rear tyre grip and initiates a power drift.
        </p>
        <ul>
          <li>
            Drifting rapidly charges your Nitro meter at <strong>16% per second</strong>.
          </li>
          <li>
            Driving at high speed (&gt;15 km/h) also provides a modest passive
            recharge of <strong>4% per second</strong>.
          </li>
          <li>
            Firing Nitro adds up to <strong>+8 to +24 km/h</strong> top speed and a
            <strong>1.6x acceleration multiplier</strong>, kicking up camera shake and
            dynamic field-of-view expansion.
          </li>
        </ul>

        <h3>3. Coin Collection &amp; Persistent Bank</h3>
        <p>
          Every lap features rows of spinning gold coins. Steer through them to collect
          them! All coins gathered during a race are automatically deposited into your
          persistent bank balance stored in your browser&apos;s local storage. Use your
          earnings in the Garage to unlock higher-tier racing rickshaws.
        </p>

        <h2 id="hazards">Track Hazards &amp; Obstacles</h2>
        <p>
          Karachi streets are lively, unpredictable, and full of character. Keep your
          eyes sharp for six types of road obstacles:
        </p>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Hazard</th>
                <th>Type</th>
                <th>Impact on Vehicle</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Tyre Stack</strong></td>
                <td>Physical Barrier</td>
                <td>Hard collision: cuts speed to 25% with 1.1s chassis wobble</td>
              </tr>
              <tr>
                <td><strong>Cone Field</strong></td>
                <td>Construction Marker</td>
                <td>Bumper knock: knocks momentum and requires quick steering</td>
              </tr>
              <tr>
                <td><strong>Slow Traffic Rickshaw</strong></td>
                <td>Moving Vehicle</td>
                <td>Weaves slowly between lanes at 6–11 km/h; rear-ending triggers crash</td>
              </tr>
              <tr>
                <td><strong>Speed Breakers</strong></td>
                <td>Road Surface Zone</td>
                <td>Rumble bumps that cap your maximum speed until cleared</td>
              </tr>
              <tr>
                <td><strong>Oil Slicks</strong></td>
                <td>Friction Hazard</td>
                <td>Grip loss: induces sudden steering drift and slip angles</td>
              </tr>
              <tr>
                <td><strong>Open Manholes</strong></td>
                <td>Urban Hazard</td>
                <td>Consecutive suspension shock and handling penalty</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          <em>Fairness Guarantee:</em> Obstacles are seeded with a strict minimum gap
          of at least 38 meters between consecutive hazards, ensuring that every run is
          fair, readable, and rewarding of pure driver skill.
        </p>

        <h2 id="troubleshooting">Common Questions</h2>
        <h3>Why do I not hear any engine sound?</h3>
        <p>
          Modern web browsers (Chrome, Safari, Firefox, Edge) block audio from
          playing automatically until you interact with the page. Once you click
          any button or press a key to start your race, the Web Audio engine
          activates immediately.
        </p>

        <h3>Did I lose my coins and unlocked vehicles?</h3>
        <p>
          Your garage progress is stored locally in your browser&apos;s{" "}
          <code>localStorage</code> under keys like <code>rush_bank</code> and{" "}
          <code>rush_unlocked</code>. It remains saved between sessions. If you use
          Incognito/Private browsing mode, or manually clear your browser site data,
          the local storage will reset.
        </p>

        <Link className="play" href="/">
          Head to the Grid ›
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}

