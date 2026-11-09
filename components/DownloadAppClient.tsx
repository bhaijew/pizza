"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SoleWhatLogo from "@/components/SoleWhatLogo";
import {
  Download,
  Smartphone,
  ShieldCheck,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

const APK_DIRECT_URL =
  "https://uadrrjrlhfttithjmdye.supabase.co/storage/v1/object/public/releases/Sole-What-Admin-v1.0.9.apk?download=Sole-What-Admin-v1.0.9.apk";
const APP_VERSION = "1.0.9";
const BUILD_NUM = "10";
const APK_SIZE = "36.2 MB";
const RELEASE_DATE = "Nov 09, 2026";
const THEME_STORAGE_KEY = "pizza_admin_download_theme";

export default function DownloadAppClient() {
  const [isDark, setIsDark] = useState(false); // Default clean white theme
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [apkFullUrl, setApkFullUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      setPageUrl(`${origin}/download-app`);
      setApkFullUrl(APK_DIRECT_URL);
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "dark") setIsDark(true);
        else if (saved === "light") setIsDark(false);
      } catch {}
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {}
  };

  const handleCopyLink = async () => {
    const target = pageUrl || (typeof window !== "undefined" ? window.location.href : "");
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShareWhatsApp = () => {
    const target = pageUrl || (typeof window !== "undefined" ? window.location.href : "");
    const text = encodeURIComponent(
      `Sole What Admin Android APK (v${APP_VERSION}):\n${target}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleTriggerDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 3500);
  };

  const qrImageUrl = apkFullUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=${encodeURIComponent(apkFullUrl)}`
    : "";

  // Clean theme palette
  const pageBg = isDark ? "bg-[#0b0f17] text-slate-100" : "bg-[#f8fafc] text-slate-900";
  const headerBg = isDark
    ? "bg-[#0b0f17]/95 border-slate-800"
    : "bg-white/95 border-slate-200";
  const cardBg = isDark
    ? "bg-[#111827] border-slate-800"
    : "bg-white border-slate-200 shadow-xs";
  const subCardBg = isDark
    ? "bg-[#0b0f17] border-slate-800"
    : "bg-slate-50 border-slate-200/80";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const bodyText = isDark ? "text-slate-300" : "text-slate-600";
  const headingText = isDark ? "text-white" : "text-slate-900";
  const borderCol = isDark ? "border-slate-800" : "border-slate-200";
  const secondaryBtn = isDark
    ? "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700"
    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300";

  return (
    <div className={`min-h-screen transition-colors duration-150 ${pageBg}`}>
      {/* Top Bar */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-sm ${headerBg}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SoleWhatLogo size={28} variant="shield" showGlow={false} />
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm tracking-tight ${headingText}`}>
                Sole What
              </span>
              <span className={`text-xs ${mutedText}`}>/</span>
              <span className={`text-xs font-medium ${bodyText}`}>
                Android Distribution
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Light / Dark Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{ borderRadius: "5px" }}
              className={`px-2.5 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${secondaryBtn}`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-slate-600" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <Link
              href="/admin"
              style={{ borderRadius: "5px" }}
              className={`px-3 py-1.5 text-xs font-semibold border transition-colors flex items-center gap-1.5 no-underline ${secondaryBtn}`}
            >
              <span>Web Console</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Primary Release Card */}
        <div
          style={{ borderRadius: "5px" }}
          className={`border p-6 sm:p-8 ${cardBg}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: App Identity & Download CTA */}
            <div className="md:col-span-7 space-y-5">
              <div className="flex items-start gap-3.5">
                <div
                  style={{ borderRadius: "5px" }}
                  className={`p-2.5 border shrink-0 ${subCardBg}`}
                >
                  <SoleWhatLogo size={40} variant="shield" showGlow={false} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${headingText}`}>
                      Sole What Admin
                    </h1>
                    <span
                      style={{ borderRadius: "5px" }}
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] font-semibold px-2 py-0.5"
                    >
                      v{APP_VERSION} ({BUILD_NUM})
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>
                    com.solepizza.pizza_admin &bull; Signed Production Release
                  </p>
                </div>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed ${bodyText}`}>
                Branch operations app for Android. Manage live POS orders, verify online customer orders, log daily expenses, and reconcile shift closings with background order notifications.
              </p>

              {/* Technical Specs Table */}
              <div
                style={{ borderRadius: "5px" }}
                className={`grid grid-cols-3 border divide-x text-xs ${subCardBg} ${
                  isDark ? "divide-slate-800" : "divide-slate-200"
                }`}
              >
                <div className="p-2.5">
                  <div className={`text-[11px] ${mutedText}`}>Package Size</div>
                  <div className={`font-semibold mt-0.5 ${headingText}`}>{APK_SIZE}</div>
                </div>
                <div className="p-2.5">
                  <div className={`text-[11px] ${mutedText}`}>Platform</div>
                  <div className={`font-semibold mt-0.5 ${headingText}`}>Android 7.0+</div>
                </div>
                <div className="p-2.5">
                  <div className={`text-[11px] ${mutedText}`}>Updated</div>
                  <div className={`font-semibold mt-0.5 ${headingText}`}>{RELEASE_DATE}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <a
                  href={APK_DIRECT_URL}
                  download="Sole-What-Admin-v1.0.9.apk"
                  onClick={handleTriggerDownload}
                  style={{ borderRadius: "5px" }}
                  className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm px-5 py-3 transition-colors flex items-center justify-center gap-2 no-underline cursor-pointer"
                >
                  <Download size={17} />
                  <span>
                    {downloading
                      ? "Starting APK Download..."
                      : `Download APK (v${APP_VERSION} • ${APK_SIZE})`}
                  </span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{ borderRadius: "5px" }}
                    className={`py-2 px-3 text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${secondaryBtn}`}
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Page Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    style={{ borderRadius: "5px" }}
                    className={`py-2 px-3 text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${secondaryBtn}`}
                  >
                    <ExternalLink size={14} />
                    <span>Send via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Clean QR Code Panel */}
            <div className="md:col-span-5">
              <div
                style={{ borderRadius: "5px" }}
                className={`border p-5 flex flex-col items-center text-center ${subCardBg}`}
              >
                <div className={`flex items-center gap-1.5 text-xs font-semibold mb-3 ${headingText}`}>
                  <QrCode size={14} />
                  <span>Scan with Phone Camera</span>
                </div>

                <div
                  style={{ borderRadius: "5px" }}
                  className="bg-white p-2.5 border border-slate-200 w-44 h-44 flex items-center justify-center"
                >
                  {qrImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrImageUrl}
                      alt="Download APK QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Generating QR...</span>
                  )}
                </div>

                <p className={`text-[11px] mt-3 leading-normal ${mutedText}`}>
                  Point your Android camera at the QR code to download the APK directly to your device.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Info Row: Release Notes & Installation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What's in v1.0.9 */}
          <div style={{ borderRadius: "5px" }} className={`border p-5 ${cardBg}`}>
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-3.5 ${mutedText}`}>
              Release Highlights (v{APP_VERSION})
            </h2>
            <ul className={`space-y-2.5 text-xs ${bodyText}`}>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className={headingText}>Background Order Alerts:</strong> Foreground service notifies staff with sound &amp; vibration even when the app is closed.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className={headingText}>Real-Time Online Verification:</strong> Instant sync between mobile Verify tab, Web Live Board, and Kitchen KDS.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className={headingText}>Next-Shift Rollover Sync:</strong> Closing the register immediately locks the completed shift and opens the next shift at Rs. 0.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className={headingText}>Refined Typography &amp; Cards:</strong> Google Sans typography and responsive status badges on order cards.
                </span>
              </li>
            </ul>
          </div>

          {/* Installation Steps */}
          <div style={{ borderRadius: "5px" }} className={`border p-5 ${cardBg}`}>
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-3.5 ${mutedText}`}>
              Installation Instructions
            </h2>
            <ol className={`space-y-2.5 text-xs ${bodyText}`}>
              <li className="flex items-start gap-2.5">
                <span
                  style={{ borderRadius: "5px" }}
                  className={`w-5 h-5 shrink-0 flex items-center justify-center text-[11px] font-bold border ${subCardBg} ${headingText}`}
                >
                  1
                </span>
                <span>
                  If an older version is installed and Android shows <em>&ldquo;App not installed&rdquo;</em>, uninstall the previous version first.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span
                  style={{ borderRadius: "5px" }}
                  className={`w-5 h-5 shrink-0 flex items-center justify-center text-[11px] font-bold border ${subCardBg} ${headingText}`}
                >
                  2
                </span>
                <span>
                  Tap <strong>Download APK</strong> above, open the downloaded file, and enable <em>&ldquo;Allow from this source&rdquo;</em> if prompted by your browser.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span
                  style={{ borderRadius: "5px" }}
                  className={`w-5 h-5 shrink-0 flex items-center justify-center text-[11px] font-bold border ${subCardBg} ${headingText}`}
                >
                  3
                </span>
                <span>
                  Sign in with your branch PIN or password and allow <strong>Notifications</strong> so background order alerts stay active.
                </span>
              </li>
            </ol>

            <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${borderCol} ${mutedText}`}>
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" />
                Verified Internal APK
              </span>
              <a
                href={APK_DIRECT_URL}
                download="Sole-What-Admin-v1.0.9.apk"
                className="font-semibold text-red-600 hover:underline flex items-center gap-1"
              >
                <Smartphone size={12} />
                <span>Direct APK Link</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
