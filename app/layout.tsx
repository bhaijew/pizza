import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
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
      className={`${poppins.variable} ${geistMono.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
