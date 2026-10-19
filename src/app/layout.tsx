import type { Metadata } from "next";
import { Archivo, Bagel_Fat_One, Source_Serif_4, Space_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

// Chunky rounded wordmark (à la Drowner), heavy grotesk headlines, glitchy mono labels.
const brand = Bagel_Fat_One({ variable: "--font-brand", subsets: ["latin", "latin-ext"], weight: "400" });
const sans = Archivo({ variable: "--font-sans", subsets: ["latin", "latin-ext"] });
const mono = Space_Mono({ variable: "--font-mono", subsets: ["latin", "latin-ext"], weight: ["400", "700"] });
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: site.name, template: `%s — ${site.name}` },
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${brand.variable} ${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
