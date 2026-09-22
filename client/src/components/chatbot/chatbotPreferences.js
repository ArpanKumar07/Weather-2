// Chatbot User Preferences & Age Profile Manager
const STORAGE_KEY_PREFS = 'mausam360_chatbot_prefs';
const STORAGE_KEY_HISTORY = 'mausam360_chatbot_history';

export const AGE_PROFILES = {
  child: {
    id: 'child',
    label: 'Child (<12)',
    badge: '👶 Kid Mode',
    icon: '👶',
    tagline: 'Play safety, mild exposure, hydration & parent tips',
    tone: 'friendly, protective, and simple',
    maxHeatThreshold: 34,
    minColdThreshold: 14,
    maxUVThreshold: 4,
  },
  teen: {
    id: 'teen',
    label: 'Teen (13–19)',
    badge: '🎧 Teen Mode',
    icon: '🎧',
    tagline: 'Sports, trendy clothing, campus commute & hangouts',
    tone: 'energetic, modern, and direct',
    maxHeatThreshold: 37,
    minColdThreshold: 10,
    maxUVThreshold: 6,
  },
  adult: {
    id: 'adult',
    label: 'Adult (20–59)',
    badge: '💼 Adult Mode',
    icon: '💼',
    tagline: 'Work commute, outdoor fitness, running & daily planning',
    tone: 'professional, informative, and actionable',
    maxHeatThreshold: 38,
    minColdThreshold: 8,
    maxUVThreshold: 7,
  },
  senior: {
    id: 'senior',
    label: 'Senior (60+)',
    badge: '🧓 Senior Mode',
    icon: '🧓',
    tagline: 'Joint comfort, gentle walks, thermal care & air quality',
    tone: 'caring, cautious, and health-conscious',
    maxHeatThreshold: 33,
    minColdThreshold: 15,
    maxUVThreshold: 4,
  },
};

const DEFAULT_PREFERENCES = {
  ageGroup: 'adult',
  preferredActivities: ['walking', 'commute', 'running'],
  soundEnabled: true,
  notificationsEnabled: true,
};

export function getChatbotPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveChatbotPreferences(prefs) {
  try {
    const current = getChatbotPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save chatbot preferences:', err);
    return DEFAULT_PREFERENCES;
  }
}

export function getSavedChatHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveChatHistory(messages) {
  try {
    // Keep only last 25 messages to avoid blowing up storage
    const trimmed = messages.slice(-25);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save chat history:', err);
  }
}

export function clearChatHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch (err) {
    console.warn('Failed to clear chat history:', err);
  }
}
