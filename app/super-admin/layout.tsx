import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin Portal — Multi-Shop Network",
  description: "Manage multiple pizza shop branches, owner credentials, and platform access.",
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "125vh",
        zoom: 0.8,
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      {children}
    </div>
  );
}
