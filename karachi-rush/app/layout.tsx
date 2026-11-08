import type { Metadata, Viewport } from "next";
import { Bungee, Noto_Naskh_Arabic, Teko } from "next/font/google";
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

// Just the one word on the start button.
const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: "400",
  variable: "--font-urdu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Karachi Rush — Auto-Rickshaw Racing",
  description:
    "Race a Karachi auto-rickshaw through Saddar, II Chundrigar and Clifton. Drift physics, nitro, three circuits of night racing — all in 3D in your browser.",
  icons: [
    { rel: "icon", type: "image/svg+xml", url: "/favicon.svg" },
    { rel: "icon", type: "image/x-icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/favicon.svg" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#120d18",
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
      className={`${bungee.variable} ${teko.variable} ${notoNaskh.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
