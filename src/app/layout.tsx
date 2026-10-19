import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono, Source_Serif_4 } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

// Geometric, code-like wordmark and labels (Martian Mono), grotesk headlines, serif for long reading.
const brand = Martian_Mono({ variable: "--font-brand", subsets: ["latin", "latin-ext"], axes: ["wdth"] });
const sans = Archivo({ variable: "--font-sans", subsets: ["latin", "latin-ext"] });
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: site.name, template: `%s — ${site.name}` },
  description: site.description,
};

// Paint the phone's status bar / browser chrome in the site's black so the page never shows through above the menu.
export const viewport: Viewport = { themeColor: "#0e0d0b", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${brand.variable} ${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
