import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Sun,
  Moon,
  Compass,
  User,
  LogOut,
  Sparkles,
  Menu,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useAuth } from '../context/AuthContext';
import { searchCities } from '../services/api';
import SideDrawer from './SideDrawer';

export default function Navbar() {
  const {
    loadWeather,
    detectLiveLocation,
    mode,
    toggleMode,
    tempUnit,
    toggleTempUnit,
    currentWeather,
  } = useWeather();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const searchRef = useRef(null);

  // Debounced search query
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchCities(query);
        setSuggestions(results);
        setIsDropdownOpen(results.length > 0);
      } catch (err) {
        console.warn('Search error:', err);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (item) => {
    loadWeather(item.latitude, item.longitude, item.name, item.country_code);
    setQuery('');
    setIsDropdownOpen(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelectCity(suggestions[0]);
    } else if (query.trim().length > 0) {
      // Fallback search
      searchCities(query).then((res) => {
        if (res.length > 0) handleSelectCity(res[0]);
      });
    }
  };

  return (
    <header className="navbar">
      <div className="nav-wrapper">
        {/* Left: Hamburger Menu Button & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            title="Open Menu"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Menu size={20} />
          </button>

          {/* Brand */}
          <div
            className="brand"
            onClick={() => loadWeather(22.5726, 88.3639, 'Kolkata', 'IN')}
          >
            <div className="brand-logo-glow">
              <Compass size={24} />
            </div>
            <div>
              <div className="brand-title">MAUSAM360</div>
              <div className="brand-subtitle">Weather Aware Planner</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-container" ref={searchRef}>
          <form onSubmit={handleFormSubmit}>
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search any city, e.g. Kolkata, Jaipur, London..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setIsDropdownOpen(true)}
              />
            </div>
          </form>

          {isDropdownOpen && suggestions.length > 0 && (
            <div className="search-dropdown">
              {suggestions.map((item, idx) => (
                <div
                  key={`${item.latitude}-${item.longitude}-${idx}`}
                  className="search-item"
                  onClick={() => handleSelectCity(item)}
                >
                  <div>
                    <div className="search-item-title">{item.name}</div>
                    <div className="search-item-country">
                      {item.admin1 ? `${item.admin1}, ` : ''}{item.country} ({item.country_code})
                    </div>
                  </div>
                  <Sparkles size={14} color="var(--theme-accent)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {/* Live Location Trigger */}
          <button
            className="btn-pill"
            onClick={detectLiveLocation}
            title="Auto-detect Live Location"
          >
            <MapPin size={16} color="var(--theme-accent)" />
            <span className="btn-label-desktop">Live Location</span>
          </button>

          {/* Unit Toggle */}
          <button
            className="btn-icon"
            onClick={toggleTempUnit}
            title={`Switch to °${tempUnit === 'C' ? 'F' : 'C'}`}
          >
            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>°{tempUnit}</span>
          </button>

          {/* Day / Night Mode Toggle */}
          <button
            className="btn-icon"
            onClick={toggleMode}
            title={`Toggle ${mode === 'dark' ? 'Day' : 'Night'} Mode`}
          >
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Auth Button */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                className="btn-pill"
                style={{ background: 'rgba(56, 189, 248, 0.15)', cursor: 'default' }}
              >
                <User size={15} color="var(--theme-accent)" />
                <span>{user?.username}</span>
              </div>
              <button
                className="btn-icon"
                onClick={logout}
                title="Log Out"
              >
                <LogOut size={16} color="#f43f5e" />
              </button>
            </div>
          ) : (
            <button className="btn-pill btn-pill-primary" onClick={openAuthModal}>
              <User size={16} />
              <span className="btn-label-desktop">Login / Register</span>
            </button>
          )}
        </div>
      </div>

      {/* Left-Side Navigation Drawer */}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </header>
  );
}
