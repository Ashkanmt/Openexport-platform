"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/chat");
    router.refresh();
  };

  return (
    <main style={styles.page}>
      <form style={styles.card} onSubmit={submit}>
        <h1 style={styles.h1}>Sign in</h1>
        <label style={styles.label}>Email</label>
        <input style={styles.input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.button} disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        <p style={styles.p}>New here? <a href="/signup" style={styles.link}>Create an account</a></p>
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0D12", padding: 24 },
  card: { width: "100%", maxWidth: 380, background: "#12161D", border: "1px solid #232A35", borderRadius: 10, padding: 32, display: "flex", flexDirection: "column", gap: 4 },
  h1: { color: "#EDEFF2", fontSize: 22, marginBottom: 12, fontFamily: "system-ui" },
  label: { color: "#9AA5B1", fontSize: 12, marginTop: 12, marginBottom: 4 },
  input: { background: "#1B212B", border: "1px solid #232A35", borderRadius: 6, padding: "10px 12px", color: "#EDEFF2", fontSize: 14 },
  button: { marginTop: 20, background: "#2F80ED", color: "#fff", border: "none", borderRadius: 6, padding: "12px 0", fontWeight: 600, cursor: "pointer" },
  p: { color: "#9AA5B1", fontSize: 13, marginTop: 14 },
  link: { color: "#5FA8FF" },
  error: { color: "#E5484D", fontSize: 13, marginTop: 10 },
};
