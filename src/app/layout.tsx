import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";

const sourceSans = Source_Sans_3({ variable: "--font-source", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["500", "600", "700"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MasteryOS Math MVP",
  description: "AI-native Year 6 mathematics learning intelligence MVP",
  applicationName: "MasteryOS Math",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MasteryOS Math",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#10211f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${cormorant.variable} ${mono.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
