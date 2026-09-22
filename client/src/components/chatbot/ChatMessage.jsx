import React from 'react';
import {
  CloudSun,
  User,
  AlertTriangle,
  Info,
  Thermometer,
  Cloud,
  Umbrella,
  Sun,
  Wind,
  Shirt,
  Droplet,
} from 'lucide-react';

const ICON_MAP = {
  Thermometer,
  Cloud,
  Umbrella,
  Sun,
  Wind,
  Shirt,
  Droplet,
};

/**
 * Format simple markdown text (bold, quotes, bullets) into JSX
 */
function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    // Blockquote
    if (line.startsWith('>')) {
      return (
        <blockquote key={lIdx} className="chat-blockquote">
          {line.replace(/^>\s*/, '')}
        </blockquote>
      );
    }

    // Bullet point
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      const content = line.trim().replace(/^[•-]\s*/, '');
      return (
        <div key={lIdx} className="chat-bullet">
          <span className="bullet-dot">•</span>
          <span>{renderInlineFormatting(content)}</span>
        </div>
      );
    }

    // Empty line
    if (!line.trim()) {
      return <div key={lIdx} className="chat-spacer" />;
    }

    // Regular line
    return <p key={lIdx} className="chat-paragraph">{renderInlineFormatting(line)}</p>;
  });
}

function renderInlineFormatting(str) {
  // Regex to split by bold **text**
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function ChatMessage({ message, onFollowUpClick }) {
  const isBot = message.sender === 'bot';

  return (
    <div className={`chat-message-row ${isBot ? 'bot-row' : 'user-row'}`}>
      <div className="chat-avatar">
        {isBot ? (
          <div className="bot-avatar-badge">
            <CloudSun size={18} className="bot-avatar-icon" />
          </div>
        ) : (
          <div className="user-avatar-badge">
            <User size={16} />
          </div>
        )}
      </div>

      <div className="chat-bubble-container">
        <div className={`chat-bubble ${isBot ? 'bot-bubble' : 'user-bubble'}`}>
          {isBot && message.ageTone && (
            <div className="chat-age-badge-pill">
              {message.ageTone}
            </div>
          )}

          <div className="chat-text-body">
            {renderFormattedText(message.text)}
          </div>

          {/* Optional Rich Cards */}
          {message.cards && message.cards.length > 0 && (
            <div className="chat-cards-container">
              {message.cards.map((card, cIdx) => {
                if (card.type === 'metrics') {
                  return (
                    <div key={cIdx} className="chat-metrics-grid">
                      {card.items.map((item, iIdx) => {
                        const IconComponent = item.icon && ICON_MAP[item.icon] ? ICON_MAP[item.icon] : null;
                        return (
                          <div key={iIdx} className="chat-metric-cell">
                            {IconComponent && <IconComponent size={14} className="cell-icon" />}
                            <span className="cell-label">{item.label}</span>
                            <span className="cell-value">{item.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (card.type === 'alert') {
                  const isDanger = card.severity === 'danger';
                  return (
                    <div
                      key={cIdx}
                      className={`chat-alert-card ${isDanger ? 'alert-danger' : 'alert-warning'}`}
                    >
                      {isDanger ? <AlertTriangle size={18} /> : <Info size={18} />}
                      <div className="chat-alert-content">
                        <div className="chat-alert-title">{card.title}</div>
                        <div className="chat-alert-desc">{card.desc}</div>
                      </div>
                    </div>
                  );
                }

                if (card.type === 'clothing') {
                  return (
                    <div key={cIdx} className="chat-clothing-grid">
                      {card.items.map((item, iIdx) => (
                        <div key={iIdx} className="chat-clothing-cell">
                          <Shirt size={14} className="cell-icon" />
                          <span className="clothing-cell-label">{item.label}:</span>
                          <span className="clothing-cell-val">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}

          <div className="chat-meta-footer">
            <span className="chat-time">{message.timestamp || ''}</span>
          </div>
        </div>

        {/* Follow-up suggestion buttons */}
        {isBot && message.quickFollowUps && message.quickFollowUps.length > 0 && (
          <div className="chat-followup-chips">
            {message.quickFollowUps.map((prompt, fIdx) => (
              <button
                key={fIdx}
                type="button"
                className="followup-chip-btn"
                onClick={() => onFollowUpClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
