import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_URL =
  "https://api.rainviewer.com/public/weather-maps.json";

function LiveRadar({ latitude = 28.6139, longitude = 77.2090 }) {
  const mapRef = useRef(null);
  const radarLayerRef = useRef(null);
  const framesRef = useRef([]);

  const [frames, setFrames] = useState([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [opacity, setOpacity] = useState(0.7);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  // Create map
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("radar-map").setView(
      [latitude, longitude],
      7
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(map);

    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup("Your location");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  // Get radar frames
  useEffect(() => {
    const loadRadar = async () => {
      try {
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Radar API request failed");
        }

        const data = await response.json();

        const radarFrames = data?.radar?.past || [];

        if (!radarFrames.length) {
          throw new Error("No radar data available");
        }

        framesRef.current = radarFrames;
        setFrames(radarFrames);
        setFrameIndex(radarFrames.length - 1);
      } catch (err) {
        console.error("Radar error:", err);
        setError("Unable to load live radar");
      }
    };

    loadRadar();
  }, []);

  // Display radar frame
  useEffect(() => {
    if (!mapRef.current || !frames.length) return;

    const frame = frames[frameIndex];

    if (!frame) return;

    if (radarLayerRef.current) {
      mapRef.current.removeLayer(radarLayerRef.current);
    }

    const tileUrl =
      `https://tilecache.rainviewer.com${frame.path}` +
      `/256/{z}/{x}/{y}/2/1_1.png`;

    radarLayerRef.current = L.tileLayer(tileUrl, {
      opacity: opacity,
      maxZoom: 7,
      attribution:
        '<a href="https://www.rainviewer.com/" target="_blank">Weather data by RainViewer</a>'
    });

    radarLayerRef.current.addTo(mapRef.current);
  }, [frames, frameIndex, opacity]);

  // Animation
  useEffect(() => {
    if (!playing || frames.length < 2) return;

    const timer = setInterval(() => {
      setFrameIndex((current) => {
        if (current >= frames.length - 1) {
          return 0;
        }

        return current + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [playing, frames]);

  return (
    <div>
      <div
        id="radar-map"
        style={{
          height: "500px",
          width: "100%"
        }}
      />

      {error && (
        <p>{error}</p>
      )}

      {frames.length > 0 && (
        <div style={{ padding: "10px" }}>
          <button
            onClick={() => setPlaying(!playing)}
          >
            {playing ? "Pause" : "Play"}
          </button>

          <input
            type="range"
            min="0"
            max={frames.length - 1}
            value={frameIndex}
            onChange={(e) =>
              setFrameIndex(Number(e.target.value))
            }
          />

          <label>
            Opacity:
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) =>
                setOpacity(Number(e.target.value))
              }
            />
          </label>
        </div>
      )}

      <p style={{ fontSize: "12px" }}>
        Weather data by RainViewer
      </p>
    </div>
  );
}

export default LiveRadar;
