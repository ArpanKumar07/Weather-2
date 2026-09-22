import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Users } from 'lucide-react';
import { AGE_PROFILES } from './chatbotPreferences';

export default function AgeSelector({ currentAge, onSelectAge }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const activeProfile = AGE_PROFILES[currentAge] || AGE_PROFILES.adult;

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="age-selector-container" ref={containerRef}>
      <button
        type="button"
        className="age-selector-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select Age Profile"
        aria-expanded={isOpen}
      >
        <span className="age-icon">{activeProfile.icon}</span>
        <span className="age-label">{activeProfile.label}</span>
        <ChevronDown size={13} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="age-dropdown-menu" role="menu">
          <div className="age-dropdown-header">
            <Users size={12} />
            <span>Select Profile / Age Group</span>
          </div>

          <div className="age-options-list">
            {Object.values(AGE_PROFILES).map((profile) => {
              const isSelected = profile.id === currentAge;
              return (
                <button
                  key={profile.id}
                  type="button"
                  className={`age-option-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectAge(profile.id);
                    setIsOpen(false);
                  }}
                  role="menuitem"
                >
                  <div className="age-option-left">
                    <span className="age-option-icon">{profile.icon}</span>
                    <div>
                      <div className="age-option-title">{profile.label}</div>
                      <div className="age-option-desc">{profile.tagline}</div>
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="age-check-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
