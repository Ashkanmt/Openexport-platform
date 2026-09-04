"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Treemap, Legend, Cell, ReferenceLine,
} from "recharts";
import {
  Wheat, Sprout, Package, Search, ChevronRight, ArrowRight, Check, X,
  MapPin, Truck, Ship, ShieldCheck, Star, Info, Send, ClipboardList,
  TrendingUp, Users, Building2, FileText, Calculator, Globe2, Filter,
  Sliders, BadgeCheck, Clock, ArrowUpRight, ArrowDownRight, LayoutDashboard,
  MessageSquare, LogOut, Mail, CheckCircle2, Landmark, Anchor, ShieldAlert,
  Ban, Activity, PlusCircle, Handshake, Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ChatApp from "./ChatApp";

/* =================================================================
   DESIGN TOKENS — deep green / gold / off-white B2B trade platform.
   Deliberately distinct from a generic startup template: Bloomberg-
   grade data density, agricultural trust cues, premium restraint.
================================================================= */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');`;

const COLORS = {
  bg: "#0A0D12", s1: "#12161D", s2: "#1B212B", border: "#232A35", borderStrong: "#333D4C",
  textPri: "#EDEFF2", textSec: "#9AA5B1", textMut: "#67707C",
  brand: "#2F80ED", brand2: "#5FA8FF", gold: "#F2A93B", goldSoft: "#F7CB83",
  good: "#3ECF8E", warn: "#F2A93B", risk: "#E5484D", info: "#5FA8FF",
};

const fmt = (n, d = 0) => n == null ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const money = (n, d = 0) => `$${fmt(n, d)}`;

function DataTag({ type }) {
  const map = {
    live: { c: COLORS.good, l: "Live" }, estimated: { c: COLORS.warn, l: "Estimated" },
    user: { c: COLORS.info, l: "User-provided" }, historical: { c: COLORS.textMut, l: "Historical" },
    demo: { c: COLORS.risk, l: "Demo data" },
  };
  const t = map[type] || map.demo;
  return (
    <span style={{
      fontSize: 9.5, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.05em", color: t.c, border: `1px solid ${t.c}55`, borderRadius: 3, padding: "2px 6px",
    }}>{t.l}</span>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: COLORS.s1, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 20,
      cursor: onClick ? "pointer" : "default", ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children, right, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, color: COLORS.textPri }}>{children}</div>
        {right}
      </div>
      {sub && <div style={{ fontSize: 12.5, color: COLORS.textSec, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Badge({ tone = "neutral", children }) {
  const map = {
    neutral: { bg: COLORS.s2, fg: COLORS.textSec },
    brand: { bg: "rgba(47,128,237,0.14)", fg: COLORS.brand },
    gold: { bg: "rgba(242,169,59,0.16)", fg: COLORS.gold },
    good: { bg: "rgba(62,207,142,0.14)", fg: COLORS.good },
    risk: { bg: "rgba(229,72,77,0.14)", fg: COLORS.risk },
  };
  const t = map[tone];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", padding: "3px 9px",
      borderRadius: 3, background: t.bg, color: t.fg, display: "inline-flex", alignItems: "center", gap: 4,
    }}>{children}</span>
  );
}

function VerifiedBadge({ level = 2 }) {
  const labels = { 1: "Email Verified", 2: "Business Verified", 3: "Supplier Verified", 4: "Export Verified", 5: "Trade History Verified" };
  return <Badge tone="good"><BadgeCheck size={11} /> {labels[level]}</Badge>;
}

function TickerTape({ onSelect }) {
  const items = [...PRICE_BOARD, ...PRICE_BOARD];
  return (
    <div style={{ background: "#000000", borderBottom: `1px solid ${COLORS.border}`, overflow: "hidden", whiteSpace: "nowrap", height: 32 }}>
      <div style={{ display: "inline-flex", animation: "oe-ticker 42s linear infinite", height: 32, alignItems: "center" }}>
        {items.map((p, i) => (
          <button key={i} onClick={() => onSelect && onSelect(p.id)} style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "0 18px", background: "none",
            border: "none", borderRight: `1px solid ${COLORS.border}`, cursor: onSelect ? "pointer" : "default", height: 32,
          }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, fontWeight: 700, color: "#EDEFF2" }}>{p.name.toUpperCase()}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: COLORS.textSec }}>${p.basePrice}/MT</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: p.change >= 0 ? COLORS.good : COLORS.risk }}>
              {p.change >= 0 ? "▲" : "▼"} {Math.abs(p.change)}%
            </span>
          </button>
        ))}
      </div>
      <style>{`@keyframes oe-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* =================================================================
   DATA MODEL — clearly-labeled demo data.
================================================================= */

const PROVINCES = ["Saskatchewan", "Alberta", "Manitoba", "Ontario", "British Columbia", "Quebec"];
const DESTINATIONS = [
  "United Arab Emirates", "Saudi Arabia", "Oman", "Qatar", "Kuwait", "Bahrain",
  "Egypt", "Turkey", "India", "Bangladesh", "Indonesia", "China", "Germany",
  "Mexico", "United States", "Canada (Domestic)",
];
const PORTS = {
  origin: ["Vancouver", "Thunder Bay", "Montreal", "Halifax", "Prince Rupert"],
  dest: {
    "United Arab Emirates": "Jebel Ali", "Saudi Arabia": "Jeddah", "Oman": "Sohar",
    "Qatar": "Hamad", "Kuwait": "Shuwaikh", "Bahrain": "Khalifa Bin Salman",
    "Egypt": "Alexandria", "Turkey": "Istanbul", "India": "Nhava Sheva",
    "Bangladesh": "Chittagong", "Indonesia": "Tanjung Priok", "China": "Shanghai",
    "Germany": "Hamburg", "Mexico": "Veracruz", "United States": "Seattle",
    "Canada (Domestic)": "By truck/rail — no ocean port",
  },
};

const CATEGORIES = [
  { id: "pulses", name: "Pulses & Dried Legumes", icon: Sprout },
  { id: "oilseeds", name: "Oilseeds", icon: Sprout },
  { id: "grains", name: "Grains", icon: Wheat },
  { id: "specialty", name: "Specialty Crops", icon: Package },
  { id: "processed", name: "Processed Ingredients", icon: Package },
];

const PRODUCTS = [
  { id: "red-lentils", name: "Red Lentils", category: "pulses", hsCode: "0713.40", grade: "Canada No. 1", basePrice: 500, unit: "MT" },
  { id: "green-lentils", name: "Green Lentils", category: "pulses", hsCode: "0713.40", grade: "Canada No. 1", basePrice: 540, unit: "MT" },
  { id: "yellow-peas", name: "Yellow Peas", category: "pulses", hsCode: "0713.10", grade: "Canada No. 1", basePrice: 320, unit: "MT" },
  { id: "chickpeas", name: "Chickpeas", category: "pulses", hsCode: "0713.20", grade: "Canada No. 1", basePrice: 610, unit: "MT" },
  { id: "canola", name: "Canola", category: "oilseeds", hsCode: "1205.00", grade: "No.1 Canada", basePrice: 640, unit: "MT" },
  { id: "rapeseed", name: "Rapeseed", category: "oilseeds", hsCode: "1205.00", grade: "No.1 Canada", basePrice: 615, unit: "MT" },
  { id: "wheat", name: "Wheat", category: "grains", hsCode: "1001.99", grade: "CWRS No.1", basePrice: 296, unit: "MT" },
  { id: "oats", name: "Oats", category: "grains", hsCode: "1004.00", grade: "Canada No.1", basePrice: 275, unit: "MT" },
  { id: "barley", name: "Barley", category: "grains", hsCode: "1003.90", grade: "Canada No.1", basePrice: 258, unit: "MT" },
];

const SUPPLIERS_SEED = [
  {
    id: "s1", name: "Prairie Valley Farms", demo: true, province: "Saskatchewan", years: 14, verification: 4,
    products: ["red-lentils", "green-lentils", "yellow-peas"], certifications: ["HACCP", "Non-GMO"],
    exportMarkets: ["United Arab Emirates", "Saudi Arabia", "Turkey", "Bangladesh", "India"], responseHrs: 18, responseRate: 96,
    inventory: { "red-lentils": 1200, "green-lentils": 900, "yellow-peas": 2750 },
    priceAdj: { "red-lentils": 0, "green-lentils": 10, "yellow-peas": -5 },
  },
  {
    id: "s2", name: "Saskatchewan Pulse Co.", demo: true, province: "Saskatchewan", years: 9, verification: 3,
    products: ["red-lentils", "chickpeas", "yellow-peas"], certifications: ["Non-GMO", "Organic"],
    exportMarkets: ["United Arab Emirates", "Oman", "Egypt", "India"], responseHrs: 30, responseRate: 88,
    inventory: { "red-lentils": 640, "chickpeas": 480, "yellow-peas": 1100 },
    priceAdj: { "red-lentils": 10, "chickpeas": 0, "yellow-peas": 5 },
  },
  {
    id: "s3", name: "Northern Prairie Grains", demo: true, province: "Alberta", years: 21, verification: 4,
    products: ["wheat", "barley", "oats"], certifications: ["HACCP", "ISO 22000"],
    exportMarkets: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Egypt", "Indonesia", "China"], responseHrs: 12, responseRate: 98,
    inventory: { "wheat": 6000, "barley": 3400, "oats": 1800 },
    priceAdj: { "wheat": -3, "barley": 0, "oats": 8 },
  },
  {
    id: "s4", name: "Maple Ridge Agricultural Export", demo: true, province: "Manitoba", years: 6, verification: 2,
    products: ["canola", "rapeseed"], certifications: ["Non-GMO"],
    exportMarkets: ["United Arab Emirates", "Germany", "China", "Mexico"], responseHrs: 40, responseRate: 79,
    inventory: { "canola": 2200, "rapeseed": 1500 },
    priceAdj: { "canola": -8, "rapeseed": 0 },
  },
  {
    id: "s5", name: "Western Canadian Pulses", demo: true, province: "Alberta", years: 17, verification: 5,
    products: ["red-lentils", "chickpeas", "green-lentils"], certifications: ["HACCP", "Non-GMO", "Organic"],
    exportMarkets: ["United Arab Emirates", "Saudi Arabia", "Kuwait", "Bahrain", "Turkey", "Bangladesh"], responseHrs: 8, responseRate: 99,
    inventory: { "red-lentils": 3100, "chickpeas": 1650, "green-lentils": 1200 },
    priceAdj: { "red-lentils": 6, "chickpeas": 4, "green-lentils": 2 },
  },
  {
    id: "s6", name: "Golden Field Cooperative", demo: true, province: "Saskatchewan", years: 11, verification: 3,
    products: ["wheat", "oats", "canola"], certifications: ["Non-GMO"],
    exportMarkets: ["United Arab Emirates", "Turkey", "Mexico", "United States"], responseHrs: 24, responseRate: 90,
    inventory: { "wheat": 2800, "oats": 950, "canola": 1400 },
    priceAdj: { "wheat": 2, "oats": -2, "canola": 5 },
  },
  {
    id: "s7", name: "Great Lakes Grain Traders", demo: true, province: "Ontario", years: 19, verification: 4,
    products: ["wheat", "oats", "barley"], certifications: ["HACCP", "Non-GMO"],
    exportMarkets: ["United States", "Canada (Domestic)", "Germany"], responseHrs: 16, responseRate: 94,
    inventory: { "wheat": 1900, "oats": 1100, "barley": 1500 },
    priceAdj: { "wheat": 4, "oats": 1, "barley": 3 },
  },
  {
    id: "s8", name: "St. Lawrence Pulse & Grain", demo: true, province: "Quebec", years: 8, verification: 3,
    products: ["oats", "yellow-peas", "canola"], certifications: ["Non-GMO", "Organic"],
    exportMarkets: ["Canada (Domestic)", "United States"], responseHrs: 22, responseRate: 91,
    inventory: { "oats": 780, "yellow-peas": 640, "canola": 900 },
    priceAdj: { "oats": 3, "yellow-peas": -2, "canola": 2 },
  },
];

const BUYERS_SEED = [
  { id: "b1", name: "Dubai Food Imports LLC", demo: true, country: "United Arab Emirates", looking: ["red-lentils", "yellow-peas", "chickpeas"], orderSize: "500–5,000 MT", destPort: "Jebel Ali", verification: 2 },
  { id: "b2", name: "Gulf Grain Trading Co.", demo: true, country: "United Arab Emirates", looking: ["wheat", "barley"], orderSize: "1,000–10,000 MT", destPort: "Jebel Ali", verification: 3 },
  { id: "b3", name: "Al Rawda Foodstuff Trading", demo: true, country: "Saudi Arabia", looking: ["yellow-peas", "chickpeas"], orderSize: "500–3,000 MT", destPort: "Jeddah", verification: 2 },
  { id: "b4", name: "Oasis Agri Commodities", demo: true, country: "Qatar", looking: ["canola", "oats"], orderSize: "200–1,500 MT", destPort: "Hamad", verification: 1 },
  { id: "b5", name: "Nile Delta Grain Co.", demo: true, country: "Egypt", looking: ["wheat", "red-lentils"], orderSize: "2,000–15,000 MT", destPort: "Alexandria", verification: 3 },
  { id: "b6", name: "Anatolia Foodstuffs Trading", demo: true, country: "Turkey", looking: ["chickpeas", "red-lentils"], orderSize: "500–4,000 MT", destPort: "Istanbul", verification: 2 },
  { id: "b7", name: "Mumbai Pulses & Agro Ltd.", demo: true, country: "India", looking: ["yellow-peas", "chickpeas"], orderSize: "1,000–8,000 MT", destPort: "Nhava Sheva", verification: 2 },
  { id: "b8", name: "Hanseatic Grain Import GmbH", demo: true, country: "Germany", looking: ["oats", "canola"], orderSize: "500–3,000 MT", destPort: "Hamburg", verification: 3 },
  { id: "b9", name: "Ontario Milling & Ingredients Inc.", demo: true, country: "Canada (Domestic)", looking: ["wheat", "oats", "red-lentils"], orderSize: "200–2,000 MT", destPort: "Toronto, ON (rail/truck)", verification: 2 },
];

function daysLeft(n) { const d = new Date("2026-08-31"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

const RFQ_SEED = [
  { id: "r1", buyerId: "b1", productId: "red-lentils", qty: 2000, destination: "United Arab Emirates", destPort: "Jebel Ali", delivery: "December 2026", grade: "Canada No. 1", packaging: "Bulk", incoterm: "CIF", payment: "Letter of Credit", certRequired: true, postedDaysAgo: 3, expiresOn: daysLeft(11), notes: "Please provide latest quality certificate." },
  { id: "r2", buyerId: "b2", productId: "wheat", qty: 5000, destination: "United Arab Emirates", destPort: "Jebel Ali", delivery: "November 2026", grade: "CWRS No.1", packaging: "Bulk", incoterm: "CFR", payment: "T/T", certRequired: true, postedDaysAgo: 1, expiresOn: daysLeft(13), notes: "Vessel nomination required 15 days before laycan." },
  { id: "r3", buyerId: "b3", productId: "yellow-peas", qty: 1200, destination: "Saudi Arabia", destPort: "Jeddah", delivery: "January 2027", grade: "Canada No. 1", packaging: "50kg bags", incoterm: "CIF", payment: "Letter of Credit", certRequired: true, postedDaysAgo: 6, expiresOn: daysLeft(8), notes: "" },
  { id: "r4", buyerId: "b4", productId: "canola", qty: 800, destination: "Qatar", destPort: "Hamad", delivery: "November 2026", grade: "No.1 Canada", packaging: "Bulk", incoterm: "FOB", payment: "T/T", certRequired: false, postedDaysAgo: 9, expiresOn: daysLeft(5), notes: "" },
  { id: "r5", buyerId: "b1", productId: "chickpeas", qty: 900, destination: "United Arab Emirates", destPort: "Jebel Ali", delivery: "December 2026", grade: "Canada No. 1", packaging: "25kg bags", incoterm: "CIF", payment: "Letter of Credit", certRequired: true, postedDaysAgo: 2, expiresOn: daysLeft(14), notes: "" },
  { id: "r6", buyerId: "b5", productId: "wheat", qty: 8000, destination: "Egypt", destPort: "Alexandria", delivery: "January 2027", grade: "CWRS No.1", packaging: "Bulk", incoterm: "CFR", payment: "Letter of Credit", certRequired: true, postedDaysAgo: 4, expiresOn: daysLeft(10), notes: "GASC-style spec sheet required." },
  { id: "r7", buyerId: "b6", productId: "chickpeas", qty: 1100, destination: "Turkey", destPort: "Istanbul", delivery: "December 2026", grade: "Canada No. 1", packaging: "50kg bags", incoterm: "CIF", payment: "T/T", certRequired: true, postedDaysAgo: 5, expiresOn: daysLeft(9), notes: "" },
  { id: "r8", buyerId: "b7", productId: "yellow-peas", qty: 3000, destination: "India", destPort: "Nhava Sheva", delivery: "February 2027", grade: "Canada No. 1", packaging: "Bulk", incoterm: "CIF", payment: "Letter of Credit", certRequired: true, postedDaysAgo: 7, expiresOn: daysLeft(6), notes: "Fumigation certificate required on arrival." },
  { id: "r9", buyerId: "b8", productId: "oats", qty: 1500, destination: "Germany", destPort: "Hamburg", delivery: "November 2026", grade: "Canada No.1", packaging: "Bulk", incoterm: "CIF", payment: "T/T", certRequired: true, postedDaysAgo: 2, expiresOn: daysLeft(12), notes: "" },
  { id: "r10", buyerId: "b9", productId: "red-lentils", qty: 300, destination: "Canada (Domestic)", destPort: "Toronto, ON (rail/truck)", delivery: "October 2026", grade: "Canada No. 1", packaging: "25kg bags", incoterm: "DAP", payment: "T/T", certRequired: false, postedDaysAgo: 1, expiresOn: daysLeft(15), notes: "Domestic delivery — no ocean freight required." },
];

// Resolves buyer display info for an RFQ whether it came from the seed
// data (has a buyerId into the demo BUYERS list) or was just submitted
// by a real signed-in account (carries its own buyerName instead).
function rfqBuyerInfo(r) {
  const b = BUYERS_SEED.find((x) => x.id === r.buyerId);
  if (b) return { name: b.name, verification: b.verification };
  return { name: r.buyerName || "Guest Buyer", verification: r.buyerVerification || 1 };
}

// Freight/logistics per-MT baseline rates by destination (demo/estimated, section 18/38)
const FREIGHT_RATES = {
  "United Arab Emirates": { inland: 35, rail: 55, terminal: 15, ocean: 42, insuranceRate: 0.006, destHandling: 12, customsRate: 0 },
  "Saudi Arabia": { inland: 35, rail: 55, terminal: 15, ocean: 48, insuranceRate: 0.006, destHandling: 14, customsRate: 0.05 },
  "Oman": { inland: 35, rail: 55, terminal: 15, ocean: 45, insuranceRate: 0.006, destHandling: 13, customsRate: 0.05 },
  "Qatar": { inland: 35, rail: 55, terminal: 15, ocean: 44, insuranceRate: 0.006, destHandling: 13, customsRate: 0 },
  "Kuwait": { inland: 35, rail: 55, terminal: 15, ocean: 46, insuranceRate: 0.006, destHandling: 13, customsRate: 0.04 },
  "Bahrain": { inland: 35, rail: 55, terminal: 15, ocean: 47, insuranceRate: 0.006, destHandling: 13, customsRate: 0.05 },
  "Egypt": { inland: 35, rail: 55, terminal: 15, ocean: 50, insuranceRate: 0.006, destHandling: 14, customsRate: 0.05 },
  "Turkey": { inland: 35, rail: 55, terminal: 15, ocean: 52, insuranceRate: 0.006, destHandling: 14, customsRate: 0.03 },
  "India": { inland: 35, rail: 55, terminal: 15, ocean: 46, insuranceRate: 0.006, destHandling: 13, customsRate: 0.1 },
  "Bangladesh": { inland: 35, rail: 55, terminal: 15, ocean: 49, insuranceRate: 0.006, destHandling: 13, customsRate: 0.05 },
  "Indonesia": { inland: 35, rail: 55, terminal: 15, ocean: 54, insuranceRate: 0.006, destHandling: 14, customsRate: 0.05 },
  "China": { inland: 35, rail: 55, terminal: 15, ocean: 38, insuranceRate: 0.006, destHandling: 12, customsRate: 0.09 },
  "Germany": { inland: 35, rail: 55, terminal: 15, ocean: 58, insuranceRate: 0.006, destHandling: 15, customsRate: 0 },
  "Mexico": { inland: 35, rail: 55, terminal: 15, ocean: 40, insuranceRate: 0.006, destHandling: 12, customsRate: 0 },
  "United States": { inland: 35, rail: 40, terminal: 10, ocean: 22, insuranceRate: 0.005, destHandling: 8, customsRate: 0 },
  "Canada (Domestic)": { inland: 28, rail: 32, terminal: 6, ocean: 0, insuranceRate: 0.003, destHandling: 4, customsRate: 0 },
};

const OPPORTUNITIES = [
  {
    id: "op1", productId: "red-lentils", destination: "United Arab Emirates", score: 87,
    factors: { "Canadian supply": 92, "UAE demand": 94, "Price attractiveness": 88, "Freight": 79, "Competition": 72, "Supplier availability": 91, "Historical trade": 96, "Regulatory complexity": 82 },
  },
  {
    id: "op2", productId: "canola", destination: "United Arab Emirates", score: 82,
    factors: { "Canadian supply": 88, "UAE demand": 80, "Price attractiveness": 76, "Freight": 74, "Competition": 68, "Supplier availability": 84, "Historical trade": 91, "Regulatory complexity": 85 },
  },
  {
    id: "op3", productId: "yellow-peas", destination: "Saudi Arabia", score: 84,
    factors: { "Canadian supply": 90, "Saudi demand": 86, "Price attractiveness": 82, "Freight": 71, "Competition": 66, "Supplier availability": 89, "Historical trade": 88, "Regulatory complexity": 79 },
  },
  {
    id: "op4", productId: "wheat", destination: "United Arab Emirates", score: 74,
    factors: { "Canadian supply": 85, "UAE demand": 70, "Price attractiveness": 65, "Freight": 68, "Competition": 58, "Supplier availability": 80, "Historical trade": 82, "Regulatory complexity": 84 },
  },
  {
    id: "op5", productId: "oats", destination: "Qatar", score: 65,
    factors: { "Canadian supply": 74, "Qatar demand": 58, "Price attractiveness": 61, "Freight": 55, "Competition": 70, "Supplier availability": 72, "Historical trade": 52, "Regulatory complexity": 78 },
  },
  {
    id: "op6", productId: "wheat", destination: "Egypt", score: 90,
    factors: { "Canadian supply": 91, "Egypt demand": 97, "Price attractiveness": 84, "Freight": 76, "Competition": 62, "Supplier availability": 88, "Historical trade": 93, "Regulatory complexity": 80 },
  },
  {
    id: "op7", productId: "chickpeas", destination: "Turkey", score: 79,
    factors: { "Canadian supply": 83, "Turkey demand": 81, "Price attractiveness": 74, "Freight": 70, "Competition": 65, "Supplier availability": 86, "Historical trade": 77, "Regulatory complexity": 83 },
  },
  {
    id: "op8", productId: "yellow-peas", destination: "India", score: 71,
    factors: { "Canadian supply": 89, "India demand": 92, "Price attractiveness": 58, "Freight": 68, "Competition": 50, "Supplier availability": 85, "Historical trade": 74, "Regulatory complexity": 45 },
  },
  {
    id: "op9", productId: "red-lentils", destination: "Canada (Domestic)", score: 76,
    factors: { "Canadian supply": 95, "Domestic demand": 68, "Price attractiveness": 72, "Freight": 96, "Competition": 55, "Supplier availability": 93, "Historical trade": 70, "Regulatory complexity": 98 },
  },
];

function classify(score) {
  if (score >= 90) return { label: "Exceptional", tone: "good" };
  if (score >= 80) return { label: "Strong", tone: "good" };
  if (score >= 70) return { label: "Moderate", tone: "gold" };
  if (score >= 60) return { label: "Watch", tone: "gold" };
  return { label: "Weak", tone: "risk" };
}

// Computes a trade-opportunity score for any product+destination pair —
// reuses the hand-tuned OPPORTUNITIES entry where one exists (the 9
// curated corridors), otherwise derives a deterministic estimate from
// actual Canadian supply for that product plus seeded demand/logistics
// factors. This means any newly posted RFQ gets a real card here, not
// just the 9 pre-scored corridors.
function deriveOpportunity(productId, destination, suppliersList = SUPPLIERS_SEED) {
  const seeded = OPPORTUNITIES.find((o) => o.productId === productId && o.destination === destination);
  if (seeded) return seeded;
  const totalSupply = suppliersList.filter((s) => s.products.includes(productId)).reduce((sum, s) => sum + (s.inventory[productId] || 0), 0);
  const supplyScore = Math.min(97, 50 + Math.round(totalSupply / 150));
  const h = hashStr(productId + "|" + destination);
  const factors = {
    "Canadian supply": supplyScore,
    "Demand": 55 + Math.round(seededVal(h * 1.1) * 35),
    "Price attractiveness": 52 + Math.round(seededVal(h * 1.7) * 33),
    "Freight": 50 + Math.round(seededVal(h * 2.3) * 35),
    "Competition": 48 + Math.round(seededVal(h * 3.1) * 38),
    "Supplier availability": supplyScore,
    "Historical trade": 42 + Math.round(seededVal(h * 4.4) * 40),
    "Regulatory complexity": 52 + Math.round(seededVal(h * 5.6) * 36),
  };
  const score = Math.round(Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length);
  return { id: `derived-${productId}-${destination}`, productId, destination, score, factors, derived: true };
}

// Historical/demo — conceptually inspired by a published trade visualization; not live data.
const TREEMAP_DATA = [
  { name: "Dried Legumes", size: 203, fill: COLORS.brand },
  { name: "Rapeseed / Canola", size: 162, fill: COLORS.brand2 },
  { name: "Wheat", size: 90.4, fill: COLORS.gold },
  { name: "Oats", size: 11.1, fill: COLORS.goldSoft },
  { name: "Other", size: 10.5, fill: COLORS.borderStrong },
];
const TRADE_TREND = [
  { year: "2022", value: 358 }, { year: "2023", value: 401 }, { year: "2024", value: 429 },
  { year: "2025", value: 452 }, { year: "2026", value: 477 },
];

/* =================================================================
   MARKET NEWS — condensed from real, current pulse/grain trade
   reporting (paraphrased, not quoted).
================================================================= */

const MARKET_NEWS = [
  {
    id: "n1", tag: "Pulses", time: "This week",
    headline: "Canadian lentil exports running well ahead of last year",
    summary: "Lentil shipments have outpaced the prior marketing year by a wide margin, with total exports for the current crop year projected near 2.3 million tonnes — India, Turkey and the UAE remain the leading destinations.",
    source: "Lord Agro Trade", url: "https://lordagrotrade.com/canadian-pulse-market-report-june-2026-prices-supply-new-crop-outlook/",
  },
  {
    id: "n2", tag: "Peas", time: "3 weeks ago",
    headline: "Large carry-out stocks keep pea prices range-bound",
    summary: "Yellow pea bids are holding in the $7–7.50/bu range with green peas near $10–10.50/bu; new-crop bids remain conservative as buyers stay cautious given ample supply cushions from the prior harvest.",
    source: "Saskatchewan Pulse Growers", url: "https://saskpulse.com/resources/outlook-for-canadian-peas-lentils-3/",
  },
  {
    id: "n3", tag: "Trade Policy", time: "1 month ago",
    headline: "India tariff hasn't stopped the lentil trade — but it has slowed it",
    summary: "A 10% Indian import tariff has dampened import volumes without halting the flow of Canadian lentils; with Canadian supplies exceeding 4 million tonnes this year, India remains a critical demand outlet, especially for green lentils.",
    source: "Saskatchewan Pulse Growers", url: "https://saskpulse.com/resources/clouds-and-silver-linings-on-the-trade-horizon/",
  },
  {
    id: "n4", tag: "Logistics", time: "1 month ago",
    headline: "Strait of Hormuz disruptions pushing up shipping costs",
    summary: "Trade flow disruptions linked to regional tensions near the Strait of Hormuz are raising freight costs and complicating routing for pulse cargo, though volumes are continuing to move via alternative shipping lanes.",
    source: "Lord Agro Trade", url: "https://lordagrotrade.com/canadian-pulses-market-report-april-2026/",
  },
  {
    id: "n5", tag: "Harvest", time: "1 week ago",
    headline: "2026 pea and lentil harvest underway with average yields",
    summary: "Early harvest reports show average-to-slightly-below-average yields; Statistics Canada acreage data points to yellow pea production down roughly 30% and green peas down about 26% year over year, while red lentil output is expected to outpace green.",
    source: "Mundus Agri", url: "https://www.mundus-agri.eu/news/peas-lentils-harvest-canada-underway.n37884.html",
  },
];

// Bloomberg-style price board — clearly labeled per section 21/47 data-quality rules.
//
// Three real, independently-run sources, cross-checked against each
// other (median value, confidence = how well they agree) — the same
// structure a live backend pipeline produces. See
// /openexport-price-pipeline for the real Python pipeline that fetches
// and cross-validates these on a schedule; the values below are still
// placeholder numbers shaped exactly like that pipeline's real output,
// pending that backend actually being deployed and connected.
const PRICE_SOURCES = {
  "red-lentils": [
    { name: "Sask. Dashboard — Lentils", url: "https://dashboard.saskatchewan.ca/agriculture/grain-and-specialty-crop-prices/lentils", value: 500 },
    { name: "StatCan Table 32-10-0077-01", url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701", value: 512 },
    { name: "Canadian Grain Commission — Weekly", url: "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/", value: 498 },
  ],
  "green-lentils": [
    { name: "Sask. Dashboard — Lentils", url: "https://dashboard.saskatchewan.ca/agriculture/grain-and-specialty-crop-prices/lentils", value: 540 },
    { name: "StatCan Table 32-10-0077-01", url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701", value: 551 },
    { name: "Canadian Grain Commission — Weekly", url: "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/", value: 533 },
  ],
  "yellow-peas": [
    { name: "Sask. Dashboard — Field Peas", url: "https://dashboard.saskatchewan.ca/agriculture/grain-and-specialty-crop-prices/field-peas", value: 320 },
    { name: "StatCan Table 32-10-0077-01", url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701", value: 314 },
    { name: "Canadian Grain Commission — Weekly", url: "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/", value: 327 },
  ],
  "chickpeas": [
    // Not broken out individually by StatCan or the Grain Commission —
    // single-source, so this one is honestly marked lower-confidence.
    { name: "Sask. Dashboard — Chickpeas", url: "https://dashboard.saskatchewan.ca/agriculture/grain-and-specialty-crop-prices/chickpeas", value: 610 },
  ],
  "canola": [
    { name: "Sask. Dashboard — Canola", url: "https://dashboard.saskatchewan.ca/agriculture/grain-and-specialty-crop-prices/canola", value: 640 },
    { name: "StatCan Table 32-10-0077-01", url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701", value: 652 },
    { name: "Canadian Grain Commission — Weekly", url: "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/", value: 636 },
  ],
  "rapeseed": [
    { name: "Sask. Dashboard — Canola", url: "https://dashboard.saskatchewan.ca/agriculture/grain-and-specialty-crop-prices/canola", value: 615 },
    { name: "StatCan Table 32-10-0077-01", url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701", value: 601 },
  ],
  "wheat": [
    { name: "Sask. Dashboard — Wheat", url: "https://dashboard.saskatchewan.ca/agriculture/grain-and-specialty-crop-prices/wheat", value: 296 },
    { name: "StatCan Table 32-10-0077-01", url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701", value: 289 },
    { name: "Canadian Grain Commission — Weekly", url: "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/", value: 301 },
  ],
  "oats": [
    { name: "Sask. Dashboard — Oats", url: "https://dashboard.saskatchewan.ca/agriculture/grain-and-specialty-crop-prices/oats", value: 275 },
    { name: "StatCan Table 32-10-0077-01", url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701", value: 268 },
    { name: "Canadian Grain Commission — Weekly", url: "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/", value: 279 },
  ],
  "barley": [
    { name: "Sask. Dashboard — Barley", url: "https://dashboard.saskatchewan.ca/agriculture/grain-and-specialty-crop-prices/barley", value: 258 },
    { name: "StatCan Table 32-10-0077-01", url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701", value: 249 },
    { name: "Canadian Grain Commission — Weekly", url: "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/", value: 263 },
  ],
};

// Mirrors the real pipeline's cross_validate.py: median of all sources,
// confidence based on how tightly they agree (4% = high, 12% = medium).
function crossValidate(sources) {
  const values = sources.map((s) => s.value).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  if (sources.length === 1) return { median, confidence: "low", maxDeviationPct: 0 };
  const maxDev = Math.max(...values.map((v) => Math.abs(v - median) / median));
  const confidence = maxDev <= 0.04 ? "high" : maxDev <= 0.12 ? "medium" : "low";
  return { median: Math.round(median * 10) / 10, confidence, maxDeviationPct: Math.round(maxDev * 1000) / 10 };
}

const PRICE_BOARD = PRODUCTS.map((p, i) => {
  const sources = PRICE_SOURCES[p.id] || [];
  const { median, confidence } = crossValidate(sources);
  return {
    ...p,
    location: SUPPLIERS_SEED.find((s) => s.products.includes(p.id))?.province || "Saskatchewan",
    change: [1.2, -0.4, 0.8, -1.1, 2.3, -0.6, 0.3, 1.7, -0.2][i % 9],
    updated: "Aug 28, 2026",
    basePrice: median || p.basePrice,
    sources,
    confidence,
    source: sources[0]?.name || "Government of Saskatchewan",
    sourceUrl: sources[0]?.url,
    dataType: "estimated",
  };
});

/* =================================================================
   PRICE COMPARISON — per-product, top-5-country stock-style chart.
   Synthetic but deterministic (seeded), clearly labeled as demo.
================================================================= */

// Top exporting/importing markets per product, with an illustrative
// price offset vs. the Canadian reference (freight, quality, duty).
const PRODUCT_COUNTRIES = {
  "red-lentils": [["Canada", 0], ["India", 35], ["Turkey", 28], ["Australia", 15], ["United States", 20]],
  "green-lentils": [["Canada", 0], ["India", 32], ["Turkey", 24], ["Australia", 12], ["United States", 18]],
  "yellow-peas": [["Canada", 0], ["India", 40], ["China", 25], ["Bangladesh", 30], ["United States", 18]],
  "chickpeas": [["Canada", 0], ["India", 45], ["Turkey", 30], ["Australia", 20], ["Pakistan", 35]],
  "canola": [["Canada", 0], ["China", 40], ["Germany", 55], ["Japan", 60], ["Mexico", 25]],
  "rapeseed": [["Canada", 0], ["Germany", 35], ["France", 30], ["China", 45], ["Ukraine", -20]],
  "wheat": [["Russia", -15], ["United States", 5], ["Canada", 0], ["Australia", 10], ["Argentina", -8]],
  "oats": [["Canada", 0], ["Russia", -20], ["Australia", 15], ["Germany", 25], ["United States", 10]],
  "barley": [["Russia", -18], ["France", 20], ["Australia", 12], ["Canada", 0], ["Germany", 22]],
};

const RANGE_STEPS = {
  "1D": { points: 8, stepDays: 0 },
  "5D": { points: 5, stepDays: 1 },
  "1M": { points: 10, stepDays: 3 },
  "6M": { points: 12, stepDays: 14 },
  "YTD": { points: 12, stepDays: 20 },
  "1Y": { points: 12, stepDays: 30 },
  "5Y": { points: 10, stepDays: 180 },
  "Max": { points: 10, stepDays: 400 },
};
const LINE_COLORS = [COLORS.gold, COLORS.brand2, COLORS.good, COLORS.risk, COLORS.info];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function seededVal(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const FORECAST_POINTS = { "1D": 4, "5D": 3, "1M": 4, "6M": 6, "YTD": 5, "1Y": 6, "5Y": 3, "Max": 2 };

function generatePriceCompareData(productId, countries, range, basePrice) {
  const cfg = RANGE_STEPS[range];
  const fPoints = FORECAST_POINTS[range];
  const today = new Date("2026-08-31");

  const perCountry = countries.map(([country, offset]) => {
    const seedBase = hashStr(productId + country + range);
    let price = basePrice + offset;
    const histVals = [];
    for (let i = 0; i < cfg.points; i++) {
      const rnd = seededVal(seedBase + i * 97.7);
      if (i > 0) price += (rnd - 0.5) * basePrice * 0.035;
      histVals.push(Math.round(price * 10) / 10);
    }
    // Forecast continues from recent momentum plus bounded noise — a simple,
    // transparent extrapolation, not a real predictive model.
    const momentum = (histVals[histVals.length - 1] - histVals[Math.max(0, histVals.length - 3)]) / 2;
    let fPrice = histVals[histVals.length - 1];
    const forecastVals = [fPrice];
    for (let i = 1; i <= fPoints; i++) {
      const rnd = seededVal(seedBase + 5000 + i * 61.3);
      fPrice = Math.round((fPrice + momentum * 0.4 + (rnd - 0.5) * basePrice * 0.03) * 10) / 10;
      forecastVals.push(fPrice);
    }
    return { country, histVals, forecastVals };
  });

  const rows = [];
  for (let i = 0; i < cfg.points; i++) {
    let label;
    if (range === "1D") {
      label = `${9 + i}:00`;
    } else {
      const d = new Date(today);
      d.setDate(d.getDate() - (cfg.points - 1 - i) * cfg.stepDays);
      label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    const row = { label };
    perCountry.forEach(({ country, histVals }) => { row[country] = histVals[i]; });
    rows.push(row);
  }
  const todayLabel = rows[rows.length - 1].label;
  // Duplicate the last actual point onto the forecast key so the dashed
  // line picks up exactly where the solid line ends.
  perCountry.forEach(({ country, histVals }) => { rows[rows.length - 1][`${country}__f`] = histVals[histVals.length - 1]; });

  for (let i = 1; i <= fPoints; i++) {
    let label;
    if (range === "1D") {
      label = `${9 + cfg.points - 1 + i}:00`;
    } else {
      const d = new Date(today);
      d.setDate(d.getDate() + i * cfg.stepDays);
      label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    const row = { label };
    perCountry.forEach(({ country, forecastVals }) => { row[`${country}__f`] = forecastVals[i]; });
    rows.push(row);
  }

  return { rows, todayLabel };
}

/* =================================================================
   MATCHING & SCORING ENGINES (section 15 / 46)
================================================================= */

function matchSuppliers(rfq, suppliersList = SUPPLIERS_SEED) {
  const candidates = suppliersList.filter((s) => s.products.includes(rfq.productId));
  return candidates.map((s) => {
    const inv = s.inventory[rfq.productId] || 0;
    const productScore = 100;
    const qtyScore = Math.max(40, Math.min(100, Math.round((inv / rfq.qty) * 100)));
    const qualityScore = 100; // grade match assumed for demo
    const deliveryScore = s.responseHrs <= 24 ? 90 : 75;
    const certScore = rfq.certRequired ? (s.certifications.length > 0 ? 100 : 50) : 100;
    const destScore = s.exportMarkets.includes(rfq.destination) ? 100 : 60;
    const overall = Math.round(
      productScore * 0.25 + qtyScore * 0.2 + qualityScore * 0.2 + deliveryScore * 0.15 + certScore * 0.1 + destScore * 0.1
    );
    return {
      supplier: s, overall, breakdown: { Product: productScore, Quantity: qtyScore, Quality: qualityScore, Delivery: deliveryScore, Certification: certScore, "Market access": destScore },
    };
  }).sort((a, b) => b.overall - a.overall);
}

function landedCost({ price, qty, destination, incoterm }) {
  const r = FREIGHT_RATES[destination] || FREIGHT_RATES["United Arab Emirates"];
  const inland = incoterm === "FOB" ? 0 : r.inland;
  const rail = incoterm === "FOB" ? 0 : r.rail;
  const terminal = r.terminal;
  const ocean = incoterm === "FOB" ? 0 : r.ocean;
  const subtotalBeforeIns = price + inland + rail + terminal + ocean;
  const insurance = incoterm === "CIF" ? Math.round(subtotalBeforeIns * r.insuranceRate * 10) / 10 : 0;
  const destHandling = incoterm === "FOB" ? 0 : r.destHandling;
  const customs = Math.round(price * r.customsRate * 10) / 10;
  const total = Math.round((subtotalBeforeIns + insurance + destHandling + customs) * 10) / 10;
  return {
    components: [
      { label: "Supplier price", value: price, type: "user" },
      { label: "Inland transportation", value: inland, type: "estimated" },
      { label: "Rail", value: rail, type: "estimated" },
      { label: "Terminal handling", value: terminal, type: "estimated" },
      { label: "Ocean freight", value: ocean, type: "estimated" },
      { label: "Insurance", value: insurance, type: "estimated" },
      { label: "Destination handling", value: destHandling, type: "estimated" },
      { label: "Customs / tariffs", value: customs, type: "estimated" },
    ],
    total, transactionValue: Math.round(total * qty),
  };
}

/* =================================================================
   SHARED BITS
================================================================= */

function ProductIcon({ id, size = 16, color }) {
  const p = PRODUCTS.find((x) => x.id === id);
  const cat = p ? CATEGORIES.find((c) => c.id === p.category) : null;
  const Icon = cat ? cat.icon : Package;
  return <Icon size={size} color={color || COLORS.brand} />;
}

function OpportunityScoreRing({ score, size = 64 }) {
  const c = classify(score);
  const color = c.tone === "good" ? COLORS.good : c.tone === "gold" ? COLORS.gold : COLORS.risk;
  const r = (size - 8) / 2, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.s2} strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: size * 0.28, color: COLORS.textPri }}>
        {score}
      </div>
    </div>
  );
}

/* =================================================================
   HOMEPAGE
================================================================= */

function Home({ onNav, rfqs, suppliers }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
      <div>
        <div style={{
          background: `linear-gradient(135deg, #0D1420 0%, #182437 100%)`, borderRadius: 8, padding: "48px 40px",
          marginBottom: 32, color: "#EDEFF2", border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.gold, marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>OpenExport</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, lineHeight: 1.15, maxWidth: 600 }}>
            Connecting Canadian agricultural supply with global demand.
          </div>
          <div style={{ fontSize: 14.5, color: "#B7C0CC", marginTop: 14, maxWidth: 540, lineHeight: 1.6 }}>
            Find verified Canadian suppliers, discover international demand, compare offers, estimate landed
            costs, and simplify the export process — connecting Canada to markets across the Middle East,
            Asia, Europe and the Americas.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <button onClick={() => onNav("products")} style={{ background: COLORS.gold, color: "#1A1305", border: "none", borderRadius: 5, padding: "11px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Find Canadian Products</button>
            <button onClick={() => onNav("rfq-create")} style={{ background: "transparent", color: "#EDEFF2", border: `1px solid ${COLORS.borderStrong}`, borderRadius: 5, padding: "11px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Post a Buying Request</button>
          </div>
        </div>

        <SectionLabel>Explore Canadian Agricultural Products</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 36 }}>
          {CATEGORIES.map((c) => {
            const items = PRODUCTS.filter((p) => p.category === c.id);
            const supply = items.reduce((s, p) => s + suppliers.filter((sp) => sp.products.includes(p.id)).reduce((ss, sp) => ss + (sp.inventory[p.id] || 0), 0), 0);
            return (
              <Card key={c.id} onClick={() => onNav("products", { category: c.id })} style={{ textAlign: "left" }}>
                <c.icon size={20} color={COLORS.brand} />
                <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.textPri, marginTop: 10 }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: COLORS.textMut, marginTop: 4 }}>{items.length} products</div>
                <div style={{ fontSize: 11.5, color: COLORS.textSec, marginTop: 2 }}>{fmt(supply)} MT available</div>
              </Card>
            );
          })}
        </div>

        <SectionLabel right={<button onClick={() => onNav("opportunities")} style={linkBtnStyle}>View all →</button>} sub="Generated from actual buying requests posted on OpenExport — newest first.">Today's Trade Opportunities</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 36 }}>
          {(() => {
            const seenPair = new Set();
            const fromRfqs = [...rfqs].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo).filter((r) => {
              const key = r.productId + "|" + r.destination;
              if (seenPair.has(key)) return false;
              seenPair.add(key);
              return true;
            }).slice(0, 6).map((r) => deriveOpportunity(r.productId, r.destination, suppliers));
            return fromRfqs.map((op) => {
              const p = PRODUCTS.find((x) => x.id === op.productId);
              const c = classify(op.score);
              return (
                <Card key={op.id} onClick={() => onNav("opportunities")}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.textPri }}>{p.name.toUpperCase()} → {op.destination === "United Arab Emirates" ? "UAE" : op.destination}</div>
                      <Badge tone={c.tone}>{c.label} Opportunity</Badge>
                    </div>
                    <OpportunityScoreRing score={op.score} size={48} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14, fontSize: 11.5 }}>
                    <div><span style={{ color: COLORS.textMut }}>Canadian supply</span><br /><b style={{ color: COLORS.textPri }}>{op.factors["Canadian supply"] >= 85 ? "High" : "Moderate"}</b></div>
                    <div><span style={{ color: COLORS.textMut }}>Demand</span><br /><b style={{ color: COLORS.textPri }}>{Object.values(op.factors)[1] >= 85 ? "High" : "Moderate"}</b></div>
                  </div>
                  <div style={{ marginTop: 4 }}><DataTag type="demo" /></div>
                </Card>
              );
            });
          })()}
        </div>

        <SectionLabel right={<button onClick={() => onNav("chambers")} style={linkBtnStyle}>View all chambers →</button>} sub="Every Canadian province represented on OpenExport, plus the national Canada-Gulf chamber.">Canadian Chambers of Commerce</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 36 }}>
          {CHAMBERS.filter((c) => c.country === "Canada").map((c) => (
            <Card key={c.id} onClick={() => onNav("chambers")}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <Landmark size={20} color={COLORS.brand} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.textPri }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: COLORS.textMut, marginTop: 4, lineHeight: 1.5 }}>
                    {c.province && c.province !== "National" ? c.province : "National"} · Founded {c.founded}<br />Represented by {c.rep}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 12, color: COLORS.textSec }}>{c.members} members</span>
                <ArrowRight size={14} color={COLORS.textMut} />
              </div>
            </Card>
          ))}
        </div>

        <div style={{ background: `linear-gradient(135deg, #0D1420 0%, #182437 100%)`, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "32px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, color: "#fff", fontWeight: 700, marginBottom: 16 }}>Ready to trade?</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => onNav("products")} style={{ background: COLORS.gold, border: "none", borderRadius: 5, padding: "10px 20px", color: "#1A1305", fontWeight: 700, cursor: "pointer" }}>Find Products</button>
            <button onClick={() => onNav("dashboard-supplier")} style={{ background: "transparent", border: `1px solid ${COLORS.borderStrong}`, borderRadius: 5, padding: "10px 20px", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Become a Supplier</button>
          </div>
        </div>
      </div>

      <div style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 20 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.textPri, display: "flex", alignItems: "center", gap: 7 }}>
              <MessageSquare size={13} color={COLORS.gold} /> Live Buying Requests
            </span>
            <button onClick={() => onNav("rfqs")} style={{ ...linkBtnStyle, fontSize: 11 }}>View all →</button>
          </div>
          <div>
            {rfqs.slice().sort((a, b) => a.postedDaysAgo - b.postedDaysAgo).slice(0, 4).map((r) => {
              const p = PRODUCTS.find((x) => x.id === r.productId);
              const buyer = rfqBuyerInfo(r);
              return (
                <div key={r.id} onClick={() => onNav("rfqs")} style={{
                  display: "flex", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", background: COLORS.s2, border: `1px solid ${COLORS.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: COLORS.brand2, flexShrink: 0,
                  }}>{buyer.name.slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: COLORS.textPri, lineHeight: 1.5 }}>
                      <b>{buyer.name}</b> is looking to buy <b>{fmt(r.qty)} MT {p?.name}</b> → {r.destination === "United Arab Emirates" ? "UAE" : r.destination}
                    </div>
                    <div style={{ fontSize: 10.5, color: COLORS.textMut, marginTop: 3, display: "flex", gap: 8, alignItems: "center" }}>
                      <Clock size={10} /> {r.postedDaysAgo === 0 ? "Today" : `${r.postedDaysAgo}d ago`} · Delivery {r.delivery}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "12px 16px" }}>
            <button onClick={() => onNav("rfq-create")} style={{ ...secondaryBtn, width: "100%", justifyContent: "center", fontSize: 11.5 }}>
              <PlusCircle size={12} /> Post your own buying request
            </button>
          </div>
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.textPri }}>Latest Trade News</span>
            <button onClick={() => onNav("news")} style={{ ...linkBtnStyle, fontSize: 11 }}>View all →</button>
          </div>
          <div style={{ padding: "0 16px" }}>
            {MARKET_NEWS.map((n) => <NewsRow key={n.id} n={n} />)}
          </div>
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.textPri }}>Market Snapshot</span>
            <button onClick={() => onNav("prices")} style={{ ...linkBtnStyle, fontSize: 11 }}>View all →</button>
          </div>
          <div>
            {PRICE_BOARD.map((p) => (
              <div key={p.id} onClick={() => onNav("prices")} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px",
                borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer",
              }}>
                <span style={{ fontSize: 12, color: COLORS.textPri, fontWeight: 600 }}>{p.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textSec }}>${p.basePrice}</span>
                  <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: p.change >= 0 ? COLORS.good : COLORS.risk }}>
                    {p.change >= 0 ? "▲" : "▼"} {Math.abs(p.change)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 16px" }}><DataTag type="demo" /></div>
        </Card>
      </div>
    </div>
  );
}

