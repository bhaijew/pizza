/**
 * MenuEmptyState — shown when the catalog has no items (or filtered category has no items).
 * Clean square UI with SVG vector graphics.
 */
interface MenuEmptyStateProps {
  message?: string;
}

export default function MenuEmptyState({
  message = "No menu items available right now.",
}: MenuEmptyStateProps) {
  return (
    <div
      role="status"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 20px",
        textAlign: "center",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 5,
        maxWidth: 480,
        margin: "20px auto",
      }}
      className="animate-fade-in"
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 4,
          background: "#f1f5f9",
          border: "1px solid #cbd5e1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          marginBottom: 16,
        }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>

      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 17,
          color: "#0f172a",
          margin: "0 0 6px",
        }}
      >
        {message}
      </h3>

      <p style={{ fontSize: 13, color: "#64748b", maxWidth: 340, margin: 0, lineHeight: 1.6 }}>
        Check back shortly or choose a different category tab to browse available items.
      </p>
    </div>
  );
}
