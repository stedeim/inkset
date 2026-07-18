import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deimira — The Agentic Vibe-Coding Platform",
  description:
    "Describe your idea. A team of AI agents designs, codes, tests, and deploys a production-ready app for you. No coding required.",
  metadataBase: new URL("https://deimira.app"),
  openGraph: {
    title: "Deimira — Build full-stack apps with AI",
    description:
      "From prompt to production. A coordinated team of AI agents ships real apps built with React, FastAPI, and MongoDB.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} dark`}>
      <body>{children}</body>
    </html>
  );
}
