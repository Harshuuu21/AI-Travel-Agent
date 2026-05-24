export interface WeatherData {
  temperature: number | string;
  condition: string;
}

export interface ItineraryResponse {
  destination: string;
  weather: WeatherData;
  budgetTier: string;
  budgetUtilization: number;
  travelOptions: string;
  budgetBreakdown: string;
  accommodation: string;
  hotelSuggestions: string;
  itinerary: string;
  travelTips: string;
  packingList: string;
}
