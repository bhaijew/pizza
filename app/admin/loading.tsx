import Image from "next/image";

export default function AdminLoading() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "55vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
      }}
      className="admin-page-transition"
    >
      <div
        style={{
          position: "relative",
          width: "68px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Ambient radial blur behind logo */}
        <div
          style={{
            position: "absolute",
            inset: "-10px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(239, 68, 68, 0.22) 0%, rgba(249, 115, 22, 0.08) 55%, transparent 75%)",
            filter: "blur(8px)",
            animation: "adminPulseGlow 2s infinite ease-in-out",
          }}
        />

        {/* Outer glowing pulsing rotating ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2.5px solid rgba(239, 68, 68, 0.15)",
            borderTopColor: "#ef4444",
            borderRightColor: "#f97316",
            boxShadow: "0 0 14px rgba(239, 68, 68, 0.25)",
            animation: "navLinkSpinner 0.8s cubic-bezier(0.4, 0.1, 0.4, 0.9) infinite",
          }}
        />

        {/* Sole What Brand Logo Card */}
        <div
          style={{
            position: "relative",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            padding: "5px",
          }}
          className="admin-pulse-red"
        >
          <Image
            src="/images/solewhat-icon.png"
            alt="Sole What Logo"
            width={40}
            height={40}
            priority
            style={{ objectFit: "contain", width: "100%", height: "100%" }}
          />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: "0 0 2px 0",
          }}
        >
          Sole What
        </p>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "#64748b",
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          Loading View...
        </p>
      </div>
    </div>
  );
}
