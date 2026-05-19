import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopBar } from "@/components/TopBar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoftLaunch",
  description: "AI co-editor for streamers — from raw footage to confident short-form clips.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <TooltipProvider>
          <TopBar />
          <main className="flex-1 min-h-0 flex flex-col">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
