import { fetchSettings } from "@/lib/menu-data";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await fetchSettings();

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
            margin: "0 0 4px",
          }}
        >
          Shop &amp; Menu Settings
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Control your pizza brand name, menu heading title, and Google SEO metadata.
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
