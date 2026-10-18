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
  const [status, setStatus] = useState<SoleWhatStatus>(initialStatus);
  const [sessionId, setSessionId] = useState(initialStatus.sessionId || "");
  const [apiKey, setApiKey] = useState(initialStatus.apiKey || "");
  const [gatewayUrl, setGatewayUrl] = useState(initialStatus.gatewayUrl);

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
          message: `WhatsApp message dispatched successfully! Message ID: ${res.messageId}`,
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
  GATEWAY_URL: '${gatewayUrl}',
  SESSION_ID: '${sessionId || "rhs5o"}',
  API_KEY: '${apiKey || "wag_qF0HVpcLGTxuqGZvBLO1I2057gJUwiV8"}',
};

console.log('Connecting Pizza POS to Sole-What session:', CONFIG.SESSION_ID);
`;
    const blob = new Blob([bridgeCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sole-what-bridge-${shopSlug}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ─── Hero Banner ─── */}
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f172a 100%)",
          borderRadius: "16px",
          padding: "24px 28px",
          color: "#ffffff",
          boxShadow: "0 10px 30px rgba(6, 78, 59, 0.25)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
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
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: status.isOnline ? "#10b981" : "#f59e0b",
                  boxShadow: status.isOnline ? "0 0 10px #10b981" : "none",
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#34d399",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Sole-What WhatsApp Gateway Hub &bull; {status.isOnline ? "Online" : "Standby"}
              </span>
            </div>

            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Sole-What WhatsApp Automation
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#a7f3d0", maxWidth: "600px", lineHeight: 1.5 }}>
              Dispatch automatic order confirmations, live delivery tracking links, and marketing broadcasts directly to customer WhatsApp numbers using your dedicated Sole-What instance.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleDownloadBridge}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 16px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 800,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              className="hover:bg-white/20"
            >
              <Download size={14} />
              <span>Download Sole-What Bridge (.JS)</span>
            </button>

            <a
              href="https://solewhat-production.up.railway.app"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 16px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
              }}
            >
              <ExternalLink size={14} />
              <span>Open Sole-What Dashboard</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── Gateway Connection Status Row ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
        {/* Status Card 1 */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: status.isOnline ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              color: status.isOnline ? "#10b981" : "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Radio size={22} className={status.isOnline ? "animate-pulse" : ""} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
              Gateway Server
            </div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: status.isOnline ? "#34d399" : "#fbbf24" }}>
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
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: sessionId ? "rgba(59, 130, 246, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: sessionId ? "#3b82f6" : "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Smartphone size={22} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
              Branch WhatsApp Session
            </div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: sessionId ? "#60a5fa" : "#f87171" }}>
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
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "rgba(139, 92, 246, 0.15)",
              color: "#a78bfa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
              Desktop Folder Linked
            </div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "#c4b5fd" }}>
              sole_what-main
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              Ready for local &amp; cloud WhatsApp bot
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid: Configuration & Live Test ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
        {/* Left Column: Credentials & Settings */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Sole-What Session Setup
              </h2>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                Link your WhatsApp session from Sole-What to this pizza branch.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveCredentials} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
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
                  borderRadius: "8px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Each branch must use its own session ID to ensure no shared or wrong numbers.
              </span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
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
                  borderRadius: "8px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                Gateway Endpoint URL
              </label>
              <input
                type="text"
                value={gatewayUrl}
                readOnly
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(0, 0, 0, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#94a3b8",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {saveFeedback && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: saveFeedback.startsWith("Error") ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  border: saveFeedback.startsWith("Error") ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                  color: saveFeedback.startsWith("Error") ? "#f87171" : "#34d399",
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
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                transition: "transform 0.15s ease",
              }}
              className="hover:scale-102"
            >
              <CheckCircle2 size={16} />
              <span>{isPending ? "Saving..." : "Save WhatsApp Credentials"}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Interactive Test Message Sender */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(59, 130, 246, 0.15)",
                color: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Send Live Test WhatsApp Message
              </h2>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                Instantly verify your WhatsApp gateway delivers to mobile devices.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
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
                  borderRadius: "8px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                Test Message Text
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
            </div>

            {testResult && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: testResult.success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  border: testResult.success ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                  color: testResult.success ? "#34d399" : "#f87171",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                {testResult.success ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />}
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
                borderRadius: "8px",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                transition: "transform 0.15s ease",
              }}
              className="hover:scale-102"
            >
              <Send size={15} />
              <span>{isSendingTest ? "Dispatching WhatsApp..." : "Dispatch Test WhatsApp"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Automated WhatsApp Triggers Showcase ─── */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "22px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 4px", color: "#ffffff" }}>
              Active WhatsApp Event Triggers
            </h2>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
              These messages trigger automatically during live orders without cashier intervention.
            </p>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: "6px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            4 AUTOMATED WORKFLOWS
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "14px" }}>
          {/* Trigger 1 */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#60a5fa", fontWeight: 800, fontSize: "13px" }}>
              <Bell size={16} />
              <span>1. Order Placed Alert</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4 }}>
              Sent to customer instantly upon checkout with order items summary, total amount, and live tracker URL.
            </p>
          </div>

          {/* Trigger 2 */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f97316", fontWeight: 800, fontSize: "13px" }}>
              <ChefHat size={16} />
              <span>2. Kitchen Baking (KDS)</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4 }}>
              Alerts customer when pizza is placed in the oven, updating live progress bar to "Preparing".
            </p>
          </div>

          {/* Trigger 3 */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a855f7", fontWeight: 800, fontSize: "13px" }}>
              <Bike size={16} />
              <span>3. Rider Dispatched Alert</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4 }}>
              Sends WhatsApp to Rider (delivery location &amp; cash to collect) AND to Customer (with rider name &amp; phone).
            </p>
          </div>

          {/* Trigger 4 */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: 800, fontSize: "13px" }}>
              <CheckCircle2 size={16} />
              <span>4. Order Delivered / Review</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4 }}>
              Thanks the customer for their business and offers loyalty coupon code for their next pizza order.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Recent Customer Contacts Section ─── */}
      {recentCustomers.length > 0 && (
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={18} className="text-emerald-400" />
              <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Recent Customer Contacts ({recentCustomers.length})
              </h2>
            </div>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
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
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#f8fafc",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                className="hover:border-emerald-500/50 hover:bg-emerald-500/10"
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>{c.name}</div>
                  <div style={{ fontSize: "11px", color: "#34d399", fontFamily: "monospace" }}>{c.phone}</div>
                </div>
                <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", color: "#94a3b8" }}>
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
