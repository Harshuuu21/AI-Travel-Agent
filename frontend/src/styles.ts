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
// BUDGET TIER CONFIG
// ============================================================
export const BUDGET_TIER_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  backpacker: { emoji: "🎒", label: "Backpacker Trip", color: "#8D6E63" },
  budget: { emoji: "💰", label: "Budget Trip", color: "#43A047" },
  "mid-range": { emoji: "⭐", label: "Mid-Range Trip", color: "#42A5F5" },
  comfortable: { emoji: "🌟", label: "Comfortable Trip", color: "#7E57C2" },
  premium: { emoji: "✨", label: "Premium Trip", color: "#FF7043" },
  luxury: { emoji: "👑", label: "Luxury Trip", color: "#FFB300" },
};

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
  { icon: "🚀", label: "Travel Agent", desc: "finding transport options..." },
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
// MARKDOWN CLEANER
// ============================================================
export function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^\s*[-*]\s/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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

export interface DayCard { day: string; title: string; content: string }
export function parseDays(itinerary: string): DayCard[] {
  if (!itinerary) return [];
  const days: DayCard[] = [];
  const dayPattern = /(?:^|\n)\s*(?:\*{0,2})(?:Day|DAY)\s+(\d+)(?:\*{0,2})[:\-–]?\s*(?:\*{0,2})(.*?)(?:\*{0,2})\s*(?=\n)/gi;
  const matches = [...itinerary.matchAll(dayPattern)];
  if (matches.length === 0) {
    return [{ day: 'Day 1', title: 'Your Itinerary', content: itinerary }];
  }
  matches.forEach((match, index) => {
    const dayNumber = match[1];
    const dayTitle = match[2]?.trim() || '';
    const startIndex = (match.index ?? 0) + match[0].length;
    const endIndex = index < matches.length - 1 ? (matches[index + 1].index ?? itinerary.length) : itinerary.length;
    const content = itinerary.slice(startIndex, endIndex).trim();
    if (content.length > 2) {
      days.push({ day: `Day ${dayNumber}`, title: dayTitle, content });
    }
  });
  return days.length > 0 ? days : [{ day: 'Day 1', title: 'Your Itinerary', content: itinerary }];
}

export function parseList(text: string): string[] {
  if (!text) return [];
  return text.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
}

// ============================================================
// NEW PARSERS — ACCOMMODATION & TRAVEL OPTIONS
// ============================================================

export interface CityAccommodation {
  city: string;
  days: string;
  nights: number;
  budget: string;
  midrange: string;
  premium: string;
  area: string;
}

