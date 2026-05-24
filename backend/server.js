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
// DESTINATION AGENT
// ================================
async function destinationAgent(budget, month, preference) {
  const prompt = `
You are a travel expert.

User details:
Budget: ₹${budget}
Month: ${month}
Preference: ${preference}

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
    budgetBreakdown: "",
    hotelSuggestions: "",
    itinerary: "",
    travelTips: "",
    packingList: "",
  };

  if (!text) return sections;

  try {
    // Extract BUDGET BREAKDOWN section
    const budgetMatch = text.match(/BUDGET BREAKDOWN:([\s\S]*?)(?=HOTEL SUGGESTIONS:|DAY \d|TRAVEL TIPS:|PACKING LIST:|$)/i);
    if (budgetMatch) sections.budgetBreakdown = budgetMatch[1].trim();

    // Extract HOTEL SUGGESTIONS section
    const hotelMatch = text.match(/HOTEL SUGGESTIONS:([\s\S]*?)(?=DAY \d|TRAVEL TIPS:|PACKING LIST:|$)/i);
    if (hotelMatch) sections.hotelSuggestions = hotelMatch[1].trim();

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
  if (!sections.budgetBreakdown && !sections.hotelSuggestions && !sections.itinerary) {
    sections.itinerary = text;
  }

  return sections;
}


// ================================
// ITINERARY API
// ================================
app.post("/generate-itinerary", async (req, res) => {
  try {
    const { budget, month, duration, destination, preference } = req.body;

    // ---- Destination Agent ----
    let finalDestination = destination;
    if (!destination || destination === "Anywhere" || destination.trim() === "") {
      const dest = await destinationAgent(budget, month, preference);
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
Trip Details: Budget: ₹${budget}, Duration: ${duration} days, Month: ${month}, Preference: ${preference}

Create a detailed travel itinerary in this EXACT format. Follow every section header exactly as shown:

BUDGET BREAKDOWN:
- Transport: ₹XXXX (brief reason)
- Hotel/Stay: ₹XXXX per night × ${duration} nights = ₹XXXX
- Food: ₹XXXX per day × ${duration} days = ₹XXXX
- Activity 1 name: ₹XXXX
- Activity 2 name: ₹XXXX
- Activity 3 name: ₹XXXX
- Buffer/Emergency: ₹XXXX
- TOTAL: ₹XXXX

HOTEL SUGGESTIONS:
- Budget option: [Hotel/Homestay name or type] — approx ₹XXXX per night
- Mid-range option: [Hotel name or type] — approx ₹XXXX per night
- Premium option: [Hotel/Resort name or type] — approx ₹XXXX per night

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

(Continue for all ${duration} days)

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
2. The TOTAL in budget breakdown must equal approximately ₹${budget}
3. Hotel suggestions must be realistic for ${cityName}
4. Activities must be appropriate for ${month}
5. Use the EXACT section headers shown above
`;

    const itinerary = await askAI(itineraryPrompt);

    // ---- Critic Agent ----
    const criticPrompt = `
You are a strict travel itinerary reviewer.

Review this itinerary and improve it if needed. Check the following:
1. Budget breakdown adds up correctly and the TOTAL is close to ₹${budget}
2. Hotel suggestions are realistic for the destination and budget range
3. Day-wise spending is consistent with the total budget
4. Activities are seasonally appropriate for ${month}
5. Budget feasibility — is the plan realistic?
6. Travel practicality — are timings and distances reasonable?

If something is wrong, FIX IT in your response. Keep the EXACT same format with all section headers:
BUDGET BREAKDOWN:, HOTEL SUGGESTIONS:, DAY 1:, DAY 2:, etc., TRAVEL TIPS:, PACKING LIST:

ITINERARY TO REVIEW:
${itinerary}
`;

    const finalPlan = await askAI(criticPrompt);

    // ---- Parse Response ----
    const parsed = parseItineraryResponse(finalPlan);

    res.json({
      destination: cityName || finalDestination,
      weather: weather,
      budgetBreakdown: parsed.budgetBreakdown,
      hotelSuggestions: parsed.hotelSuggestions,
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