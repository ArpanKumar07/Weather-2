import React from 'react';

export default function CityLandmark({ cityName }) {
  const norm = (cityName || '').toLowerCase();

  // 1. Kolkata: Howrah Bridge & Victoria Memorial
  if (norm.includes('kolkata') || norm.includes('calcutta')) {
    return (
      <div className="landmark-backdrop" title="Kolkata: Howrah Bridge & Victoria Memorial">
        <svg viewBox="0 0 1200 450" className="landmark-svg" preserveAspectRatio="xMidYMax meet">
          {/* River Water Glow */}
          <path d="M0,420 Q300,410 600,425 T1200,420 L1200,450 L0,450 Z" fill="currentColor" opacity="0.4" />
          <path d="M0,435 Q350,428 700,440 T1200,432 L1200,450 L0,450 Z" fill="currentColor" opacity="0.6" />

          {/* Left Pylons of Howrah Bridge */}
          <rect x="180" y="160" width="30" height="260" rx="4" />
          <rect x="250" y="160" width="30" height="260" rx="4" />
          <polygon points="170,160 290,160 260,110 200,110" />
          {/* Bridge Steel Cross Trusses */}
          <line x1="210" y1="160" x2="280" y2="240" stroke="currentColor" strokeWidth="6" />
          <line x1="280" y1="160" x2="210" y2="240" stroke="currentColor" strokeWidth="6" />
          <line x1="210" y1="240" x2="280" y2="320" stroke="currentColor" strokeWidth="6" />
          <line x1="280" y1="240" x2="210" y2="320" stroke="currentColor" strokeWidth="6" />

          {/* Right Pylons of Howrah Bridge */}
          <rect x="920" y="160" width="30" height="260" rx="4" />
          <rect x="990" y="160" width="30" height="260" rx="4" />
          <polygon points="910,160 1030,160 1000,110 940,110" />
          <line x1="950" y1="160" x2="1020" y2="240" stroke="currentColor" strokeWidth="6" />
          <line x1="1020" y1="160" x2="950" y2="240" stroke="currentColor" strokeWidth="6" />
          <line x1="950" y1="240" x2="1020" y2="320" stroke="currentColor" strokeWidth="6" />
          <line x1="1020" y1="240" x2="950" y2="320" stroke="currentColor" strokeWidth="6" />

          {/* Suspended Cantilever Arch */}
          <path d="M0,320 L230,220 C450,130 750,130 970,220 L1200,320" fill="none" stroke="currentColor" strokeWidth="12" />
          <path d="M230,230 C450,160 750,160 970,230" fill="none" stroke="currentColor" strokeWidth="7" />
          {/* Vertical Hanger Ribs */}
          <line x1="380" y1="190" x2="380" y2="380" stroke="currentColor" strokeWidth="4" />
          <line x1="480" y1="155" x2="480" y2="380" stroke="currentColor" strokeWidth="4" />
          <line x1="600" y1="145" x2="600" y2="380" stroke="currentColor" strokeWidth="5" />
          <line x1="720" y1="155" x2="720" y2="380" stroke="currentColor" strokeWidth="4" />
          <line x1="820" y1="190" x2="820" y2="380" stroke="currentColor" strokeWidth="4" />
          {/* Deck */}
          <rect x="0" y="380" width="1200" height="20" rx="2" />

          {/* Victoria Memorial Silhouette in the Center-Right */}
          <g transform="translate(510, 220) scale(0.65)" opacity="0.85">
            {/* Base */}
            <rect x="0" y="190" width="280" height="50" rx="4" />
            {/* Columns & Wings */}
            <rect x="20" y="140" width="60" height="50" />
            <rect x="200" y="140" width="60" height="50" />
            <rect x="90" y="110" width="100" height="80" />
            {/* Main Central Dome */}
            <path d="M90,110 C90,40 190,40 190,110 Z" fill="currentColor" />
            {/* Mini Domes */}
            <path d="M25,140 C25,100 75,100 75,140 Z" fill="currentColor" />
            <path d="M205,140 C205,100 255,100 255,140 Z" fill="currentColor" />
            {/* Angel of Victory Finial */}
            <line x1="140" y1="40" x2="140" y2="15" stroke="currentColor" strokeWidth="4" />
            <circle cx="140" cy="15" r="7" />
          </g>
        </svg>
      </div>
    );
  }

  // 2. Jaipur: Hawa Mahal (Palace of Winds)
  if (norm.includes('jaipur')) {
    return (
      <div className="landmark-backdrop" title="Jaipur: Hawa Mahal">
        <svg viewBox="0 0 1200 450" className="landmark-svg" preserveAspectRatio="xMidYMax meet">
          <g transform="translate(360, 40) scale(1)">
            {/* Base Podium */}
            <rect x="20" y="370" width="440" height="40" rx="4" />
            {/* Tier 1 */}
            <path d="M30,370 L450,370 L430,300 L50,300 Z" />
            {/* Tier 2 */}
            <path d="M60,300 L420,300 L390,230 L90,230 Z" />
            {/* Tier 3 */}
            <path d="M100,230 L380,230 L350,160 L130,160 Z" />
            {/* Tier 4 */}
            <path d="M140,160 L340,160 L310,90 L170,90 Z" />
            {/* Tier 5 (Crowning Chhatris) */}
            <path d="M180,90 L300,90 L260,30 L220,30 Z" />
            <path d="M220,30 C220,5 260,5 260,30 Z" />
            <circle cx="240" cy="5" r="5" />

            {/* Honeycomb Jharokhas Windows */}
            {[0, 1, 2, 3, 4].map((row) => {
              const count = 7 - row;
              const y = 320 - row * 70;
              return Array.from({ length: count }).map((_, col) => {
                const x = 70 + row * 25 + col * 52;
                return (
                  <g key={`${row}-${col}`}>
                    <path d={`M${x},${y} C${x},${y - 25} ${x + 30},${y - 25} ${x + 30},${y} Z`} fill="none" stroke="var(--bg-gradient-start)" strokeWidth="4" />
                    <rect x={x + 7} y={y} width="16" height="20" fill="var(--bg-gradient-start)" rx="2" />
                  </g>
                );
              });
            })}
          </g>
        </svg>
      </div>
    );
  }

  // 3. Mumbai: Gateway of India & Coastal Waves
  if (norm.includes('mumbai') || norm.includes('bombay')) {
    return (
      <div className="landmark-backdrop" title="Mumbai: Gateway of India">
        <svg viewBox="0 0 1200 450" className="landmark-svg" preserveAspectRatio="xMidYMax meet">
          <path d="M0,420 Q300,405 600,420 T1200,415 L1200,450 L0,450 Z" fill="currentColor" opacity="0.4" />
          <g transform="translate(420, 110)">
            {/* Basal Steps */}
            <rect x="0" y="280" width="360" height="30" rx="3" />
            {/* Left Tower */}
            <rect x="20" y="60" width="70" height="220" />
            <polygon points="10,60 100,60 85,20 25,20" />
            <circle cx="55" cy="15" r="6" />
            {/* Right Tower */}
            <rect x="270" y="60" width="70" height="220" />
            <polygon points="260,60 350,60 335,20 275,20" />
            <circle cx="305" cy="15" r="6" />
            {/* Center Massive Arch */}
            <rect x="90" y="60" width="180" height="220" />
            <path d="M125,280 L125,180 C125,120 235,120 235,180 L235,280 Z" fill="var(--bg-gradient-start)" />
            {/* Dome & Parapet */}
            <rect x="60" y="50" width="240" height="15" />
            <path d="M130,50 C130,0 230,0 230,50 Z" />
            <line x1="180" y1="0" x2="180" y2="-15" stroke="currentColor" strokeWidth="4" />
          </g>
        </svg>
      </div>
    );
  }

  // 4. Delhi: India Gate
  if (norm.includes('delhi')) {
    return (
      <div className="landmark-backdrop" title="Delhi: India Gate">
        <svg viewBox="0 0 1200 450" className="landmark-svg" preserveAspectRatio="xMidYMax meet">
          <g transform="translate(440, 100)">
            {/* Base Plinth */}
            <rect x="0" y="290" width="320" height="30" rx="4" />
            {/* Left Pillar */}
            <rect x="30" y="40" width="80" height="250" />
            {/* Right Pillar */}
            <rect x="210" y="40" width="80" height="250" />
            {/* Grand Arch */}
            <rect x="110" y="40" width="100" height="250" />
            <path d="M110,290 L110,180 C110,110 210,110 210,180 L210,290 Z" fill="var(--bg-gradient-start)" />
            {/* Entablature & Cornice */}
            <rect x="15" y="25" width="290" height="20" rx="2" />
            <rect x="40" y="0" width="240" height="25" rx="3" />
            <path d="M120,0 C120,-20 200,-20 200,0 Z" />
          </g>
        </svg>
      </div>
    );
  }

  // 5. London: Big Ben & Westminster
  if (norm.includes('london')) {
    return (
      <div className="landmark-backdrop" title="London: Big Ben">
        <svg viewBox="0 0 1200 450" className="landmark-svg" preserveAspectRatio="xMidYMax meet">
          <g transform="translate(500, 30)">
            {/* Clock Tower Body */}
            <rect x="80" y="140" width="90" height="270" />
            {/* Clock Face Square */}
            <rect x="70" y="90" width="110" height="60" rx="4" />
            <circle cx="125" cy="120" r="22" fill="var(--bg-gradient-start)" />
            <circle cx="125" cy="120" r="18" fill="currentColor" opacity="0.8" />
            {/* Spire */}
            <polygon points="65,90 185,90 125,5" />
            <line x1="125" y1="5" x2="125" y2="-15" stroke="currentColor" strokeWidth="4" />
            {/* Westminster Palace Wing */}
            <rect x="170" y="240" width="320" height="170" />
            <polygon points="170,240 230,190 290,240" />
            <polygon points="290,240 350,190 410,240" />
          </g>
        </svg>
      </div>
    );
  }

  // 6. Paris: Eiffel Tower
  if (norm.includes('paris')) {
    return (
      <div className="landmark-backdrop" title="Paris: Eiffel Tower">
        <svg viewBox="0 0 1200 450" className="landmark-svg" preserveAspectRatio="xMidYMax meet">
          <g transform="translate(510, 20)">
            {/* Ground Arch */}
            <path d="M30,390 C60,280 120,280 150,390" fill="var(--bg-gradient-start)" />
            {/* Legs */}
            <polygon points="10,390 50,390 70,260 40,260" />
            <polygon points="170,390 130,390 110,260 140,260" />
            {/* First Platform */}
            <rect x="35" y="250" width="110" height="15" rx="3" />
            {/* Second Tier */}
            <polygon points="45,250 135,250 115,140 65,140" />
            <rect x="60" y="130" width="60" height="12" rx="2" />
            {/* Top Spire */}
            <polygon points="70,130 110,130 92,10 88,10" />
            <line x1="90" y1="10" x2="90" y2="-10" stroke="currentColor" strokeWidth="4" />
          </g>
        </svg>
      </div>
    );
  }

  // 7. Generic Global Skyline for any other city
  return (
    <div className="landmark-backdrop" title="Modern City Skyline">
      <svg viewBox="0 0 1200 450" className="landmark-svg" preserveAspectRatio="xMidYMax meet">
        {/* Modern Skyline Silhouette with Domes, Towers, Spire */}
        <g opacity="0.7">
          <rect x="100" y="240" width="80" height="180" rx="3" />
          <rect x="200" y="170" width="90" height="250" rx="3" />
          <polygon points="200,170 290,170 245,90" />
          <rect x="310" y="220" width="100" height="200" rx="3" />
          {/* Central Dome */}
          <path d="M430,280 C430,160 550,160 550,280 Z" />
          <rect x="420" y="280" width="140" height="140" rx="3" />
          {/* Main Spire Tower */}
          <rect x="580" y="110" width="80" height="310" rx="3" />
          <polygon points="570,110 670,110 620,20" />
          <line x1="620" y1="20" x2="620" y2="-5" stroke="currentColor" strokeWidth="4" />
          {/* Right Blocks */}
          <rect x="680" y="190" width="95" height="230" rx="3" />
          <rect x="795" y="230" width="80" height="190" rx="3" />
          <rect x="895" y="160" width="100" height="260" rx="3" />
          <rect x="1015" y="250" width="85" height="170" rx="3" />
        </g>
      </svg>
    </div>
  );
}
