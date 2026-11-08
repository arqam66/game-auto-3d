import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "Tracks & Districts — Karachi Rush",
  description:
    "Explore the 3 iconic districts of the Karachi Rush circuit: Saddar, II Chundrigar Road, and Clifton Sea View.",
};

export default function TracksPage() {
  return (
    <>
      <link rel="stylesheet" href="/page.css" />
      <SiteHeader current="tracks" />

      <main className="wrap">
        <h1>The Tracks &amp; Districts</h1>
        <p className="lede">
          A continuous 2.9-kilometer closed-loop circuit cutting through the heart of
          Karachi, Pakistan. Across three laps, the race transitions across three
          storied districts, complete with dynamic time-of-day changes and authentic
          landmarks.
        </p>

        <Link className="play" href="/">
          Race the Circuit ›
        </Link>

        <h2>Lap 1: Saddar (Empress Market &amp; Chaar Minar)</h2>
        <p className="updated">Time of Day: Crisp Daylight ☀️ · Environment: Colonial Clocktowers &amp; Bazaar Lanes</p>
        <p>
          The race starts at the historic gates of Saddar. You accelerate through
          wide asphalt stretches flanked by traditional street vendors and colonial-era
          facades. Sweeping curves take you past the red-brick clocktower of Empress
          Market and the bustling roundabout of Chaar Minar. Traffic is tight, and early
          positioning into the first chicane is essential to breaking away from the pack.
        </p>

        <h2>Lap 2: II Chundrigar Road (Habib Bank Plaza &amp; Boulton Market)</h2>
        <p className="updated">Time of Day: Golden Sunset 🌅 · Environment: Financial High-Rises &amp; Long Shadows</p>
        <p>
          As lap two begins, the sky shifts into warm amber and copper hues. You enter
          Pakistan&apos;s Wall Street: II Chundrigar Road. Here, corporate glass towers
          and the soaring spire of Habib Bank Plaza cast long shadows across the
          surface. Wide straights allow tuned autos to reach their maximum velocity,
          interspersed with tricky speed breaker zones and sudden dips around Boulton
          Market where braking discipline pays off.
        </p>

        <h2>Lap 3: Clifton (Mazar-e-Quaid &amp; Sea View Boulevard)</h2>
        <p className="updated">Time of Day: Cyberpunk Night 🌃 · Environment: Midnight Ocean Air &amp; Glowing Headlights</p>
        <p>
          The final lap descends into an atmospheric midnight race. Headlights snap on,
          casting sharp illumination cones across the road ahead. You sweep past the
          illuminated white marble dome of Mazar-e-Quaid and crest the Clifton coastal
          ridge before tearing down towards the neon-lit Sea View billboard stretch.
          The cool Arabian Sea breeze and high-speed coastal bends test your drift control
          as you battle to the chequered flag.
        </p>

        <h2>District Comparison</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Lap</th>
                <th>District</th>
                <th>Time of Day</th>
                <th>Landmarks</th>
                <th>Key Challenge</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td><strong>Saddar</strong></td>
                <td>Day (Crisp)</td>
                <td>Empress Market, Chaar Minar</td>
                <td>Tight opening turns &amp; rival congestion</td>
              </tr>
              <tr>
                <td>2</td>
                <td><strong>II Chundrigar</strong></td>
                <td>Sunset (Amber)</td>
                <td>Habib Bank Plaza, Boulton Market</td>
                <td>High-speed straights &amp; speed breaker zones</td>
              </tr>
              <tr>
                <td>3</td>
                <td><strong>Clifton</strong></td>
                <td>Night (Indigo)</td>
                <td>Mazar-e-Quaid, Sea View Coast</td>
                <td>Reduced night visibility &amp; high-G drift bends</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>How the Circuit is Built</h2>
        <p>
          Rather than relying on flat grid roads, the Karachi Rush circuit is modeled
          as a continuous three-dimensional Catmull-Rom spline curve with realistic
          elevation undulations, banked sweepers, and cambered crests.
        </p>
        <p>
          Road surfaces, barrier curbs, streetlights, palm trees, and skyscraper blocks
          are generated along the curve coordinates at load time. This procedural
          pipeline ensures that the entire 3D world loads instantly with zero waiting time.
        </p>

        <Link className="play" href="/">
          Take the Wheel ›
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}

