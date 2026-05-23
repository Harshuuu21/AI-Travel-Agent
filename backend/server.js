const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// OpenWeather API key
const apiKey = "378f02ef011e0178edd20a1043419ddc";


// ================================
// LLM CALL FUNCTION
// ================================
async function askAI(promptText) {
  try {

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llama3.2:3b",
        prompt: promptText,
        stream: false
      }
    );

    return response.data.response;

  } catch (error) {

    console.error("Ollama error:", error.message);
    return "AI generation failed.";
  }
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

Return in this format:

Destination: <city>
Reason: <short reason>
`;

  return await askAI(prompt);
}



// ================================
// WEATHER AGENT
// ================================
async function weatherAgent(city) {

  try {

    const url =
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    const res = await axios.get(url);

    return {
      temperature: res.data.main.temp,
      condition: res.data.weather[0].description
    };

  } catch (error) {

    return {
      temperature: "Unknown",
      condition: "Weather unavailable"
    };
  }
}



// ================================
// ITINERARY API
// ================================
app.post("/generate-itinerary", async (req, res) => {

  const {
    budget,
    month,
    duration,
    destination,
    preference
  } = req.body;

  let finalDestination = destination;

  // Destination Agent (if user did not provide)
  if (!destination) {

    const dest = await destinationAgent(
      budget,
      month,
      preference
    );

    finalDestination = dest;
  }

  // Weather Agent
  const weather = await weatherAgent(finalDestination);

  // Itinerary Agent
  const itineraryPrompt = `
You are an expert travel planner.

Destination:
${finalDestination}

Weather:
Temperature: ${weather.temperature}°C
Condition: ${weather.condition}

Trip Details:
Budget: ₹${budget}
Duration: ${duration} days
Month: ${month}
Preference: ${preference}

Create a travel itinerary including:

1. Budget breakdown
2. Day-by-day itinerary
3. Key attractions
4. Food suggestions
5. Travel tips

VERY IMPORTANT: At the very end of your response, you MUST include a strict JSON array of the top 3-5 specific places/attractions recommended in your itinerary, including their exact latitude and longitude. 
Enclose this JSON array exactly between the tags <JSON_LOCATIONS> and </JSON_LOCATIONS>.
Example format:
<JSON_LOCATIONS>
[
  {"name": "Taj Mahal", "lat": 27.1751, "lng": 78.0421},
  {"name": "Agra Fort", "lat": 27.1795, "lng": 78.0211}
]
</JSON_LOCATIONS>
`;

  const itinerary = await askAI(itineraryPrompt);

  // Critic Agent
  const criticPrompt = `
You are a travel reviewer.

Check this itinerary for:
- Budget feasibility
- Seasonal suitability
- Travel practicality

If needed improve it. Make sure the <JSON_LOCATIONS> array and its contents remain intact and perfectly formatted at the end of your response, exactly as the original. If it was missing, generate it now.

ITINERARY:
${itinerary}
`;

  let finalPlan = await askAI(criticPrompt);
  let locations = [];

  // Extract JSON from response
  try {
    const jsonMatch = finalPlan.match(/<JSON_LOCATIONS>([\s\S]*?)<\/JSON_LOCATIONS>/);
    if (jsonMatch && jsonMatch[1]) {
      locations = JSON.parse(jsonMatch[1].trim());
      // Remove the JSON block from the final display text
      finalPlan = finalPlan.replace(/<JSON_LOCATIONS>[\s\S]*?<\/JSON_LOCATIONS>/, '').trim();
    }
  } catch (err) {
    console.error("Error parsing locations JSON:", err);
  }

  res.json({
    destination: finalDestination,
    weather: weather,
    itinerary: finalPlan,
    locations: locations
  });

});



// ================================
// SERVER START
// ================================
app.listen(5000, () => {
  console.log("Server running on port 5000");
});