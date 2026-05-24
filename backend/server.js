require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ================================
// ENVIRONMENT VARIABLES
// ================================
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const PORT = process.env.PORT || 5000;


// ================================
// LLM CALL FUNCTION
// ================================
async function askAI(promptText) {
  try {
    const response = await axios.post(OLLAMA_URL, {
      model: "llama3.2:3b",
      prompt: promptText,
      stream: false,
    });
    return response.data.response;
  } catch (error) {
    console.error("Ollama error:", error.message);
    return "AI generation failed.";
  }
}


// ================================
// EXTRACT CITY NAME HELPER
// ================================
function extractCityName(text) {
  if (!text) return "";

  // Try "Destination: CityName" pattern first
  const destMatch = text.match(/Destination:\s*([A-Za-z\s]+)/i);
  if (destMatch) {
    // Take only the first 1-3 words before any dash, comma, parenthesis, or long description
    const raw = destMatch[1].trim();
    const cleaned = raw.split(/[\—\-\–\,\(\.\!]/)[0].trim();
    // Return only the first meaningful words (city names are 1-3 words max)
    const words = cleaned.split(/\s+/).slice(0, 3);
    return words.join(" ").trim();
  }

  // If no "Destination:" prefix, try to grab the first capitalized word(s)
  const lines = text.trim().split("\n");
  for (const line of lines) {
    const match = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
    if (match) {
      return match[1].trim();
    }
  }

  // Last resort: return first line trimmed
  return lines[0].trim().split(/[\—\-\–\,\(]/)[0].trim();
}


// ================================
// BUDGET TIER CATEGORIZATION
// ================================
function categorizeBudget(budget, totalPeople, duration) {
  const perPersonPerDay = budget / totalPeople / duration;
  if (perPersonPerDay < 1000) return 'backpacker';
  if (perPersonPerDay < 2500) return 'budget';
  if (perPersonPerDay < 5000) return 'mid-range';
  if (perPersonPerDay < 10000) return 'comfortable';
  if (perPersonPerDay < 20000) return 'premium';
  return 'luxury';
}


// ================================
// BUDGET UTILIZATION CALCULATOR
// ================================
function calculateBudgetUtilization(parsedText, totalBudget) {
  if (!parsedText || !totalBudget) return 85; // default fallback
  // Try to find TOTAL line in budget breakdown
  const totalMatch = parsedText.match(/TOTAL[^:]*:\s*₹?([\d,]+)/i);
  if (totalMatch) {
    const estimatedSpend = parseInt(totalMatch[1].replace(/,/g, ''), 10);
    if (estimatedSpend > 0) {
      return Math.min(Math.round((estimatedSpend / totalBudget) * 100), 150);
    }
  }
  return 85;
}


// ================================
// DESTINATION AGENT
// ================================
async function destinationAgent(budget, month, preference, adults, children, departureCity) {
  const totalPeople = (adults || 1) + (children || 0);
  const hasKids = (children || 0) > 0;
  const prompt = `
You are a travel expert.

User details:
Budget: ₹${budget}
Month: ${month}
Preference: ${preference}
Group: ${totalPeople} people (${adults || 1} adults, ${children || 0} children)
${hasKids ? 'Note: There are children in the group — suggest family-friendly destinations.' : ''}
${departureCity ? `Departing from: ${departureCity}` : ''}

Choose the BEST destination in India for this user.

Return in this EXACT format only (no extra text):

Destination: <city name only>
Reason: <one short sentence>
`;

  return await askAI(prompt);
}


// ================================
// WEATHER AGENT
// ================================
async function weatherAgent(cityInput) {
  try {
    const city = extractCityName(cityInput);
    if (!city) {
      console.warn("Weather Agent: Could not extract city name from:", cityInput);
      return { temperature: "N/A", condition: "Weather data unavailable" };
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const res = await axios.get(url);

    return {
      temperature: res.data.main.temp,
      condition: res.data.weather[0].description,
    };
  } catch (error) {
    console.error("Weather Agent error:", error.message);
    return { temperature: "N/A", condition: "Weather data unavailable" };
  }
}


// ================================
// PARSE ITINERARY RESPONSE
// ================================
function parseItineraryResponse(text) {
  const sections = {
    travelOptions: "",
    budgetBreakdown: "",
    accommodation: "",
    hotelSuggestions: "",
    itinerary: "",
    travelTips: "",
    packingList: "",
  };

  if (!text) return sections;

  try {
    // Extract TRAVEL OPTIONS section
    const travelMatch = text.match(/TRAVEL OPTIONS:([\s\S]*?)(?=BUDGET BREAKDOWN:|ACCOMMODATION PLAN:|DAY \d|TRAVEL TIPS:|PACKING LIST:|$)/i);
    if (travelMatch) sections.travelOptions = travelMatch[1].trim();

    // Extract BUDGET BREAKDOWN section
    const budgetMatch = text.match(/BUDGET BREAKDOWN:([\s\S]*?)(?=ACCOMMODATION PLAN:|HOTEL SUGGESTIONS:|DAY \d|TRAVEL TIPS:|PACKING LIST:|$)/i);
    if (budgetMatch) sections.budgetBreakdown = budgetMatch[1].trim();

    // Extract ACCOMMODATION PLAN section (new multi-city format)
    const accomMatch = text.match(/ACCOMMODATION PLAN:([\s\S]*?)(?=DAY \d|TRAVEL TIPS:|PACKING LIST:|$)/i);
    if (accomMatch) {
      sections.accommodation = accomMatch[1].trim();
      sections.hotelSuggestions = accomMatch[1].trim();
    }

    // Fallback: try old HOTEL SUGGESTIONS format
    if (!sections.accommodation) {
      const hotelMatch = text.match(/HOTEL SUGGESTIONS:([\s\S]*?)(?=DAY \d|TRAVEL TIPS:|PACKING LIST:|$)/i);
      if (hotelMatch) {
        sections.accommodation = hotelMatch[1].trim();
        sections.hotelSuggestions = hotelMatch[1].trim();
      }
    }

    // Extract DAY-BY-DAY itinerary (all DAY sections combined)
    const dayMatches = text.match(/(DAY \d[\s\S]*?)(?=TRAVEL TIPS:|PACKING LIST:|$)/i);
    if (dayMatches) sections.itinerary = dayMatches[1].trim();

    // Extract TRAVEL TIPS section
    const tipsMatch = text.match(/TRAVEL TIPS:([\s\S]*?)(?=PACKING LIST:|$)/i);
    if (tipsMatch) sections.travelTips = tipsMatch[1].trim();

    // Extract PACKING LIST section
    const packingMatch = text.match(/PACKING LIST:([\s\S]*?)$/i);
    if (packingMatch) sections.packingList = packingMatch[1].trim();
  } catch (err) {
    console.error("Error parsing itinerary sections:", err.message);
    // If parsing fails, put entire text in itinerary
    sections.itinerary = text;
  }

  // Fallback: if no sections were parsed, put everything in itinerary
  if (!sections.budgetBreakdown && !sections.accommodation && !sections.itinerary) {
    sections.itinerary = text;
  }

  return sections;
}


// ================================
// ITINERARY API
// ================================
app.post("/generate-itinerary", async (req, res) => {
  try {
    const { budget, month, duration, destination, preference, adults, children, departureCity } = req.body;

    const numAdults = parseInt(adults) || 1;
    const numChildren = parseInt(children) || 0;
    const totalPeople = numAdults + numChildren;
    const numBudget = parseInt(budget) || 0;
    const numDuration = parseInt(duration) || 1;
    const budgetTier = categorizeBudget(numBudget, totalPeople, numDuration);
    const perPersonPerDay = Math.round(numBudget / totalPeople / numDuration);
    const hasKids = numChildren > 0;
    const fromCity = departureCity || "Not specified";

    // ---- Destination Agent ----
    let finalDestination = destination;
    if (!destination || destination === "Anywhere" || destination.trim() === "") {
      const dest = await destinationAgent(budget, month, preference, numAdults, numChildren, fromCity);
      finalDestination = dest;
    }

    // Extract clean city name for display and APIs
    const cityName = extractCityName(finalDestination);

    // ---- Weather Agent ----
    const weather = await weatherAgent(finalDestination);

    // ---- Itinerary Agent ----
    const itineraryPrompt = `
You are an expert travel planner for India.

Destination: ${cityName}
Weather: Temperature: ${weather.temperature}°C, Condition: ${weather.condition}
Departure City: ${fromCity}
Trip Details: Budget: ₹${numBudget}, Duration: ${numDuration} days, Month: ${month}, Preference: ${preference}
Group: ${totalPeople} people — ${numAdults} adult${numAdults > 1 ? 's' : ''}${hasKids ? ` and ${numChildren} child${numChildren > 1 ? 'ren' : ''} (below 12)` : ''}
Budget Tier: ${budgetTier.toUpperCase()} — ₹${perPersonPerDay} per person per day

The user has a ${budgetTier} budget of ₹${numBudget} total for ${totalPeople} people for ${numDuration} days. This means ₹${perPersonPerDay} per person per day. You MUST suggest accommodation, food, and activities that match this spending level. Do NOT suggest budget options if the user has a premium or luxury budget. Use the FULL budget — if there is remaining budget after essentials suggest upgrades like:
- Better hotels (suite vs standard room)
- Private transfers instead of shared
- Fine dining experiences
- Premium activities (helicopter ride, private guided tours, spa days)
- Business class or premium economy flights
The goal is to give the user the BEST possible experience for their actual budget, not the cheapest possible trip.

${hasKids ? `IMPORTANT — CHILDREN IN GROUP:
- Suggest family-friendly activities only
- Avoid strenuous treks or extreme adventure activities
- Suggest kid-friendly alternatives where possible
- Mention child entry fees separately where applicable
- Hotel rooms should accommodate families (family rooms or connecting rooms)
` : ''}

Create a detailed travel itinerary in this EXACT format. Follow every section header exactly as shown:

TRAVEL OPTIONS:

✈️ FLIGHT:
Route: ${fromCity} → ${cityName} (via hub if needed)
Airlines: suggest specific airlines
Cost per adult: ₹XXXX
Cost per child: ₹XXXX
Total for group: ₹XXXX (${numAdults} adults + ${numChildren} children)
Duration: X hours
Best option: specific recommendation
Booking tip: when to book for best price

🚂 TRAIN:
Route: ${fromCity} → ${cityName}
Train name/number: suggest specific train
Class recommended: Sleeper/3AC/2AC based on ${budgetTier} budget
Cost per adult: ₹XXXX
Cost per child: ₹XXXX
Total for group: ₹XXXX
Duration: X hours
Best option: specific recommendation

🚌 BUS:
Route: ${fromCity} → ${cityName}
Type: AC Sleeper / Volvo / State bus based on ${budgetTier} budget
Cost per adult: ₹XXXX
Cost per child: ₹XXXX
Total for group: ₹XXXX
Duration: X hours
Best option: specific recommendation

BUDGET BREAKDOWN:

TRANSPORT BREAKDOWN:
${fromCity} → ${cityName} (recommended mode):
Adult ticket: ₹XXXX × ${numAdults} adults = ₹XXXX
${hasKids ? `Child ticket: ₹XXXX × ${numChildren} children = ₹XXXX` : ''}
Return journey: ₹XXXX
Local transport at destination: ₹XXXX
Inter-city transport during trip: ₹XXXX
TRANSPORT TOTAL: ₹XXXX

Hotel: ₹XXXX per night per room × N rooms × ${numDuration} nights (specify how many rooms recommended for ${numAdults} adults${hasKids ? ` + ${numChildren} children` : ''})
Food: ₹XXXX per person per day × ${totalPeople} people × ${numDuration} days = ₹XXXX
Activity costs: ₹XXXX per adult × ${numAdults} + ${hasKids ? `₹XXXX per child × ${numChildren}` : ''} = ₹XXXX total
Buffer/Emergency: ₹XXXX
TOTAL for entire group: ₹XXXX

IMPORTANT: The TOTAL must be close to ₹${numBudget}. You are planning a ${budgetTier} trip. Use the full budget appropriately.

ACCOMMODATION PLAN:

Identify ALL distinct cities/locations the itinerary covers and provide accommodation for EACH city separately. Do NOT suggest just one hotel for the entire trip if multiple cities are visited.

📍 CITY 1: [City Name] (Day X to Day Y — N nights)
Budget option: [name/type] — ₹XXXX per night
Mid-range option: [name/type] — ₹XXXX per night
Premium option: [name/type] — ₹XXXX per night
Area to stay in: [neighborhood or area recommendation]

📍 CITY 2: [City Name] (Day X to Day Y — N nights)
Budget option: [name/type] — ₹XXXX per night
Mid-range option: [name/type] — ₹XXXX per night
Premium option: [name/type] — ₹XXXX per night
Area to stay in: [neighborhood or area recommendation]

(continue for each city in the itinerary)

TOTAL ACCOMMODATION COST:
Budget route total: ₹XXXX for entire trip
Mid-range route total: ₹XXXX for entire trip
Premium route total: ₹XXXX for entire trip

DAY 1: [Title]
- Morning: activity description
- Afternoon: activity description
- Evening: activity description
- Estimated spend today: ₹XXXX

DAY 2: [Title]
- Morning: activity description
- Afternoon: activity description
- Evening: activity description
- Estimated spend today: ₹XXXX

(Continue for all ${numDuration} days)

TRAVEL TIPS:
- tip 1
- tip 2
- tip 3

PACKING LIST:
- item 1
- item 2
- item 3

IMPORTANT RULES:
1. All costs must be in Indian Rupees (₹)
2. The TOTAL in budget breakdown must equal approximately ₹${numBudget}
3. Activities and hotels must match the ${budgetTier} spending level
4. Activities must be appropriate for ${month}
5. Use the EXACT section headers shown above
6. If the trip covers multiple cities (e.g. a state tour), provide SEPARATE hotel suggestions for each city
7. All activity costs should show per-person and group total
${hasKids ? '8. All activities must be child-friendly. Avoid extreme sports, strenuous treks.\n9. Show child entry fees separately.' : ''}
`;

    const itinerary = await askAI(itineraryPrompt);

    // ---- Critic Agent ----
    const criticPrompt = `
You are a strict travel itinerary reviewer.

Review this itinerary and improve it if needed. Check the following:
1. Budget breakdown adds up correctly and the TOTAL is close to ₹${numBudget}
2. Hotel suggestions are realistic for the destination and budget range (${budgetTier})
3. Day-wise spending is consistent with the total budget
4. Activities are seasonally appropriate for ${month}
5. Budget feasibility — is the plan realistic?
6. Travel practicality — are timings and distances reasonable?
7. BUDGET UTILIZATION CHECK: The total estimated spend should use close to the full budget of ₹${numBudget}. If the total is less than 80% of ₹${numBudget} (i.e., less than ₹${Math.round(numBudget * 0.8)}), suggest upgrades to accommodation, dining, or activities to utilize the remaining budget. If over budget, suggest what to cut.
8. For a ${budgetTier} trip, ensure suggestions match the spending tier — do NOT suggest budget hotels for a premium/luxury budget.
${hasKids ? '9. Verify all activities are child-friendly and safe for children below 12.' : ''}
10. If multiple cities are visited, ensure EACH city has separate accommodation suggestions.

If something is wrong, FIX IT in your response. Keep the EXACT same format with all section headers:
TRAVEL OPTIONS:, BUDGET BREAKDOWN:, ACCOMMODATION PLAN:, DAY 1:, DAY 2:, etc., TRAVEL TIPS:, PACKING LIST:

ITINERARY TO REVIEW:
${itinerary}
`;

    const finalPlan = await askAI(criticPrompt);

    // ---- Parse Response ----
    const parsed = parseItineraryResponse(finalPlan);

    // ---- Calculate Budget Utilization ----
    const budgetUtilization = calculateBudgetUtilization(finalPlan, numBudget);

    res.json({
      destination: cityName || finalDestination,
      weather: weather,
      budgetTier: budgetTier,
      budgetUtilization: budgetUtilization,
      travelOptions: parsed.travelOptions,
      budgetBreakdown: parsed.budgetBreakdown,
      accommodation: parsed.accommodation,
      hotelSuggestions: parsed.accommodation || parsed.hotelSuggestions,
      itinerary: parsed.itinerary,
      travelTips: parsed.travelTips,
      packingList: parsed.packingList,
    });

  } catch (error) {
    console.error("Error in /generate-itinerary:", error.message);
    res.status(500).json({ error: "Failed to generate itinerary. Please try again." });
  }
});


// ================================
// SERVER START
// ================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});