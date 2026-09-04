import Marketplace from "@/components/Marketplace";

// The full marketplace is now the site's homepage — same component
// that was mounted at /marketplace, just serving as "/" too. Both
// routes work identically; this one is what visitors land on first.
export default function Home() {
  return <Marketplace />;
}
