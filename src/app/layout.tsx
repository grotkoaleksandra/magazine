import type { Metadata } from "next";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${brand.variable} ${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
