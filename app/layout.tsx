import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pizza Shop — Order Online",
  description:
    "Browse our menu and order fresh, made-to-order pizzas online. Fast delivery and quality ingredients.",
  keywords: ["pizza", "order online", "pizza shop", "menu", "delivery"],
  openGraph: {
    title: "Pizza Shop — Order Online",
    description:
      "Fresh, made-to-order pizzas. Browse the menu and place your order.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${geistMono.variable}`}
    >
      <body style={{ minHeight: "100vh" }} suppressHydrationWarning>{children}</body>
    </html>
  );
}
