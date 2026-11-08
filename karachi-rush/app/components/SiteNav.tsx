import Link from "next/link";

interface SiteNavProps {
  current?:
    | "play"
    | "how-to-play"
    | "tracks"
    | "autos"
    | "changelog"
    | "about"
    | "contact"
    | "privacy"
    | "terms";
}

export function SiteHeader({ current }: SiteNavProps) {
  return (
    <header className="top">
      <div className="wrap">
        <Link className="brand" href="/">
          KARACHI <span>RUSH</span> <small>Rickshaw Circuit Championship</small>
        </Link>
        <nav className="site" aria-label="Site">
          <Link href="/" aria-current={current === "play" ? "page" : undefined}>
            Play
          </Link>
          <Link
            href="/how-to-play"
            aria-current={current === "how-to-play" ? "page" : undefined}
          >
            How to play
          </Link>
          <Link
            href="/tracks"
            aria-current={current === "tracks" ? "page" : undefined}
          >
            Tracks
          </Link>
          <Link
            href="/autos"
            aria-current={current === "autos" ? "page" : undefined}
          >
            The autos
          </Link>
          <Link
            href="/changelog"
            aria-current={current === "changelog" ? "page" : undefined}
          >
            Updates
          </Link>
          <Link
            href="/about"
            aria-current={current === "about" ? "page" : undefined}
          >
            About
          </Link>
          <Link
            href="/contact"
            aria-current={current === "contact" ? "page" : undefined}
          >
            Contact
          </Link>
          <Link
            href="/privacy"
            aria-current={current === "privacy" ? "page" : undefined}
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            aria-current={current === "terms" ? "page" : undefined}
          >
            Terms
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site wrap">
      <nav aria-label="Footer">
        <Link href="/">Play</Link>
        <Link href="/how-to-play">How to play</Link>
        <Link href="/tracks">Tracks</Link>
        <Link href="/autos">The autos</Link>
        <Link href="/changelog">Updates</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
      <p>
        Karachi Rush: Rickshaw Circuit Championship — a free browser 3D racing
        game.
      </p>
    </footer>
  );
}

