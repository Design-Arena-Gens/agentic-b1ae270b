import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agentic Shorts Assistant",
  description:
    "Drop a YouTube video or channel link and instantly get 9:16 Shorts-ready ideas with timestamps, hooks, and captions.",
  openGraph: {
    title: "Agentic Shorts Assistant",
    description:
      "Drop a YouTube link, grab viral-ready Short ideas in seconds.",
    url: "https://agentic-b1ae270b.vercel.app",
    siteName: "Agentic Shorts Assistant",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentic Shorts Assistant",
    description: "Paste a YouTube link. Get viral Shorts ideas instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
