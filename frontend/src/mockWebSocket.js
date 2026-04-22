/**
 * mockWebSocket.js
 * Simulates backend WebSocket + REST endpoints for frontend development.
 * Usage: import { startMockServer } from './mockWebSocket'
 * Call startMockServer() in index.js when REACT_APP_MOCK=true.
 */

export const startMockServer = () => {
  console.log('🚀 Mock Server Starting...');

  // --- STATE MANAGEMENT ---
  let currentEmotions = {
    tension: 50,
    euphoria: 30,
    frustration: 10,
    disbelief: 5
  };

  const updateEmotions = () => {
    const walk = (val) => Math.min(100, Math.max(0, val + (Math.random() * 10 - 5)));
    currentEmotions = {
      tension: walk(currentEmotions.tension),
      euphoria: walk(currentEmotions.euphoria),
      frustration: walk(currentEmotions.frustration),
      disbelief: walk(currentEmotions.disbelief)
    };
  };

  // --- MOCK WEBSOCKETS ---
  const createMockWS = (url, name) => {
    console.log(`[Mock WS] ${name} available at ${url}`);
    // In a real browser-native mock, we'd use something like 'mock-socket' 
    // but here we'll simulate the logic via EventEmitters or simple Interval callbacks
    // that the UI can "subscribe" to if it were using a real mock library.
    // Since we need to be dependency-free, we'll use a global event bus.
    return {
      onMessage: (callback) => {
        window.addEventListener(`ws-${name}`, (e) => callback(e.detail));
      }
    };
  };

  const dispatchWS = (name, data) => {
    window.dispatchEvent(new CustomEvent(`ws-${name}`, { detail: data }));
  };

  // 1. Live Emotions (Every 2s)
  setInterval(() => {
    updateEmotions();
    dispatchWS('live-emotions', currentEmotions);
  }, 2000);

  // 2. Moment Cards (Every 15-30s)
  const templates = [
    { type: 'WICKET', player: 'V. Kohli', description: 'Huge breakthrough for the bowling side!' },
    { type: 'SIX', player: 'R. Sharma', description: 'Clean strike over long-on!' },
    { type: 'BOUNDARY', player: 'S. Gill', description: 'Elegant drive through the covers.' },
    { type: 'DRS', player: 'Umpire', description: 'Review pending... tension is high.' }
  ];

  const sendMomentCard = () => {
    const card = templates[Math.floor(Math.random() * templates.length)];
    dispatchWS('moment-cards', { ...card, timestamp: new Date().toISOString() });
    const nextInterval = Math.floor(Math.random() * (30000 - 15000 + 1) + 15000);
    setTimeout(sendMomentCard, nextInterval);
  };
  sendMomentCard();

  // 3. Live Feed (Every 1-2s)
  const platforms = ['Twitter', 'Instagram', 'Reddit'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'London', 'Sydney'];
  const emotions = ['🔥 Absolute scenes!', '😱 I can\'t believe it', '📉 This is stressful', '🙌 Pure class'];

  setInterval(() => {
    const message = {
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      text: emotions[Math.floor(Math.random() * emotions.length)],
      timestamp: new Date().toLocaleTimeString()
    };
    dispatchWS('live-feed', message);
  }, Math.random() * 1000 + 1000);

  // --- MOCK REST ENDPOINTS (Intercepting fetch) ---
  const originalFetch = window.fetch;
  window.fetch = async (url, options) => {
    if (url.includes('/api/over-summary')) {
      return {
        ok: true,
        json: async () => {
          const overs = Array.from({ length: 20 }, (_, i) => {
            const overNum = i + 1;
            let intensity = 20;
            if (overNum <= 5) intensity = 10 + Math.random() * 20;
            if (overNum === 10) intensity = 80;
            if (overNum >= 16 && overNum <= 18) intensity = 90 + Math.random() * 10;
            return { over: overNum, tension: intensity, euphoria: intensity * 0.8 };
          });
          return overs;
        }
      };
    }

    if (url.includes('/api/city-split')) {
      return {
        ok: true,
        json: async () => ({
          'Mumbai': { euphoria: 80, tension: 20 },
          'Delhi': { euphoria: 60, tension: 40 },
          'Bangalore': { euphoria: 90, tension: 10 }
        })
      };
    }

    if (url.includes('/api/live-emotions')) {
      return {
        ok: true,
        json: async () => currentEmotions
      };
    }

    return originalFetch(url, options);
  };

  console.log('✅ Mock Server Active. WebSocket emitters and REST intercepts ready.');
};
