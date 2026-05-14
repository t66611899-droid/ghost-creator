import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik } from "next/font/google";
import "./globals.css";
import SuiteShell from "@/components/nav/SuiteShell";
import R3FBackground from "@/components/3d/R3FBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew"],
  weight: ["700", "900"],
});

export const metadata: Metadata = {
  title: "Ghost Creator",
  description: "AI-powered video content creation for local businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} h-full antialiased dark`}
    >
      <body className="h-full" style={{ background: '#0A0A0A' }}>
        {/* Z-0: persistent R3F scroll-aware background */}
        <R3FBackground />

        {/* Z-10+: app content */}
        <div className="relative" style={{ zIndex: 10 }}>
          <SuiteShell>{children}</SuiteShell>
        </div>
      </body>
    </html>
  );
}
