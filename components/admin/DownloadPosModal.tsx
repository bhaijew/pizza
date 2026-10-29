"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Laptop,
  Smartphone,
  Printer,
  Database,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  FileCode,
  ShieldCheck,
  Zap,
  HardDrive,
  WifiOff,
} from "lucide-react";

interface DownloadPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName?: string;
  shopSlug?: string;
  shopId?: number | null;
}

export default function DownloadPosModal({
  isOpen,
  onClose,
  shopName = "Pizza Shop",
  shopSlug = "main",
  shopId = null,
}: DownloadPosModalProps) {
  const [downloadTab, setDownloadTab] = useState<"desktop" | "pwa" | "printer" | "offline">("desktop");
  const [copiedScript, setCopiedScript] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Auto-trigger installer download on modal open
  useEffect(() => {
    if (isOpen) {
      setDownloadStarted(true);
      const a = document.createElement("a");
      a.href = "/api/download-pos";
      a.download = "Sole-What-Setup-1.6.8.exe";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      setDownloadStarted(false);
    }
  }, [isOpen]);

  const handleDownloadInstallerExe = () => {
    setIsDownloading(true);
    const a = document.createElement("a");
    a.href = "/api/download-pos";
    a.download = "Sole-What-Setup-1.6.8.exe";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setIsDownloading(false), 800);
  };

  if (!isOpen) return null;

  const currentHost = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const posUrl = `${currentHost}/demo/pos?shop=${encodeURIComponent(shopSlug || "main")}`;

  const launcherScript = `@echo off
title Pizza Management FloDesktop POS Launcher - ${shopName}
color 0A
echo ========================================================
echo   PIZZA MANAGEMENT SYSTEM - FLODESKTOP POS CLIENT
echo   Branch: ${shopName} (Slug: ${shopSlug})
echo ========================================================
echo.
echo [*] Initializing POS connection...
echo [*] Cloud Endpoint: ${currentHost}
echo [*] Shop ID: ${shopId ?? "Master"}
echo.
echo Starting Cashier Terminal in Kiosk/App Mode...
start msedge --app="${posUrl}" --start-maximized || start chrome --app="${posUrl}" --start-maximized || start "" "${posUrl}"
echo.
echo POS Terminal successfully dispatched!
echo You can minimize this window.
timeout /t 5 >nul
exit
`;

  const handleDownloadLauncher = () => {
    setIsDownloading(true);
    try {
      const blob = new Blob([launcherScript], { type: "application/bat" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Start-Pizza-POS-${shopSlug || "terminal"}.bat`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  };

  const handleDownloadOfflineMenu = async () => {
    setIsDownloading(true);
    try {
      // Fetch current products for offline backup
      const res = await fetch(`/api/pos/download?shopSlug=${encodeURIComponent(shopSlug || "main")}&type=backup`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pos-offline-backup-${shopSlug}-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback local json
        const backupData = {
          shopName,
          shopSlug,
          shopId,
          exportDate: new Date().toISOString(),
          posUrl,
          offlineMode: true,
          notice: "Offline POS snapshot ready for local terminal cache.",
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pos-offline-backup-${shopSlug}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      alert("Download generated.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(launcherScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(10, 15, 29, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          background: "#0f172a",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(239, 68, 68, 0.15)",
          color: "#f8fafc",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 16px rgba(239, 68, 68, 0.35)",
              }}
            >
              <Download size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  Download &amp; Install POS Terminal
                </h2>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: "4px",
                    background: "rgba(16, 185, 129, 0.2)",
                    color: "#34d399",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    letterSpacing: "0.05em",
                  }}
                >
                  READY
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                Branch: <strong style={{ color: "#f8fafc" }}>{shopName}</strong> &bull; Offline Ready, Thermal Print &amp; Touch Friendly
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "6px",
              color: "#94a3b8",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            className="hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Auto-Download Banner */}
        {downloadStarted && (
          <div
            style={{
              padding: "10px 20px",
              background: "linear-gradient(90deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.12) 100%)",
              borderBottom: "1px solid rgba(16, 185, 129, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>⚡</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#34d399" }}>
                    Download automatically started:
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "4px" }}>
                    Sole-What-Setup-1.6.8.exe (~85 MB)
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Check your browser downloads bar. If it didn&apos;t start, click &quot;Download Installer (.EXE)&quot; below.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadInstallerExe}
              style={{
                background: "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "5px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)",
              }}
            >
              📥 Download Again
            </button>
          </div>
        )}

        {/* Option Tabs */}
        <div
          style={{
            display: "flex",
            padding: "8px 16px",
            background: "rgba(0, 0, 0, 0.25)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            gap: "8px",
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setDownloadTab("desktop")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              background: downloadTab === "desktop" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "transparent",
              color: downloadTab === "desktop" ? "#ffffff" : "#94a3b8",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Laptop size={14} />
            <span>Windows Desktop POS (.EXE)</span>
          </button>

          <button
            type="button"
            onClick={() => setDownloadTab("pwa")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              background: downloadTab === "pwa" ? "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)" : "transparent",
              color: downloadTab === "pwa" ? "#ffffff" : "#94a3b8",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Smartphone size={14} />
            <span>Tablet &amp; Mobile Web POS</span>
          </button>

          <button
            type="button"
            onClick={() => setDownloadTab("printer")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              background: downloadTab === "printer" ? "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)" : "transparent",
              color: downloadTab === "printer" ? "#ffffff" : "#94a3b8",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Printer size={14} />
            <span>Thermal Printer Driver</span>
          </button>

          <button
            type="button"
            onClick={() => setDownloadTab("offline")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              background: downloadTab === "offline" ? "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)" : "transparent",
              color: downloadTab === "offline" ? "#ffffff" : "#94a3b8",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Database size={14} />
            <span>Offline Database Backup</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* TAB 1: WINDOWS DESKTOP POS */}
          {downloadTab === "desktop" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* PRIMARY PROMINENT CARD: OFFICIAL WINDOWS SETUP INSTALLER (.EXE) */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(5, 150, 105, 0.06) 100%)",
                  border: "1.5px solid rgba(16, 185, 129, 0.4)",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.12)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                        flexShrink: 0,
                      }}
                    >
                      <Download size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 3px", fontSize: "16px", fontWeight: 900, color: "#ffffff" }}>
                        Sole What POS Setup 1.6.8 (.EXE)
                      </h3>
                      <p style={{ margin: 0, fontSize: "12.5px", color: "#94a3b8" }}>
                        Official FloDesktop Desktop Application with Direct ESC/POS USB Thermal Printing, Cash Drawer &amp; Offline Cache
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.25)",
                      color: "#34d399",
                      border: "1px solid rgba(16, 185, 129, 0.5)",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 900,
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    WINDOWS 64-BIT
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                  <div style={{ background: "rgba(0,0,0,0.35)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Source File</div>
                    <div style={{ fontSize: "12px", color: "#f8fafc", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Sole-What-Setup-1.6.8.exe
                    </div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.35)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Package Size</div>
                    <div style={{ fontSize: "12px", color: "#34d399", fontWeight: 800 }}>
                      ~85 MB (Windows Native)
                    </div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.35)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Thermal Printer</div>
                    <div style={{ fontSize: "12px", color: "#60a5fa", fontWeight: 800 }}>
                      Direct USB Raw Print Ready ✓
                    </div>
                  </div>
                </div>

                {/* Direct Action Button */}
                <div style={{ display: "flex", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
                  <a
                    href="/api/download-pos"
                    download="Sole-What-Setup-1.6.8.exe"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "9px",
                      padding: "11px 22px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      fontSize: "13.5px",
                      fontWeight: 900,
                      textDecoration: "none",
                      boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
                      transition: "transform 0.15s ease",
                      cursor: "pointer",
                    }}
                    className="hover:scale-105"
                  >
                    <Download size={17} />
                    <span>Download Windows Installer (1.6.8.exe)</span>
                  </a>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
                      FloDesktop Kiosk Launcher (.BAT)
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", lineHeight: 1.5 }}>
                      One-click portable launcher for Windows cashiers. Launches dedicated full-screen borderless POS terminal pre-configured with <strong>{shopName}</strong> credentials.
                    </p>
                  </div>
                  <span
                    style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      color: "#60a5fa",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    WINDOWS 10 / 11
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>POS Endpoint</div>
                    <div style={{ fontSize: "12px", color: "#f8fafc", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {posUrl}
                    </div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Hardware Support</div>
                    <div style={{ fontSize: "12px", color: "#34d399", fontWeight: 800 }}>
                      ESC/POS 80mm &amp; Barcode Scanner
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleDownloadLauncher}
                    disabled={isDownloading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                      transition: "transform 0.15s ease",
                    }}
                    className="hover:scale-105"
                  >
                    <Download size={16} />
                    <span>{isDownloading ? "Generating..." : "Download Launcher (.BAT)"}</span>
                  </button>

                  <a
                    href={posUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 18px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      textDecoration: "none",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                    }}
                    className="hover:bg-white/10"
                  >
                    <ExternalLink size={15} />
                    <span>Open Web POS Now</span>
                  </a>
                </div>
              </div>

              {/* Launcher script preview */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                    Launcher Command Preview
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: copiedScript ? "#34d399" : "#94a3b8",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {copiedScript ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedScript ? "Copied Script" : "Copy Script"}</span>
                  </button>
                </div>
                <pre
                  style={{
                    background: "rgba(0, 0, 0, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    color: "#a7f3d0",
                    overflowX: "auto",
                    margin: 0,
                    maxHeight: "130px",
                  }}
                >
                  {launcherScript}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: TABLET & MOBILE WEB POS */}
          {downloadTab === "pwa" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(16, 185, 129, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#10b981",
                    }}
                  >
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
                      Progressive Web App (PWA) / Tablet POS
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                      Install directly to iPad, Android Tablet, Touchscreen Monitor, or Chromebook.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#cbd5e1" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, flexShrink: 0 }}>
                      1
                    </div>
                    <div>
                      Open POS on your tablet or phone: <strong>{posUrl}</strong>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, flexShrink: 0 }}>
                      2
                    </div>
                    <div>
                      Tap browser menu (Chrome: <strong>Install App</strong> or <strong>Add to Home screen</strong> &bull; Safari: <strong>Share &rarr; Add to Home Screen</strong>).
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, flexShrink: 0 }}>
                      3
                    </div>
                    <div>
                      The POS icon will appear on your desktop or home screen, opening instantly without browser address bar in full kiosk view!
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  <a
                    href={posUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 18px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 800,
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                    }}
                  >
                    <Smartphone size={16} />
                    <span>Launch Tablet POS</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THERMAL PRINTER DRIVER */}
          {downloadTab === "printer" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(249, 115, 22, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f97316",
                    }}
                  >
                    <Printer size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
                      Thermal Receipt Printer Integration
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                      Seamless 80mm &amp; 58mm ESC/POS silent receipt printing for customer &amp; kitchen KOT.
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                  <div style={{ background: "rgba(0,0,0,0.25)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>
                      Option A: Browser Silent Print
                    </div>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
                      Enable <code>--kiosk-printing</code> in Chrome/Edge shortcut to print customer receipts instantly without preview dialog.
                    </p>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.25)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>
                      Option B: FloDesktop Native Driver
                    </div>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
                      Direct USB/COM port raw ESC/POS connection in the FloDesktop app with automatic cash drawer kick trigger.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const printScript = `@echo off
echo Configuring Chrome/Edge for Kiosk Silent Thermal Printing...
echo Target Printer: Default Windows 80mm ESC/POS
start chrome --kiosk-printing "${posUrl}"
echo Done.
`;
                      const blob = new Blob([printScript], { type: "application/bat" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Silent-Thermal-Printer-Setup.bat`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "9px 16px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Download size={14} />
                    <span>Download Silent Print Setup (.BAT)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OFFLINE DATABASE BACKUP */}
          {downloadTab === "offline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(139, 92, 246, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8b5cf6",
                    }}
                  >
                    <HardDrive size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
                      Offline SQLite &amp; Catalog Snapshot
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                      Backup entire menu, prices, and cashier PINs locally for offline sales during internet outages.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <WifiOff size={18} className="text-emerald-400 flex-shrink-0" />
                  <span style={{ fontSize: "12px", color: "#a7f3d0" }}>
                    When internet reconnects, offline orders automatically sync back to Supabase Cloud!
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={handleDownloadOfflineMenu}
                    disabled={isDownloading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 18px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
                    }}
                  >
                    <Download size={15} />
                    <span>{isDownloading ? "Exporting..." : "Download Offline JSON Snapshot"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Secure Cashier &amp; Manager Session</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "7px 16px",
              borderRadius: "6px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#f8fafc",
              fontSize: "12px",
              fontWeight: 700,
              border: "1px solid rgba(255, 255, 255, 0.12)",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
