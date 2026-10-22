"use client";

import { useState, useTransition } from "react";
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Download,
  Users,
  Settings,
  Flame,
  Radio,
  FileCode,
  Sparkles,
  Bell,
  Clock,
  Bike,
  ChefHat,
  Lock,
} from "lucide-react";
import {
  type SoleWhatStatus,
  updateSoleWhatCredentials,
  sendSoleWhatTestMessage,
} from "@/lib/sole-what-actions";
import SoleWhatLogo from "@/components/SoleWhatLogo";

interface SoleWhatManagerProps {
  initialStatus: SoleWhatStatus;
  shopName?: string;
  shopSlug?: string;
  recentCustomers?: { phone: string; name: string; orderCount: number; lastOrder: string }[];
}

export default function SoleWhatManager({
  initialStatus,
  shopName = "Pizza Shop",
  shopSlug = "main",
  recentCustomers = [],
}: SoleWhatManagerProps) {
  const defaultMasterKey = "wag_8iBNQyfmDmSpZEvF0SsL7rtM2UzNzJ8M";
  const [status, setStatus] = useState<SoleWhatStatus>(initialStatus);
  const [sessionId, setSessionId] = useState(initialStatus.sessionId || "");
  const [apiKey, setApiKey] = useState(
    initialStatus.apiKey && initialStatus.apiKey !== "wag_qF0HVpcLGTxuqGZvBLO1I2057gJUwiV8"
      ? initialStatus.apiKey
      : defaultMasterKey
  );
  const normalizedGatewayUrl = (
    initialStatus.gatewayUrl && !initialStatus.gatewayUrl.includes("solewhat-production.up.railway.app")
      ? initialStatus.gatewayUrl
      : "https://solewhat-production-33f6.up.railway.app"
  );
  const [gatewayUrl, setGatewayUrl] = useState(normalizedGatewayUrl);

  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    `Salam! 🍕 Pizza Alert from ${shopName}: Your order has been received and is being prepared in the kitchen. Track live: http://localhost:3000/track/1001`
  );
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [copiedBridge, setCopiedBridge] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback(null);

    const formData = new FormData();
    formData.append("whatsapp_session_id", sessionId);
    formData.append("whatsapp_api_key", apiKey);

    startTransition(async () => {
      const res = await updateSoleWhatCredentials(formData);
      if (res.success) {
        setSaveFeedback("Sole-What session credentials saved successfully!");
        setStatus((prev) => ({
          ...prev,
          configured: !!sessionId.trim(),
          sessionId: sessionId.trim() || null,
          apiKey: apiKey.trim() || null,
        }));
        setTimeout(() => setSaveFeedback(null), 4000);
      } else {
        setSaveFeedback(`Error: ${res.error}`);
      }
    });
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      setTestResult({ success: false, message: "Please enter a recipient phone number (e.g. 03001234567)" });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendSoleWhatTestMessage(testPhone, testMessage);
      if (res.success) {
        setTestResult({
          success: true,
          message: `✓ WhatsApp message delivered successfully to ${testPhone}! (ID: ${res.messageId})`,
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || "Failed to send WhatsApp message via Sole-What gateway.",
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Gateway communication error" });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleDownloadBridge = () => {
    const bridgeCode = `// Sole-What Local Connector Bridge for ${shopName}
const https = require('https');
const http = require('http');

const CONFIG = {
  shopSlug: "${shopSlug}",
  sessionId: "${sessionId || 'rhs5o'}",
  apiKey: "${apiKey || 'wag_...'}",
  gatewayUrl: "${gatewayUrl}",
  port: 8089,
};

console.log("⚡ [Sole-What Bridge] Starting local WhatsApp connector on port", CONFIG.port);
console.log("⚡ [Sole-What Bridge] Target Gateway:", CONFIG.gatewayUrl);
console.log("⚡ [Sole-What Bridge] Active Session:", CONFIG.sessionId);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: "online", branch: CONFIG.shopSlug, session: CONFIG.sessionId }));
});

server.listen(CONFIG.port, () => {
  console.log(\`✅ Sole-What connector bridge running at http://localhost:\${CONFIG.port}\`);
});
`;

    const blob = new Blob([bridgeCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sole-what-connector-${shopSlug}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* ─── Hero Banner (White / Light Emerald UI) ─── */}
      <div
        style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 45%, #ffffff 100%)",
          borderRadius: "5px",
          padding: "24px 28px",
          color: "#0f172a",
          boxShadow: "0 4px 20px rgba(16, 185, 129, 0.08)",
          border: "1px solid #bbf7d0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-20px",
            top: "-20px",
            width: "180px",
            height: "180px",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ flexShrink: 0, marginTop: "4px" }}>
              <SoleWhatLogo size={48} variant="badge" showGlow={true} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: status.isOnline ? "#10b981" : "#f59e0b",
                    boxShadow: status.isOnline ? "0 0 8px #10b981" : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#059669",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Sole-What WhatsApp Gateway Hub &bull; {status.isOnline ? "Online" : "Standby"}
                </span>
              </div>

              <h1 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 6px", color: "#0f172a", letterSpacing: "-0.02em" }}>
                Sole-What WhatsApp Automation
              </h1>
              <p style={{ margin: 0, fontSize: "13px", color: "#475569", maxWidth: "620px", lineHeight: 1.5 }}>
                Dispatch automatic order confirmations, live delivery tracking links, and marketing broadcasts directly to customer WhatsApp numbers using your dedicated Sole-What instance.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleDownloadBridge}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 15px",
                borderRadius: "5px",
                background: "#ffffff",
                color: "#1e293b",
                fontSize: "12px",
                fontWeight: 800,
                border: "1px solid #cbd5e1",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                transition: "all 0.15s ease",
              }}
              className="hover:bg-slate-50 hover:border-slate-400"
            >
              <Download size={14} className="text-emerald-600" />
              <span>Download Sole-What Bridge (.JS)</span>
            </button>

            <a
              href="https://solewhat-production-33f6.up.railway.app/dashboard"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 16px",
                borderRadius: "5px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(16, 185, 129, 0.35)",
              }}
              className="hover:opacity-95"
            >
              <ExternalLink size={14} />
              <span>Open Sole-What Dashboard</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── Gateway Connection Status Row (White Cards) ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "16px" }}>
        {/* Status Card 1 */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "5px",
              background: status.isOnline ? "#ecfdf5" : "#fffbeb",
              color: status.isOnline ? "#059669" : "#d97706",
              border: status.isOnline ? "1px solid #a7f3d0" : "1px solid #fde68a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Radio size={20} className={status.isOnline ? "animate-pulse" : ""} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Gateway Server
            </div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: status.isOnline ? "#059669" : "#d97706" }}>
              {status.isOnline ? "Connected & Active" : "Standby / Reachable"}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              {status.latencyMs ? `${status.latencyMs}ms Latency` : "Railway Cloud Cluster"}
            </div>
          </div>
        </div>

        {/* Status Card 2 */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "5px",
              background: sessionId ? "#eff6ff" : "#fef2f2",
              color: sessionId ? "#2563eb" : "#dc2626",
              border: sessionId ? "1px solid #bfdbfe" : "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Smartphone size={20} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Branch WhatsApp Session
            </div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: sessionId ? "#1d4ed8" : "#dc2626" }}>
              {sessionId ? `Session: ${sessionId}` : "Not Configured"}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              Multi-tenant isolated number
            </div>
          </div>
        </div>

        {/* Status Card 3 */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "5px",
              background: "#f5f3ff",
              color: "#7c3aed",
              border: "1px solid #ddd6fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Desktop Folder Linked
            </div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#6d28d9" }}>
              sole_what-main
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              Ready for local &amp; cloud WhatsApp bot
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid: Configuration & Live Test (White Cards) ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "20px" }}>
        {/* Left Column: Credentials & Settings */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "5px",
                background: "#ecfdf5",
                color: "#059669",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Sole-What Session Setup
              </h2>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Link your WhatsApp session from Sole-What to this pizza branch.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveCredentials} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                WhatsApp Session ID (e.g. rhs5o or branch slug)
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="e.g. rhs5o, branch-1, pizza-main"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "5px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                className="focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Each branch must use its own session ID to ensure no shared or wrong numbers.
              </span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Sole-What Gateway API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="wag_..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "5px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                className="focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                  Gateway Endpoint URL
                </label>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#16a34a",
                    background: "#dcfce7",
                    border: "1px solid #bbf7d0",
                    padding: "2px 7px",
                    borderRadius: "4px",
                  }}
                >
                  ⚡ LIVE AUTOMATION CLOUD
                </span>
              </div>
              <input
                type="text"
                value={gatewayUrl}
                readOnly
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "5px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "13px",
                  fontWeight: 700,
                  boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                Active Railway Gateway: <code style={{ color: "#059669", fontWeight: 700 }}>{gatewayUrl}</code>
              </div>
            </div>

            {saveFeedback && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "5px",
                  background: saveFeedback.startsWith("Error") ? "#fef2f2" : "#f0fdf4",
                  border: saveFeedback.startsWith("Error") ? "1px solid #fecaca" : "1px solid #bbf7d0",
                  color: saveFeedback.startsWith("Error") ? "#dc2626" : "#15803d",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {saveFeedback}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "11px 18px",
                borderRadius: "5px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
                transition: "transform 0.15s ease",
              }}
              className="hover:scale-[1.01]"
            >
              <CheckCircle2 size={16} />
              <span>{isPending ? "Saving..." : "Save WhatsApp Credentials"}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Interactive Test Message Sender (White Card) */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "5px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Send Live Test WhatsApp Message
              </h2>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Instantly verify your WhatsApp gateway delivers to mobile devices.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Recipient Phone Number (Pakistani / International)
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="03001234567 or +923001234567"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "5px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                className="focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Test Message Text
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "5px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
                className="focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            {testResult && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "5px",
                  background: testResult.success ? "#f0fdf4" : "#fef2f2",
                  border: testResult.success ? "1px solid #bbf7d0" : "1px solid #fecaca",
                  color: testResult.success ? "#15803d" : "#b91c1c",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                {testResult.success ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" /> : <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSendTest}
              disabled={isSendingTest}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "11px 18px",
                borderRadius: "5px",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(59, 130, 246, 0.3)",
                transition: "transform 0.15s ease",
              }}
              className="hover:scale-[1.01]"
            >
              <Send size={15} />
              <span>{isSendingTest ? "Dispatching WhatsApp..." : "Dispatch Test WhatsApp"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Automated WhatsApp Triggers Showcase (White Card) ─── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "5px",
          padding: "22px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>
              Active WhatsApp Event Triggers
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              These messages trigger automatically during live orders without cashier intervention.
            </p>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: "5px",
              background: "#ecfdf5",
              color: "#059669",
              border: "1px solid #bbf7d0",
            }}
          >
            4 AUTOMATED WORKFLOWS
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "14px" }}>
          {/* Trigger 1 */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563eb", fontWeight: 800, fontSize: "13px" }}>
              <Bell size={16} />
              <span>1. Order Placed Alert</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: 1.45 }}>
              Sent to customer instantly upon checkout with order items summary, total amount, and live tracker URL.
            </p>
          </div>

          {/* Trigger 2 */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ea580c", fontWeight: 800, fontSize: "13px" }}>
              <ChefHat size={16} />
              <span>2. Kitchen Baking (KDS)</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: 1.45 }}>
              Alerts customer when pizza is placed in the oven, updating live progress bar to "Preparing".
            </p>
          </div>

          {/* Trigger 3 */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7c3aed", fontWeight: 800, fontSize: "13px" }}>
              <Bike size={16} />
              <span>3. Rider Dispatched Alert</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: 1.45 }}>
              Sends WhatsApp to Rider (delivery location &amp; cash to collect) AND to Customer (with rider name &amp; phone).
            </p>
          </div>

          {/* Trigger 4 */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: 800, fontSize: "13px" }}>
              <CheckCircle2 size={16} />
              <span>4. Order Delivered / Review</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: 1.45 }}>
              Thanks the customer for their business and offers loyalty coupon code for their next pizza order.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Recent Customer Contacts Section (White Card) ─── */}
      {recentCustomers.length > 0 && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={18} className="text-emerald-600" />
              <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Recent Customer Contacts ({recentCustomers.length})
              </h2>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              Click any contact to auto-fill recipient phone
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "10px" }}>
            {recentCustomers.map((c) => (
              <button
                key={c.phone}
                type="button"
                onClick={() => setTestPhone(c.phone)}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#0f172a",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                className="hover:border-emerald-500 hover:bg-emerald-50"
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>{c.name}</div>
                  <div style={{ fontSize: "11px", color: "#059669", fontFamily: "monospace", fontWeight: 600 }}>{c.phone}</div>
                </div>
                <span style={{ fontSize: "10px", background: "#e2e8f0", padding: "2px 6px", borderRadius: "5px", color: "#475569", fontWeight: 600 }}>
                  {c.orderCount} ord
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
