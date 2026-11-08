// Flat 24×24 line icons. Every fill/stroke is currentColor so a single CSS
// color on the button controls the whole glyph. No emoji anywhere in the UI.

type IconProps = {
  size?: number;
  className?: string;
};

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
  focusable: false as const,
});

export function CoinIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.4" />
    </svg>
  );
}

export function BoltIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M13.4 3 5.8 13.1h4.9L10 21l7.7-10.3h-5L13.4 3Z" />
    </svg>
  );
}

export function PauseIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M9.5 5v14M14.5 5v14" />
    </svg>
  );
}

export function PlayIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M7.5 4.8 19 12 7.5 19.2V4.8Z" />
    </svg>
  );
}

export function SpeakerIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4V9.5Z" />
      <path d="M15.6 9.2a4 4 0 0 1 0 5.6" />
      <path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
    </svg>
  );
}

export function SpeakerOffIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4V9.5Z" />
      <path d="M16 9.6 20.4 14M20.4 9.6 16 14" />
    </svg>
  );
}

export function WarningIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 4.2 21 19.6H3L12 4.2Z" />
      <path d="M12 10v4.1M12 17.2v.1" />
    </svg>
  );
}

export function GearIcon({ size = 20, className }: IconProps) {
  // Sliders, not a cog. At 18px a cog's teeth collapse into a sun glyph, and
  // the sun already means brightness elsewhere.
  return (
    <svg {...base(size, className)}>
      <path d="M4 9h5.6M15.2 9H20" />
      <circle cx="12.4" cy="9" r="2.2" />
      <path d="M4 15h1.6M10 15H20" />
      <circle cx="7.8" cy="15" r="2.2" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </svg>
  );
}
