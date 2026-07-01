import type { Metadata } from "next";
import { Archivo, Comfortaa, Inter } from "next/font/google";
// global styles (neobrutalist tokens, ink-outline utility, animations)
import "./globals.css";

// Comfortaa → the wordmark. Archivo (heavy) → oversized neobrutalist display
// headlines. Inter → landing body/UI copy (gives weight contrast against the
// heavy display font). All self-hosted via next/font (no runtime request, no
// FOUC) and exposed as CSS variables used by .font-brand / .font-display /
// .font-text. NOTE: this is additive — the legacy app pages still use
// font-sans → --sans and are unaffected (nothing applies .font-text there).
const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Munerate",
  description: "See what AI owes your site.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${comfortaa.variable} ${archivo.variable} ${inter.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
