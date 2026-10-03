/**
 * ImagePlaceholder — shown when a product has no image_url in the database.
 * Crisp square geometric SVG icon.
 */
export default function ImagePlaceholder() {
  return (
    <div
      className="img-placeholder"
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        minHeight: 140,
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          background: "#e2e8f0",
          color: "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <polygon points="12 2 22 20 2 20 12 2" />
          <circle cx="12" cy="14" r="1.5" />
        </svg>
      </div>
      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        No image
      </span>
    </div>
  );
}
