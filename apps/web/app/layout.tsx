import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Reno", template: "%s — Reno" },
  description:
    "AI renovation and design demo app. Upload a photo of any space, pick a style, and generate a photorealistic redesign.",
  openGraph: {
    title: "Reno",
    description:
      "Upload a photo of any space, pick a style, and generate a photorealistic redesign.",
    siteName: "Reno",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav no-print" aria-label="Main">
          <Link href="/" className="logo">
            Re<span>no</span>
          </Link>
          <div className="nav-links">
            <Link href="/studio">Studio</Link>
            <Link href="/projects">Projects</Link>
          </div>
        </nav>
        <main className="main">{children}</main>
        <footer className="footer no-print">
          <p>
            Reno is MIT open source. Self-host with your own API keys — free
            forever.
          </p>
        </footer>
      </body>
    </html>
  );
}
