import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { WeatherProvider, useWeather } from './context/WeatherContext';
import Navbar from './components/Navbar';
import FavoritesBar from './components/FavoritesBar';
import WeatherHero from './components/WeatherHero';
import SmartAdvice from './components/SmartAdvice';
import HourlyForecast from './components/HourlyForecast';
import DailyForecast from './components/DailyForecast';
import LiveRadar from './components/LiveRadar';
import ActivityPlanner from './components/ActivityPlanner';
import CityLandmark from './components/CityLandmark';
import WeatherEffects from './components/WeatherEffects';
import AuthModal from './components/AuthModal';
import HistoryModal from './components/HistoryModal';
import Footer from './components/Footer';
import { Loader2, AlertTriangle } from 'lucide-react';
import './styles/index.css';

function MainDashboard() {
  const { currentWeather, loading, error, loadWeather } = useWeather();

  return (
    <div className="app-container">
      {/* Dynamic Ambient Canvas Effects */}
      <WeatherEffects weatherGroup={currentWeather?.weather_group || 'clear'} />

      {/* City Background Landmark Artwork (Feature 9) */}
      <CityLandmark cityName={currentWeather?.city_name || 'Kolkata'} />

      {/* Sticky Glass Navbar */}
      <Navbar />

      <main className="main-content">
        {/* Quick Favorite Cities Bar (Feature 11) */}
        <FavoritesBar />

        {loading && !currentWeather ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              gap: '1rem',
            }}
          >
            <Loader2 size={40} className="animate-spin" color="var(--theme-accent)" />
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Fetching real-time meteorological metrics...
            </div>
          </div>
        ) : error ? (
          <div
            className="card-glass"
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              maxWidth: '500px',
              margin: '3rem auto',
            }}
          >
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Unable to retrieve weather</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </p>
            <button
              className="btn-pill btn-pill-primary"
              onClick={() => loadWeather(22.5726, 88.3639, 'Kolkata', 'IN')}
            >
              Reset to Kolkata
            </button>
          </div>
        ) : (
          <>
            {/* 3D Hero Grid (Feature 1, 6, 8, 13) */}
            <div className="hero-grid">
              <WeatherHero />
              <SmartAdvice />
            </div>

            {/* 24-Hour Commuter Forecast (Feature 2) */}
            <HourlyForecast />

            {/* 7-to-15-Day Extended Outlook (Feature 3) */}
            <DailyForecast />

            {/* Interactive Live Radar (Feature 4) */}
            <LiveRadar />

            {/* City-Aware Activity Planner (Feature 7) */}
            <ActivityPlanner />
          </>
        )}
      </main>

      {/* Modals */}
      <AuthModal />
      <HistoryModal />

      {/* Footer with NFR / SLA Performance Gate */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WeatherProvider>
        <MainDashboard />
      </WeatherProvider>
    </AuthProvider>
  );
}
