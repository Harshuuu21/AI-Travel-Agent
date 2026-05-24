import { C, S, BUDGET_COLORS, BUDGET_TIER_CONFIG, DAY_COLORS, parseBudgetLines, parseHotels, parseDays, parseList, parseAccommodation, parseAccommodationSummary, parseTravelOptions, cleanMarkdown } from "./styles";
import type { ItineraryResponse } from "./types";
import { useState } from "react";

// ============================================================
// BUDGET TIER BADGE
// ============================================================
export function BudgetTierBadge({ tier }: { tier: string }) {
  const cfg = BUDGET_TIER_CONFIG[tier] || BUDGET_TIER_CONFIG['mid-range'];
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"6px 16px",borderRadius:20,background:`${cfg.color}15`,fontSize:13,fontWeight:700,color:cfg.color,letterSpacing:"0.3px" }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ============================================================
// BUDGET UTILIZATION BAR
// ============================================================
export function BudgetUtilizationBar({ pct }: { pct: number }) {
  const color = pct > 100 ? "#E53935" : pct >= 70 ? "#43A047" : "#FFA000";
  const msg = pct > 100 ? "Over budget — review plan" : pct >= 70 ? "Great budget utilization" : "Consider upgrading some experiences";
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:600,marginBottom:6 }}>
        <span style={{ color:C.dark }}>Budget Used</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height:10,borderRadius:5,background:"#f0f0f0",overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${Math.min(pct,100)}%`,borderRadius:5,background:color,transition:"width 0.8s ease" }} />
      </div>
      <div style={{ fontSize:11,color,marginTop:4,fontWeight:500 }}>{msg}</div>
    </div>
  );
}

// ============================================================
// BUDGET CARD
// ============================================================
export function BudgetCard({ text, utilization }: { text: string; utilization?: number }) {
  const lines = parseBudgetLines(text);
  const totalLine = lines.find(l => /total/i.test(l.category));
  const totalAmt = totalLine ? parseInt(totalLine.amount.replace(/[^\d]/g, ""), 10) || 1 : 1;
  const nonTotalLines = lines.filter(l => !/total/i.test(l.category));
  return (
    <div style={S.card}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <div style={S.sectionTitle}>💰 Budget Breakdown</div>
        {totalLine && <div style={{ fontSize:18,fontWeight:800,color:C.accent }}>{totalLine.amount}</div>}
      </div>
      {utilization != null && <BudgetUtilizationBar pct={utilization} />}
      <div style={{ display:"flex",height:8,borderRadius:4,overflow:"hidden",marginBottom:20 }}>
        {nonTotalLines.map((l,i) => {
          const amt = parseInt(l.amount.replace(/[^\d]/g,""),10)||0;
          const pct = Math.max((amt/totalAmt)*100,2);
          return <div key={i} style={{ width:`${pct}%`,background:BUDGET_COLORS[i%BUDGET_COLORS.length],transition:"width 0.6s" }} />;
        })}
      </div>
      {lines.map((l,i) => {
        const isTotal = /total/i.test(l.category);
        return (
          <div key={i}>
            {isTotal && <div style={{ height:1,background:C.divider,margin:"8px 0" }} />}
            <div style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:isTotal?15:14,fontWeight:isTotal?800:400,color:isTotal?C.dark:C.body }}>
              <span>{l.category}</span>
              <span style={{ fontWeight:isTotal?800:700,color:isTotal?C.accent:C.dark }}>{l.amount}</span>
            </div>
            {!isTotal && i<lines.length-1 && !/total/i.test(lines[i+1]?.category) && <div style={{ height:1,background:"#f5f5f5" }} />}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TRAVEL OPTIONS CARD
// ============================================================
const BOOKING_LINKS: Record<string,{label:string;url:string;bg:string}[]> = {
  Flight: [
    { label:"MakeMyTrip", url:"https://www.makemytrip.com/flights/", bg:"#E23744" },
    { label:"Goibibo", url:"https://www.goibibo.com/flights/", bg:"#F26522" },
    { label:"Cleartrip", url:"https://www.cleartrip.com/flights/", bg:"#E8710A" },
  ],
  Train: [
    { label:"IRCTC", url:"https://www.irctc.co.in/nget/train-search", bg:"#1A237E" },
  ],
  Bus: [
    { label:"RedBus", url:"https://www.redbus.in/", bg:"#D32F2F" },
    { label:"AbhiBus", url:"https://www.abhibus.com/", bg:"#FF6F00" },
  ],
};

export function TravelOptionsCard({ text }: { text: string }) {
  const options = parseTravelOptions(cleanMarkdown(text));
  if (options.length === 0) return null;
  return (
    <div style={S.card}>
      <div style={S.sectionTitle}>🚀 How to Get There</div>
      {options.map((opt,i) => {
        const links = BOOKING_LINKS[opt.mode] || BOOKING_LINKS['Flight'] || [];
        return (
          <div key={i} style={{ marginBottom:i<options.length-1?20:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
              <span style={{ fontSize:20 }}>{opt.emoji}</span>
              <span style={{ fontSize:15,fontWeight:700,color:C.dark }}>By {opt.mode}</span>
            </div>
            <div style={{ background:"#f8f9fa",borderRadius:12,padding:"14px 16px",marginBottom:10 }}>
              {opt.content.split('\n').filter(l=>l.trim()).map((line,j) => (
                <div key={j} style={{ fontSize:13,color:C.body,marginBottom:4 }}>{line.replace(/^[•\-]\s*/,'')}</div>
              ))}
            </div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
              {links.map((lnk,k) => (
                <a key={k} href={lnk.url} target="_blank" rel="noreferrer" style={{ padding:"6px 14px",borderRadius:20,background:lnk.bg,color:"#fff",fontSize:11,fontWeight:600,textDecoration:"none",transition:"opacity 0.2s" }}>
                  {lnk.label} ↗
                </a>
              ))}
            </div>
            {i < options.length-1 && <div style={{ height:1,background:C.divider,margin:"16px 0" }} />}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// ACCOMMODATION CARD (MULTI-CITY)
// ============================================================
export function AccommodationCard({ text, dest }: { text: string; dest: string }) {
  const cities = parseAccommodation(cleanMarkdown(text));
  const summary = parseAccommodationSummary(cleanMarkdown(text));
  const [expandedCity, setExpandedCity] = useState<number>(0);
  const tierColors: Record<string,string> = { Budget:C.green, "Mid-range":"#42A5F5", Premium:"#FFB300" };

  if (cities.length === 0) {
    // Fallback to legacy hotel card
    return <LegacyHotelCard text={text} dest={dest} />;
  }

  return (
    <div style={S.card}>
      <div style={S.sectionTitle}>🏨 Where to Stay</div>
      {cities.map((city,i) => {
        const isExpanded = expandedCity === i;
        const cityName = city.city || dest;
        return (
          <div key={i} style={{ marginBottom:12 }}>
            <div onClick={() => setExpandedCity(isExpanded ? -1 : i)} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderRadius:12,background:isExpanded?`${C.primary}08`:"#f8f9fa",cursor:"pointer",transition:"all 0.2s",border:isExpanded?`1px solid ${C.primary}20`:"1px solid transparent" }}>
              <div>
                <span style={{ fontSize:14,fontWeight:700,color:C.dark }}>📍 {cityName}</span>
                {city.days && <span style={{ fontSize:12,color:C.muted,marginLeft:8 }}>({city.days} — {city.nights} night{city.nights!==1?'s':''})</span>}
              </div>
              <span style={{ fontSize:16,color:C.muted,transition:"transform 0.2s",transform:isExpanded?"rotate(180deg)":"rotate(0)" }}>▼</span>
            </div>
            {isExpanded && (
              <div style={{ padding:"14px 16px",animation:"fadeInUp 0.3s ease" }}>
                {[{label:"Budget",val:city.budget},{label:"Mid-range",val:city.midrange},{label:"Premium",val:city.premium}].filter(t=>t.val).map((tier,j) => (
                  <div key={j} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:j<2?`1px solid ${C.divider}`:"none" }}>
                    <span style={{ padding:"3px 10px",borderRadius:8,fontSize:10,fontWeight:700,color:tierColors[tier.label]||C.primary,background:`${tierColors[tier.label]||C.primary}15` }}>{tier.label}</span>
                    <span style={{ flex:1,fontSize:13,color:C.body }}>{tier.val}</span>
                  </div>
                ))}
                {city.area && <div style={{ fontSize:12,color:C.muted,marginTop:8 }}>📌 Recommended area: {city.area}</div>}
                <div style={{ display:"flex",gap:6,marginTop:12,flexWrap:"wrap" }}>
                  <a href={`https://www.google.com/maps/search/hotels+in+${encodeURIComponent(cityName)}`} target="_blank" rel="noreferrer" style={{ padding:"6px 14px",borderRadius:20,background:"#4285F4",color:"#fff",fontSize:11,fontWeight:600,textDecoration:"none" }}>🗺️ Search on Maps</a>
                  <a href={`https://www.booking.com/search.html?ss=${encodeURIComponent(cityName)}`} target="_blank" rel="noreferrer" style={{ padding:"6px 14px",borderRadius:20,background:"#003580",color:"#fff",fontSize:11,fontWeight:600,textDecoration:"none" }}>Booking.com</a>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {(summary.budget || summary.midrange || summary.premium) && (
        <div style={{ marginTop:16,padding:"14px 16px",borderRadius:12,background:"#f8f9fa" }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.dark,marginBottom:8 }}>🧾 Accommodation Summary (Full Trip)</div>
          {summary.budget && <div style={{ fontSize:12,color:C.body,marginBottom:4 }}>Budget route: <strong>{summary.budget}</strong></div>}
          {summary.midrange && <div style={{ fontSize:12,color:C.body,marginBottom:4 }}>Mid-range route: <strong>{summary.midrange}</strong></div>}
          {summary.premium && <div style={{ fontSize:12,color:C.body }}>Premium route: <strong>{summary.premium}</strong></div>}
        </div>
      )}
    </div>
  );
}

