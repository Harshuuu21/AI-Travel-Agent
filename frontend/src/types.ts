export interface WeatherData {
  temperature: number | string;
  condition: string;
}

export interface ItineraryResponse {
  destination: string;
  weather: WeatherData;
  budgetBreakdown: string;
  hotelSuggestions: string;
  itinerary: string;
  travelTips: string;
  packingList: string;
}
