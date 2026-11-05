import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto Rush: Karachi Grand Prix",
  description:
    "Auto Rush: Karachi Grand Prix — a Karachi-themed auto rickshaw rush game rebuilt with Three.js.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