function LegacyHotelCard({ text, dest }: { text: string; dest: string }) {
  const hotels = parseHotels(cleanMarkdown(text));
  const dotColors: Record<string,string> = { Budget:C.green,"Mid-range":"#42A5F5",Premium:"#FFB300" };
  return (
    <div style={S.card}>
      <div style={S.sectionTitle}>🏨 Where to Stay</div>
      {hotels.map((h,i) => (
        <div key={i}>
          <div style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 0" }}>
            <span style={{ display:"inline-block",padding:"4px 12px",borderRadius:10,fontSize:11,fontWeight:700,color:dotColors[h.label]||C.primary,background:`${dotColors[h.label]||C.primary}18` }}>{h.label}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,color:C.dark,fontWeight:500 }}>{h.desc}</div>
              {h.price && <div style={{ fontSize:13,color:C.muted,marginTop:2 }}>{h.price}</div>}
            </div>
            <div style={{ display:"flex",gap:6,flexShrink:0 }}>
              <a href={`https://www.google.com/maps/search/hotels+in+${encodeURIComponent(dest)}`} target="_blank" rel="noreferrer" style={{ padding:"5px 10px",borderRadius:8,background:"#4285F4",color:"#fff",fontSize:10,fontWeight:600,textDecoration:"none" }}>Maps</a>
              <a href={`https://www.booking.com/search.html?ss=${encodeURIComponent(dest)}`} target="_blank" rel="noreferrer" style={{ padding:"5px 10px",borderRadius:8,background:"#003580",color:"#fff",fontSize:10,fontWeight:600,textDecoration:"none" }}>Booking</a>
            </div>
          </div>
          {i < hotels.length-1 && <div style={{ height:1,background:C.divider }} />}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// DAY CARDS
// ============================================================
interface TimeSection { label: string; content: string }
function parseDaySections(content: string): { sections: TimeSection[]; spend: string; otherLines: string[] } {
  const sectionPattern = /(?:^|\n)\s*(?:\*{0,2})(Morning|Afternoon|Evening|Night)(?:\*{0,2})\s*[:\-–]?\s*/gi;
  const matches = [...content.matchAll(sectionPattern)];
  const sections: TimeSection[] = [];
  const otherLines: string[] = [];
  let spend = '';
  const spendPattern = /(?:estimated\s+(?:daily\s+)?spend|total\s+for\s+the\s+day|estimated\s+(?:spend|cost)\s+(?:for\s+)?(?:day\s*\d*)?)[:\s]*(₹[\d,]+|\d[\d,]*)/i;
  const spendMatch = content.match(spendPattern);
  if (spendMatch) {
    const amtPart = spendMatch[1].startsWith('₹') ? spendMatch[1] : `₹${spendMatch[1]}`;
    spend = `Estimated spend: ${amtPart}`;
  } else {
    const lines = content.split('\n');
    for (const line of lines) {
      if (/(spend|cost)/i.test(line) && /(₹[\d,]+|\d[\d,]+\s*rupee)/i.test(line)) {
        const numMatch = line.match(/(₹[\d,]+)/);
        if (numMatch) { spend = `Estimated spend: ${numMatch[1]}`; break; }
      }
    }
  }
  let cleanContent = content;
  if (spendMatch) cleanContent = cleanContent.replace(spendMatch[0], '');
  if (matches.length > 0) {
    matches.forEach((m, idx) => {
      const label = m[1];
      const start = (m.index ?? 0) + m[0].length;
      const end = idx < matches.length - 1 ? (matches[idx + 1].index ?? cleanContent.length) : cleanContent.length;
      const raw = cleanContent.slice(start, end).trim();
      const cleaned = raw.replace(/^[\s*•\-]+$/gm, '').replace(/\n{2,}/g, '\n').trim();
      if (cleaned.length >= 3) sections.push({ label: label.charAt(0).toUpperCase() + label.slice(1).toLowerCase(), content: cleaned });
    });
    const beforeFirst = cleanContent.slice(0, matches[0].index ?? 0).trim();
    if (beforeFirst.length >= 3) beforeFirst.split('\n').map(l => l.trim()).filter(l => l.length >= 3 && !/^[\s*•\-:]+$/.test(l)).forEach(l => otherLines.push(l));
  } else {
    cleanContent.split('\n').map(l => l.replace(/^[•\-*]\s*/, '').trim()).filter(l => l.length >= 3 && !/^[\s*•\-:]+$/.test(l)).forEach(l => otherLines.push(l));
  }
  return { sections, spend, otherLines };
}

export function DayCardsView({ text }: { text: string }) {
  const days = parseDays(text);
  const borderColors: Record<string,string> = { Morning:'#FFB74D',Afternoon:'#4FC3F7',Evening:'#7E57C2',Night:'#5C6BC0' };
  return (<>
    {days.map((d,i) => {
      const color = DAY_COLORS[i % DAY_COLORS.length];
      const dayNum = d.day.replace(/\D/g,'') || `${i+1}`;
      const { sections, spend, otherLines } = parseDaySections(d.content);
      return (
        <div key={i} style={{ ...S.card,padding:0,overflow:"hidden" }}>
          <div style={{ background:`${color}10`,padding:"16px 22px",display:"flex",alignItems:"center",gap:14 }}>
            <span style={{ width:36,height:36,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#fff",fontSize:14,flexShrink:0 }}>{dayNum}</span>
            <span style={{ color,fontWeight:700,fontSize:16 }}>{d.title||'Exploration'}</span>
          </div>
          <div style={{ padding:"18px 22px" }}>
            {sections.map((sec,j) => (
              <div key={j} style={{ borderLeft:`3px solid ${borderColors[sec.label]||'#eee'}`,paddingLeft:14,marginBottom:14 }}>
                <div style={{ fontSize:10,fontWeight:700,color:C.label,letterSpacing:"0.8px",marginBottom:4,textTransform:'uppercase' }}>{sec.label}</div>
                {sec.content.split('\n').filter(l => l.trim().length>=3).map((line,k) => (
                  <div key={k} style={{ fontSize:14,color:C.body,marginBottom:4 }}>{line.replace(/^[•]\s*/,'')}</div>
                ))}
              </div>
            ))}
            {otherLines.map((line,j) => (<div key={`o${j}`} style={{ fontSize:14,color:C.body,marginBottom:6,paddingLeft:2 }}>{line}</div>))}
            {spend && <div style={{ marginTop:12,display:"inline-block",padding:"5px 14px",borderRadius:20,background:C.coralLight,fontSize:12,fontWeight:700,color:C.accent }}>{spend}</div>}
          </div>
        </div>
      );
    })}
  </>);
}

// ============================================================
// TIPS & PACKING
// ============================================================
export function TipsCard({ text }: { text: string }) {
  const tips = parseList(text);
  return (
    <div style={{ ...S.card,background:C.greenLight }}>
      <div style={S.sectionTitle}>✅ Travel Tips</div>
      {tips.map((t,i) => (
        <div key={i} style={{ display:"flex",gap:10,marginBottom:10,fontSize:13,color:C.body }}>
          <span style={{ width:20,height:20,borderRadius:"50%",background:C.green,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,flexShrink:0 }}>✓</span>
          <span>{t}</span>
        </div>
      ))}
      {tips.length===0 && <div style={{ fontSize:13,color:C.muted }}>No tips available</div>}
    </div>
  );
}

export function PackingCard({ text, checked, toggle }: { text: string; checked: Set<number>; toggle: (i:number)=>void }) {
  const items = parseList(text);
  return (
    <div style={{ ...S.card,background:C.amberLight }}>
      <div style={S.sectionTitle}>🎒 Packing List</div>
      {items.map((item,i) => (
        <div key={i} onClick={() => toggle(i)} style={{ display:"flex",gap:10,marginBottom:10,fontSize:13,cursor:"pointer",alignItems:"center" }}>
          <span style={{ width:20,height:20,borderRadius:4,border:checked.has(i)?"none":`2px solid #ccc`,background:checked.has(i)?C.primary:"transparent",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0 }}>{checked.has(i)?"✓":""}</span>
          <span style={{ textDecoration:checked.has(i)?"line-through":"none",color:checked.has(i)?"#aaa":C.body }}>{item}</span>
        </div>
      ))}
      {items.length===0 && <div style={{ fontSize:13,color:C.muted }}>No packing list available</div>}
    </div>
  );
}

// ============================================================
// PDF EXPORT
// ============================================================
export function exportPDF(data: ItineraryResponse, checkedItems: Set<number>) {
  const w = window.open("","_blank"); if (!w) return;
  const ci = cleanMarkdown(data.itinerary||""), cb = cleanMarkdown(data.budgetBreakdown||"");
  const ch = cleanMarkdown(data.accommodation||data.hotelSuggestions||""), ct = cleanMarkdown(data.travelTips||""), cp = cleanMarkdown(data.packingList||"");
  const cto = cleanMarkdown(data.travelOptions||"");
  const days = parseDays(ci), bl = parseBudgetLines(cb);
  const hotels = parseHotels(ch), tips = parseList(ct), pack = parseList(cp);
  const tierCfg = BUDGET_TIER_CONFIG[data.budgetTier] || BUDGET_TIER_CONFIG['mid-range'];
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Itinerary — ${data.destination}</title>
<style>body{font-family:'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:32px;color:#1A1A2E}
h1{color:#5C6BC0;font-size:28px}h2{margin-top:24px;color:#5C6BC0;font-size:18px}
table{width:100%;border-collapse:collapse;margin:8px 0}td{padding:8px;border-bottom:1px solid #f0f0f0}
.total{font-weight:800;color:#FF7043;font-size:15px}
.day{background:#FAFAF8;border-radius:12px;padding:20px;margin:12px 0;border:1px solid #f0f0f0}
.day h3{margin:0 0 8px;color:#5C6BC0}ul{padding-left:20px}li{margin:4px 0;color:#555}
.badge{display:inline-block;padding:4px 14px;border-radius:16px;font-size:12px;font-weight:700;margin-bottom:12px;background:${tierCfg.color}20;color:${tierCfg.color}}</style></head><body>
<h1>✈️ Trip to ${data.destination}</h1>
<div class="badge">${tierCfg.emoji} ${tierCfg.label}</div>
<p><strong>Weather:</strong> ${data.weather.temperature}°C — ${data.weather.condition}</p>
${cto ? `<h2>🚀 How to Get There</h2><pre style="white-space:pre-wrap;font-family:inherit">${cto}</pre>` : ''}
<h2>💰 Budget Breakdown</h2><table>${bl.map(b=>`<tr class="${/total/i.test(b.category)?'total':''}"><td>${b.category}</td><td style="text-align:right">${b.amount}</td></tr>`).join("")}</table>
<h2>🏨 Accommodation</h2><ul>${hotels.map(h=>`<li><strong>${h.label}:</strong> ${h.desc} ${h.price?"— "+h.price:""}</li>`).join("")}</ul>
<h2>📅 Day-by-Day Itinerary</h2>${days.map(d=>`<div class="day"><h3>${d.day}: ${d.title}</h3><pre style="white-space:pre-wrap;font-family:inherit;margin:0">${d.content}</pre></div>`).join("")}
<h2>✅ Travel Tips</h2><ul>${tips.map(t=>`<li>${t}</li>`).join("")}</ul>
<h2>🎒 Packing List</h2><ul>${pack.map((p,i)=>`<li>${checkedItems.has(i)?"☑":"☐"} ${p}</li>`).join("")}</ul>
</body></html>`);
  w.document.close(); setTimeout(() => w.print(), 400);
}
