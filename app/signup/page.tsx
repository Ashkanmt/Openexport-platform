"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ROLES = [
  { id: "buyer", label: "Buyer / Importer" },
  { id: "supplier", label: "Supplier / Exporter" },
  { id: "logistics", label: "Logistics / Shipping" },
  { id: "chamber", label: "Chamber of Commerce" },
  { id: "both", label: "Buyer & Supplier" },
];

export default function SignupPage() {
  const [form, setForm] = useState({
    companyName: "", contactName: "", email: "", password: "", country: "", role: "buyer",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const supabase = createClient();
    // This is a real call — Supabase actually creates the account and
    // sends a real confirmation email (via Supabase's built-in email
    // service by default; you can swap in your own SMTP/Resend/SendGrid
    // in the Supabase dashboard under Authentication → Email Templates
    // for better deliverability once you have real volume).
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          company_name: form.companyName,
          contact_name: form.contactName,
          role: form.role,
          country: form.country,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Check your email</h1>
          <p style={styles.p}>
            We sent a real confirmation link to <b>{form.email}</b>. Click it to activate your
            account, then come back and sign in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <form style={styles.card} onSubmit={submit}>
        <h1 style={styles.h1}>Create your account</h1>
        <label style={styles.label}>I am a…</label>
        <select style={styles.input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <label style={styles.label}>Company name</label>
        <input style={styles.input} required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
        <label style={styles.label}>Your name</label>
        <input style={styles.input} required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
        <label style={styles.label}>Country</label>
        <input style={styles.input} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <label style={styles.label}>Email</label>
        <input style={styles.input} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.button} disabled={status === "loading"}>
          {status === "loading" ? "Creating account…" : "Create account"}
        </button>
        <p style={styles.p}>Already have an account? <a href="/login" style={styles.link}>Sign in</a></p>
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0D12", padding: 24 },
  card: { width: "100%", maxWidth: 420, background: "#12161D", border: "1px solid #232A35", borderRadius: 10, padding: 32, display: "flex", flexDirection: "column", gap: 4 },
  h1: { color: "#EDEFF2", fontSize: 22, marginBottom: 12, fontFamily: "system-ui" },
  label: { color: "#9AA5B1", fontSize: 12, marginTop: 12, marginBottom: 4 },
  input: { background: "#1B212B", border: "1px solid #232A35", borderRadius: 6, padding: "10px 12px", color: "#EDEFF2", fontSize: 14 },
  button: { marginTop: 20, background: "#2F80ED", color: "#fff", border: "none", borderRadius: 6, padding: "12px 0", fontWeight: 600, cursor: "pointer" },
  p: { color: "#9AA5B1", fontSize: 13, marginTop: 14 },
  link: { color: "#5FA8FF" },
  error: { color: "#E5484D", fontSize: 13, marginTop: 10 },
};
