import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse — Take the Vital Signs of Your Operation",
  description: "Pulse helps CI and OE teams run structured workplace audits, track scores over time, and close corrective actions — without the paper, the spreadsheets, or the chasing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Caveat:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
