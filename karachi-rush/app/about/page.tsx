import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "About — Karachi Rush",
  description:
    "A free browser racing game about the most iconic three-wheeler in Pakistan, racing through the historic streets and seaside avenues of Karachi.",
};

export default function AboutPage() {
  return (
    <>
      <link rel="stylesheet" href="/page.css" />
      <SiteHeader current="about" />

      <main className="wrap">
        <h1>About Karachi Rush</h1>
        <p className="lede">
          A free browser 3D racing game about the most enduring vehicle on Pakistani
          roads — and about Karachi, which is a faster, louder, and more vibrant
          city to race through than any circuit anyone could invent.
        </p>

        <h2>The idea</h2>
        <p>
          Racing games are full of pristine supercars on manicured racetracks. Very
          few of them celebrate the vehicle that hundreds of thousands of people in
          Karachi actually travel in every single day: the three-wheeled 2-stroke
          auto-rickshaw.
        </p>
        <p>
          Karachi Rush puts you on a live starting grid alongside seven competitive
          rivals and lets you blast down the real commercial arteries and coastal
          stretches of the City of Lights: from the colonial clocktowers and bustling
          bazaars of <strong>Saddar</strong> (past Empress Market and Chaar Minar),
          through the towering banking canyon of <strong>II Chundrigar Road</strong>{" "}
          (by the Habib Bank Plaza and Boulton Market), down to the wide, sea-breeze
          swept highways of <strong>Clifton and Sea View</strong> under the night sky.
        </p>
        <p>
          It is meant to bring a smile to your face before it is meant to be serious.
          The autos have authentic truck-art calligraphy and reflective decals, the
          exhaust crackles with real 2-stroke frequency modulation, and overtaking
          under the streetlights of Karachi is pure adrenaline. Under the hood,
          though, the handling is genuinely modeled: three wheels, an asymmetric
          trike footprint, dynamic suspension body roll into turns, high center of
          gravity, and a rear axle that will kick out into a powerslide if you tap
          the brakes while steering.
        </p>

        <h2>What&apos;s in it</h2>
        <ul>
          <li>
            <strong>Full 8-Rickshaw Grid:</strong> Race against seven CPU rivals
            with individual aggression parameters, tactical overtakes, and lane
            navigation.
          </li>
          <li>
            <strong>Three Distinct District Laps:</strong> Experience a dynamic
            progression across three Karachi zones — bright daytime in Saddar,
            golden sunset along II Chundrigar, and midnight coastal night racing
            through Clifton.
          </li>
          <li>
            <strong>Atmospheric Lighting &amp; Active Headlights:</strong> Real-time
            time-of-day engine shifting from crisp daytime sunshine to warm golden
            hour and indigo cyberpunk night with real vehicle headlight illumination.
          </li>
          <li>
            <strong>Four Iconic Rickshaws to Unlock:</strong> Collect coins strewn
            across the circuit to buy and master everything from the classic green &amp;
            white <em>Baba Auto</em> to the championship-winning <em>Bhatta Express</em>.
          </li>
          <li>
            <strong>Authentic City Traps &amp; Hazards:</strong> Dodge tyre stacks,
            cone fields, weaving slow traffic, speed breaker rumble zones, oil slicks,
            and open manhole hazards.
          </li>
          <li>
            <strong>Procedural Web Audio Engine:</strong> Pure mathematical sound
            synthesis with zero sample downloads — real-time RPM-modulated 2-stroke
            sawtooth oscillators, screeching drift tyre friction, and high-frequency
            nitro jet thrust.
          </li>
          <li>
            <strong>Three Difficulty Modes:</strong> Easy (relaxed traffic, 2x coins),
            Medium (the authentic Karachi commute), and Hard (bumper-to-bumper chaos
            with 1.3x score multiplier).
          </li>
        </ul>

        <h2>How it&apos;s built</h2>
        <p>
          Karachi Rush is a modern web application built with{" "}
          <strong>Next.js 16 (App Router)</strong>, <strong>React 19</strong>, and
          rendered in full hardware-accelerated 3D using{" "}
          <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">
            Three.js
          </a>{" "}
          over WebGL2.
        </p>
        <p>
          There are no app store downloads, no plugins, no heavy 500MB asset packs,
          and no accounts required. The entire city environment, curved spline tracks,
          landmarks, roadside curbs, and obstacles are procedurally generated at
          runtime. That is why the game loads in less than two seconds on a standard
          broadband or mobile 4G connection.
        </p>

        <h2>Audio &amp; Sound Engine</h2>
        <p>
          All sound effects are synthesized dynamically on your machine through the
          standard browser <strong>Web Audio API</strong>:
        </p>
        <ul>
          <li>
            <strong>2-Stroke Engine Roar:</strong> Sawtooth oscillator modulated in
            real-time by engine RPM, sweeping smoothly between 24 Hz idle and 180 Hz
            top speed.
          </li>
          <li>
            <strong>Tyre Drift Screech:</strong> Bandpass-filtered procedural pink noise
            triggered when lateral slip angle exceeds tyre grip thresholds.
          </li>
          <li>
            <strong>Nitro Jet Exhaust:</strong> Dual-frequency resonant triangle waves
            simulating pressurized afterburner thrust.
          </li>
          <li>
            <strong>Starting Sequence &amp; Impacts:</strong> Mathematical frequency
            beeps and square-wave pitch drops for curb collisions and barrier taps.
          </li>
        </ul>

        <h2>Who made it</h2>
        <p>
          Karachi Rush is crafted as an independent passion project celebrating South
          Asian street culture, urban architecture, and high-speed arcade gaming. It is
          completely free to play and will always remain accessible to anyone with a
          web browser.
        </p>
        <p>
          If you encounter a bug, have an idea for a new Karachi landmark or rickshaw
          livery, or just want to tell us that the Bhatta Express is too fast for your
          keyboard — head over to the <Link href="/contact">contact page</Link>.
        </p>

        <Link className="play" href="/">
          Play Karachi Rush ›
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}

