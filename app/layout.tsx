import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.solewhat.store"),
  title: {
    default: "SoleWhat — All-in-One Restaurant & Retail POS, WhatsApp AI Automation & Cloud Menus",
    template: "%s | SoleWhat",
  },
  description:
    "SoleWhat is the modern all-in-one POS and retail management platform. Multi-branch cloud POS, automated WhatsApp AI ordering, real-time kitchen display (KDS), high-speed ESC/POS thermal printing, and branded online storefronts.",
  keywords: [
    "SoleWhat",
    "SoleWhat POS",
    "Restaurant POS System",
    "Retail POS Software",
    "WhatsApp AI Ordering",
    "WhatsApp Food Ordering Bot",
    "Kitchen Display System KDS",
    "Thermal Printer POS ESC POS",
    "Multi-branch Restaurant POS",
    "Online Food Ordering System",
    "FloDesktop POS",
    "Cloud POS Pakistan",
    "Table QR Ordering",
  ],
  authors: [{ name: "SoleWhat Technologies", url: "https://www.solewhat.store" }],
  creator: "SoleWhat",
  publisher: "SoleWhat",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "SoleWhat — All-in-One Restaurant & Retail POS, WhatsApp AI & Cloud Menus",
    description:
      "Modern omnichannel POS platform with automated 24/7 WhatsApp AI order taking, live kitchen display, high-speed thermal receipt printing, and dedicated cloud storefronts.",
    url: "https://www.solewhat.store",
    siteName: "SoleWhat",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoleWhat — Restaurant POS, WhatsApp AI & Cloud Menus",
    description:
      "All-in-one POS & restaurant retail operating system with automated WhatsApp AI order assistant and real-time operations.",
  },
  alternates: {
    canonical: "https://www.solewhat.store",
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
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${geistMono.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
