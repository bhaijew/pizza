/**
 * MenuSkeleton — square placeholder skeleton shown while Supabase data is loading.
 */
export default function MenuSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading menu">
      {/* Category tabs skeleton */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[90, 110, 85, 120, 95].map((w, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ width: w, height: 36, borderRadius: 4 }}
          />
        ))}
      </div>

      {/* Product grid skeleton — 2 products per row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "clamp(12px, 2vw, 24px)",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "#ffffff",
              borderRadius: 5,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {/* Image skeleton */}
            <div
              className="skeleton"
              style={{ width: "100%", aspectRatio: "16/10", borderRadius: 0 }}
            />
            <div style={{ padding: "14px 16px 16px" }}>
              {/* Badge */}
              <div className="skeleton" style={{ width: 60, height: 18, marginBottom: 10, borderRadius: 3 }} />
              {/* Title */}
              <div className="skeleton" style={{ width: "75%", height: 18, marginBottom: 8, borderRadius: 3 }} />
              {/* Description */}
              <div className="skeleton" style={{ width: "100%", height: 12, marginBottom: 4, borderRadius: 2 }} />
              <div className="skeleton" style={{ width: "60%", height: 12, marginBottom: 16, borderRadius: 2 }} />
              {/* Price + button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 3 }} />
                <div className="skeleton" style={{ width: 50, height: 28, borderRadius: 4 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
