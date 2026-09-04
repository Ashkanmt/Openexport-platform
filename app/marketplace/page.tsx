import Marketplace from "@/components/Marketplace";

// This mounts the full OpenExport marketplace prototype — products,
// suppliers, RFQs, chambers of commerce, news, prices, opportunities,
// landed cost calculator — as a real page on the live site.
//
// Honest note: this page's own internal sign-up/sign-in and data
// (suppliers, RFQs, prices, chamber members) are still the original
// demo data, not connected to the real Supabase database that the
// Chat and Profile pages use. Making each of those sections genuinely
// real — backed by actual database tables the way Chat now is — is
// the natural next phase, one feature at a time, same as Chat and
// Profile were built.
export default function MarketplacePage() {
  return <Marketplace />;
}
