import React from 'react';
import { Star, X, Sparkles } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useAuth } from '../context/AuthContext';

export default function FavoritesBar() {
  const { favorites, loadWeather, toggleFavorite, convertTemp, currentWeather } = useWeather();
  const { isAuthenticated, openAuthModal } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="favorites-bar">
        <div
          className="favorite-chip"
          onClick={openAuthModal}
          style={{ borderStyle: 'dashed' }}
        >
          <Star size={14} color="#f59e0b" />
          <span className="favorite-chip-name" style={{ opacity: 0.85 }}>
            Login to sync & save your favorite cities
          </span>
          <Sparkles size={13} color="var(--theme-accent)" />
        </div>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="favorites-bar">
        <div className="favorite-chip" style={{ cursor: 'default', opacity: 0.7 }}>
          <Star size={14} color="var(--text-muted)" />
          <span className="favorite-chip-name">
            Click the star icon next to any city name to bookmark it
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
        <Star size={14} color="#f59e0b" />
        <span>Favorites:</span>
      </div>
      {favorites.map((fav) => {
        const isActive = currentWeather?.location_id === fav.location_id ||
                         (currentWeather?.city_name.toLowerCase() === fav.city_name.toLowerCase());
        return (
          <div
            key={fav.location_id}
            className={`favorite-chip ${isActive ? 'active' : ''}`}
            onClick={() => loadWeather(fav.latitude, fav.longitude, fav.city_name, fav.country_code)}
          >
            <span className="favorite-chip-name">{fav.city_name}</span>
            <span className="favorite-chip-temp">
              {convertTemp(fav.current_temp)}°
            </span>
            <span
              className="favorite-chip-remove"
              title="Remove from favorites"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(fav.location_id);
              }}
            >
              <X size={14} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