const linkBtnStyle = { background: "none", border: "none", color: COLORS.brand, fontSize: 12.5, fontWeight: 600, cursor: "pointer" };

/* =================================================================
   PRODUCTS DIRECTORY
================================================================= */

function Products({ initialFilter, onOpenProduct, suppliers }) {
  const [category, setCategory] = useState(initialFilter?.category || "all");
  const [query, setQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const rows = useMemo(() => {
    const out = [];
    PRODUCTS.forEach((p) => {
      suppliers.filter((s) => s.products.includes(p.id)).forEach((s) => {
        out.push({ product: p, supplier: s, qty: s.inventory[p.id] || 0, price: p.basePrice + (s.priceAdj[p.id] || 0) });
      });
    });
    return out.filter((r) =>
      (category === "all" || r.product.category === category) &&
      (query.trim() === "" || r.product.name.toLowerCase().includes(query.toLowerCase()) || r.supplier.name.toLowerCase().includes(query.toLowerCase())) &&
      (!verifiedOnly || r.supplier.verification >= 3)
    );
  }, [category, query, verifiedOnly, suppliers]);

  return (
    <div>
      <SectionLabel sub="Browse Canadian pulses, oilseeds, grains, specialty and processed products.">Product Marketplace</SectionLabel>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={14} color={COLORS.textMut} style={{ position: "absolute", left: 12, top: 12 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, suppliers or varieties…" style={{
            width: "100%", background: COLORS.s2, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "10px 12px 10px 34px",
            fontSize: 13, color: COLORS.textPri, outline: "none", boxSizing: "border-box",
          }} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setCategory("all")} style={filterChip(category === "all")}>All categories</button>
          {CATEGORIES.map((c) => <button key={c.id} onClick={() => setCategory(c.id)} style={filterChip(category === c.id)}>{c.name}</button>)}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSec, marginLeft: "auto", cursor: "pointer" }}>
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> Verified suppliers only
          </label>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {rows.map((r, i) => (
          <Card key={i} onClick={() => onOpenProduct(r.product.id, r.supplier.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <ProductIcon id={r.product.id} size={22} />
              {r.supplier.verification >= 3 && <VerifiedBadge level={r.supplier.verification} />}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPri, marginTop: 10, fontFamily: "'Space Grotesk', sans-serif" }}>{r.product.name}</div>
            <div style={{ fontSize: 12, color: COLORS.textMut, marginTop: 2 }}>{r.supplier.name} · {r.supplier.province}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12 }}>
              <span style={{ color: COLORS.textSec }}>Available: <b style={{ color: COLORS.textPri }}>{fmt(r.qty)} MT</b></span>
              <span style={{ color: COLORS.textSec }}>Grade: <b style={{ color: COLORS.textPri }}>{r.product.grade}</b></span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {r.supplier.certifications.map((cert) => <Badge key={cert} tone="neutral">{cert}</Badge>)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, color: COLORS.textPri }}>{money(r.price)}/MT</span>
              <span style={{ fontSize: 11.5, color: COLORS.brand2, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>View product <ChevronRight size={13} /></span>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: COLORS.textMut, fontSize: 13 }}>No products match these filters.</div>}
      </div>
    </div>
  );
}

