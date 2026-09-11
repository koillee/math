import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Geist_Mono,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Great Haim's Math Mastery",
  description: "A personal math practice and learning app for Haim.",
  applicationName: "The Great Haim's Math Mastery",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Haim Math Mastery",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#10211f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${cormorant.variable} ${mono.variable}`}
    >
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
