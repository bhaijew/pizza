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
        gap: "14px",
      }}
      className="admin-page-transition"
    >
      <div
        style={{
          position: "relative",
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer glowing pulsing ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(239, 68, 68, 0.2)",
            borderTopColor: "#ef4444",
            borderRightColor: "#f97316",
            animation: "navLinkSpinner 0.75s linear infinite",
          }}
        />
        {/* Brand Icon */}
        <span style={{ fontSize: "24px" }} className="admin-pulse-red">
          🍕
        </span>
      </div>

      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 800,
            color: "#64748b",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Loading View...
        </p>
      </div>
    </div>
  );
}