const filterChip = (active) => ({
  fontSize: 12, padding: "6px 12px", borderRadius: 4, cursor: "pointer",
  background: active ? COLORS.brand : "none", color: active ? "#fff" : COLORS.textSec,
  border: `1px solid ${active ? COLORS.brand : COLORS.border}`,
});

/* =================================================================
   PRODUCT DETAIL
================================================================= */

function ProductDetail({ productId, supplierId, onBack, onCalc, onRequestQuote, suppliers }) {
  const [tab, setTab] = useState("overview");
  const p = PRODUCTS.find((x) => x.id === productId);
  const s = suppliers.find((x) => x.id === supplierId) || suppliers.find((x) => x.products.includes(productId));
  if (!p || !s) return null;
  const price = p.basePrice + (s.priceAdj[p.id] || 0);
  const qty = s.inventory[p.id] || 0;
  const op = OPPORTUNITIES.find((o) => o.productId === p.id);

  const tabs = ["overview", "specifications", "supplier", "pricing", "trade intelligence"];

  return (
    <div>
      <button onClick={onBack} style={{ ...linkBtnStyle, marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}><ChevronRight size={13} style={{ transform: "rotate(180deg)" }} /> Back to products</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.textPri }}>Canadian {p.name}</div>
          <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 4 }}>{s.province}, Canada · Grade {p.grade} · HS {p.hsCode}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 700, color: COLORS.textPri }}>{money(price)}<span style={{ fontSize: 13, color: COLORS.textMut }}>/MT</span></div>
          <DataTag type="user" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => onRequestQuote(p.id, s.id)} style={primaryBtn}>Request Quote</button>
        <button onClick={() => onCalc(p.id, price)} style={secondaryBtn}><Calculator size={13} /> Calculate Landed Cost</button>
        <button style={secondaryBtn}>Request Sample</button>
        <button style={secondaryBtn}>Contact Supplier</button>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", borderBottom: `2px solid ${tab === t ? COLORS.brand : "transparent"}`,
            padding: "8px 4px", marginRight: 18, fontSize: 12.5, fontWeight: 600, textTransform: "capitalize",
            color: tab === t ? COLORS.brand : COLORS.textMut, cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Card>
            <SectionLabel>Availability</SectionLabel>
            <Row label="Available quantity" value={`${fmt(qty)} MT`} />
            <Row label="Minimum order" value="100 MT" />
            <Row label="Packaging" value="Bulk / 25kg / 50kg" />
            <Row label="Availability window" value="October – December 2026" />
          </Card>
          <Card>
            <SectionLabel>Supplier</SectionLabel>
            <Row label="Company" value={s.name + (s.demo ? " (Demo Supplier)" : "")} />
            <Row label="Location" value={`${s.province}, Canada`} />
            <Row label="Years in business" value={s.years} />
            <Row label="Response time" value={`< ${s.responseHrs}h`} />
            <div style={{ marginTop: 8 }}><VerifiedBadge level={s.verification} /></div>
          </Card>
        </div>
      )}

      {tab === "specifications" && (
        <Card>
          <SectionLabel>Quality Specifications</SectionLabel>
          <Row label="Moisture" value="≤ 14%" /><Row label="Foreign material" value="≤ 1%" />
          <Row label="Size" value="6–7mm" /><Row label="Color" value="Uniform, characteristic of grade" />
          <Row label="Protein" value="≥ 22%" /><Row label="Quality certificate" value="Available on request" />
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>{s.certifications.map((c) => <Badge key={c} tone="neutral">{c}</Badge>)}</div>
        </Card>
      )}

      {tab === "supplier" && (
        <Card>
          <SectionLabel>About {s.name}</SectionLabel>
          <div style={{ fontSize: 13, color: COLORS.textSec, lineHeight: 1.7, marginBottom: 14 }}>
            {s.name} is a demo supplier profile based in {s.province}, Canada, established {2026 - s.years}, exporting to {s.exportMarkets.join(", ")}.
          </div>
          <Row label="Products offered" value={s.products.map((id) => PRODUCTS.find((x) => x.id === id)?.name).join(", ")} />
          <Row label="Export markets" value={s.exportMarkets.join(", ")} />
          <Row label="Response rate" value={`${s.responseRate}%`} />
        </Card>
      )}

      {tab === "pricing" && (
        <Card>
          <SectionLabel>Pricing</SectionLabel>
          <Row label="Indicative price (FOB)" value={money(price) + "/MT"} />
          <Row label="Currency" value="USD" />
          <Row label="Price validity" value="7 days" />
          <div style={{ fontSize: 11.5, color: COLORS.textMut, marginTop: 10 }}>Price is indicative and subject to supplier confirmation. Use the landed cost calculator for a full delivered estimate.</div>
        </Card>
      )}

      {tab === "trade intelligence" && (
        <Card>
          <SectionLabel>Trade Intelligence</SectionLabel>
          {op ? (
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <OpportunityScoreRing score={op.score} size={80} />
              <div>
                <Badge tone={classify(op.score).tone}>{classify(op.score).label} Opportunity</Badge>
                <div style={{ fontSize: 12.5, color: COLORS.textSec, marginTop: 8 }}>
                  Canadian supply and {op.destination === "United Arab Emirates" ? "UAE" : op.destination} demand both trending favorably for {p.name.toLowerCase()}.
                </div>
              </div>
            </div>
          ) : <div style={{ fontSize: 12.5, color: COLORS.textMut }}>No opportunity score modeled for this corridor yet.</div>}
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12.5 }}>
      <span style={{ color: COLORS.textMut }}>{label}</span><span style={{ color: COLORS.textPri, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const primaryBtn = { background: COLORS.brand, color: "#fff", border: "none", borderRadius: 5, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const secondaryBtn = { background: "none", color: COLORS.textSec, border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };

/* =================================================================
   SUPPLIERS DIRECTORY + PROFILE
================================================================= */

function Suppliers({ onOpen, suppliers }) {
  return (
    <div>
      <SectionLabel sub="Canadian agricultural suppliers verified on OpenExport.">Supplier Directory</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {suppliers.map((s) => {
          const totalInv = Object.values(s.inventory).reduce((a, b) => a + b, 0);
          return (
            <Card key={s.id} onClick={() => onOpen(s.id)}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: COLORS.textPri }}>{s.name}</div>
                <VerifiedBadge level={s.verification} />
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMut, marginTop: 3 }}>{s.province}, Canada · {s.demo ? "Demo Supplier" : "Member since " + (s.joinedDate || "2026")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {s.products.map((id) => <Badge key={id} tone="brand">{PRODUCTS.find((p) => p.id === id)?.name}</Badge>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14, fontSize: 11.5 }}>
                <div><span style={{ color: COLORS.textMut }}>Available</span><br /><b style={{ color: COLORS.textPri }}>{fmt(totalInv)} MT</b></div>
                <div><span style={{ color: COLORS.textMut }}>Response</span><br /><b style={{ color: COLORS.textPri }}>&lt;{s.responseHrs}h</b></div>
                <div><span style={{ color: COLORS.textMut }}>Export markets</span><br /><b style={{ color: COLORS.textPri }}>{s.exportMarkets.length}</b></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SupplierProfile({ supplierId, onBack, onOpenProduct, suppliers }) {
  const s = suppliers.find((x) => x.id === supplierId);
  if (!s) return null;
  return (
    <div>
      <button onClick={onBack} style={{ ...linkBtnStyle, marginBottom: 14 }}>← Back to suppliers</button>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: COLORS.textPri }}>{s.name}</div>
            <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 4 }}>{s.province}, Canada · Established {2026 - s.years} · {s.demo ? "Demo Supplier profile" : ""}</div>
          </div>
          <VerifiedBadge level={s.verification} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <div><div style={{ fontSize: 11, color: COLORS.textMut }}>Years in business</div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, color: COLORS.textPri }}>{s.years}</div></div>
          <div><div style={{ fontSize: 11, color: COLORS.textMut }}>Response rate</div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, color: COLORS.textPri }}>{s.responseRate}%</div></div>
          <div><div style={{ fontSize: 11, color: COLORS.textMut }}>Avg. response time</div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, color: COLORS.textPri }}>&lt;{s.responseHrs}h</div></div>
          <div><div style={{ fontSize: 11, color: COLORS.textMut }}>Export markets</div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, color: COLORS.textPri }}>{s.exportMarkets.length}</div></div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <SectionLabel>Products & inventory</SectionLabel>
          {s.products.map((id) => {
            const p = PRODUCTS.find((x) => x.id === id);
            return (
              <div key={id} onClick={() => onOpenProduct(id, s.id)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}>
                <span style={{ fontSize: 13, color: COLORS.textPri }}>{p.name}</span>
                <span style={{ fontSize: 12, color: COLORS.textSec, fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(s.inventory[id])} MT</span>
              </div>
            );
          })}
        </Card>
        <Card>
          <SectionLabel>Certifications & markets</SectionLabel>
          <div style={{ fontSize: 11, color: COLORS.textMut, marginBottom: 6 }}>Certifications</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>{s.certifications.map((c) => <Badge key={c} tone="neutral">{c}</Badge>)}</div>
          <div style={{ fontSize: 11, color: COLORS.textMut, marginBottom: 6 }}>Export markets served</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{s.exportMarkets.map((m) => <Badge key={m} tone="brand">{m}</Badge>)}</div>
        </Card>
      </div>
    </div>
  );
}

