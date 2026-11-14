import type { Metadata, Viewport } from "next";
import { Bungee, Teko } from "next/font/google";
import "./globals.css";

// Wordmark + headings. Used once per screen so the condensed signage look
// stays special instead of turning into body copy.
const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

// Body, labels and HUD numerals. Teko's tall x-height keeps 14px readable and
// its tabular-ish digits stop the speedometer from jittering.
const teko = Teko({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Karachi Rickshaw Rush — Karachi Grand Prix",
  description:
    "Free in-browser 3D arcade racer. Drive Karachi's street vehicles against 7 rivals through real Karachi roads — Saddar, Burns Road, Sea View. Drift physics, nitro, no download, no sign-up.",
  icons: [
    { rel: "icon", type: "image/svg+xml", url: "/favicon.svg" },
    { rel: "icon", type: "image/x-icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/favicon.svg" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#14102B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bungee.variable} ${teko.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
