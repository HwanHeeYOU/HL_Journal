import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HL Journal",
  description: "Generative AI Journaling for mental wellness",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