/* =================================================================
   RFQ MARKETPLACE + CREATE + MATCHING
================================================================= */

function RFQMarketplace({ onOpen, onCreate, rfqs }) {
  return (
    <div>
      <SectionLabel right={<button onClick={onCreate} style={primaryBtn}>+ Post a Buying Request</button>} sub="Open buyer requests currently seeking Canadian suppliers.">RFQ Marketplace</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rfqs.map((r) => {
          const p = PRODUCTS.find((x) => x.id === r.productId);
          const b = rfqBuyerInfo(r);
          return (
            <Card key={r.id} onClick={() => onOpen(r.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <ProductIcon id={r.productId} size={24} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPri }}>{fmt(r.qty)} MT {p.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMut, marginTop: 2 }}>{b.name} · {r.destPort}, {r.destination} · Delivery {r.delivery}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {b.verification >= 2 && <Badge tone="good">Verified Buyer</Badge>}
                    <Badge tone="neutral">{r.incoterm}</Badge>
                    {r.certRequired && <Badge tone="gold">Cert. required</Badge>}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: COLORS.textMut, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}><Clock size={11} /> Closes {r.expiresOn}</div>
                <button style={{ ...secondaryBtn, marginTop: 8 }}>Submit Offer</button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RFQDetail({ rfqId, onBack, rfqs, suppliers }) {
  const r = rfqs.find((x) => x.id === rfqId);
  if (!r) return null;
  const p = PRODUCTS.find((x) => x.id === r.productId);
  const b = rfqBuyerInfo(r);
  const matches = matchSuppliers(r, suppliers);

  const offers = matches.slice(0, 3).map((m) => {
    const price = p.basePrice + (m.supplier.priceAdj[p.id] || 0);
    const lc = landedCost({ price, qty: r.qty, destination: r.destination, incoterm: r.incoterm });
    return { supplier: m.supplier, price, freight: lc.total - price, landed: lc.total, match: m.overall };
  });
  const bestLanded = Math.min(...offers.map((o) => o.landed));

  return (
    <div>
      <button onClick={onBack} style={{ ...linkBtnStyle, marginBottom: 14 }}>← Back to RFQs</button>
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Request for Quote</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <Row label="Product" value={p.name} /><Row label="Quantity" value={`${fmt(r.qty)} MT`} />
          <Row label="Destination" value={`${r.destPort}, ${r.destination}`} /><Row label="Delivery" value={r.delivery} />
          <Row label="Grade" value={r.grade} /><Row label="Packaging" value={r.packaging} />
          <Row label="Incoterm" value={r.incoterm} /><Row label="Payment" value={r.payment} />
        </div>
        {r.notes && <div style={{ fontSize: 12, color: COLORS.textSec, marginTop: 12, fontStyle: "italic" }}>"{r.notes}"</div>}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}><Badge tone="good">{b.name} — Verified Buyer</Badge></div>
      </Card>

      <SectionLabel sub="Ranked by product, quantity, quality, delivery, certification and market access match.">Matched Suppliers</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {matches.map((m) => (
          <Card key={m.supplier.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <OpportunityScoreRing score={m.overall} size={48} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPri }}>{m.supplier.name}</div>
                  <div style={{ fontSize: 11.5, color: COLORS.textMut }}>{m.supplier.province} · {fmt(m.supplier.inventory[r.productId])} MT available</div>
                </div>
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700, color: COLORS.brand }}>{m.overall}%</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
              {Object.entries(m.breakdown).map(([k, v]) => (
                <span key={k} style={{ fontSize: 10.5, color: COLORS.textMut, fontFamily: "'IBM Plex Mono', monospace" }}>{k}: <b style={{ color: COLORS.textPri }}>{v}%</b></span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <SectionLabel sub="Estimated landed cost comparison across the top matches.">Offer Comparison</SectionLabel>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", gap: 8, padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 10.5, color: COLORS.textMut, textTransform: "uppercase" }}>
          <span>Supplier</span><span>Price</span><span>Freight (est.)</span><span>Landed cost (est.)</span><span>Match</span>
        </div>
        {offers.map((o) => (
          <div key={o.supplier.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: COLORS.textPri, fontWeight: 600 }}>{o.supplier.name}</span>
            <span style={{ fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace" }}>{money(o.price)}</span>
            <span style={{ fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace" }}>{money(Math.round(o.freight))}</span>
            <span style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: o.landed === bestLanded ? COLORS.good : COLORS.textPri }}>
              {money(Math.round(o.landed))} {o.landed === bestLanded && <Badge tone="good">Best</Badge>}
            </span>
            <span style={{ fontSize: 12.5 }}>{o.match}%</span>
          </div>
        ))}
      </Card>
      <div style={{ marginTop: 8 }}><DataTag type="estimated" /> <span style={{ fontSize: 11, color: COLORS.textMut }}>Landed costs are estimates, not guaranteed quotes.</span></div>
    </div>
  );
}

function RFQCreate({ onPublish, initial }) {
  const [form, setForm] = useState({
    productId: initial?.productId || PRODUCTS[0].id,
    qty: initial?.qty || 1000,
    destination: initial?.destination || DESTINATIONS[0],
    delivery: "", grade: "Canada No. 1", packaging: "Bulk", incoterm: "CIF", payment: "Letter of Credit", certRequired: true, notes: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inputStyle = { width: "100%", background: COLORS.s2, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "9px 11px", fontSize: 13, color: COLORS.textPri, outline: "none", boxSizing: "border-box" };
  const label = { fontSize: 11.5, color: COLORS.textSec, marginBottom: 5, display: "block" };

  return (
    <div style={{ maxWidth: 620 }}>
      <SectionLabel sub={initial ? "Pre-filled from your search — review the details below and publish when ready." : undefined}>Request for Quote</SectionLabel>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={label}>Product</label><select style={inputStyle} value={form.productId} onChange={(e) => set("productId", e.target.value)}>{PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label style={label}>Quantity (MT)</label><input type="number" style={inputStyle} value={form.qty} onChange={(e) => set("qty", Number(e.target.value))} /></div>
          <div><label style={label}>Destination</label><select style={inputStyle} value={form.destination} onChange={(e) => set("destination", e.target.value)}>{DESTINATIONS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div><label style={label}>Delivery window</label><input style={inputStyle} placeholder="e.g. December 2026" value={form.delivery} onChange={(e) => set("delivery", e.target.value)} /></div>
          <div><label style={label}>Grade</label><input style={inputStyle} value={form.grade} onChange={(e) => set("grade", e.target.value)} /></div>
          <div><label style={label}>Packaging</label><select style={inputStyle} value={form.packaging} onChange={(e) => set("packaging", e.target.value)}><option>Bulk</option><option>25kg bags</option><option>50kg bags</option></select></div>
          <div><label style={label}>Incoterm</label><select style={inputStyle} value={form.incoterm} onChange={(e) => set("incoterm", e.target.value)}><option>FOB</option><option>CFR</option><option>CIF</option><option>DAP</option></select></div>
          <div><label style={label}>Payment preference</label><select style={inputStyle} value={form.payment} onChange={(e) => set("payment", e.target.value)}><option>Letter of Credit</option><option>T/T</option><option>Other</option></select></div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: COLORS.textSec, margin: "14px 0" }}>
          <input type="checkbox" checked={form.certRequired} onChange={(e) => set("certRequired", e.target.checked)} /> Quality certification required
        </label>
        <label style={label}>Additional notes</label>
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any additional requirements…" />
        <button onClick={() => onPublish(form)} style={{ ...primaryBtn, marginTop: 16, width: "100%", padding: "11px 0" }}>Publish RFQ</button>
      </Card>
    </div>
  );
}

/* =================================================================
   OPPORTUNITIES DASHBOARD
================================================================= */

function Opportunities({ rfqs, suppliers }) {
  const seenPair = new Set();
  const fromRfqs = [...rfqs].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo).filter((r) => {
    const key = r.productId + "|" + r.destination;
    if (seenPair.has(key)) return false;
    seenPair.add(key);
    return true;
  }).map((r) => deriveOpportunity(r.productId, r.destination, suppliers));
  // Keep the curated corridors visible too, even if no RFQ has been posted for them yet.
  const combined = [...fromRfqs];
  OPPORTUNITIES.forEach((op) => {
    if (!combined.some((c) => c.productId === op.productId && c.destination === op.destination)) combined.push(op);
  });

  return (
    <div>
      <SectionLabel sub="Analytical indicators combining supply, demand, price, logistics, competition and trade history. Generated from posted buying requests, newest first — not a guaranteed prediction.">
        Trade Opportunity Dashboard
      </SectionLabel>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <DataTag type="demo" /> <span style={{ fontSize: 11.5, color: COLORS.textMut }}>Scores shown are illustrative demo calculations.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {combined.map((op) => {
          const p = PRODUCTS.find((x) => x.id === op.productId);
          const c = classify(op.score);
          return (
            <Card key={op.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: COLORS.textPri }}>{p.name} → {op.destination}</div>
                  <Badge tone={c.tone}>{c.label}</Badge>
                </div>
                <OpportunityScoreRing score={op.score} size={64} />
              </div>
              <div style={{ marginTop: 16 }}>
                {Object.entries(op.factors).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: COLORS.textMut }}>{k}</span><span style={{ color: COLORS.textPri, fontFamily: "'IBM Plex Mono', monospace" }}>{v}</span>
                    </div>
                    <div style={{ height: 4, background: COLORS.s2, borderRadius: 2 }}><div style={{ width: `${v}%`, height: "100%", background: v >= 80 ? COLORS.good : v >= 60 ? COLORS.gold : COLORS.risk, borderRadius: 2 }} /></div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* =================================================================
   MARKET INTELLIGENCE
================================================================= */

function TreemapCell({ x, y, width, height, name, size, fill }) {
  if (width < 2 || height < 2) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill, stroke: "#fff", strokeWidth: 2 }} />
      {width > 60 && height > 30 && (
        <text x={x + 8} y={y + 20} fill="#fff" fontSize={12} fontWeight={700} fontFamily="Inter">{name}</text>
      )}
      {width > 60 && height > 44 && (
        <text x={x + 8} y={y + 38} fill="#fff" fontSize={11} fontFamily="IBM Plex Mono">${size}M</text>
      )}
    </g>
  );
}

/* =================================================================
   PRICES — Bloomberg-style market price board (spec section 21)
================================================================= */

function ConfidenceBadge({ confidence, sourceCount }) {
  const map = {
    high: { tone: "good", label: `Verified · ${sourceCount} sources agree` },
    medium: { tone: "gold", label: `Verified · ${sourceCount} sources, minor variance` },
    low: { tone: "risk", label: sourceCount > 1 ? "Sources disagree — flagged" : "Single source" },
  };
  const m = map[confidence] || map.low;
  return <Badge tone={m.tone}><ShieldCheck size={11} /> {m.label}</Badge>;
}

function Prices({ onOpenCompare }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <SectionLabel sub="Each price is the median across multiple independent government sources, cross-checked for agreement — not a single feed. Click a product to compare it across markets.">
        Market Prices
      </SectionLabel>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.9fr 0.7fr 1.7fr 0.6fr", gap: 8, padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 10.5, color: COLORS.textMut, textTransform: "uppercase" }}>
          <span>Product</span><span>Price (CAD/MT)</span><span>24h</span><span>Verification</span><span>Sources</span>
        </div>
        {PRICE_BOARD.map((p) => (
          <div key={p.id}>
            <div style={{
              display: "grid", gridTemplateColumns: "1.5fr 0.9fr 0.7fr 1.7fr 0.6fr", gap: 8, padding: "12px 16px",
              borderBottom: `1px solid ${expanded === p.id ? "transparent" : COLORS.border}`, alignItems: "center", cursor: "pointer",
            }} onClick={() => onOpenCompare(p.id)}>
              <span style={{ fontSize: 13, color: COLORS.textPri, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}><ProductIcon id={p.id} size={14} /> {p.name}</span>
              <span style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textPri, fontWeight: 700 }}>${p.basePrice}</span>
              <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: p.change >= 0 ? COLORS.good : COLORS.risk }}>
                {p.change >= 0 ? "▲" : "▼"} {Math.abs(p.change)}%
              </span>
              <ConfidenceBadge confidence={p.confidence} sourceCount={p.sources.length} />
              <button onClick={(e) => { e.stopPropagation(); setExpanded(expanded === p.id ? null : p.id); }} style={{
                ...secondaryBtn, padding: "4px 10px", fontSize: 11,
              }}>{expanded === p.id ? "Hide" : "View"}</button>
            </div>
            {expanded === p.id && (
              <div style={{ padding: "0 16px 14px 38px", borderBottom: `1px solid ${COLORS.border}` }}>
                {p.sources.map((s) => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0",
                    fontSize: 12, color: COLORS.textSec, textDecoration: "none", borderBottom: `1px solid ${COLORS.border}`,
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.brand2 }}>{s.name} <ArrowUpRight size={11} /></span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textPri }}>${s.value}/MT</span>
                  </a>
                ))}
                <div style={{ fontSize: 10.5, color: COLORS.textMut, marginTop: 8 }}>
                  Median of {p.sources.length} source{p.sources.length > 1 ? "s" : ""} shown above, cross-checked for agreement · Updated {p.updated} · <DataTag type={p.dataType} />
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>
      <div style={{ fontSize: 11, color: COLORS.textMut, marginTop: 10 }}>
        Sources: Government of Saskatchewan crop price dashboard, Statistics Canada Table 32-10-0077-01, and the Canadian Grain Commission's
        Grain Statistics Weekly — three independent organizations, cross-checked against each other rather than trusted individually.
        Values shown are placeholder figures shaped like a real automated feed; see the price pipeline for what makes this live.
      </div>
    </div>
  );
}

/* =================================================================
   PRICE COMPARE — stock-chart-style, per product, top 5 markets
================================================================= */

function PriceCompare({ productId, onBack }) {
  const [range, setRange] = useState("1D");
  const [primaryIdx, setPrimaryIdx] = useState(0);
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) return null;
  const countries = PRODUCT_COUNTRIES[productId] || PRODUCT_COUNTRIES["wheat"];
  const { rows, todayLabel } = generatePriceCompareData(productId, countries, range, p.basePrice);
  const primary = countries[primaryIdx][0];

  const actualRows = rows.filter((r) => r[primary] != null);
  const currentV = actualRows[actualRows.length - 1][primary];
  const prevClose = actualRows[0][primary];
  const dayChangeAbs = currentV - prevClose;
  const dayChangePct = (dayChangeAbs / prevClose) * 100;
  const up = dayChangeAbs >= 0;
  const trendColor = up ? COLORS.good : COLORS.risk;

  const rangeHigh = Math.max(...actualRows.map((r) => r[primary]));
  const rangeLow = Math.min(...actualRows.map((r) => r[primary]));
  const confidence = Math.max(48, 82 - Object.keys(RANGE_STEPS).indexOf(range) * 5 - (hashStr(productId) % 10));
  const lastForecastRow = rows[rows.length - 1];
  const forecastV = lastForecastRow[`${primary}__f`];

  return (
    <div>
      <button onClick={onBack} style={{ ...linkBtnStyle, marginBottom: 14 }}>← Back to prices</button>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>
        {/* MAIN CHART PANEL */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMut, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <ProductIcon id={p.id} size={13} /> {p.name} · {primary}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: COLORS.textPri }}>{fmt(currentV, 2)}</span>
                <span style={{ fontSize: 13, color: COLORS.textMut, fontWeight: 600 }}>USD</span>
                <span style={{
                  fontSize: 12.5, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
                  background: up ? "rgba(62,207,142,0.14)" : "rgba(229,72,77,0.14)", color: trendColor,
                }}>{up ? "↑" : "↓"} {Math.abs(dayChangePct).toFixed(2)}%</span>
                <span style={{ fontSize: 13, color: trendColor, fontWeight: 600 }}>{up ? "+" : ""}{fmt(dayChangeAbs, 2)} {range === "1D" ? "today" : `over ${range}`}</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMut, marginTop: 6 }}>
                Aug 31, 2026 · Demo data · <span style={{ textDecoration: "underline", cursor: "help" }} title="All prices, forecasts and comparisons on this page are illustrative demo data — not a live market feed.">Disclaimer</span>
              </div>
            </div>
            <button style={{
              background: COLORS.brand, border: "none", borderRadius: 20, padding: "9px 16px", color: "#fff",
              fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            }}><Bell size={13} /> Set Alert</button>
          </div>

          <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${COLORS.border}`, margin: "18px 0 16px" }}>
            {Object.keys(RANGE_STEPS).map((r) => (
              <button key={r} onClick={() => setRange(r)} style={{
                background: "none", border: "none", cursor: "pointer", padding: "8px 12px",
                fontSize: 12.5, fontWeight: 600, color: range === r ? COLORS.brand : COLORS.textMut,
                borderBottom: `2px solid ${range === r ? COLORS.brand : "transparent"}`, marginBottom: -1,
              }}>{r}</button>
            ))}
          </div>

          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={trendColor} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.border} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: COLORS.textMut, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: COLORS.border }} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 10, fill: COLORS.textMut, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={44} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: COLORS.s2, border: `1px solid ${COLORS.borderStrong}`, fontSize: 12, borderRadius: 4 }}
                  labelStyle={{ color: COLORS.textPri, fontWeight: 700, marginBottom: 4 }}
                  formatter={(value, name) => [value != null ? `$${value}` : "—", name]}
                />
                <ReferenceLine y={prevClose} stroke={COLORS.textMut} strokeDasharray="2 3" label={{ value: "Previous close", position: "insideBottomRight", fill: COLORS.textMut, fontSize: 10 }} />
                <ReferenceLine x={todayLabel} stroke={COLORS.gold} strokeDasharray="4 3" label={{ value: "Today", position: "insideTopRight", fill: COLORS.gold, fontSize: 10 }} />
                {countries.map(([country], i) => i !== primaryIdx && (
                  <Area key={country} type="monotone" dataKey={country} name={country} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={1.25} fill="none" dot={false} isAnimationActive={false} opacity={0.55} />
                ))}
                {countries.map(([country], i) => i !== primaryIdx && (
                  <Area key={country + "_f"} type="monotone" dataKey={`${country}__f`} name={country} legendType="none" stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={1.25} strokeDasharray="4 3" fill="none" dot={false} isAnimationActive={false} opacity={0.55} />
                ))}
                <Area type="monotone" dataKey={primary} name={primary} stroke={trendColor} strokeWidth={2.5} fill="url(#priceAreaGradient)" dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey={`${primary}__f`} name={primary} legendType="none" stroke={trendColor} strokeWidth={2.5} strokeDasharray="5 4" fill="none" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 10.5, color: COLORS.textMut, marginTop: 6 }}>
            {primary} shown as the featured market (click any market on the right to feature it) · dashed = forecast, not guaranteed.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 22, paddingTop: 18, borderTop: `1px solid ${COLORS.border}` }}>
            <div>
              <StatRow label="Open" value={`$${fmt(prevClose, 2)}`} />
              <StatRow label="High" value={`$${fmt(rangeHigh, 2)}`} />
              <StatRow label="Low" value={`$${fmt(rangeLow, 2)}`} />
            </div>
            <div>
              <StatRow label="Markets tracked" value={countries.length} />
              <StatRow label="Grade" value={p.grade} />
              <StatRow label="Category" value={CATEGORIES.find((c) => c.id === p.category)?.name} />
            </div>
            <div>
              <StatRow label="Forecast" value={`$${fmt(forecastV, 2)}`} highlight={COLORS.gold} />
              <StatRow label="Confidence" value={`${confidence}%`} />
              <StatRow label="Source" value="Sask. Dashboard" />
            </div>
          </div>
        </Card>

        {/* SIDE PANEL — top markets */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.textPri }}>
            Top 5 Markets
          </div>
          {countries.map(([country], i) => {
            const cRows = rows.filter((r) => r[country] != null);
            const cCurrent = cRows[cRows.length - 1][country];
            const cStart = cRows[0][country];
            const cChg = ((cCurrent - cStart) / cStart) * 100;
            const isPrimary = i === primaryIdx;
            return (
              <button key={country} onClick={() => setPrimaryIdx(i)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                padding: "13px 16px", background: isPrimary ? COLORS.s2 : "none", border: "none",
                borderBottom: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${isPrimary ? LINE_COLORS[i % LINE_COLORS.length] : "transparent"}`,
                cursor: "pointer", textAlign: "left",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPri }}>{country}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMut, fontFamily: "'IBM Plex Mono', monospace" }}>${fmt(cCurrent, 2)} USD</div>
                </div>
                <span style={{
                  fontSize: 11.5, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
                  background: cChg >= 0 ? "rgba(62,207,142,0.14)" : "rgba(229,72,77,0.14)", color: cChg >= 0 ? COLORS.good : COLORS.risk,
                }}>{cChg >= 0 ? "↑" : "↓"} {Math.abs(cChg).toFixed(2)}%</span>
              </button>
            );
          })}
          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: COLORS.textMut, marginBottom: 8 }}>Quality specifications</div>
            <StatRow label="Category" value={CATEGORIES.find((c) => c.id === p.category)?.name} />
            <StatRow label="HS code" value={p.hsCode} />
            <StatRow label="Reference grade" value={p.grade} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5 }}>
      <span style={{ color: COLORS.textMut }}>{label}</span>
      <span style={{ color: highlight || COLORS.textPri, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</span>
    </div>
  );
}

