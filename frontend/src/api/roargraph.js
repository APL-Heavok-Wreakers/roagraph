/**
 * roargraph.js — Real API connector
 * Replaces mockWebSocket.js for production use.
 * Connects to the RoarGraph backend on http://localhost:8000
 */

const BASE = '/api'; // proxied to http://localhost:8000 via vite.config.js

// ── REST Endpoints ──────────────────────────────────────────────────────────

export async function fetchLiveEmotions(window = '60s') {
  const res = await fetch(`${BASE}/live-emotions?window=${window}`);
  return res.json();
}

export async function fetchCitySplit(topN = 8) {
  const res = await fetch(`${BASE}/city-split?top_n=${topN}`);
  return res.json();
}

export async function fetchOverSummary(over, innings = 1) {
  const res = await fetch(`${BASE}/over-summary/${over}?innings=${innings}`);
  return res.json();
}

export async function fetchMomentCards(limit = 20) {
  const res = await fetch(`${BASE}/moment-cards?limit=${limit}`);
  return res.json();
}

export async function fetchMatchState() {
  const res = await fetch(`${BASE}/match-state`);
  return res.json();
}

export async function fetchIPLMatch() {
  const res = await fetch(`${BASE}/ipl-match`);
  return res.json();
}

// ── WebSocket ───────────────────────────────────────────────────────────────

export function createWebSocket(onMessage, onConnect, onDisconnect) {
  let ws;
  let reconnectTimer;

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws/live`);

    ws.onopen = () => {
      console.log('[RoarGraph] WebSocket connected');
      onConnect?.();
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        onMessage(msg);
        // Also fire friend's event bus format for compatibility
        if (msg.event === 'EMOTION_PULSE') {
          window.dispatchEvent(new CustomEvent('ws-live-emotions', { detail: msg.data }));
        }
        if (msg.event === 'SPIKE_ALERT') {
          window.dispatchEvent(new CustomEvent('ws-moment-cards', { detail: msg.data }));
        }
      } catch (e) {
        console.error('[RoarGraph] WS parse error', e);
      }
    };

    ws.onclose = () => {
      console.warn('[RoarGraph] WebSocket closed, reconnecting in 2s...');
      onDisconnect?.();
      reconnectTimer = setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();
  }

  connect();

  return {
    close: () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    },
    send: (data) => ws?.send(JSON.stringify(data)),
  };
}
