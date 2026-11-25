import type { Metadata } from "next";
import DownloadAppClient from "@/components/DownloadAppClient";

export const metadata: Metadata = {
  title: "Download Apps (Android APK & Windows POS) | Sole What",
  description:
    "Direct browser download for Sole What Admin Android APK and Windows Native POS Setup (Sole-What-Setup-1.8.26.exe).",
};

export default function DownloadAppPage() {
  return <DownloadAppClient />;
}