/* =================================================================
   NEWS
================================================================= */

function NewsRow({ n }) {
  return (
    <a href={n.url} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", gap: 12, textDecoration: "none", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}`,
    }}>
      <FileText size={14} color={COLORS.textMut} style={{ marginTop: 3, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <Badge tone="gold">{n.tag}</Badge>
          <span style={{ fontSize: 10.5, color: COLORS.textMut, fontFamily: "'IBM Plex Mono', monospace" }}>{n.source} · {n.time}</span>
        </div>
        <div style={{ fontSize: 13.5, color: COLORS.textPri, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>{n.headline}</div>
        <div style={{ fontSize: 12, color: COLORS.textSec, lineHeight: 1.6 }}>{n.summary}</div>
      </div>
    </a>
  );
}

function News() {
  return (
    <div>
      <SectionLabel sub="Condensed from public market reporting on Canadian pulses and grain trade — not OpenExport's own analysis.">Latest Trade News</SectionLabel>
      <Card>
        {MARKET_NEWS.map((n) => <NewsRow key={n.id} n={n} />)}
      </Card>
    </div>
  );
}

function MarketIntelligence() {
  const [country, setCountry] = useState("United Arab Emirates");
  const total = TREEMAP_DATA.reduce((s, d) => s + d.size, 0);
  return (
    <div>
      <SectionLabel sub="Historical/demo figures conceptually inspired by published Canadian export data — not a live feed.">Market Intelligence</SectionLabel>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ ...secondaryBtn, appearance: "auto" }}>{DESTINATIONS.map((d) => <option key={d}>{d}</option>)}</select>
          <DataTag type="historical" />
        </div>
        <SectionLabel>Canada's Agricultural Exports to {country === "United Arab Emirates" ? "UAE" : country} — ${fmt(total, 1)}M total</SectionLabel>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap data={TREEMAP_DATA} dataKey="size" stroke="#fff" content={<TreemapCell />} />
          </ResponsiveContainer>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionLabel>Total export value over time</SectionLabel>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TRADE_TREND}>
                <CartesianGrid stroke={COLORS.border} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: COLORS.textMut }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: COLORS.textMut }} axisLine={false} tickLine={false} width={36} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={COLORS.brand} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 6 }}><DataTag type="historical" /></div>
        </Card>
        <Card>
          <SectionLabel>Export value by category</SectionLabel>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TREEMAP_DATA} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: COLORS.textSec }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="size" radius={[0, 3, 3, 0]}>
                  {TREEMAP_DATA.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 6 }}><DataTag type="historical" /></div>
        </Card>
      </div>
    </div>
  );
}

/* =================================================================
   LANDED COST CALCULATOR
================================================================= */

function LandedCostCalculator({ initial }) {
  const [productId, setProductId] = useState(initial?.productId || PRODUCTS[0].id);
  const [price, setPrice] = useState(initial?.price || PRODUCTS[0].basePrice);
  const [qty, setQty] = useState(2000);
  const [destination, setDestination] = useState("United Arab Emirates");
  const [incoterm, setIncoterm] = useState("CIF");

  const result = useMemo(() => landedCost({ price: Number(price), qty: Number(qty), destination, incoterm }), [price, qty, destination, incoterm]);
  const inputStyle = { width: "100%", background: COLORS.s2, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "9px 11px", fontSize: 13, color: COLORS.textPri, outline: "none", boxSizing: "border-box" };
  const label = { fontSize: 11.5, color: COLORS.textSec, marginBottom: 5, display: "block" };

  return (
    <div>
      <SectionLabel sub="Estimates supplier price plus inland transport, ocean freight, insurance, destination handling and customs.">Landed Cost Calculator</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div><label style={label}>Product</label><select style={inputStyle} value={productId} onChange={(e) => { setProductId(e.target.value); setPrice(PRODUCTS.find((p) => p.id === e.target.value).basePrice); }}>{PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label style={label}>Supplier price (USD/MT)</label><input type="number" style={inputStyle} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div><label style={label}>Quantity (MT)</label><input type="number" style={inputStyle} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
            <div><label style={label}>Destination</label><select style={inputStyle} value={destination} onChange={(e) => setDestination(e.target.value)}>{DESTINATIONS.map((d) => <option key={d}>{d}</option>)}</select></div>
            <div><label style={label}>Incoterm</label><select style={inputStyle} value={incoterm} onChange={(e) => setIncoterm(e.target.value)}><option>FOB</option><option>CFR</option><option>CIF</option></select></div>
          </div>
        </Card>
        <Card>
          <SectionLabel>Estimated landed cost</SectionLabel>
          {result.components.map((c) => (
            <div key={c.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 12.5, color: COLORS.textSec, display: "flex", alignItems: "center", gap: 8 }}>{c.label} <DataTag type={c.type} /></span>
              <span style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textPri }}>{money(c.value, 1)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 4px" }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.textPri }}>Estimated landed cost</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 700, color: COLORS.brand }}>{money(result.total, 1)}/MT</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textMut }}>
            <span>Estimated transaction value ({fmt(qty)} MT)</span><span style={{ color: COLORS.textPri, fontWeight: 600 }}>{money(result.transactionValue)}</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textMut }}>This is an estimate, not a guaranteed price. Confirm freight and duty rates with your logistics provider before contracting.</div>
        </Card>
      </div>
    </div>
  );
}

/* =================================================================
   DASHBOARDS
================================================================= */

function StatCard({ label, value, icon: Icon }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMut, textTransform: "uppercase" }}>{label}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 700, color: COLORS.textPri, marginTop: 6 }}>{value}</div>
        </div>
        {Icon && <Icon size={16} color={COLORS.textMut} />}
      </div>
    </Card>
  );
}

