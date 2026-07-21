import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import UmamiAnalytics from "@/components/UmamiAnalytics";
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
  title: "OneFarmTech | Fresh food supply",
  description:
    "OneFarmTech is a Fresh food supply platform for Nigerian bulk buyers, restaurants, retailers, caterers, and large households.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
      <UmamiAnalytics />
    </html>
  );
}
