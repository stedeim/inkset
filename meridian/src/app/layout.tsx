import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian",
  description: "A private membership for your health and performance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
