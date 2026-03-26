import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Sora, Unbounded } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-cc-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  variable: "--font-cc-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-cc-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OpSync — Command Center",
  description: "Operations cockpit — internal CRM and agent automations",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#060A14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${unbounded.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
