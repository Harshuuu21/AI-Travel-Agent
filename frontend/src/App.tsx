import { useState, useEffect } from "react";
import axios from "axios";
import { 
  MapPin, 
  Calendar, 
  Wallet, 
  Settings, 
  Compass, 
  Sparkles,
  Loader2,
  Map as MapIcon
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import "./App.css";

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle automatic map bounds jumping
function MapBounds({ locations }: { locations: Location[] }) {
  const map = useMap();
  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  return null;
}

interface Location {
  name: string;
  lat: number;
  lng: number;
}

function App() {
  const [budget, setBudget] = useState("");
  const [month, setMonth] = useState("");
  const [duration, setDuration] = useState("");
  const [destination, setDestination] = useState("");
  const [preference, setPreference] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [parsedDestination, setParsedDestination] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateItinerary = async () => {
    if (!budget || !month || !duration) return;
    
    setIsLoading(true);
    setResult(null);
    setLocations([]);
    
    try {
      const response = await axios.post("http://localhost:5000/generate-itinerary", {
        budget,
        month,
        duration,
        destination: destination || "Anywhere",
        preference: preference || "Any"
      });

      setParsedDestination(response.data.destination);
      setResult(response.data.itinerary);
      if (response.data.locations && Array.isArray(response.data.locations)) {
        setLocations(response.data.locations);
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
      setResult("Error generating itinerary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Main Area */}
      <main className="main-content">
        <header className="header text-center">
          <div className="brand-logo mb-6">
            <span className="brand-text">TRVL<span className="brand-dot">.</span></span>
          </div>
          <h1 className="page-title">Generate Experience</h1>
          <p className="page-subtitle">Your personalized, AI-driven travel operating system.</p>
        </header>

        <div className="content-grid two-columns">
          
          {/* Left Column: Input and Itinerary Text */}
          <div className="left-column">
            {/* Input Panel */}
            <section className="glass-panel planner-card animate-fade-in mb-6">
              <div className="form-group">
                <label className="form-label">Destination</label>
                <div className="input-wrapper">
                  <MapPin className="input-icon" />
                  <input
                    className="premium-input"
                    placeholder="Where to? (e.g. Tokyo, Japan)"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Timing</label>
                <div className="input-wrapper">
                  <Calendar className="input-icon" />
                  <input
                    className="premium-input"
                    placeholder="When are you traveling? (e.g. October)"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Duration</label>
                <div className="input-wrapper">
                  <Settings className="input-icon" />
                  <input
                    className="premium-input"
                    placeholder="How many days? (e.g. 7)"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Budget</label>
                <div className="input-wrapper">
                  <Wallet className="input-icon" />
                  <input
                    className="premium-input"
                    placeholder="Total budget in ₹ (e.g. 150000)"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vibe / Preferences</label>
                <div className="input-wrapper">
                  <Sparkles className="input-icon" />
                  <input
                    className="premium-input"
                    placeholder="Mountains, beaches, culture, food..."
                    value={preference}
                    onChange={(e) => setPreference(e.target.value)}
                  />
                </div>
              </div>

              <button 
                className="submit-btn" 
                onClick={generateItinerary}
                disabled={isLoading || !budget || !month || !duration}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="loader-icon" size={20} />
                    <span>Synthesizing Itinerary...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate Itinerary</span>
                  </>
                )}
              </button>
            </section>

            {/* Result Panel (Text Only) */}
            <section className="glass-panel result-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
               <div className="result-header">
                <div className="result-title">
                  <Compass size={18} />
                  <span>Itinerary Details</span>
                </div>
                {result && <div className="result-badge">AI Optimized</div>}
              </div>
              <div className="result-content text-result-content">
                {!result && !isLoading && (
                  <div className="empty-state">
                    <MapIcon className="empty-icon" />
                    <p>Enter parameters to chart your course.</p>
                  </div>
                )}
                
                {isLoading && (
                  <div className="empty-state">
                    <Loader2 className="loader-icon empty-icon" />
                    <p>Analyzing global databases...</p>
                  </div>
                )}

                {result && !isLoading && (
                  <div className="itinerary-output animate-fade-in">
                    <div className="destination-highlight">
                      {parsedDestination}
                    </div>
                    {result}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Map panel */}
          <section className="glass-panel map-card animate-fade-in sticky-map" style={{ animationDelay: '0.2s' }}>
            <div className="result-header">
              <div className="result-title">
                <MapIcon size={18} />
                <span>Travel Map</span>
              </div>
            </div>
            
            <div className="map-container-wrapper">
              <MapContainer 
                center={[20.5937, 78.9629]} // Default center India
                zoom={4} 
                style={{ height: "100%", width: "100%", zIndex: 1 }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapBounds locations={locations} />
                {locations.map((loc, idx) => (
                  <Marker key={idx} position={[loc.lat, loc.lng]}>
                    <Popup className="premium-popup">
                      <strong>{loc.name}</strong>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
               
               {/* Overlay when loading or empty */}
               {(!result || isLoading) && (
                 <div className="map-overlay">
                   {isLoading ? (
                      <div className="empty-state">
                        <Loader2 className="loader-icon empty-icon" />
                        <p>Locating destinations...</p>
                      </div>
                   ) : (
                      <div className="empty-state">
                        <MapPin className="empty-icon" style={{ opacity: 0.3 }} />
                        <p>Map will populate with generated stops.</p>
                      </div>
                   )}
                 </div>
               )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default App;