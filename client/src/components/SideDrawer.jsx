import React, { useEffect } from 'react';
import {
  X,
  CloudSun,
  Brain,
  Trophy,
  Car,
  Activity,
  Shirt,
  Camera,
  AlertTriangle,
  ChevronRight,
  Compass,
  MapPin,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

export default function SideDrawer({ isOpen, onClose }) {
  const { currentWeather, convertTemp, tempUnit } = useWeather();

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNavigate = (targetId) => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Optional subtle highlight pulse
        el.style.transition = 'box-shadow 0.4s ease';
        el.style.boxShadow = '0 0 0 2px var(--theme-accent)';
        setTimeout(() => {
          el.style.boxShadow = '';
        }, 1500);
      }
    }, 150);
  };

  const navGroups = [
    {
      groupTitle: 'Core Forecast',
      items: [
        {
          id: 'weather-hero',
          icon: CloudSun,
          label: 'Weather',
          emoji: '🌦️',
          description: 'Current metrics & 3D ambient conditions',
        },
      ],
    },
    {
      groupTitle: 'Weather Intelligence',
      icon: Brain,
      items: [
        {
          id: 'best-time-today',
          icon: Trophy,
          label: 'Best Time Today',
          emoji: '🏆',
          description: 'Optimal 2-hour outdoor activity window',
          badge: 'Popular',
        },
        {
          id: 'smart-commute',
          icon: Car,
          label: 'Smart Commute',
          emoji: '🚗',
          description: 'Transit risk & best departure time',
          badge: 'New',
        },
        {
          id: 'activity-planner',
          icon: Activity,
          label: 'Activity Planner',
          emoji: '🏃',
          description: 'City-curated outdoor & indoor plans',
        },
        {
          id: 'smart-advice',
          icon: Shirt,
          label: 'What to Wear',
          emoji: '👕',
          description: 'Feels-like & thermal clothing advice',
        },
        {
          id: 'live-radar',
          icon: Camera,
          label: 'Photography Conditions',
          emoji: '📸',
          description: 'Live radar, visibility & sky clarity',
        },
      ],
    },
    {
      groupTitle: 'Safety & Advisories',
      items: [
        {
          id: 'smart-advice',
          icon: AlertTriangle,
          label: 'Weather Alerts',
          emoji: '🚨',
          description: 'Live rain, wind & temperature advisories',
        },
      ],
    },
  ];

  return (
    <>
      {/* Backdrop Overlay with Click-outside-to-close */}
      <div
        className={`drawer-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 250,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Slide-out Drawer Panel */}
      <aside
        role="dialog"
        aria-label="Navigation drawer"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(350px, 86vw)',
          background: 'var(--card-bg)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderLeft: '1px solid var(--card-border)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
          zIndex: 251,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          overflowY: 'auto',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.4rem 1.4rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--card-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--badge-bg)',
                color: 'var(--theme-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Compass size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>MAUSAM360</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Weather Aware Planner</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="btn-icon"
            style={{ width: '34px', height: '34px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Navigation Content */}
        <div style={{ flex: 1, padding: '1.25rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <div
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: '0.65rem',
                  paddingLeft: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700,
                }}
              >
                {group.icon && <group.icon size={13} color="var(--theme-accent)" />}
                <span>{group.groupTitle}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {group.items.map((item, iIdx) => {
                  return (
                    <button
                      key={iIdx}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'var(--transition-smooth)',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--badge-bg)';
                        e.currentTarget.style.borderColor = 'var(--theme-accent)';
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                        e.currentTarget.style.borderColor = 'var(--card-border)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{item.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{item.label}</span>
                            {item.badge && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '999px',
                                  background: item.badge === 'New' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                                  color: item.badge === 'New' ? '#34d399' : '#38bdf8',
                                  fontWeight: 700,
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {item.description}
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={15} color="var(--text-muted)" style={{ marginLeft: '0.5rem', flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer Status */}
        {currentWeather && (
          <div
            style={{
              padding: '1rem 1.4rem',
              borderTop: '1px solid var(--card-border)',
              background: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <MapPin size={15} color="var(--theme-accent)" />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>{currentWeather.city_name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {currentWeather.weather_group ? currentWeather.weather_group.toUpperCase() : 'LIVE'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--theme-accent)' }}>
              {convertTemp(currentWeather.temperature)}°{tempUnit}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
