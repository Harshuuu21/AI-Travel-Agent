import { useState, useEffect } from "react";
import axios from "axios";
import "./index.css";
import { C, S, PREFERENCE_GROUPS, AGENT_STEPS, getWeatherEmoji, getWeatherBorderColor, cleanMarkdown, BUDGET_TIER_CONFIG } from "./styles";
import { BudgetTierBadge, BudgetCard, TravelOptionsCard, AccommodationCard, DayCardsView, TipsCard, PackingCard, exportPDF } from "./components";
import type { ItineraryResponse } from "./types";

// ============================================================
// APP
// ============================================================
function App() {
  const [budget, setBudget] = useState("");
  const [month, setMonth] = useState("");
  const [duration, setDuration] = useState("");
  const [destination, setDestination] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [result, setResult] = useState<ItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [agentStep, setAgentStep] = useState(0);
  const [checkedPacking, setCheckedPacking] = useState<Set<number>>(new Set());
  const [validationError, setValidationError] = useState("");
  const [focusedInput, setFocusedInput] = useState("");

  useEffect(() => {
    if (!isLoading) { setAgentStep(0); return; }
    let step = 0;
    const iv = setInterval(() => { step++; if (step < AGENT_STEPS.length) setAgentStep(step); else clearInterval(iv); }, 800);
    return () => clearInterval(iv);
  }, [isLoading]);

  const togglePref = (p: string) => setPreferences(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const generate = async () => {
    if (!budget || !month || !duration) { setValidationError("Please fill in Budget, Travel Month, and Trip Duration."); return; }
    if (!departureCity.trim()) { setValidationError("Please enter your departure city."); return; }
    if (adults < 1) { setValidationError("At least 1 adult is required."); return; }
    if (children < 0) { setValidationError("Children count cannot be negative."); return; }
    if (preferences.length === 0) { setValidationError("Please select at least one travel preference."); return; }
    setValidationError(""); setIsLoading(true); setResult(null); setError(""); setCheckedPacking(new Set());
    try {
      const res = await axios.post("http://localhost:5000/generate-itinerary", {
        budget, month, duration,
        destination: destination || "",
        preference: preferences.join(", "),
        adults, children, departureCity,
      });
      setResult(res.data);
    } catch { setError("Failed to generate itinerary. Make sure the backend and Ollama are running."); }
    finally { setIsLoading(false); }
  };

  const togglePacking = (i: number) => setCheckedPacking(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const dest = result?.destination || "";
  const weatherAvail = result?.weather && result.weather.temperature !== "N/A";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 600;

  // Traveller summary
  const travellerSummary = `${adults} Adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}`;

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        {/* HEADER */}
        <div style={{ paddingTop: 60, textAlign: "center", marginBottom: 40 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 16px", borderRadius: 20, background: `linear-gradient(135deg, ${C.primary}18, ${C.accent}18)`, fontSize: 11, fontWeight: 700, color: C.primary, letterSpacing: "0.5px", marginBottom: 16 }}>
            ✨ AI POWERED
          </span>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: C.dark, margin: "16px 0 8px", lineHeight: 1.2 }}>Plan Your Perfect Trip</h1>
          <p style={{ fontSize: 15, color: C.muted, margin: 0, lineHeight: 1.5 }}>Tell us your budget. Our AI agents will handle the rest.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20, fontSize: 12, color: "#aaa" }}>
            <span>🤖 Multi-Agent AI</span><span style={{ color: "#ddd" }}>·</span>
            <span>🌦️ Live Weather</span><span style={{ color: "#ddd" }}>·</span>
            <span>📄 PDF Export</span>
          </div>
        </div>

        {/* FORM */}
        <div style={S.card}>
          <div style={S.grid2}>
            {[
              { key: "budget", label: "BUDGET (₹)", type: "number", ph: "e.g. 25000", val: budget, set: (v: string) => setBudget(v) },
              { key: "month", label: "TRAVEL MONTH", type: "text", ph: "e.g. October", val: month, set: (v: string) => setMonth(v) },
              { key: "duration", label: "TRIP DURATION (DAYS)", type: "number", ph: "e.g. 5", val: duration, set: (v: string) => setDuration(v) },
              { key: "destination", label: "DESTINATION (OPTIONAL)", type: "text", ph: "Leave blank — AI will suggest", val: destination, set: (v: string) => setDestination(v) },
              { key: "departureCity", label: "🏙️ TRAVELLING FROM", type: "text", ph: "e.g. Mumbai, Delhi, Bangalore", val: departureCity, set: (v: string) => setDepartureCity(v) },
            ].map(f => (
              <div key={f.key}>
                <label style={S.label}>{f.label}</label>
                <input
                  style={{ ...S.input, ...(focusedInput === f.key ? { borderBottomColor: C.primary, background: "#fff" } : {}) }}
                  type={f.type} placeholder={f.ph} value={f.val}
                  onChange={e => f.set(e.target.value)}
                  onFocus={() => setFocusedInput(f.key)} onBlur={() => setFocusedInput("")}
                />
              </div>
            ))}
          </div>

          {/* TRAVELLER DETAILS */}
          <div style={{ ...S.grid2, marginTop: 20 }}>
            <div>
              <label style={S.label}>👨‍👩‍👧 ADULTS</label>
              <input
                style={{ ...S.input, ...(focusedInput === "adults" ? { borderBottomColor: C.primary, background: "#fff" } : {}) }}
                type="number" min={1} value={adults}
                onChange={e => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                onFocus={() => setFocusedInput("adults")} onBlur={() => setFocusedInput("")}
              />
            </div>
            <div>
              <label style={S.label}>🧒 CHILDREN (BELOW 12)</label>
              <input
                style={{ ...S.input, ...(focusedInput === "children" ? { borderBottomColor: C.primary, background: "#fff" } : {}) }}
                type="number" min={0} value={children}
                onChange={e => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                onFocus={() => setFocusedInput("children")} onBlur={() => setFocusedInput("")}
              />
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.primary, marginTop: 8, fontWeight: 600 }}>
            👥 Travelling as: {travellerSummary}
          </div>

          <hr style={{ ...S.divider } as React.CSSProperties} />

          {/* PREFERENCES */}
          <label style={{ ...S.label, marginBottom: 16 }}>WHAT KIND OF TRIP?</label>
          {PREFERENCE_GROUPS.map(g => (
            <div key={g.heading} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "1px", marginBottom: 8, textTransform: "uppercase" }}>{g.heading}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {g.items.map(p => {
                  const active = preferences.includes(p);
                  return (
                    <span key={p} onClick={() => togglePref(p)} style={{
                      padding: "8px 16px", borderRadius: 24, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                      border: active ? "none" : `1.5px solid ${C.divider}`,
                      background: active ? `linear-gradient(135deg, ${C.primary}, #7E57C2)` : "#fff",
                      color: active ? "#fff" : "#666",
                      transform: active ? "scale(1.05)" : "scale(1)",
                    }}>{p}</span>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{preferences.length} preference{preferences.length !== 1 ? "s" : ""} selected</div>

          {validationError && <div style={S.error}>{validationError}</div>}

          <button onClick={generate} disabled={isLoading} style={{
            width: "100%", height: 52, border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
            background: isLoading ? "#ccc" : C.accent, color: "#fff", marginTop: 20,
            transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            {isLoading ? (<><span style={{ width: 18, height: 18, border: "2.5px solid #fff", borderTop: "2.5px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />Planning your trip...</>) : "Generate My Itinerary →"}
          </button>
        </div>

        {/* AGENT STEPPER */}
        {isLoading && (
          <div style={S.card}>
            <div style={{ ...S.sectionTitle, marginBottom: 20 }}>Agent Pipeline</div>
            {AGENT_STEPS.map((s, i) => {
              const done = i < agentStep, active = i === agentStep, pending = i > agentStep;
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, transition: "all 0.3s",
                      background: done ? C.green : active ? C.primary : "#eee",
                      color: done || active ? "#fff" : "#bbb",
                      animation: active ? "pulse 1.5s ease infinite" : "none",
                    }}>{done ? "✓" : i + 1}</div>
                    {i < AGENT_STEPS.length - 1 && <div style={{ width: 2, height: 28, background: done ? C.green : "#eee", transition: "background 0.3s" }} />}
                  </div>
                  <div style={{ paddingBottom: 20, opacity: pending ? 0.4 : 1, transition: "opacity 0.3s" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{s.icon} {s.label}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && <div style={{ ...S.error, marginBottom: 32 }}>{error}</div>}

        {/* =================== RESULTS =================== */}
        {result && !isLoading && (<>
          {/* BUDGET TIER BADGE */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <BudgetTierBadge tier={result.budgetTier || "mid-range"} />
          </div>

          {/* DESTINATION */}
          <div style={{ ...S.card, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.dark }}>📍 {dest}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              {[
                { href: `https://www.google.com/maps/search/${encodeURIComponent(dest)}`, label: "🗺️ View on Maps", bg: "#4285F4" },
                { href: `https://www.google.com/maps/dir//${encodeURIComponent(dest)}`, label: "🧭 Get Directions", bg: "#EA4335" },
                { href: `https://www.google.com/maps/search/hotels+in+${encodeURIComponent(dest)}`, label: "🏨 Find Hotels", bg: "#34A853" },
              ].map(l => <a key={l.label} href={l.href} target="_blank" rel="noreferrer" style={{ padding: "7px 16px", borderRadius: 20, background: l.bg, color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>{l.label}</a>)}
            </div>
          </div>

          {/* WEATHER */}
          {weatherAvail ? (
            <div style={{ ...S.card, background: C.blueLight, borderTop: `4px solid ${getWeatherBorderColor(result.weather.condition)}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>{dest}</div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 4, textTransform: "capitalize" }}>{result.weather.condition}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48 }}>{getWeatherEmoji(result.weather.condition)}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.dark }}>{result.weather.temperature}°C</div>
              </div>
            </div>
          ) : (
            <div style={{ ...S.card, background: "#f9f9f9", color: C.muted, textAlign: "center", fontSize: 14 }}>🌤️ Weather data currently unavailable</div>
          )}

          {/* TRAVEL OPTIONS */}
          {result.travelOptions && <TravelOptionsCard text={result.travelOptions} />}

          {/* BUDGET */}
          {result.budgetBreakdown && <BudgetCard text={cleanMarkdown(result.budgetBreakdown)} utilization={result.budgetUtilization} />}

          {/* ACCOMMODATION */}
          {(result.accommodation || result.hotelSuggestions) && (
            <AccommodationCard text={result.accommodation || result.hotelSuggestions} dest={dest} />
          )}

          {/* DAYS */}
          {result.itinerary && <DayCardsView text={cleanMarkdown(result.itinerary)} />}

          {/* TIPS + PACKING */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 32 }}>
            <TipsCard text={cleanMarkdown(result.travelTips || "")} />
            <PackingCard text={cleanMarkdown(result.packingList || "")} checked={checkedPacking} toggle={togglePacking} />
          </div>

          {/* PDF */}
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <button onClick={() => result && exportPDF(result, checkedPacking)} style={{
              padding: "14px 36px", borderRadius: 14, background: "transparent", border: `2px solid ${C.primary}`,
              color: C.primary, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
            }} onMouseEnter={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.color = "#fff"; }}
               onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.primary; }}>
              📄 Save Itinerary as PDF
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
}

export default App;