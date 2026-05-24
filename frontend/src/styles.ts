import type { CSSProperties } from "react";

// ============================================================
// DESIGN TOKENS
// ============================================================
export const C = {
  primary: "#5C6BC0",
  primaryDark: "#3F51B5",
  accent: "#FF7043",
  accentDark: "#F4511E",
  bg: "#FAFAF8",
  cardBg: "#fff",
  cardBorder: "#F0F0F0",
  cardShadow: "0 2px 16px rgba(0,0,0,0.06)",
  dark: "#1A1A2E",
  body: "#555",
  label: "#999",
  muted: "#888",
  divider: "#F0F0F0",
  errorBg: "#FFF5F5",
  errorBorder: "#FED7D7",
  errorText: "#C53030",
  green: "#43A047",
  greenLight: "#E8F5E9",
  amberLight: "#FFF8E1",
  blueLight: "#F0F4FF",
  coralLight: "#FFF3F0",
};

export const DAY_COLORS = ["#5C6BC0", "#7E57C2", "#26A69A", "#42A5F5", "#66BB6A", "#EF5350"];
export const BUDGET_COLORS = ["#5C6BC0", "#7E57C2", "#FF7043", "#26A69A", "#42A5F5", "#66BB6A", "#EF5350", "#FFA726"];

// ============================================================
// PREFERENCE CATEGORIES
// ============================================================
export const PREFERENCE_GROUPS = [
  { heading: "NATURE & OUTDOORS", items: ["🏔️ Mountains", "🏖️ Beach", "🌿 Forests & Nature", "🏜️ Desert"] },
  { heading: "ACTIVITY BASED", items: ["🧗 Adventure & Trekking", "🧘 Wellness & Spa", "🍽️ Food & Culinary", "📸 Photography & Sightseeing"] },
  { heading: "CULTURE & HERITAGE", items: ["🛕 Religious & Spiritual", "🏛️ Historical & Heritage", "🎨 Art & Culture", "🎉 Festivals & Events"] },
  { heading: "URBAN & LIFESTYLE", items: ["🏙️ City & Urban", "🛍️ Shopping", "🌃 Nightlife & Entertainment", "👨‍👩‍👧 Family Friendly"] },
];

// ============================================================
// AGENT STEPS
// ============================================================
export const AGENT_STEPS = [
  { icon: "🗺️", label: "Planner Agent", desc: "selecting best destination..." },
  { icon: "🌦️", label: "Weather Agent", desc: "checking current conditions..." },
  { icon: "📅", label: "Itinerary Agent", desc: "building your day-by-day plan..." },
  { icon: "💰", label: "Budget Agent", desc: "calculating cost breakdown..." },
  { icon: "🔍", label: "Critic Agent", desc: "reviewing and improving..." },
];

// ============================================================
// SHARED STYLES
// ============================================================
export const S: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", padding: "0 16px 60px", background: `radial-gradient(ellipse at 50% 30%, rgba(92,107,192,0.04) 0%, transparent 60%), ${C.bg}`, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" },
  wrap: { maxWidth: 720, margin: "0 auto" },
  card: { background: C.cardBg, borderRadius: 20, padding: "28px 24px", border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow, marginBottom: 32 },
  label: { fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.8px" },
  input: { width: "100%", padding: "12px 0 10px", border: "none", borderBottom: `2px solid ${C.divider}`, borderRadius: 0, fontSize: 14, outline: "none", background: "#FAFAFA", transition: "all 0.2s", color: C.dark },
  inputFocus: { borderBottomColor: C.primary, background: "#fff" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 14 },
  error: { background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 12, padding: "12px 16px", color: C.errorText, fontSize: 13, fontWeight: 600, marginTop: 16 },
  divider: { height: 1, background: C.divider, margin: "24px 0", border: "none" },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export function getWeatherEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("snow")) return "❄️";
  if (c.includes("rain") || c.includes("drizzle")) return "🌧️";
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("cloud")) return "⛅";
  if (c.includes("clear") || c.includes("sun")) return "☀️";
  if (c.includes("fog") || c.includes("mist")) return "🌫️";
  return "🌤️";
}

export function getWeatherBorderColor(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("clear") || c.includes("sun")) return "#FFB300";
  if (c.includes("rain") || c.includes("drizzle")) return "#42A5F5";
  if (c.includes("snow")) return "#90CAF9";
  if (c.includes("cloud")) return "#B0BEC5";
  return C.primary;
}

export function parseBudgetLines(text: string): { category: string; amount: string }[] {
  if (!text) return [];
  return text.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter((l) => l.length > 0)
    .map((l) => { const p = l.split(/:\s*/); return { category: p[0] || l, amount: p.slice(1).join(": ") || "" }; });
}

export interface HotelOption { label: string; desc: string; price: string }
export function parseHotels(text: string): HotelOption[] {
  if (!text) return [];
  return text.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean).map((l) => {
    let label = "Option";
    if (/budget/i.test(l)) label = "Budget";
    else if (/mid/i.test(l)) label = "Mid-range";
    else if (/premium/i.test(l)) label = "Premium";
    const ds = l.split(/[—\-–]/);
    const desc = ds[0]?.replace(/budget option:|mid-range option:|premium option:/i, "").trim() || l;
    const price = ds[1]?.trim() || "";
    return { label, desc, price };
  });
}

export interface DayCard { dayNum: string; title: string; activities: string[]; spend: string }
export function parseDays(text: string): DayCard[] {
  if (!text) return [];
  return text.split(/(?=DAY \d)/i).filter(Boolean).map((block) => {
    const header = block.match(/DAY (\d+):?\s*(.*)/i);
    const lines = block.split("\n").slice(1).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    return {
      dayNum: header?.[1] || "?", title: header?.[2]?.trim() || "Exploration",
      activities: lines.filter((l) => !/estimated spend/i.test(l)),
      spend: lines.find((l) => /estimated spend/i.test(l)) || "",
    };
  });
}

export function parseList(text: string): string[] {
  if (!text) return [];
  return text.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
}
