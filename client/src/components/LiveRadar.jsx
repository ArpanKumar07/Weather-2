import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Play, Pause, RotateCcw, Layers, MapPin, Radio } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

export default function LiveRadar() {
  const { currentWeather } = useWeather();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const radarLayerRef = useRef(null);

  const [radarFrames, setRadarFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [radarHost, setRadarHost] = useState('https://tilecache.rainviewer.com');
  const [opacity, setOpacity] = useState(0.75);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentWeather?.latitude || 22.57, currentWeather?.longitude || 88.36],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
      });

      // Sleek Dark CartoDB base tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Center when city changes
  useEffect(() => {
    if (mapInstanceRef.current && currentWeather) {
      const { latitude, longitude, city_name } = currentWeather;
      mapInstanceRef.current.setView([latitude, longitude], 7, { animate: true });

      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Add stylish glowing marker
      const customIcon = L.divIcon({
        className: 'custom-radar-pin',
        html: `<div style="width:16px;height:16px;background:#38bdf8;border:3px solid #fff;border-radius:50%;box-shadow:0 0 15px #38bdf8;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      markerRef.current = L.marker([latitude, longitude], { icon: customIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>${city_name}</strong><br/>Live Weather Station`);
    }
  }, [currentWeather]);

  // Fetch RainViewer radar timestamps
  useEffect(() => {
    async function fetchRadarTimestamps() {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        if (data && data.radar && data.radar.past) {
          const frames = [...data.radar.past, ...(data.radar.nowcast || [])];
          setRadarFrames(frames);
          setRadarHost(data.host || 'https://tilecache.rainviewer.com');
          setCurrentFrameIndex(frames.length - 1);
        }
      } catch (err) {
        console.warn('RainViewer fetch error:', err);
      }
    }
    fetchRadarTimestamps();
  }, []);

  // Update Radar Layer on frame or opacity change
  useEffect(() => {
    if (!mapInstanceRef.current || radarFrames.length === 0) return;

    const frame = radarFrames[currentFrameIndex];
    if (!frame) return;

    if (radarLayerRef.current) {
      radarLayerRef.current.remove();
    }

    const tileUrl = `${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    const newLayer = L.tileLayer(tileUrl, {
      opacity: opacity,
      zIndex: 10,
    });

    newLayer.addTo(mapInstanceRef.current);
    radarLayerRef.current = newLayer;
  }, [currentFrameIndex, radarFrames, radarHost, opacity]);

  // Play animation loop
  useEffect(() => {
    if (!isPlaying || radarFrames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, radarFrames]);

  const currentFrameTime = radarFrames[currentFrameIndex]?.time
    ? new Date(radarFrames[currentFrameIndex].time * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Live';

  return (
    <div className="radar-wrapper">
      <div className="radar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Radio size={20} color="#f43f5e" style={{ animation: 'pulse 1.5s infinite' }} />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Interactive Live Weather Radar</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Real-time precipitation & cloud tracking via Global Doppler Radar
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="radar-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn-icon"
              style={{ width: '36px', height: '36px' }}
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause Radar' : 'Play Radar'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '65px', textAlign: 'center' }}>
              {currentFrameTime}
            </span>
          </div>

          {/* Opacity Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Layers size={14} />
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              style={{ width: '80px', accentColor: 'var(--theme-accent)' }}
              title="Radar Layer Opacity"
            />
          </div>

          <button
            className="btn-pill"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
            onClick={() => {
              if (mapInstanceRef.current && currentWeather) {
                mapInstanceRef.current.setView([currentWeather.latitude, currentWeather.longitude], 7);
              }
            }}
          >
            <MapPin size={13} color="var(--theme-accent)" />
            <span>Center City</span>
          </button>
        </div>
      </div>

      <div ref={mapContainerRef} className="radar-map-container" />
    </div>
  );
}
