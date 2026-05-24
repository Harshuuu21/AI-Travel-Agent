import { useState, useEffect } from "react";
import axios from "axios";
import "./index.css";
import { C, S, DAY_COLORS, BUDGET_COLORS, PREFERENCE_GROUPS, AGENT_STEPS, getWeatherEmoji, getWeatherBorderColor, parseBudgetLines, parseHotels, parseDays, parseList } from "./styles";
import type { ItineraryResponse } from "./types";

// ============================================================
// PDF EXPORT
// ============================================================
function exportPDF(data: ItineraryResponse, checkedItems: Set<number>) {
  const w = window.open("", "_blank"); if (!w) return;
  const days = parseDays(data.itinerary), bl = parseBudgetLines(data.budgetBreakdown);
  const hotels = parseHotels(data.hotelSuggestions), tips = parseList(data.travelTips), pack = parseList(data.packingList);
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Itinerary — ${data.destination}</title>
<style>body{font-family:'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:32px;color:#1A1A2E}
h1{color:#5C6BC0;font-size:28px}h2{margin-top:24px;color:#5C6BC0;font-size:18px}
table{width:100%;border-collapse:collapse;margin:8px 0}td{padding:8px;border-bottom:1px solid #f0f0f0}
.total{font-weight:800;color:#FF7043;font-size:15px}
.day{background:#FAFAF8;border-radius:12px;padding:20px;margin:12px 0;border:1px solid #f0f0f0}
.day h3{margin:0 0 8px;color:#5C6BC0}ul{padding-left:20px}li{margin:4px 0;color:#555}</style></head><body>
<h1>✈️ Trip to ${data.destination}</h1>
<p><strong>Weather:</strong> ${data.weather.temperature}°C — ${data.weather.condition}</p>
<h2>💰 Budget Breakdown</h2><table>${bl.map(b=>`<tr class="${/total/i.test(b.category)?'total':''}"><td>${b.category}</td><td style="text-align:right">${b.amount}</td></tr>`).join("")}</table>
<h2>🏨 Hotel Suggestions</h2><ul>${hotels.map(h=>`<li><strong>${h.label}:</strong> ${h.desc} ${h.price?"— "+h.price:""}</li>`).join("")}</ul>
<h2>📅 Day-by-Day Itinerary</h2>${days.map(d=>`<div class="day"><h3>Day ${d.dayNum}: ${d.title}</h3><ul>${d.activities.map(a=>`<li>${a}</li>`).join("")}</ul>${d.spend?`<p><em>${d.spend}</em></p>`:""}</div>`).join("")}
<h2>✅ Travel Tips</h2><ul>${tips.map(t=>`<li>${t}</li>`).join("")}</ul>
<h2>🎒 Packing List</h2><ul>${pack.map((p,i)=>`<li>${checkedItems.has(i)?"☑":"☐"} ${p}</li>`).join("")}</ul>
</body></html>`);
  w.document.close(); setTimeout(() => w.print(), 400);
}

// ============================================================
// APP
// ============================================================
function App() {
  const [budget, setBudget] = useState("");
  const [month, setMonth] = useState("");
  const [duration, setDuration] = useState("");
  const [destination, setDestination] = useState("");
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
    if (preferences.length === 0) { setValidationError("Please select at least one travel preference."); return; }
    setValidationError(""); setIsLoading(true); setResult(null); setError(""); setCheckedPacking(new Set());
    try {
      const res = await axios.post("http://localhost:5000/generate-itinerary", {
        budget, month, duration, destination: destination || "", preference: preferences.join(", "),
      });
      setResult(res.data);
    } catch { setError("Failed to generate itinerary. Make sure the backend and Ollama are running."); }
    finally { setIsLoading(false); }
  };

  const togglePacking = (i: number) => setCheckedPacking(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const dest = result?.destination || "";
  const weatherAvail = result?.weather && result.weather.temperature !== "N/A";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 600;

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
              { key: "budget", label: "BUDGET (₹)", type: "number", ph: "e.g. 25000", val: budget, set: setBudget },
              { key: "month", label: "TRAVEL MONTH", type: "text", ph: "e.g. October", val: month, set: setMonth },
              { key: "duration", label: "TRIP DURATION (DAYS)", type: "number", ph: "e.g. 5", val: duration, set: setDuration },
              { key: "destination", label: "DESTINATION (OPTIONAL)", type: "text", ph: "Leave blank — AI will suggest", val: destination, set: setDestination },
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
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: i < AGENT_STEPS.length - 1 ? 0 : 0 }}>
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

          {/* BUDGET */}
          {result.budgetBreakdown && <BudgetCard text={result.budgetBreakdown} />}

          {/* HOTELS */}
          {result.hotelSuggestions && <HotelCard text={result.hotelSuggestions} dest={dest} />}

          {/* DAYS */}
          {result.itinerary && <DayCardsView text={result.itinerary} />}

          {/* TIPS + PACKING */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 32 }}>
            <TipsCard text={result.travelTips} />
            <PackingCard text={result.packingList} checked={checkedPacking} toggle={togglePacking} />
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

// ============================================================
// SUB-COMPONENTS
// ============================================================
function BudgetCard({ text }: { text: string }) {
  const lines = parseBudgetLines(text);
  const totalLine = lines.find(l => /total/i.test(l.category));
  const totalAmt = totalLine ? parseInt(totalLine.amount.replace(/[^\d]/g, ""), 10) || 1 : 1;
  const nonTotalLines = lines.filter(l => !/total/i.test(l.category));

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={S.sectionTitle}>💰 Budget Breakdown</div>
        {totalLine && <div style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{totalLine.amount}</div>}
      </div>
      {/* Stacked bar */}
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
        {nonTotalLines.map((l, i) => {
          const amt = parseInt(l.amount.replace(/[^\d]/g, ""), 10) || 0;
          const pct = Math.max((amt / totalAmt) * 100, 2);
          return <div key={i} style={{ width: `${pct}%`, background: BUDGET_COLORS[i % BUDGET_COLORS.length], transition: "width 0.6s" }} />;
        })}
      </div>
      {lines.map((l, i) => {
        const isTotal = /total/i.test(l.category);
        return (
          <div key={i}>
            {isTotal && <div style={{ height: 1, background: C.divider, margin: "8px 0" }} />}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: isTotal ? 15 : 14, fontWeight: isTotal ? 800 : 400, color: isTotal ? C.dark : C.body }}>
              <span>{l.category}</span>
              <span style={{ fontWeight: isTotal ? 800 : 700, color: isTotal ? C.accent : C.dark }}>{l.amount}</span>
            </div>
            {!isTotal && i < lines.length - 1 && !/total/i.test(lines[i + 1]?.category) && <div style={{ height: 1, background: "#f5f5f5" }} />}
          </div>
        );
      })}
    </div>
  );
}

function HotelCard({ text, dest }: { text: string; dest: string }) {
  const hotels = parseHotels(text);
  const dotColors: Record<string, string> = { Budget: C.green, "Mid-range": "#42A5F5", Premium: "#FFB300" };

  return (
    <div style={S.card}>
      <div style={S.sectionTitle}>🏨 Where to Stay</div>
      {hotels.map((h, i) => (
        <div key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
            <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: dotColors[h.label] || C.primary, background: `${dotColors[h.label] || C.primary}18` }}>{h.label}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: C.dark, fontWeight: 500 }}>{h.desc}</div>
              {h.price && <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{h.price}</div>}
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <a href={`https://www.google.com/maps/search/hotels+in+${encodeURIComponent(dest)}`} target="_blank" rel="noreferrer" style={{ padding: "5px 10px", borderRadius: 8, background: "#4285F4", color: "#fff", fontSize: 10, fontWeight: 600, textDecoration: "none" }}>Maps</a>
              <a href={`https://www.booking.com/search.html?ss=${encodeURIComponent(dest)}`} target="_blank" rel="noreferrer" style={{ padding: "5px 10px", borderRadius: 8, background: "#003580", color: "#fff", fontSize: 10, fontWeight: 600, textDecoration: "none" }}>Booking</a>
            </div>
          </div>
          {i < hotels.length - 1 && <div style={{ height: 1, background: C.divider }} />}
        </div>
      ))}
    </div>
  );
}

function DayCardsView({ text }: { text: string }) {
  const days = parseDays(text);
  return (<>
    {days.map((d, i) => {
      const color = DAY_COLORS[i % DAY_COLORS.length];
      return (
        <div key={i} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
          <div style={{ background: `${color}10`, padding: "16px 22px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 36, height: 36, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 14, flexShrink: 0 }}>{d.dayNum}</span>
            <span style={{ color, fontWeight: 700, fontSize: 16 }}>{d.title}</span>
          </div>
          <div style={{ padding: "18px 22px" }}>
            {d.activities.map((a, j) => {
              const isMorning = /morning/i.test(a), isAfternoon = /afternoon/i.test(a), isEvening = /evening/i.test(a);
              const timeLabel = isMorning ? "MORNING" : isAfternoon ? "AFTERNOON" : isEvening ? "EVENING" : "";
              const borderColor = isMorning ? "#FFB74D" : isAfternoon ? "#4FC3F7" : isEvening ? "#7E57C2" : "#eee";
              return (
                <div key={j} style={{ borderLeft: `3px solid ${borderColor}`, paddingLeft: 14, marginBottom: 12 }}>
                  {timeLabel && <div style={{ fontSize: 10, fontWeight: 700, color: C.label, letterSpacing: "0.8px", marginBottom: 2 }}>{timeLabel}</div>}
                  <div style={{ fontSize: 14, color: C.body }}>{a}</div>
                </div>
              );
            })}
            {d.spend && (
              <div style={{ marginTop: 12, display: "inline-block", padding: "5px 14px", borderRadius: 20, background: C.coralLight, fontSize: 12, fontWeight: 700, color: C.accent }}>{d.spend}</div>
            )}
          </div>
        </div>
      );
    })}
  </>);
}

function TipsCard({ text }: { text: string }) {
  const tips = parseList(text);
  return (
    <div style={{ ...S.card, background: C.greenLight }}>
      <div style={S.sectionTitle}>✅ Travel Tips</div>
      {tips.map((t, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13, color: C.body }}>
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: C.green, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>✓</span>
          <span>{t}</span>
        </div>
      ))}
      {tips.length === 0 && <div style={{ fontSize: 13, color: C.muted }}>No tips available</div>}
    </div>
  );
}

function PackingCard({ text, checked, toggle }: { text: string; checked: Set<number>; toggle: (i: number) => void }) {
  const items = parseList(text);
  return (
    <div style={{ ...S.card, background: C.amberLight }}>
      <div style={S.sectionTitle}>🎒 Packing List</div>
      {items.map((item, i) => (
        <div key={i} onClick={() => toggle(i)} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13, cursor: "pointer", alignItems: "center" }}>
          <span style={{ width: 20, height: 20, borderRadius: 4, border: checked.has(i) ? "none" : `2px solid #ccc`, background: checked.has(i) ? C.primary : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{checked.has(i) ? "✓" : ""}</span>
          <span style={{ textDecoration: checked.has(i) ? "line-through" : "none", color: checked.has(i) ? "#aaa" : C.body }}>{item}</span>
        </div>
      ))}
      {items.length === 0 && <div style={{ fontSize: 13, color: C.muted }}>No packing list available</div>}
    </div>
  );
}

export default App;