import type { Metadata } from "next";
import DownloadAppClient from "@/components/DownloadAppClient";

export const metadata: Metadata = {
  title: "Download Mobile App (APK) | Sole What Admin",
  description:
    "Direct browser download for Sole What Admin Android APK (v1.0.9).",
};

export default function AdminDownloadAppPage() {
  return <DownloadAppClient />;
}