function SupplierDashboard({ rfqs, suppliers, user }) {
  const own = user ? suppliers.find((sp) => sp.name === user.companyName) : null;
  const s = own || suppliers[0];
  const viewingLabel = own ? `Signed in as ${s.name}` : `Viewing as ${s.name} (demo supplier account)`;
  const inventoryData = s.products.map((id) => ({ name: PRODUCTS.find((p) => p.id === id)?.name, mt: s.inventory[id] }));
  const relevantRfqs = rfqs.filter((r) => s.products.includes(r.productId));
  return (
    <div>
      <SectionLabel sub={viewingLabel}>Supplier Dashboard</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Active inventory" value={`${fmt(Object.values(s.inventory).reduce((a, b) => a + b, 0))} MT`} icon={Package} />
        <StatCard label="Buyer requests" value={relevantRfqs.length} icon={FileText} />
        <StatCard label="Active offers" value={3} icon={Send} />
        <StatCard label="Sales pipeline" value="$1.8M" icon={TrendingUp} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionLabel>Inventory by product</SectionLabel>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData}>
                <CartesianGrid stroke={COLORS.border} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: COLORS.textSec }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: COLORS.textMut }} axisLine={false} tickLine={false} width={36} />
                <Tooltip />
                <Bar dataKey="mt" fill={COLORS.brand} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionLabel>Open buyer requests matching your products</SectionLabel>
          {relevantRfqs.map((r) => {
            const p = PRODUCTS.find((x) => x.id === r.productId);
            return (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12.5 }}>
                <span style={{ color: COLORS.textPri }}>{fmt(r.qty)} MT {p.name} · {r.destination}</span>
                <span style={{ color: COLORS.textMut }}>{r.delivery}</span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

function BuyerDashboard({ rfqs, user, suppliers, buyers }) {
  const b = buyers[0];
  const myRfqs = user
    ? rfqs.filter((r) => r.buyerName === user.companyName || rfqBuyerInfo(r).name === user.companyName)
    : rfqs.filter((r) => r.buyerId === b.id);
  const viewingLabel = user ? `Signed in as ${user.companyName}` : `Viewing as ${b.name} (demo buyer account)`;
  return (
    <div>
      <SectionLabel sub={viewingLabel}>Buyer Dashboard</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Active RFQs" value={myRfqs.length} icon={FileText} />
        <StatCard label="Supplier offers" value={18} icon={Send} />
        <StatCard label="Active purchases" value={3} icon={ClipboardList} />
        <StatCard label="Pipeline value" value="$4.2M" icon={TrendingUp} />
      </div>
      <Card>
        <SectionLabel>Your open RFQs</SectionLabel>
        {myRfqs.length === 0 && (
          <div style={{ fontSize: 12.5, color: COLORS.textMut, padding: "8px 0" }}>
            No open RFQs yet — post a buying request to see it appear here and in the RFQ Marketplace.
          </div>
        )}
        {myRfqs.map((r) => {
          const p = PRODUCTS.find((x) => x.id === r.productId);
          const matches = matchSuppliers(r);
          return (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <div style={{ fontSize: 13, color: COLORS.textPri, fontWeight: 600 }}>{fmt(r.qty)} MT {p.name} → {r.destination}</div>
                <div style={{ fontSize: 11.5, color: COLORS.textMut }}>{matches.length} matched suppliers · closes {r.expiresOn}</div>
              </div>
              <Badge tone="brand">{r.incoterm}</Badge>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* =================================================================
   ACCOUNTS, AUTH — real signup/verify/login flow (client-side
   simulation; see closing notes on what a production backend needs).
================================================================= */

const ACCOUNT_TYPES = [
  { id: "buyer", label: "Buyer / Importer", desc: "I want to purchase Canadian agricultural products", icon: Package },
  { id: "supplier", label: "Supplier / Exporter", desc: "I want to sell Canadian agricultural products", icon: Sprout },
  { id: "logistics", label: "Logistics / Shipping Company", desc: "I move agricultural cargo by ocean, rail or road", icon: Ship },
  { id: "chamber", label: "Chamber of Commerce", desc: "I represent a national or regional trade body", icon: Landmark },
];

// An account can be a buyer, a supplier, or both — accountRoles() normalizes
// both the new multi-role accounts and the older single-accountType seed
// accounts into one array so every consumer can treat them the same way.
function accountRoles(acc) {
  return acc.roles && acc.roles.length ? acc.roles : [acc.accountType];
}
function roleLabel(acc) {
  return accountRoles(acc).map((r) => ACCOUNT_TYPES.find((t) => t.id === r)?.label || r).join(" & ");
}

function makeActivity(type, actor, detail, minsAgo) {
  const d = new Date(); d.setMinutes(d.getMinutes() - minsAgo);
  return { id: `act-${Math.random().toString(36).slice(2, 9)}`, type, actor, detail, time: d.toISOString() };
}

const SEED_ACCOUNTS = [
  { id: "u0", accountType: "admin", companyName: "OpenExport Platform Team", contactName: "Site Administrator", email: "admin@openexport.io", password: "admin123", country: "Canada", status: "active", isAdmin: true, joinedDate: "2026-01-04" },
  { id: "u1", accountType: "buyer", companyName: "Dubai Food Imports LLC", contactName: "Amira Hassan", email: "amira@dubaifoodimports.example", password: "demo1234", country: "United Arab Emirates", status: "active", isAdmin: false, joinedDate: "2026-03-11" },
  { id: "u2", accountType: "supplier", companyName: "Prairie Valley Farms", contactName: "Grant McAllister", email: "grant@prairievalley.example", password: "demo1234", country: "Canada", status: "active", isAdmin: false, joinedDate: "2026-02-18" },
  { id: "u3", accountType: "logistics", companyName: "Northern Star Ocean Freight", contactName: "Priya Nair", email: "priya@northernstarfreight.example", password: "demo1234", country: "Canada", status: "active", isAdmin: false, joinedDate: "2026-04-02" },
  { id: "u4", accountType: "chamber", companyName: "Canada-Gulf Chamber of Commerce", contactName: "David Okafor", email: "david@canadagulfchamber.example", password: "demo1234", country: "Canada", status: "active", isAdmin: false, joinedDate: "2026-01-22" },
  { id: "u5", accountType: "buyer", companyName: "Anatolia Foodstuffs Trading", contactName: "Emre Yildiz", email: "emre@anatoliafoods.example", password: "demo1234", country: "Turkey", status: "pending", isAdmin: false, joinedDate: "2026-08-25" },
];

const INITIAL_ACTIVITY = [
  makeActivity("signup", "Anatolia Foodstuffs Trading", "created a buyer account", 40),
  makeActivity("rfq", "Dubai Food Imports LLC", "posted RFQ for 2,000 MT Red Lentils → UAE", 190),
  makeActivity("offer", "Prairie Valley Farms", "submitted an offer on RFQ #r1", 175),
  makeActivity("verify", "OpenExport Platform Team", "verified Northern Star Ocean Freight (Logistics)", 300),
  makeActivity("chamber", "David Okafor", "created the Canada-Gulf Chamber of Commerce", 4200),
  makeActivity("message", "Amira Hassan", "messaged Prairie Valley Farms", 60),
  makeActivity("login", "Grant McAllister", "signed in", 20),
];

/* =================================================================
   CHAMBERS OF COMMERCE
================================================================= */

const CHAMBERS = [
  { id: "c1", country: "Canada", province: "National", name: "Canada-Gulf Chamber of Commerce", founded: 2026, members: 84, verified: true, rep: "David Okafor", description: "Represents Canadian agricultural exporters trading into the GCC region on OpenExport." },
  { id: "c2", country: "United Arab Emirates", name: "UAE Food & Agri Trade Council", founded: 2025, members: 62, verified: true, rep: "Fatima Al-Suwaidi", description: "Represents UAE-based importers, distributors and food processors sourcing agricultural commodities." },
  { id: "c3", country: "Saudi Arabia", name: "Saudi Agricultural Importers Chamber", founded: 2026, members: 39, verified: true, rep: "Khalid Al-Mansour", description: "Coordinates Saudi buyer interests for pulses, grains and oilseeds imports." },
  { id: "c4", country: "Egypt", name: "Egypt Grain Trade Chamber", founded: 2025, members: 51, verified: false, rep: "Nour El-Sayed", description: "Newly formed body representing Egyptian wheat and legume importers." },
  { id: "c5", country: "Turkey", name: "Anatolia Trade & Commerce Union", founded: 2024, members: 47, verified: true, rep: "Emre Yildiz", description: "Represents Turkish pulse and grain trading houses active in Canadian sourcing." },
  { id: "c6", country: "Canada", province: "Saskatchewan", name: "Saskatchewan Pulse & Grain Chamber", founded: 2025, members: 133, verified: true, rep: "Colleen Fraser", description: "Represents Saskatchewan lentil, pea and grain producers exporting through OpenExport." },
  { id: "c7", country: "Canada", province: "Alberta", name: "Alberta Agricultural Export Chamber", founded: 2025, members: 98, verified: true, rep: "Ryan Thibault", description: "Coordinates Alberta wheat, barley, oat and pulse exporters trading internationally." },
  { id: "c8", country: "Canada", province: "Manitoba", name: "Manitoba Trade Chamber", founded: 2024, members: 71, verified: true, rep: "Sana Malik", description: "Represents Manitoba canola and rapeseed suppliers and their export partners." },
  { id: "c9", country: "Canada", province: "Ontario", name: "Ontario Grain Exporters Chamber", founded: 2026, members: 44, verified: false, rep: "Tom Delaney", description: "Newly formed body for Ontario grain suppliers expanding into export and domestic trade." },
  { id: "c10", country: "Canada", province: "Quebec", name: "Quebec Agri-Trade Chamber", founded: 2026, members: 29, verified: false, rep: "Isabelle Roy", description: "Represents Quebec pulse, oat and canola producers entering export markets." },
  { id: "c11", country: "Canada", province: "British Columbia", name: "British Columbia Export Chamber", founded: 2025, members: 56, verified: true, rep: "Wei Chen", description: "Represents BC-based exporters and Port of Vancouver logistics partners." },
];

function Chambers({ onOpen, onCreate }) {
  return (
    <div>
      <SectionLabel
        right={<button onClick={onCreate} style={primaryBtn}><PlusCircle size={13} /> Create Your Country's Chamber</button>}
        sub="OpenExport is building toward a global chamber-of-commerce network — every country can establish its own chamber here to represent its trading community."
      >Chambers of Commerce</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {CHAMBERS.map((c) => (
          <Card key={c.id} onClick={() => onOpen(c.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Landmark size={22} color={COLORS.brand} />
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.textPri }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMut, marginTop: 2 }}>{c.province && c.province !== "National" ? `${c.province}, ` : ""}{c.country} · Founded {c.founded}</div>
                </div>
              </div>
              {c.verified ? <Badge tone="good"><BadgeCheck size={11} /> Verified Chamber</Badge> : <Badge tone="gold">Pending Verification</Badge>}
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.textSec, marginTop: 12, lineHeight: 1.6 }}>{c.description}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.border}`, fontSize: 11.5 }}>
              <span style={{ color: COLORS.textMut }}>Representative: <b style={{ color: COLORS.textPri }}>{c.rep}</b></span>
              <span style={{ color: COLORS.textMut }}>{c.members} members</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ChamberProfile({ chamberId, onBack, suppliers, buyers }) {
  const c = CHAMBERS.find((x) => x.id === chamberId);
  if (!c) return null;
  const relatedBuyers = buyers.filter((b) => b.country === c.country);
  const relatedSuppliers = c.country === "Canada"
    ? suppliers.filter((s) => !c.province || c.province === "National" || s.province === c.province)
    : [];
  return (
    <div>
      <button onClick={onBack} style={{ ...linkBtnStyle, marginBottom: 14 }}>← Back to chambers</button>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Landmark size={30} color={COLORS.brand} />
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: COLORS.textPri }}>{c.name}</div>
              <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 4 }}>{c.province ? `${c.province}, ` : ""}{c.country} · Founded {c.founded} · Represented by {c.rep}</div>
            </div>
          </div>
          {c.verified ? <Badge tone="good"><BadgeCheck size={11} /> Verified Chamber</Badge> : <Badge tone="gold">Pending Verification</Badge>}
        </div>
        <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 14, lineHeight: 1.7 }}>{c.description}</div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <SectionLabel>Member suppliers</SectionLabel>
          {relatedSuppliers.length ? relatedSuppliers.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12.5 }}>
              <span style={{ color: COLORS.textPri }}>{s.name}</span><span style={{ color: COLORS.textMut }}>{s.province}</span>
            </div>
          )) : <div style={{ fontSize: 12, color: COLORS.textMut }}>No linked suppliers in this demo yet.</div>}
        </Card>
        <Card>
          <SectionLabel>Member buyers</SectionLabel>
          {relatedBuyers.length ? relatedBuyers.map((b) => (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12.5 }}>
              <span style={{ color: COLORS.textPri }}>{b.name}</span><span style={{ color: COLORS.textMut }}>{b.orderSize}</span>
            </div>
          )) : <div style={{ fontSize: 12, color: COLORS.textMut }}>No linked buyers in this demo yet.</div>}
        </Card>
      </div>
    </div>
  );
}

function CreateChamber({ onCreate }) {
  const [form, setForm] = useState({ country: "", name: "", contactName: "", email: "", description: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inputStyle = { width: "100%", background: COLORS.s2, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "9px 11px", fontSize: 13, color: COLORS.textPri, outline: "none", boxSizing: "border-box" };
  const label = { fontSize: 11.5, color: COLORS.textSec, marginBottom: 5, display: "block" };
  return (
    <div style={{ maxWidth: 560 }}>
      <SectionLabel sub="Any country not yet represented can establish its official OpenExport chamber. New chambers start as Pending Verification.">Create Your Country's Chamber of Commerce</SectionLabel>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={label}>Country</label><input style={inputStyle} value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="e.g. Indonesia" /></div>
          <div><label style={label}>Chamber name</label><input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Indonesia Agri-Trade Chamber" /></div>
          <div><label style={label}>Representative name</label><input style={inputStyle} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} /></div>
          <div><label style={label}>Contact email</label><input style={inputStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
        </div>
        <label style={{ ...label, marginTop: 12 }}>Description</label>
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What trading community will this chamber represent?" />
        <button onClick={() => onCreate(form)} style={{ ...primaryBtn, marginTop: 16, width: "100%", padding: "11px 0" }}>Submit Chamber for Verification</button>
      </Card>
    </div>
  );
}

/* =================================================================
   LOGISTICS / SHIPPING PROVIDERS
================================================================= */

const LOGISTICS_PROVIDERS = [
  { id: "l1", name: "Northern Star Ocean Freight", demo: true, country: "Canada", services: ["Ocean Freight", "Customs Brokerage"], routes: ["Vancouver → Jebel Ali", "Vancouver → Jeddah", "Montreal → Hamburg"], verification: 3, responseHrs: 10 },
  { id: "l2", name: "Prairie Rail Logistics", demo: true, country: "Canada", services: ["Rail", "Inland Trucking"], routes: ["Saskatchewan → Vancouver", "Alberta → Thunder Bay"], verification: 4, responseHrs: 6 },
  { id: "l3", name: "Gulf Maritime Shipping Co.", demo: true, country: "United Arab Emirates", services: ["Ocean Freight", "Destination Handling"], routes: ["Jebel Ali → Regional GCC ports"], verification: 3, responseHrs: 14 },
  { id: "l4", name: "Bosphorus Freight Forwarders", demo: true, country: "Turkey", services: ["Ocean Freight", "Customs Brokerage"], routes: ["Istanbul → Black Sea region"], verification: 2, responseHrs: 20 },
  { id: "l5", name: "Nile Logistics Group", demo: true, country: "Egypt", services: ["Ocean Freight", "Warehousing"], routes: ["Alexandria → Cairo distribution"], verification: 3, responseHrs: 16 },
];

function Logistics({ onOpen }) {
  return (
    <div>
      <SectionLabel sub="Freight forwarders, ocean carriers, rail and trucking providers moving Canadian agricultural cargo.">Logistics & Shipping Directory</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {LOGISTICS_PROVIDERS.map((l) => (
          <Card key={l.id} onClick={() => onOpen(l.id)}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Anchor size={20} color={COLORS.brand} />
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.textPri }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMut, marginTop: 2 }}>{l.country} · {l.demo ? "Demo Provider" : ""}</div>
                </div>
              </div>
              <VerifiedBadge level={l.verification} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {l.services.map((s) => <Badge key={s} tone="brand">{s}</Badge>)}
            </div>
            <div style={{ fontSize: 11.5, color: COLORS.textSec, marginTop: 10 }}>Routes: {l.routes.join(" · ")}</div>
            <div style={{ fontSize: 11, color: COLORS.textMut, marginTop: 8 }}>Avg. response: &lt;{l.responseHrs}h</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LogisticsProfile({ providerId, onBack }) {
  const l = LOGISTICS_PROVIDERS.find((x) => x.id === providerId);
  if (!l) return null;
  return (
    <div>
      <button onClick={onBack} style={{ ...linkBtnStyle, marginBottom: 14 }}>← Back to logistics directory</button>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Anchor size={28} color={COLORS.brand} />
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: COLORS.textPri }}>{l.name}</div>
              <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 4 }}>{l.country} · {l.demo ? "Demo Provider profile" : ""}</div>
            </div>
          </div>
          <VerifiedBadge level={l.verification} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMut, marginBottom: 6 }}>Services offered</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{l.services.map((s) => <Badge key={s} tone="brand">{s}</Badge>)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMut, marginBottom: 6 }}>Routes served</div>
            {l.routes.map((r) => <div key={r} style={{ fontSize: 12.5, color: COLORS.textPri, padding: "3px 0" }}>{r}</div>)}
          </div>
        </div>
        <Row label="Average response time" value={`< ${l.responseHrs} hours`} />
      </Card>
    </div>
  );
}

/* =================================================================
   HUB — messaging + personal dashboard
================================================================= */

function seedConversations(currentUser) {
  return [
    {
      id: "conv1",
      with: "Prairie Valley Farms",
      messages: [
        { from: "them", text: "Thanks for your interest — happy to send our latest quality certificate for red lentils.", time: "09:14" },
        { from: "me", text: "Great, please also confirm availability for December loading.", time: "09:20" },
        { from: "them", text: "Confirmed — 500 MT available for December, Vancouver loading.", time: "09:31" },
      ],
    },
    {
      id: "conv2",
      with: "Northern Star Ocean Freight",
      messages: [
        { from: "them", text: "We can offer a competitive rate on the Vancouver → Jebel Ali route this quarter.", time: "Yesterday" },
      ],
    },
  ];
}

/* =================================================================
   COMMUNITY — global chat rooms. Anyone can see that conversations
   are happening; only signed-in, verified members can read or post.
================================================================= */

const GLOBAL_ROOMS = [
  {
    id: "room1", name: "Canadian Exporters Trade Desk", topic: "General buyer/supplier discussion across all Canada export corridors",
    membersCount: 214, lastActivity: "4 minutes ago",
    messages: [
      { from: "Prairie Valley Farms", text: "Anyone shipped red lentils to Jebel Ali this month? Curious about current transit times.", time: "10:02" },
      { from: "Gulf Grain Trading Co.", text: "About 26-28 days door to door right now, slightly longer than usual.", time: "10:06" },
      { from: "Dubai Food Imports LLC", text: "Confirming — we received our October shipment in 27 days.", time: "10:11" },
    ],
  },
  {
    id: "room2", name: "Chamber of Commerce Lounge", topic: "For verified chamber representatives worldwide",
    membersCount: 58, lastActivity: "1 hour ago",
    messages: [
      { from: "Canada-Gulf Chamber of Commerce", text: "Welcome to any newly verified chambers — happy to help you get set up.", time: "09:10" },
      { from: "UAE Food & Agri Trade Council", text: "Appreciated — looking forward to coordinating more joint trade missions.", time: "09:22" },
    ],
  },
  {
    id: "room3", name: "Logistics & Freight Exchange", topic: "Shipping companies and exporters comparing routes and rates",
    membersCount: 97, lastActivity: "38 minutes ago",
    messages: [
      { from: "Northern Star Ocean Freight", text: "Ocean rates to Jeddah ticking up slightly this week — booking early recommended.", time: "08:40" },
      { from: "Prairie Rail Logistics", text: "Rail capacity out of Saskatchewan looks good through November.", time: "08:55" },
    ],
  },
  {
    id: "room4", name: "Pulses & Legumes Traders", topic: "Product-specific discussion for lentils, peas and chickpeas",
    membersCount: 143, lastActivity: "12 minutes ago",
    messages: [
      { from: "Western Canadian Pulses", text: "Green lentil supply is heavy this year — good time for buyers to lock in volume.", time: "11:15" },
      { from: "Anatolia Foodstuffs Trading", text: "Seeing the same on our end, prices staying soft for now.", time: "11:20" },
    ],
  },
];

function Community({ user, onNav }) {
  const [activeRoomId, setActiveRoomId] = useState(GLOBAL_ROOMS[0].id);
  const [rooms, setRooms] = useState(GLOBAL_ROOMS);
  const [draft, setDraft] = useState("");
  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  if (!user) {
    return (
      <div>
        <SectionLabel sub="OpenExport's global trade community — buyers, suppliers, chambers and logistics providers from around the world, talking in real time.">Community</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 20 }}>
          {GLOBAL_ROOMS.map((r) => (
            <Card key={r.id} style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.textPri }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMut, marginTop: 3 }}>{r.topic}</div>
                </div>
                <MessageSquare size={16} color={COLORS.textMut} />
              </div>
              <div style={{ fontSize: 11.5, color: COLORS.textSec, marginTop: 12 }}>{r.membersCount} members · active {r.lastActivity}</div>
              <div style={{ marginTop: 10, filter: "blur(3px)", userSelect: "none", pointerEvents: "none" }}>
                {r.messages.slice(0, 1).map((m, i) => (
                  <div key={i} style={{ fontSize: 12, color: COLORS.textSec, background: COLORS.s2, borderRadius: 6, padding: "8px 10px" }}>
                    <b>{m.from}:</b> {m.text}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <Card style={{ textAlign: "center", padding: 28 }}>
          <ShieldCheck size={22} color={COLORS.gold} style={{ marginBottom: 8 }} />
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.textPri, marginBottom: 6 }}>Members only</div>
          <div style={{ fontSize: 12.5, color: COLORS.textSec, marginBottom: 16 }}>Sign in as a verified buyer, supplier, logistics provider or chamber to read and join these conversations.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => onNav("login")} style={secondaryBtn}>Sign In</button>
            <button onClick={() => onNav("signup")} style={primaryBtn}>Create Account</button>
          </div>
        </Card>
      </div>
    );
  }

  const send = () => {
    if (!draft.trim()) return;
    setRooms((rs) => rs.map((r) => r.id === activeRoomId
      ? { ...r, messages: [...r.messages, { from: user.companyName, text: draft.trim(), time: "Now" }] }
      : r));
    setDraft("");
  };

  return (
    <div>
      <SectionLabel sub="You're signed in as a verified member — visible to other members in these rooms.">Community</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.textMut, textTransform: "uppercase" }}>Rooms</div>
          {rooms.map((r) => (
            <button key={r.id} onClick={() => setActiveRoomId(r.id)} style={{
              display: "block", width: "100%", textAlign: "left", padding: "12px 16px",
              background: activeRoomId === r.id ? COLORS.s2 : "none", border: "none", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer",
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.textPri }}>{r.name}</div>
              <div style={{ fontSize: 10.5, color: COLORS.textMut, marginTop: 2 }}>{r.membersCount} members</div>
            </button>
          ))}
        </Card>
        <Card style={{ padding: 0, display: "flex", flexDirection: "column", height: 460 }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPri, fontFamily: "'Space Grotesk', sans-serif" }}>{activeRoom.name}</div>
            <div style={{ fontSize: 11, color: COLORS.textMut, marginTop: 2 }}>{activeRoom.topic}</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {activeRoom.messages.map((m, i) => (
              <div key={i} style={{ maxWidth: "80%", alignSelf: m.from === user.companyName ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: 10.5, color: COLORS.textMut, marginBottom: 3, textAlign: m.from === user.companyName ? "right" : "left" }}>{m.from}</div>
                <div style={{
                  background: m.from === user.companyName ? COLORS.brand : COLORS.s2, color: m.from === user.companyName ? "#fff" : COLORS.textPri,
                  borderRadius: 8, padding: "8px 12px", fontSize: 12.5,
                }}>{m.text}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${COLORS.border}` }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={`Message ${activeRoom.name}…`} style={{
              flex: 1, background: COLORS.s2, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "9px 11px", fontSize: 13, color: COLORS.textPri, outline: "none",
            }} />
            <button onClick={send} style={{ ...primaryBtn, padding: "9px 14px" }}><Send size={13} /></button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* =================================================================
   REAL CHAT — genuinely backed by the Supabase database, unlike the
   Community section above which is still demo data. Checks the real
   signed-in session (separate from this prototype's own demo
   accounts) and only shows the chat once that's confirmed.
================================================================= */

function RealChatSection() {
  const [status, setStatus] = useState("checking"); // "checking" | "signed-out" | "signed-in"

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? "signed-in" : "signed-out");
    });
  }, []);

  if (status === "checking") {
    return <div style={{ padding: 40, color: COLORS.textMut, fontSize: 13 }}>Checking your account…</div>;
  }

  if (status === "signed-out") {
    return (
      <div>
        <SectionLabel sub="This is the real, database-backed chat — separate from the demo Community rooms above, and it needs your real OpenExport account (not the demo sign-up used elsewhere on this page).">
          Chat
        </SectionLabel>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <MessageSquare size={22} color={COLORS.gold} style={{ marginBottom: 10 }} />
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.textPri, marginBottom: 6 }}>Sign in with your real account</div>
          <div style={{ fontSize: 12.5, color: COLORS.textSec, marginBottom: 18 }}>
            Real-time messaging with any other signed-up member, backed by a real database.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <a href="/login" style={{ ...secondaryBtn, textDecoration: "none" }}>Sign In</a>
            <a href="/signup" style={{ ...primaryBtn, textDecoration: "none" }}>Create Account</a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel sub="Real-time, database-backed messaging — separate from the demo Community rooms.">Chat</SectionLabel>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <ChatApp />
      </Card>
    </div>
  );
}

const ROLE_QUICK_LINKS = {
  buyer: [
    { label: "Post a buying request", view: "rfq-create", icon: PlusCircle },
    { label: "Browse suppliers", view: "suppliers", icon: Sprout },
    { label: "Your buyer dashboard", view: "dashboard-buyer", icon: LayoutDashboard },
  ],
  supplier: [
    { label: "Browse open RFQs", view: "rfqs", icon: FileText },
    { label: "Compare landed cost", view: "landed-cost", icon: Calculator },
    { label: "Your supplier dashboard", view: "dashboard-supplier", icon: LayoutDashboard },
  ],
  logistics: [
    { label: "Logistics directory", view: "logistics", icon: Ship },
    { label: "Browse open RFQs needing freight", view: "rfqs", icon: FileText },
  ],
  chamber: [
    { label: "Chambers of Commerce", view: "chambers", icon: Landmark },
    { label: "Community rooms", view: "community", icon: MessageSquare },
  ],
  admin: [
    { label: "Admin console", view: "admin", icon: Sliders },
  ],
};

function Hub({ user, onLogActivity, onNav }) {
  const [conversations, setConversations] = useState(() => seedConversations(user));
  const [activeId, setActiveId] = useState("conv1");
  const [draft, setDraft] = useState("");
  const active = conversations.find((c) => c.id === activeId);

  const send = () => {
    if (!draft.trim()) return;
    setConversations((cs) => cs.map((c) => c.id === activeId
      ? { ...c, messages: [...c.messages, { from: "me", text: draft.trim(), time: "Now" }] }
      : c));
    onLogActivity(makeActivity("message", user.companyName, `messaged ${active.with}`, 0));
    setDraft("");
  };

  return (
    <div>
      <SectionLabel sub={`Signed in as ${user.companyName} — your conversations, connections and account in one place.`}>Your Hub</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 20 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.textMut, textTransform: "uppercase" }}>Conversations</div>
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)} style={{
              display: "block", width: "100%", textAlign: "left", padding: "12px 16px", background: activeId === c.id ? COLORS.s2 : "none",
              border: "none", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPri }}>{c.with}</div>
              <div style={{ fontSize: 11.5, color: COLORS.textMut, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.messages[c.messages.length - 1]?.text}
              </div>
            </button>
          ))}
        </Card>
        <Card style={{ padding: 0, display: "flex", flexDirection: "column", height: 420 }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 700, fontSize: 14, color: COLORS.textPri, fontFamily: "'Space Grotesk', sans-serif" }}>{active?.with}</div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {active?.messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "75%",
                background: m.from === "me" ? COLORS.brand : COLORS.s2, color: m.from === "me" ? "#fff" : COLORS.textPri,
                borderRadius: 8, padding: "8px 12px", fontSize: 12.5,
              }}>
                {m.text}
                <div style={{ fontSize: 9.5, opacity: 0.7, marginTop: 3 }}>{m.time}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${COLORS.border}` }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" style={{
              flex: 1, background: COLORS.s2, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "9px 11px", fontSize: 13, outline: "none",
            }} />
            <button onClick={send} style={{ ...primaryBtn, padding: "9px 14px" }}><Send size={13} /></button>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Card>
          <SectionLabel>Quick links</SectionLabel>
          {(() => {
            const seenLabels = new Set();
            const links = accountRoles(user).flatMap((r) => ROLE_QUICK_LINKS[r] || []).filter((l) => {
              if (seenLabels.has(l.label)) return false;
              seenLabels.add(l.label);
              return true;
            });
            return links.map((l) => (
              <button key={l.label} onClick={() => onNav(l.view)} style={{
                display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", background: "none",
                border: "none", padding: "9px 0", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer",
                fontSize: 12.5, color: COLORS.textPri,
              }}><l.icon size={14} color={COLORS.brand} /> {l.label}</button>
            ));
          })()}
        </Card>
        <Card>
          <SectionLabel>Your account</SectionLabel>
          <Row label="Company" value={user.companyName} />
          <Row label="Account type" value={roleLabel(user)} />
          <Row label="Country" value={user.country} />
          <Row label="Member since" value={user.joinedDate} />
          <div style={{ marginTop: 10 }}>{user.status === "active" ? <Badge tone="good"><BadgeCheck size={11} /> Verified</Badge> : <Badge tone="gold">Pending verification</Badge>}</div>
        </Card>
        <Card>
          <SectionLabel>Your network</SectionLabel>
          <div style={{ fontSize: 12.5, color: COLORS.textSec, lineHeight: 1.8 }}>
            Connected chambers, saved suppliers/buyers and logistics partners will appear here as you engage
            with the marketplace, RFQs and directories.
          </div>
        </Card>
      </div>
    </div>
  );
}

/* =================================================================
   SIGN UP / VERIFY / LOGIN
================================================================= */

function SignUp({ onSubmit, onGoLogin }) {
  const [form, setForm] = useState({
    roles: ["buyer"], companyName: "", contactName: "", email: "", password: "", confirmPassword: "", country: "", agreed: false,
    province: PROVINCES[0], productId: PRODUCTS[0].id, qty: 500, price: PRODUCTS[0].basePrice,
  });
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleRole = (id) => {
    setForm((f) => {
      if (id === "logistics" || id === "chamber") return { ...f, roles: [id] };
      let roles = f.roles.filter((r) => r !== "logistics" && r !== "chamber");
      roles = roles.includes(id) ? roles.filter((r) => r !== id) : [...roles, id];
      if (roles.length === 0) roles = [id];
      return { ...f, roles };
    });
  };
  const inputStyle = { width: "100%", background: COLORS.s2, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "10px 12px", fontSize: 13, color: COLORS.textPri, outline: "none", boxSizing: "border-box" };
  const label = { fontSize: 11.5, color: COLORS.textSec, marginBottom: 5, display: "block" };

  const submit = () => {
    if (!form.companyName || !form.contactName || !form.email || !form.password) { setError("Please complete all required fields."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords don't match."); return; }
    if (!form.agreed) { setError("Please accept the terms to continue."); return; }
    setError("");
    onSubmit(form);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <Wheat size={26} color={COLORS.brand} />
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: COLORS.textPri, marginTop: 8 }}>Join OpenExport (Marketplace demo)</div>
        <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 4 }}>Buyers, suppliers, logistics providers and chambers of commerce all start here.</div>
        <div style={{ fontSize: 11, color: COLORS.gold, marginTop: 8 }}>This creates a demo account for the Marketplace section only — for real Chat access, use <a href="/signup" style={{ color: COLORS.gold }}>the real sign-up</a> instead.</div>
      </div>
      <Card>
        <SectionLabel sub="Buying and selling can be combined — select both if that fits your business.">I am a…</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }}>
          {ACCOUNT_TYPES.map((t) => (
            <button key={t.id} onClick={() => toggleRole(t.id)} style={{
              textAlign: "left", padding: 14, borderRadius: 4, cursor: "pointer", display: "flex", gap: 10,
              background: form.roles.includes(t.id) ? "rgba(47,128,237,0.10)" : COLORS.s2,
              border: `1px solid ${form.roles.includes(t.id) ? COLORS.brand : COLORS.border}`,
            }}>
              <t.icon size={16} color={COLORS.brand} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPri }}>{t.label}</div>
                <div style={{ fontSize: 11, color: COLORS.textMut, marginTop: 2 }}>{t.desc}</div>
              </div>
              {form.roles.includes(t.id) && <Check size={15} color={COLORS.brand} style={{ flexShrink: 0 }} />}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={label}>Company / organization name *</label><input style={inputStyle} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} /></div>
          <div><label style={label}>Country *</label><input style={inputStyle} value={form.country} onChange={(e) => set("country", e.target.value)} /></div>
          <div><label style={label}>Contact name *</label><input style={inputStyle} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} /></div>
          <div><label style={label}>Work email *</label><input style={inputStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><label style={label}>Password *</label><input style={inputStyle} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} /></div>
          <div><label style={label}>Confirm password *</label><input style={inputStyle} type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} /></div>
        </div>

        {form.roles.includes("supplier") && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
            <SectionLabel sub="This creates your first product listing — you can add more from your Supplier Dashboard later.">Your first listing</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={label}>Province</label><select style={inputStyle} value={form.province} onChange={(e) => set("province", e.target.value)}>{PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
              <div><label style={label}>Product</label><select style={inputStyle} value={form.productId} onChange={(e) => { set("productId", e.target.value); set("price", PRODUCTS.find((p) => p.id === e.target.value).basePrice); }}>{PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label style={label}>Available quantity (MT)</label><input type="number" style={inputStyle} value={form.qty} onChange={(e) => set("qty", Number(e.target.value))} /></div>
              <div><label style={label}>Price (USD/MT)</label><input type="number" style={inputStyle} value={form.price} onChange={(e) => set("price", Number(e.target.value))} /></div>
            </div>
          </div>
        )}

        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: COLORS.textSec, margin: "16px 0" }}>
          <input type="checkbox" checked={form.agreed} onChange={(e) => set("agreed", e.target.checked)} style={{ marginTop: 2 }} />
          I agree to the OpenExport Terms of Service and Privacy Policy.
        </label>
        {error && <div style={{ fontSize: 12.5, color: COLORS.risk, marginBottom: 12 }}>{error}</div>}
        <button onClick={submit} style={{ ...primaryBtn, width: "100%", padding: "11px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Create account <ArrowRight size={14} /></button>
        <div style={{ textAlign: "center", fontSize: 12.5, color: COLORS.textMut, marginTop: 14 }}>
          Already have an account? <button onClick={onGoLogin} style={linkBtnStyle}>Sign in</button>
        </div>
      </Card>
    </div>
  );
}

function VerifyEmail({ email, onVerified }) {
  return (
    <div style={{ maxWidth: 460, margin: "50px auto 0", textAlign: "center" }}>
      <Card>
        <Mail size={28} color={COLORS.brand} style={{ margin: "0 auto 12px" }} />
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: COLORS.textPri, marginBottom: 8 }}>Confirm your email</div>
        <div style={{ fontSize: 13, color: COLORS.textSec, lineHeight: 1.6, marginBottom: 18 }}>
          We've sent a confirmation link to <b style={{ color: COLORS.textPri }}>{email}</b>.
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMut, marginBottom: 16, border: `1px dashed ${COLORS.border}`, borderRadius: 4, padding: 10 }}>
          This is a prototype — no real email is sent. Click below to simulate confirming it.
        </div>
        <button onClick={onVerified} style={{ ...primaryBtn, display: "inline-flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={14} /> Simulate email confirmation</button>
      </Card>
    </div>
  );
}

function Login({ accounts, onSubmit, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const inputStyle = { width: "100%", background: COLORS.s2, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "10px 12px", fontSize: 13, color: COLORS.textPri, outline: "none", boxSizing: "border-box" };

  const submit = () => {
    const acc = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!acc) { setError("No account found with that email."); return; }
    if (acc.status === "pending") { setError("Please confirm your email before signing in."); return; }
    if (acc.status === "suspended") { setError("This account has been suspended."); return; }
    setError(""); onSubmit(acc);
  };

  return (
    <div style={{ maxWidth: 380, margin: "40px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Wheat size={26} color={COLORS.brand} />
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: COLORS.textPri, marginTop: 8 }}>Sign in</div>
      </div>
      <Card>
        <label style={{ fontSize: 11.5, color: COLORS.textSec, marginBottom: 5, display: "block" }}>Email</label>
        <input style={{ ...inputStyle, marginBottom: 16 }} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="you@company.com" />
        {error && <div style={{ fontSize: 12.5, color: COLORS.risk, marginBottom: 14 }}>{error}</div>}
        <button onClick={submit} style={{ ...primaryBtn, width: "100%", padding: "11px 0" }}>Sign in</button>
        <div style={{ fontSize: 10.5, color: COLORS.textMut, margin: "16px 0 8px" }}>Quick demo logins:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {accounts.filter((a) => a.status === "active").map((a) => (
            <button key={a.id} onClick={() => onSubmit(a)} style={{
              fontSize: 10.5, padding: "5px 9px", borderRadius: 3, background: "none", cursor: "pointer",
              border: `1px solid ${COLORS.border}`, color: COLORS.textSec,
            }}>{a.isAdmin ? "🛡 " : ""}{a.companyName}</button>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 12.5, color: COLORS.textMut, marginTop: 16 }}>
          New here? <button onClick={onGoSignup} style={linkBtnStyle}>Create an account</button>
        </div>
      </Card>
    </div>
  );
}

/* =================================================================
   ADMIN — full activity log across every entity type
================================================================= */

const ACTIVITY_ICON = { signup: Users, rfq: FileText, offer: Send, verify: ShieldCheck, chamber: Landmark, message: MessageSquare, login: LogOut, logistics: Ship };

function AdminFull({ accounts, activity, onSetStatus, rfqs, suppliers, buyers }) {
  const [tab, setTab] = useState("overview");
  const [typeFilter, setTypeFilter] = useState("all");
  const [weights, setWeights] = useState({ Supply: 20, Demand: 20, Price: 20, Logistics: 15, Competition: 10, "Historical Trade": 10, Availability: 5 });
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const filteredActivity = activity.filter((a) => typeFilter === "all" || a.type === typeFilter).slice().reverse();
  const counts = {
    accounts: accounts.length, suppliers: suppliers.length, buyers: buyers.length,
    logistics: LOGISTICS_PROVIDERS.length, chambers: CHAMBERS.length, rfqs: rfqs.length,
    pending: accounts.filter((a) => a.status === "pending").length,
  };
  const statusTone = (s) => s === "active" ? "good" : s === "pending" ? "gold" : "risk";

  return (
    <div>
      <SectionLabel sub="Full platform oversight — accounts, activity, verification and opportunity-score configuration.">Admin Console</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 18 }}>
        <StatCard label="Accounts" value={counts.accounts} icon={Users} />
        <StatCard label="Suppliers" value={counts.suppliers} icon={Sprout} />
        <StatCard label="Buyers" value={counts.buyers} icon={Package} />
        <StatCard label="Logistics" value={counts.logistics} icon={Ship} />
        <StatCard label="Chambers" value={counts.chambers} icon={Landmark} />
        <StatCard label="Pending" value={counts.pending} icon={ShieldAlert} />
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
        {["overview", "accounts", "activity", "scoring"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", borderBottom: `2px solid ${tab === t ? COLORS.brand : "transparent"}`,
            padding: "8px 4px", marginRight: 18, fontSize: 12.5, fontWeight: 600, textTransform: "capitalize",
            color: tab === t ? COLORS.brand : COLORS.textMut, cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <SectionLabel>Recent activity</SectionLabel>
            {activity.slice().reverse().slice(0, 6).map((a) => {
              const Icon = ACTIVITY_ICON[a.type] || Activity;
              return (
                <div key={a.id} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <Icon size={13} color={COLORS.textMut} style={{ marginTop: 2 }} />
                  <div style={{ fontSize: 12.5, color: COLORS.textSec }}><b style={{ color: COLORS.textPri }}>{a.actor}</b> {a.detail}</div>
                </div>
              );
            })}
          </Card>
          <Card>
            <SectionLabel>Verification queue</SectionLabel>
            {accounts.filter((a) => a.status === "pending").map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12.5 }}>
                <span style={{ color: COLORS.textPri }}>{a.companyName} <Badge tone="neutral">{roleLabel(a)}</Badge></span>
                <button onClick={() => onSetStatus(a.id, "active")} style={{ ...secondaryBtn, padding: "4px 10px" }}><ShieldCheck size={12} /> Verify</button>
              </div>
            ))}
            {accounts.filter((a) => a.status === "pending").length === 0 && <div style={{ fontSize: 12, color: COLORS.textMut }}>Nothing pending.</div>}
          </Card>
        </div>
      )}

      {tab === "accounts" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1.2fr", gap: 8, padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 10.5, color: COLORS.textMut, textTransform: "uppercase" }}>
            <span>Account</span><span>Type</span><span>Country</span><span>Status</span><span>Actions</span>
          </div>
          {accounts.map((a) => (
            <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1.2fr", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: COLORS.textPri, fontWeight: 600 }}>{a.companyName}{a.isAdmin ? " 🛡" : ""}</div>
                <div style={{ fontSize: 10.5, color: COLORS.textMut }}>{a.contactName} · {a.email}</div>
              </div>
              <span style={{ fontSize: 12, color: COLORS.textSec }}>{roleLabel(a)}</span>
              <span style={{ fontSize: 12, color: COLORS.textSec }}>{a.country}</span>
              <Badge tone={statusTone(a.status)}>{a.status}</Badge>
              <div style={{ display: "flex", gap: 6 }}>
                {!a.isAdmin && a.status !== "active" && <button onClick={() => onSetStatus(a.id, "active")} style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: 5, cursor: "pointer" }}><ShieldCheck size={13} color={COLORS.good} /></button>}
                {!a.isAdmin && a.status !== "suspended" && <button onClick={() => onSetStatus(a.id, "suspended")} style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: 5, cursor: "pointer" }}><Ban size={13} color={COLORS.risk} /></button>}
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === "activity" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {["all", "signup", "rfq", "offer", "verify", "chamber", "message", "logistics"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                fontSize: 11.5, padding: "6px 12px", borderRadius: 3, cursor: "pointer", textTransform: "capitalize",
                background: typeFilter === t ? COLORS.brand : "none", color: typeFilter === t ? "#fff" : COLORS.textSec,
                border: `1px solid ${typeFilter === t ? COLORS.brand : COLORS.border}`,
              }}>{t}</button>
            ))}
          </div>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {filteredActivity.map((a) => {
              const Icon = ACTIVITY_ICON[a.type] || Activity;
              return (
                <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "11px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
                  <Icon size={14} color={COLORS.brand} />
                  <div style={{ flex: 1, fontSize: 12.5, color: COLORS.textSec }}><b style={{ color: COLORS.textPri }}>{a.actor}</b> {a.detail}</div>
                  <Badge tone="neutral">{a.type}</Badge>
                  <span style={{ fontSize: 10.5, color: COLORS.textMut, minWidth: 70, textAlign: "right" }}>{new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              );
            })}
            {filteredActivity.length === 0 && <div style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: COLORS.textMut }}>No activity of this type yet.</div>}
          </Card>
        </div>
      )}

      {tab === "scoring" && (
        <Card>
          <SectionLabel right={<span style={{ fontSize: 11, color: totalWeight === 100 ? COLORS.good : COLORS.risk }}>{totalWeight}% total</span>}>Opportunity score weights</SectionLabel>
          {Object.entries(weights).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
                <span style={{ color: COLORS.textSec }}>{k}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textPri }}>{v}%</span>
              </div>
              <input type="range" min="0" max="50" value={v} onChange={(e) => setWeights((w) => ({ ...w, [k]: Number(e.target.value) }))} style={{ width: "100%" }} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}


const NAV_GROUPS = [
  {
    id: "marketplace", label: "Marketplace",
    items: [
      { id: "products", label: "Products" },
      { id: "suppliers", label: "Suppliers" },
      { id: "rfqs", label: "RFQs" },
    ],
  },
  {
    id: "intel", label: "Market Intel",
    items: [
      { id: "prices", label: "Prices" },
      { id: "landed-cost", label: "Landed Cost" },
      { id: "news", label: "News" },
    ],
  },
  {
    id: "network", label: "Network",
    items: [
      { id: "logistics", label: "Logistics" },
      { id: "chambers", label: "Chambers of Commerce" },
      { id: "community", label: "Community (demo)" },
      { id: "real-chat", label: "Chat" },
    ],
  },
];
const NAV_GROUP_VIEWS = new Set(NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id)));

function NavDropdown({ group, view, openGroup, setOpenGroup, onNav }) {
  const isOpen = openGroup === group.id;
  const isActiveGroup = group.items.some((i) => i.id === view || (view === "product-detail" && i.id === "products") || (view === "price-compare" && i.id === "prices"));
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpenGroup(isOpen ? null : group.id)}
        style={{
          background: isOpen ? COLORS.s2 : "none", border: "none", cursor: "pointer", padding: "8px 12px",
          borderRadius: 4, fontSize: 13, fontWeight: 600, color: isOpen || isActiveGroup ? COLORS.textPri : COLORS.textSec,
          display: "flex", alignItems: "center", gap: 5,
        }}
      >
        {group.label}
        <ChevronRight size={12} style={{ transform: isOpen ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.12s" }} />
      </button>
      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 200, background: COLORS.s1,
          border: `1px solid ${COLORS.borderStrong}`, borderRadius: 6, boxShadow: "0 10px 28px rgba(0,0,0,0.45)",
          overflow: "hidden", zIndex: 30,
        }}>
          {group.items.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNav(item.id); setOpenGroup(null); }}
              style={{
                display: "block", width: "100%", textAlign: "left", background: view === item.id ? COLORS.s2 : "none",
                border: "none", padding: "10px 14px", fontSize: 13, color: view === item.id ? COLORS.brand2 : COLORS.textSec,
                cursor: "pointer", fontWeight: view === item.id ? 700 : 500,
              }}
            >{item.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [openGroup, setOpenGroup] = useState(null);
  const [productSel, setProductSel] = useState({ id: null, supplierId: null });
  const [supplierSel, setSupplierSel] = useState(null);
  const [rfqSel, setRfqSel] = useState(null);
  const [calcInitial, setCalcInitial] = useState(null);
  const [rfqCreateInitial, setRfqCreateInitial] = useState(null);
  const [productsFilter, setProductsFilter] = useState(null);
  const [chamberSel, setChamberSel] = useState(null);
  const [logisticsSel, setLogisticsSel] = useState(null);
  const [priceCompareId, setPriceCompareId] = useState(null);

  const [accounts, setAccounts] = useState(SEED_ACCOUNTS);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [rfqs, setRfqs] = useState(RFQ_SEED);
  const [suppliers, setSuppliers] = useState(SUPPLIERS_SEED);
  const [buyers, setBuyers] = useState(BUYERS_SEED);

  const logActivity = (entry) => setActivity((a) => [...a, entry]);

  const openProduct = (id, supplierId) => { setProductSel({ id, supplierId }); setView("product-detail"); };
  const openSupplier = (id) => { setSupplierSel(id); setView("supplier-profile"); };
  const openRfq = (id) => { setRfqSel(id); setView("rfq-detail"); };
  const openChamber = (id) => { setChamberSel(id); setView("chamber-profile"); };
  const openLogistics = (id) => { setLogisticsSel(id); setView("logistics-profile"); };
  const openPriceCompare = (id) => { setPriceCompareId(id); setView("price-compare"); };
  const goCalc = (productId, price) => { setCalcInitial({ productId, price }); setView("landed-cost"); };
  const goRfqCreate = (prefill) => { setRfqCreateInitial(prefill || null); setView("rfq-create"); };
  const goProducts = (id, filter) => { setProductsFilter(filter || null); setView(id); };

  const handleSignup = (form) => {
    const newAccount = {
      id: "u" + (accounts.length + 1), roles: form.roles, accountType: form.roles[0], companyName: form.companyName,
      contactName: form.contactName, email: form.email, password: form.password, country: form.country,
      status: "pending", isAdmin: false, joinedDate: new Date().toISOString().slice(0, 10),
      // carried through for supplier accounts only, used to create their first listing on verification
      province: form.province, productId: form.productId, qty: form.qty, price: form.price,
    };
    setAccounts((a) => [...a, newAccount]);
    setPendingEmail(form.email);
    logActivity(makeActivity("signup", form.companyName, `created a ${roleLabel(newAccount).toLowerCase()} account`, 0));
    setView("verify");
  };
  const handleVerified = () => {
    setAccounts((list) => list.map((a) => a.email === pendingEmail ? { ...a, status: "active" } : a));
    const acc = accounts.find((a) => a.email === pendingEmail);
    if (acc) {
      setCurrentUser({ ...acc, status: "active" });
      logActivity(makeActivity("verify", acc.companyName, "confirmed their email", 0));
      const roles = accountRoles(acc);
      if (roles.includes("supplier") && acc.productId) {
        const basePrice = PRODUCTS.find((p) => p.id === acc.productId)?.basePrice || 0;
        const newSupplier = {
          id: "sup-" + Date.now(), name: acc.companyName, demo: false, province: acc.province || "Saskatchewan",
          years: 0, verification: 2, products: [acc.productId], certifications: [],
          exportMarkets: [acc.country || "Canada"], responseHrs: 24, responseRate: 90,
          inventory: { [acc.productId]: acc.qty || 0 },
          priceAdj: { [acc.productId]: Math.round(((acc.price || basePrice) - basePrice) * 10) / 10 },
          joinedDate: new Date().toISOString().slice(0, 10),
        };
        setSuppliers((list) => [...list, newSupplier]);
        logActivity(makeActivity("signup", acc.companyName, `listed ${acc.qty || 0} MT of ${PRODUCTS.find((p) => p.id === acc.productId)?.name} — now visible in the Supplier Directory and Marketplace`, 0));
      }
      if (roles.includes("buyer")) {
        const newBuyer = {
          id: "buy-" + Date.now(), name: acc.companyName, demo: false, country: acc.country || "Canada",
          looking: acc.productId ? [acc.productId] : [], orderSize: "Not specified", destPort: "—", verification: 2,
          joinedDate: new Date().toISOString().slice(0, 10),
        };
        setBuyers((list) => [...list, newBuyer]);
        logActivity(makeActivity("signup", acc.companyName, "registered as a buyer — now visible in chamber member lists and buyer counts", 0));
      }
    }
    setView("hub");
  };
  const handleLogin = (acc) => { setCurrentUser(acc); logActivity(makeActivity("login", acc.companyName, "signed in", 0)); setView("hub"); };
  const handleLogout = () => { setCurrentUser(null); setView("home"); };
  const setAccountStatus = (id, status) => setAccounts((list) => list.map((a) => a.id === id ? { ...a, status } : a));

  const handleCreateChamber = (form) => {
    logActivity(makeActivity("chamber", form.contactName || form.name, `submitted ${form.name || "a new chamber"} (${form.country}) for verification`, 0));
    setView("chambers");
  };

  const liveUser = currentUser ? accounts.find((a) => a.id === currentUser.id) || currentUser : null;

  const publishRfq = (form) => {
    const newRfq = {
      id: "r" + Date.now(), buyerId: null,
      buyerName: liveUser ? liveUser.companyName : "Guest Buyer",
      buyerVerification: liveUser ? (liveUser.status === "active" ? 3 : 1) : 1,
      productId: form.productId, qty: form.qty, destination: form.destination,
      destPort: PORTS.dest[form.destination] || "—",
      delivery: form.delivery || "To be confirmed", grade: form.grade, packaging: form.packaging,
      incoterm: form.incoterm, payment: form.payment, certRequired: form.certRequired,
      postedDaysAgo: 0, expiresOn: daysLeft(14), notes: form.notes,
    };
    setRfqs((list) => [newRfq, ...list]);
    logActivity(makeActivity("rfq", newRfq.buyerName, `posted an RFQ for ${form.qty} MT ${PRODUCTS.find((p) => p.id === form.productId)?.name}`, 0));
    setView("rfqs");
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.textPri, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {openGroup && <div onClick={() => setOpenGroup(null)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />}

      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.s1, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "relative", zIndex: 25 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setView("home")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", marginRight: 18 }}>
            <Wheat size={19} color={COLORS.brand} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: COLORS.textPri }}>OpenExport</span>
          </button>
          <div style={{ display: "flex", gap: 2 }}>
            {NAV_GROUPS.map((g) => (
              <NavDropdown key={g.id} group={g} view={view} openGroup={openGroup} setOpenGroup={setOpenGroup} onNav={setView} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!liveUser ? (
            <>
              <a href="/login" style={{ ...secondaryBtn, fontSize: 11.5, textDecoration: "none" }}>Sign In</a>
              <a href="/signup" style={{ ...primaryBtn, fontSize: 11.5, padding: "8px 14px", textDecoration: "none" }}>Create Account</a>
            </>
          ) : (
            <>
              {liveUser.isAdmin && <button onClick={() => setView("admin")} style={{ ...secondaryBtn, fontSize: 11.5 }}><Sliders size={12} /> Admin</button>}
              <button onClick={() => setView("dashboard-supplier")} style={{ ...secondaryBtn, fontSize: 11.5 }}><LayoutDashboard size={12} /> Supplier</button>
              <button onClick={() => setView("dashboard-buyer")} style={{ ...secondaryBtn, fontSize: 11.5 }}><LayoutDashboard size={12} /> Buyer</button>
              <button onClick={() => setView("hub")} style={{
                display: "flex", alignItems: "center", gap: 7, background: view === "hub" ? COLORS.s2 : "none",
                border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "4px 12px 4px 4px", cursor: "pointer",
              }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: COLORS.brand, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700 }}>
                  {liveUser.companyName.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 11.5, color: COLORS.textSec }}>{liveUser.companyName.split(" ")[0]}</span>
                <MessageSquare size={12} color={COLORS.textMut} />
              </button>
              <button onClick={handleLogout} title="Log out" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><LogOut size={14} color={COLORS.textMut} /></button>
            </>
          )}
        </div>
      </div>

      <TickerTape onSelect={(id) => openProduct(id, null)} />

      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 32px 80px" }}>
        {view === "home" && <Home onNav={goProducts} rfqs={rfqs} suppliers={suppliers} />}
        {view === "products" && <Products initialFilter={productsFilter} onOpenProduct={openProduct} suppliers={suppliers} />}
        {view === "product-detail" && <ProductDetail productId={productSel.id} supplierId={productSel.supplierId} onBack={() => setView("products")} onCalc={goCalc} onRequestQuote={(productId) => goRfqCreate({ productId })} suppliers={suppliers} />}
        {view === "suppliers" && <Suppliers onOpen={openSupplier} suppliers={suppliers} />}
        {view === "supplier-profile" && <SupplierProfile supplierId={supplierSel} onBack={() => setView("suppliers")} onOpenProduct={openProduct} suppliers={suppliers} />}
        {view === "rfqs" && <RFQMarketplace onOpen={openRfq} onCreate={() => setView("rfq-create")} rfqs={rfqs} />}
        {view === "rfq-detail" && <RFQDetail rfqId={rfqSel} onBack={() => setView("rfqs")} rfqs={rfqs} suppliers={suppliers} />}
        {view === "rfq-create" && <RFQCreate onPublish={publishRfq} initial={rfqCreateInitial} />}
        {view === "logistics" && <Logistics onOpen={openLogistics} />}
        {view === "logistics-profile" && <LogisticsProfile providerId={logisticsSel} onBack={() => setView("logistics")} />}
        {view === "chambers" && <Chambers onOpen={openChamber} onCreate={() => setView("chamber-create")} />}
        {view === "chamber-profile" && <ChamberProfile chamberId={chamberSel} onBack={() => setView("chambers")} suppliers={suppliers} buyers={buyers} />}
        {view === "chamber-create" && <CreateChamber onCreate={handleCreateChamber} />}
        {view === "prices" && <Prices onOpenCompare={openPriceCompare} />}
        {view === "price-compare" && <PriceCompare productId={priceCompareId} onBack={() => setView("prices")} />}
        {view === "news" && <News />}
        {view === "community" && <Community user={liveUser} onNav={setView} />}
        {view === "real-chat" && <RealChatSection />}
        {view === "opportunities" && <Opportunities rfqs={rfqs} suppliers={suppliers} />}
        {view === "market-intel" && <MarketIntelligence />}
        {view === "landed-cost" && <LandedCostCalculator initial={calcInitial} />}
        {view === "dashboard-supplier" && <SupplierDashboard rfqs={rfqs} suppliers={suppliers} user={liveUser} />}
        {view === "dashboard-buyer" && <BuyerDashboard rfqs={rfqs} user={liveUser} suppliers={suppliers} buyers={buyers} />}
        {view === "signup" && <SignUp onSubmit={handleSignup} onGoLogin={() => setView("login")} />}
        {view === "verify" && <VerifyEmail email={pendingEmail} onVerified={handleVerified} />}
        {view === "login" && <Login accounts={accounts} onSubmit={handleLogin} onGoSignup={() => setView("signup")} />}
        {view === "hub" && (liveUser
          ? <Hub user={liveUser} onLogActivity={logActivity} onNav={setView} />
          : <div style={{ textAlign: "center", padding: 60, color: COLORS.textMut, fontSize: 13 }}>Please <button onClick={() => setView("login")} style={linkBtnStyle}>sign in</button> to view your hub.</div>)}
        {view === "admin" && (liveUser && liveUser.isAdmin
          ? <AdminFull accounts={accounts} activity={activity} onSetStatus={setAccountStatus} rfqs={rfqs} suppliers={suppliers} buyers={buyers} />
          : <div style={{ textAlign: "center", padding: 60, color: COLORS.textMut, fontSize: 13 }}>Admin access only.</div>)}
      </div>

      <Footer onNav={setView} />
    </div>
  );
}

function FooterLink({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: "block", background: "none", border: "none", padding: "5px 0", textAlign: "left",
      fontSize: 12.5, color: COLORS.textSec, cursor: "pointer",
    }}>{children}</button>
  );
}

function Footer({ onNav }) {
  return (
    <div style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.s1, marginTop: 40 }}>
      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "40px 32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: 32, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Wheat size={18} color={COLORS.brand} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: COLORS.textPri }}>OpenExport</span>
            </div>
            <p style={{ fontSize: 12.5, color: COLORS.textSec, lineHeight: 1.7, maxWidth: 260, margin: "0 0 12px" }}>
              A B2B agricultural marketplace and trade-intelligence platform connecting verified Canadian
              suppliers with buyers, logistics providers and chambers of commerce worldwide.
            </p>
            <DataTag type="demo" />
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMut, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Marketplace</div>
            <FooterLink onClick={() => onNav("products")}>Products</FooterLink>
            <FooterLink onClick={() => onNav("suppliers")}>Suppliers</FooterLink>
            <FooterLink onClick={() => onNav("rfqs")}>RFQs</FooterLink>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMut, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Market Intel</div>
            <FooterLink onClick={() => onNav("prices")}>Prices</FooterLink>
            <FooterLink onClick={() => onNav("landed-cost")}>Landed Cost</FooterLink>
            <FooterLink onClick={() => onNav("news")}>News</FooterLink>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMut, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Network</div>
            <FooterLink onClick={() => onNav("logistics")}>Logistics</FooterLink>
            <FooterLink onClick={() => onNav("chambers")}>Chambers of Commerce</FooterLink>
            <FooterLink onClick={() => onNav("community")}>Community</FooterLink>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMut, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Platform</div>
            <div style={{ fontSize: 12.5, color: COLORS.textMut, padding: "5px 0" }}>About OpenExport</div>
            <div style={{ fontSize: 12.5, color: COLORS.textMut, padding: "5px 0" }}>How it works</div>
            <div style={{ fontSize: 12.5, color: COLORS.textMut, padding: "5px 0" }}>Terms of Service</div>
            <div style={{ fontSize: 12.5, color: COLORS.textMut, padding: "5px 0" }}>Privacy Policy</div>
          </div>
        </div>

        <div style={{
          borderTop: `1px solid ${COLORS.border}`, paddingTop: 18, display: "flex", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
        }}>
          <span style={{ fontSize: 11, color: COLORS.textMut }}>© 2026 OpenExport. Prototype build — all data on this platform is demo/illustrative, not a live trading system.</span>
          <span style={{ fontSize: 11, color: COLORS.textMut }}>Built for Canada's agricultural export community.</span>
        </div>
      </div>
    </div>
  );
}
