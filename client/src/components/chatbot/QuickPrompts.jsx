import React from 'react';
import { Sparkles } from 'lucide-react';

const DEFAULT_CHIPS = [
  { label: '🏃 Can I run today?', query: 'Can I go for a run today?' },
  { label: '☂️ Need an umbrella?', query: 'Do I need an umbrella today?' },
  { label: '👕 What should I wear?', query: 'What should I wear today?' },
  { label: '🧠 What should I do today?', query: 'What should I do today? Give me a daily briefing.' },
  { label: '🧴 UV & Sun protection', query: 'Do I need sunscreen and UV protection?' },
  { label: '💧 Hydration goal', query: 'What is my hydration and water intake goal today?' },
  { label: '🌫️ Air Quality & Safety', query: 'How is the air quality and breathing conditions?' },
  { label: '🚗 Commute & Travel', query: 'How are road and commute conditions today?' },
  { label: '📅 Tomorrow’s weather', query: 'What is the weather forecast for tomorrow?' },
];

export default function QuickPrompts({ onSelectPrompt, dynamicPrompts = [] }) {
  const chipsToDisplay = dynamicPrompts && dynamicPrompts.length > 0
    ? dynamicPrompts.map((p) => (typeof p === 'string' ? { label: p, query: p } : p))
    : DEFAULT_CHIPS;

  return (
    <div className="quick-prompts-container">
      <div className="quick-prompts-header">
        <Sparkles size={12} className="sparkle-icon" />
        <span>Suggested Queries</span>
      </div>
      <div className="quick-prompts-scroll">
        {chipsToDisplay.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            className="quick-chip-btn"
            onClick={() => onSelectPrompt(chip.query)}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