export function parseAccommodation(text: string): CityAccommodation[] {
  if (!text) return [];
  const cities: CityAccommodation[] = [];

  // Split by city markers: 📍 CITY or similar patterns
  const cityBlocks = text.split(/(?=📍\s*CITY\s*\d|📍\s*[A-Z])/i).filter(b => b.trim().length > 5);

  for (const block of cityBlocks) {
    const cityMatch = block.match(/📍\s*(?:CITY\s*\d+\s*:\s*)?(.+?)(?:\(|$)/im);
    const daysMatch = block.match(/\(Day\s*(\d+)\s*(?:to|–|-)\s*Day\s*(\d+)\s*[—\-–]\s*(\d+)\s*night/i)
      || block.match(/\(Day\s*(\d+)\s*(?:to|–|-)\s*Day\s*(\d+)/i);

    const city = cityMatch?.[1]?.trim().replace(/[:\-–]+$/, '').trim() || '';
    if (!city) continue;

    let days = '';
    let nights = 1;
    if (daysMatch) {
      const d1 = daysMatch[1], d2 = daysMatch[2];
      days = `Day ${d1} to Day ${d2}`;
      nights = daysMatch[3] ? parseInt(daysMatch[3]) : (parseInt(d2) - parseInt(d1) + 1);
    } else {
      const simpleDay = block.match(/Day\s*(\d+)/i);
      if (simpleDay) {
        days = `Day ${simpleDay[1]}`;
        nights = 1;
      }
    }

    const budgetMatch = block.match(/Budget\s*option\s*[:]\s*(.+)/i);
    const midMatch = block.match(/Mid[\s-]*range\s*option\s*[:]\s*(.+)/i);
    const premMatch = block.match(/Premium\s*option\s*[:]\s*(.+)/i);
    const areaMatch = block.match(/Area\s*to\s*stay\s*(?:in)?\s*[:]\s*(.+)/i);

    cities.push({
      city,
      days,
      nights,
      budget: budgetMatch?.[1]?.trim() || '',
      midrange: midMatch?.[1]?.trim() || '',
      premium: premMatch?.[1]?.trim() || '',
      area: areaMatch?.[1]?.trim() || '',
    });
  }

  // Fallback: if no cities parsed, try to parse as legacy single-hotel format
  if (cities.length === 0 && text.trim().length > 5) {
    const hotels = parseHotels(text);
    if (hotels.length > 0) {
      cities.push({
        city: 'Destination',
        days: 'All days',
        nights: 1,
        budget: hotels.find(h => h.label === 'Budget') ? `${hotels.find(h => h.label === 'Budget')!.desc} — ${hotels.find(h => h.label === 'Budget')!.price}` : '',
        midrange: hotels.find(h => h.label === 'Mid-range') ? `${hotels.find(h => h.label === 'Mid-range')!.desc} — ${hotels.find(h => h.label === 'Mid-range')!.price}` : '',
        premium: hotels.find(h => h.label === 'Premium') ? `${hotels.find(h => h.label === 'Premium')!.desc} — ${hotels.find(h => h.label === 'Premium')!.price}` : '',
        area: '',
      });
    }
  }

  return cities;
}

export interface TravelModeOption {
  mode: string;
  emoji: string;
  content: string;
}

export function parseTravelOptions(text: string): TravelModeOption[] {
  if (!text) return [];
  const options: TravelModeOption[] = [];

  // Try to split by mode markers
  const flightMatch = text.match(/✈️\s*FLIGHT\s*:([\s\S]*?)(?=🚂|🚌|$)/i);
  const trainMatch = text.match(/🚂\s*TRAIN\s*:([\s\S]*?)(?=✈️|🚌|$)/i);
  const busMatch = text.match(/🚌\s*BUS\s*:([\s\S]*?)(?=✈️|🚂|$)/i);

  if (flightMatch) options.push({ mode: "Flight", emoji: "✈️", content: flightMatch[1].trim() });
  if (trainMatch) options.push({ mode: "Train", emoji: "🚂", content: trainMatch[1].trim() });
  if (busMatch) options.push({ mode: "Bus", emoji: "🚌", content: busMatch[1].trim() });

  // Fallback: if no structured sections, try line-based parsing
  if (options.length === 0 && text.trim().length > 10) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    // Put all content as a single generic section
    if (lines.length > 0) {
      options.push({ mode: "Travel Options", emoji: "🚀", content: text.trim() });
    }
  }

  return options;
}

export function parseAccommodationSummary(text: string): { budget: string; midrange: string; premium: string } {
  const summary = { budget: '', midrange: '', premium: '' };
  if (!text) return summary;

  const totalSection = text.match(/TOTAL ACCOMMODATION COST:([\s\S]*?)$/i);
  if (totalSection) {
    const budgetTotal = totalSection[1].match(/Budget\s*(?:route)?\s*total\s*:\s*(₹[\d,]+)/i);
    const midTotal = totalSection[1].match(/Mid[\s-]*range\s*(?:route)?\s*total\s*:\s*(₹[\d,]+)/i);
    const premTotal = totalSection[1].match(/Premium\s*(?:route)?\s*total\s*:\s*(₹[\d,]+)/i);
    if (budgetTotal) summary.budget = budgetTotal[1];
    if (midTotal) summary.midrange = midTotal[1];
    if (premTotal) summary.premium = premTotal[1];
  }
  return summary;
}
