import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto Rush 3D: Grand Prix | Auto-Rickshaw 3D Racing Game",
  description:
    "Race an authentic auto-rickshaw against 7 rivals through Gurugram Cyber City, Karachi Grand Prix, and Delhi Heritage Circuit in full 3D with drift physics, nitro boost, and dynamic night racing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
