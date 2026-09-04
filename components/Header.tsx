"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Chat and Profile are backed by the real Supabase database — real
// accounts, real rows, real security policies. Marketplace links to
// a real page too, but everything inside it (suppliers, RFQs, prices,
// chambers) is still the original prototype's demo data, not yet
// connected to this database — tagged "demo" rather than hidden, so
// that's honest rather than either missing or silently pretending.
const NAV_ITEMS = [
  { label: "Chat", href: "/chat", live: true },
  { label: "Profile", href: "/profile", live: true },
  { label: "Marketplace", href: "/marketplace", live: true, demo: true },
];

export default function Header({ active }: { active?: string }) {
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <a href="/" style={styles.brand}>
          <span style={styles.brandMark}>◆</span> OpenExport
        </a>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{ ...styles.navItem, color: active === item.label ? "#EDEFF2" : "#9AA5B1" }}
            >
              {item.label}
              {item.demo && <span style={styles.demoTag} title="This section still uses demo data, not the real database yet">demo</span>}
            </a>
          ))}
        </nav>
      </div>
      <button onClick={signOut} style={styles.signOut}>Sign out</button>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 20px", height: 56, background: "#12161D", borderBottom: "1px solid #232A35",
  },
  left: { display: "flex", alignItems: "center", gap: 28 },
  brand: {
    display: "flex", alignItems: "center", gap: 8, color: "#EDEFF2", textDecoration: "none",
    fontWeight: 700, fontSize: 15, fontFamily: "system-ui",
  },
  brandMark: { color: "#F2A93B" },
  nav: { display: "flex", alignItems: "center", gap: 4 },
  navItem: {
    fontSize: 13, fontWeight: 500, textDecoration: "none", padding: "8px 10px", borderRadius: 4,
    display: "flex", alignItems: "center", gap: 6,
  },
  demoTag: {
    fontSize: 9, textTransform: "uppercase", letterSpacing: "0.04em", color: "#F2A93B",
    border: "1px solid #F2A93B55", borderRadius: 3, padding: "1px 5px",
  },
  signOut: {
    background: "none", border: "1px solid #333D4C", color: "#9AA5B1", borderRadius: 6,
    padding: "7px 14px", fontSize: 12.5, cursor: "pointer",
  },
};
