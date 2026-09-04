"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";

type Profile = { id: string; company_name: string; contact_name: string; role: string; country: string | null; created_at: string };

const ROLES = [
  { id: "buyer", label: "Buyer / Importer" },
  { id: "supplier", label: "Supplier / Exporter" },
  { id: "logistics", label: "Logistics / Shipping" },
  { id: "chamber", label: "Chamber of Commerce" },
  { id: "both", label: "Buyer & Supplier" },
];

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    // Real write, enforced by the "Users can update their own profile"
    // RLS policy in schema.sql — this call would fail if you somehow
    // tried to update someone else's row, not just because the UI
    // doesn't expose it.
    const { error } = await supabase
      .from("profiles")
      .update({ company_name: profile.company_name, contact_name: profile.contact_name, role: profile.role, country: profile.country })
      .eq("id", profile.id);
    setSaving(false);
    if (!error) setSaved(true);
  };

  if (loading) return <div style={{ background: "#0A0D12", minHeight: "100vh", color: "#9AA5B1", padding: 40 }}>Loading…</div>;
  if (!profile) return <div style={{ background: "#0A0D12", minHeight: "100vh", color: "#9AA5B1", padding: 40 }}>No profile found.</div>;

  return (
    <div style={{ background: "#0A0D12", minHeight: "100vh" }}>
      <Header active="Profile" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ color: "#EDEFF2", fontSize: 22, marginBottom: 4, fontFamily: "system-ui" }}>Your profile</h1>
        <p style={{ color: "#67707C", fontSize: 13, marginBottom: 24 }}>{email} · Member since {new Date(profile.created_at).toLocaleDateString()}</p>

        <label style={styles.label}>Company name</label>
        <input style={styles.input} value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} />

        <label style={styles.label}>Contact name</label>
        <input style={styles.input} value={profile.contact_name} onChange={(e) => setProfile({ ...profile, contact_name: e.target.value })} />

        <label style={styles.label}>Role</label>
        <select style={styles.input} value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })}>
          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>

        <label style={styles.label}>Country</label>
        <input style={styles.input} value={profile.country || ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />

        <button onClick={save} disabled={saving} style={styles.button}>{saving ? "Saving…" : "Save changes"}</button>
        {saved && <p style={{ color: "#3ECF8E", fontSize: 13, marginTop: 10 }}>Saved — this is now visible to other members in the directory.</p>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: { color: "#9AA5B1", fontSize: 12, marginTop: 16, marginBottom: 4, display: "block" },
  input: { width: "100%", background: "#1B212B", border: "1px solid #232A35", borderRadius: 6, padding: "10px 12px", color: "#EDEFF2", fontSize: 14, boxSizing: "border-box" },
  button: { marginTop: 24, background: "#2F80ED", color: "#fff", border: "none", borderRadius: 6, padding: "12px 24px", fontWeight: 600, cursor: "pointer" },
};
