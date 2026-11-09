import type { Metadata } from "next";
import DownloadAppClient from "@/components/DownloadAppClient";

export const metadata: Metadata = {
  title: "Download Mobile App (APK) | Sole What Admin",
  description:
    "Direct browser download for Sole What Admin Android APK (v1.0.9). Manage live orders, verify online orders, and close daily registers in real time.",
};

export default function DownloadAppPage() {
  return <DownloadAppClient />;
}

