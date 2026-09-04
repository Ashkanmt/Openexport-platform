import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/chat");

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0A0D12", color: "#EDEFF2", fontFamily: "system-ui", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700 }}>
        <span style={{ color: "#F2A93B" }}>◆</span> OpenExport
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", maxWidth: 480 }}>Chat in real time with trade partners worldwide</h1>
      <p style={{ color: "#9AA5B1", maxWidth: 420, textAlign: "center" }}>
        Real accounts, a real member directory, and live messaging with buyers, suppliers, logistics
        providers and chambers of commerce — the rest of the platform is on its way.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <a href="/signup" style={{ background: "#2F80ED", color: "#fff", padding: "12px 24px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>Create account</a>
        <a href="/login" style={{ border: "1px solid #333D4C", color: "#EDEFF2", padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}>Sign in</a>
      </div>
    </main>
  );
}
