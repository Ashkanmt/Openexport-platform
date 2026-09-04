"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// The other tabs here aren't fake buttons — they're genuinely marked
// "Coming soon" and don't navigate anywhere, because those parts of
// the platform (marketplace, suppliers, RFQs, pricing) exist as a
// separate, not-yet-connected prototype and don't have a real page
// in this app yet. Chat and Profile are the two features actually
// wired to the real database, so they're the only ones that link.
const NAV_ITEMS = [
  { label: "Chat", href: "/chat", live: true },
  { label: "Profile", href: "/profile", live: true },
  { label: "Marketplace", live: false },
  { label: "Suppliers", live: false },
  { label: "RFQs", live: false },
  { label: "Prices", live: false },
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
        <a href="/chat" style={styles.brand}>
          <span style={styles.brandMark}>◆</span> OpenExport
        </a>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) =>
            item.live ? (
              <a
                key={item.label}
                href={item.href}
                style={{ ...styles.navItem, color: active === item.label ? "#EDEFF2" : "#9AA5B1" }}
              >
                {item.label}
              </a>
            ) : (
              <span key={item.label} style={styles.navItemDisabled} title="Not connected to the real platform yet">
                {item.label}
                <span style={styles.soon}>soon</span>
              </span>
            )
          )}
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
  },
  navItemDisabled: {
    fontSize: 13, color: "#4A5262", padding: "8px 10px", display: "flex", alignItems: "center", gap: 6, cursor: "default",
  },
  soon: {
    fontSize: 9, textTransform: "uppercase", letterSpacing: "0.04em", color: "#67707C",
    border: "1px solid #333D4C", borderRadius: 3, padding: "1px 5px",
  },
  signOut: {
    background: "none", border: "1px solid #333D4C", color: "#9AA5B1", borderRadius: 6,
    padding: "7px 14px", fontSize: 12.5, cursor: "pointer",
  },
};
