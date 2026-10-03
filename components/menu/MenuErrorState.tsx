"use client";

/**
 * MenuErrorState — shown on database fetch error or missing tables.
 * Clean square UI with SVG alert icon.
 */
interface MenuErrorStateProps {
  message?: string;
  tableMissing?: boolean;
  onRetry?: () => void;
}

export default function MenuErrorState({
  message,
  tableMissing,
  onRetry,
}: MenuErrorStateProps) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        background: "#ffffff",
        border: "1px solid #fecaca",
        borderRadius: 5,
        maxWidth: 520,
        margin: "24px auto",
      }}
      className="animate-fade-in"
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 4,
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {tableMissing ? (
        <>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "#0f172a",
              margin: "0 0 8px",
            }}
          >
            Database Tables Pending
          </h3>
          <p
            style={{ fontSize: 13, color: "#64748b", maxWidth: 420, margin: "0 0 16px", lineHeight: 1.6 }}
          >
            The menu tables (<code>categories</code> and <code>products</code>) have not yet been created in your Supabase project.
            Please run the SQL migration files in your Supabase Dashboard SQL Editor.
          </p>
        </>
      ) : (
        <>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "#0f172a",
              margin: "0 0 8px",
            }}
          >
            Unable to Load Menu
          </h3>
          <p
            style={{ fontSize: 13, color: "#64748b", maxWidth: 400, margin: "0 0 16px", lineHeight: 1.6 }}
          >
            {message || "We encountered an unexpected error while retrieving menu records from the database."}
          </p>
        </>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary"
          style={{
            padding: "8px 18px",
            borderRadius: 4,
            fontSize: 13,
            background: "#0f172a",
            borderColor: "#0f172a",
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
