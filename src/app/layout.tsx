import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import SuiteShell from "@/components/nav/SuiteShell";
import R3FBackground from "@/components/3d/R3FBackground";

// Premium serif — primary brand voice
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Technical micro-typography only (filenames, timestamps, kbd labels)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blubarber — Professional Video Editing for the Modern Barber",
  description: "High-end video editing platform for the modern barber.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body
        className="h-full"
        style={{
          background: '#0A0A0A',
          fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif',
          color: '#FFFFFF',
        }}
      >
        {/* Z-0: persistent R3F liquid-glass background */}
        <R3FBackground />

        {/* Z-10+: app content */}
        <div className="relative" style={{ zIndex: 10 }}>
          <SuiteShell>{children}</SuiteShell>
        </div>
      </body>
    </html>
  );
}
