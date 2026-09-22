import React, { useState, useEffect, useRef } from 'react';
import { useWeather } from '../../context/WeatherContext';
import {
  MessageSquare,
  X,
  Minus,
  Minimize2,
  Maximize2,
  Send,
  Trash2,
  Bot,
  MapPin,
  Sparkles,
  MoveDiagonal2,
  ChevronUp,
} from 'lucide-react';
import AgeSelector from './AgeSelector';
import QuickPrompts from './QuickPrompts';
import ChatMessage from './ChatMessage';
import { generateChatbotResponse } from './chatbotEngine';
import {
  getChatbotPreferences,
  saveChatbotPreferences,
  getSavedChatHistory,
  saveChatHistory,
  clearChatHistory,
  AGE_PROFILES,
} from './chatbotPreferences';
import './chatbot.css';

const DEFAULT_SIZE = { width: 500, height: 680 };
const STORAGE_KEY_SIZE = 'mausam360_chatbot_dimensions';

export default function ChatbotWidget() {
  const { currentWeather, tempUnit } = useWeather();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Dynamic window size & expand mode
  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SIZE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          return {
            width: Math.max(380, Math.min(parsed.width, window.innerWidth - 32)),
            height: Math.max(480, Math.min(parsed.height, window.innerHeight - 32)),
          };
        }
      }
    } catch {}
    return DEFAULT_SIZE;
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Resize drag tracking
  const resizeDirRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const currentSizeRef = useRef(size);

  useEffect(() => {
    currentSizeRef.current = size;
  }, [size]);

  const handleMouseDownResize = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    resizeDirRef.current = direction;
    setIsResizing(true);
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: currentSizeRef.current.width,
      h: currentSizeRef.current.height,
    };

    const handleMouseMove = (moveEvent) => {
      if (!resizeDirRef.current) return;
      const dir = resizeDirRef.current;
      const deltaX = moveEvent.clientX - startPosRef.current.x;
      const deltaY = moveEvent.clientY - startPosRef.current.y;

      const maxW = Math.min(1050, window.innerWidth - 32);
      const maxH = Math.min(940, window.innerHeight - 32);

      let newW = startPosRef.current.w;
      let newH = startPosRef.current.h;

      // Bottom-right anchored: dragging left (negative deltaX) widens
      if (dir === 'nw' || dir === 'w') {
        newW = Math.max(380, Math.min(maxW, startPosRef.current.w - deltaX));
      }
      // Bottom-right anchored: dragging up (negative deltaY) lengthens
      if (dir === 'nw' || dir === 'n') {
        newH = Math.max(480, Math.min(maxH, startPosRef.current.h - deltaY));
      }

      const updated = {
        width: Math.round(newW),
        height: Math.round(newH),
      };
      currentSizeRef.current = updated;
      setSize(updated);
      setIsExpanded(false);
    };

    const handleMouseUp = () => {
      resizeDirRef.current = null;
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      try {
        localStorage.setItem(STORAGE_KEY_SIZE, JSON.stringify(currentSizeRef.current));
      } catch {}
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  // Preferences & Age profile
  const [prefs, setPrefs] = useState(() => getChatbotPreferences());
  const ageGroup = prefs.ageGroup || 'adult';
  const activeAgeProfile = AGE_PROFILES[ageGroup] || AGE_PROFILES.adult;

  // Chat message history
  const [messages, setMessages] = useState(() => {
    const saved = getSavedChatHistory();
    if (saved && saved.length > 0) return saved;

    const initialCity = currentWeather?.city_name || 'Kolkata';
    return [
      {
        id: 'init-1',
        sender: 'bot',
        text: `Hello! 🌦️ I am your **MAUSAM360 Intelligent Weather Advisor** for **${initialCity}**.\n\n` +
          `I provide personalized advice based on your age profile (**${activeAgeProfile.badge}**), activities, clothing, UV exposure, rain timings, and commute safety.\n\n` +
          `How can I help you today? Try one of the suggestions below!`,
        ageTone: activeAgeProfile.badge,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickFollowUps: [
          'What should I do today?',
          'Can I go for a run today?',
          'Do I need an umbrella?',
          'What should I wear today?',
        ],
      },
    ];
  });

  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [isOpen, isMinimized]);

  // Save history on changes
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Handle changing age profile
  const handleSelectAge = (newAge) => {
    const updated = saveChatbotPreferences({ ageGroup: newAge });
    setPrefs(updated);

    const newProfile = AGE_PROFILES[newAge] || AGE_PROFILES.adult;
    const systemNotice = {
      id: `sys-${Date.now()}`,
      sender: 'bot',
      text: `🔄 Switched to **${newProfile.badge}**!\n\nAll recommendations (clothing, outdoor sports, heat/cold warnings, UV, hydration) will now be calibrated for **${newProfile.label}**: *"${newProfile.tagline}"*.`,
      ageTone: newProfile.badge,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickFollowUps: [
        'What should I do today?',
        'What should I wear?',
        'Can I go for a run today?',
      ],
    };
    setMessages((prev) => [...prev, systemNotice]);
  };

  // Send query logic
  const handleSend = async (userQuery) => {
    const text = (userQuery || inputVal).trim();
    if (!text) return;

    setInputVal('');

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate natural conversation pacing (< 400ms for responsiveness)
    setTimeout(() => {
      try {
        const botResponse = generateChatbotResponse(text, {
          weather: currentWeather,
          ageGroup: prefs.ageGroup,
          tempUnit,
          history: [...messages, userMsg],
          preferences: prefs,
        });

        const newBotMsg = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: botResponse.text,
          intent: botResponse.intent,
          cards: botResponse.cards || [],
          quickFollowUps: botResponse.quickFollowUps || [],
          ageTone: activeAgeProfile.badge,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, newBotMsg]);
      } catch (err) {
        console.error('Chatbot error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'bot',
            text: '⚠️ I encountered an issue retrieving current weather calculations. Please ensure network connectivity.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 350);
  };

  // Clear chat
  const handleClearHistory = () => {
    if (window.confirm('Clear your conversation history?')) {
      clearChatHistory();
      const resetMsg = {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: `Conversation cleared. I am ready to advise you on **${currentWeather?.city_name || 'your city'}** weather!`,
        ageTone: activeAgeProfile.badge,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickFollowUps: [
          'What should I do today?',
          'Can I go for a run today?',
          'Do I need an umbrella?',
        ],
      };
      setMessages([resetMsg]);
    }
  };

  // Latest bot message follow-up prompts
  const latestBotMsg = [...messages].reverse().find((m) => m.sender === 'bot');
  const dynamicPrompts = latestBotMsg?.quickFollowUps || [];

  // Effective dimensions
  const windowStyle = !isMinimized
    ? isExpanded
      ? {
          width: 'min(860px, calc(100vw - 36px))',
          height: 'min(860px, calc(100vh - 44px))',
        }
      : {
          width: `${size.width}px`,
          height: `${size.height}px`,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 40px)',
        }
    : {};

  return (
    <div className="chatbot-root-container">
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          type="button"
          className="chatbot-fab-btn"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open Weather Chatbot"
          title="Open MAUSAM360 Weather Chatbot"
        >
          <div className="fab-icon-wrap">
            <MessageSquare size={24} />
            {hasUnread && <span className="fab-pulse-dot" />}
          </div>
          <div className="fab-label-pill">
            <Sparkles size={14} className="fab-sparkle" />
            <span>Weather AI</span>
          </div>
        </button>
      )}

      {/* Floating Glassmorphic Chat Window */}
      {isOpen && (
        <div
          className={`chatbot-window card-glass ${isMinimized ? 'minimized' : ''} ${isResizing ? 'resizing' : ''} ${isExpanded ? 'expanded' : ''}`}
          style={windowStyle}
        >
          {/* Minimized Docked View */}
          {isMinimized ? (
            <div
              className="chatbot-minimized-bar"
              onClick={() => setIsMinimized(false)}
              role="button"
              tabIndex={0}
              title="Click to expand chat"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setIsMinimized(false);
              }}
            >
              <div className="minimized-info">
                <div className="minimized-avatar">
                  <Bot size={17} />
                  <span className="minimized-pulse-dot" />
                </div>
                <div className="minimized-text">
                  <span className="minimized-title">Mausam AI</span>
                  <span className="minimized-subtitle">Chat minimized • Click to resume</span>
                </div>
              </div>
              <div
                className="minimized-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="minimized-action-btn restore-btn"
                  onClick={() => setIsMinimized(false)}
                  title="Restore chat window"
                  aria-label="Restore chat"
                >
                  <ChevronUp size={15} />
                  <span>Restore</span>
                </button>
                <button
                  type="button"
                  className="minimized-action-btn close-btn"
                  onClick={() => {
                    setIsOpen(false);
                    setIsMinimized(false);
                  }}
                  title="Close chat"
                  aria-label="Close chat"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Resize Drag Handles (Top-Left corner, Top edge, Left edge) */}
              <div
                className="chatbot-resize-corner"
                onMouseDown={(e) => handleMouseDownResize(e, 'nw')}
                title="Drag to resize window width & height"
              >
                <div className="resize-corner-grip">
                  <MoveDiagonal2 size={12} />
                </div>
              </div>
              <div
                className="chatbot-resize-edge-top"
                onMouseDown={(e) => handleMouseDownResize(e, 'n')}
                title="Drag to resize height"
              />
              <div
                className="chatbot-resize-edge-left"
                onMouseDown={(e) => handleMouseDownResize(e, 'w')}
                title="Drag to resize width"
              />

              {/* Header */}
              <div className="chatbot-header">
                <div className="chatbot-header-left">
                  <div className="bot-header-avatar">
                    <Bot size={18} />
                  </div>
                  <div className="chatbot-title-info">
                    <div className="chatbot-title-row">
                      <span className="chatbot-name">Mausam AI</span>
                      <span className="chatbot-city-pill">
                        <MapPin size={11} />
                        {currentWeather?.city_name || 'Kolkata'}
                      </span>
                    </div>
                    <div className="chatbot-subtitle">Personalized Weather Advisor</div>
                  </div>
                </div>

                <div className="chatbot-header-actions">
                  {/* Age Selector */}
                  <AgeSelector currentAge={ageGroup} onSelectAge={handleSelectAge} />

                  {/* Clear History */}
                  <button
                    type="button"
                    className="header-icon-btn"
                    onClick={handleClearHistory}
                    title="Clear Chat History"
                    aria-label="Clear chat"
                  >
                    <Trash2 size={15} />
                  </button>

                  {/* Expand / Wide Panoramic View Toggle */}
                  <button
                    type="button"
                    className={`header-icon-btn ${isExpanded ? 'active-toggle' : ''}`}
                    onClick={toggleExpand}
                    title={isExpanded ? 'Restore standard size' : 'Expand to wide panoramic view'}
                    aria-label={isExpanded ? 'Restore standard size' : 'Expand to wide panoramic view'}
                  >
                    {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  </button>

                  {/* Minimize Button (Done chatting) */}
                  <button
                    type="button"
                    className="header-icon-btn"
                    onClick={() => setIsMinimized(true)}
                    title="Minimize chatbot (Done chatting)"
                    aria-label="Minimize chatbot"
                  >
                    <Minus size={16} />
                  </button>

                  {/* Close */}
                  <button
                    type="button"
                    className="header-icon-btn close-btn"
                    onClick={() => {
                      setIsOpen(false);
                      setIsMinimized(false);
                    }}
                    title="Close Chat"
                    aria-label="Close chat"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Main Body */}
              <div className="chatbot-messages-area">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onFollowUpClick={(prompt) => handleSend(prompt)}
                  />
                ))}

                {isTyping && (
                  <div className="chat-message-row bot-row">
                    <div className="chat-avatar">
                      <div className="bot-avatar-badge">
                        <Bot size={16} />
                      </div>
                    </div>
                    <div className="chat-bubble bot-bubble typing-bubble">
                      <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Queries Carousel */}
              <QuickPrompts
                dynamicPrompts={dynamicPrompts}
                onSelectPrompt={(query) => handleSend(query)}
              />

              {/* Input Area */}
              <form
                className="chatbot-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="chatbot-text-input"
                  placeholder={`Ask anything for ${activeAgeProfile.label} (e.g. "Can I run today?")...`}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  maxLength={300}
                />
                <button
                  type="submit"
                  className="chatbot-send-btn"
                  disabled={!inputVal.trim() || isTyping}
                  aria-label="Send query"
                >
                  <Send size={16} />
                </button>
              </form>

              {/* Done Chatting Action Footer */}
              <div className="chatbot-footer-actions">
                <button
                  type="button"
                  className="chatbot-done-btn"
                  onClick={() => setIsMinimized(true)}
                  title="Done with questions? Minimize the chatbot"
                >
                  <Minus size={13} />
                  <span>Done chatting? Minimize</span>
                </button>
                <div className="chatbot-drag-hint">
                  <MoveDiagonal2 size={11} />
                  <span>Drag top-left to resize</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
