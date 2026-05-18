/**
 * roargraph.js — Live API connector
 * Connects to the RoarGraph backend on http://localhost:8000
 * Proxied via /api (see vite.config.js → proxy → /api → http://localhost:8000)
 *
 * All fetches include:
 *   - Error handling (throws with a clear message on HTTP error)
 *   - AbortSignal timeout so a stalled server never hangs the UI
 */

const BASE = '/api';                        // proxied to http://localhost:8000
const TIMEOUT_MS = 8000;                    // 8 s per request

/** Thin fetch wrapper with timeout + HTTP-error surfacing. */
async function apiFetch(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${path}`);
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Timeout fetching ${path}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── REST Endpoints ────────────────────────────────────────────────────────────

/**
 * Emotion distribution over a rolling time window.
 * @param {string} window  e.g. '60s', '300s'
 */
export async function fetchLiveEmotions(window = '60s') {
  return apiFetch(`/live-emotions?window=${window}`);
}

/**
 * City-level emotion intensity leaderboard.
 * @param {number} topN  max cities to return
 */
export async function fetchCitySplit(topN = 8) {
  return apiFetch(`/city-split?top_n=${topN}`);
}

/**
 * Emotion summary for a specific over.
 * @param {number} over
 * @param {number} innings
 */
export async function fetchOverSummary(over, innings = 1) {
  return apiFetch(`/over-summary/${over}?innings=${innings}`);
}

/**
 * Recent moment/spike cards.
 * @param {number} limit
 */
export async function fetchMomentCards(limit = 20) {
  return apiFetch(`/moment-cards?limit=${limit}`);
}

/**
 * Match state: over, ball, message count, viewer count.
 */
export async function fetchMatchState() {
  return apiFetch('/match-state');
}

/**
 * Current IPL match context (teams, scores, venue).
 * Source: live CricAPI if CRICKET_API_KEY is set, else simulated.
 */
export async function fetchIPLMatch() {
  return apiFetch('/ipl-match');
}

/**
 * Latest ball-by-ball commentary (last 20 balls).
 * Returns { balls: [...], source: 'live' | 'synthetic' }
 */
export async function fetchCommentary() {
  return apiFetch('/commentary');
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

/**
 * Create a managed WebSocket connection to /ws/live with auto-reconnect.
 *
 * @param {(msg: object) => void}  onMessage     called with parsed JSON events
 * @param {() => void}             onConnect     called on successful open
 * @param {() => void}             onDisconnect  called on close / before reconnect
 * @returns {{ close: () => void, send: (data: object) => void }}
 */
export function createWebSocket(onMessage, onConnect, onDisconnect) {
  let ws;
  let reconnectTimer;
  let closed = false;            // tracks intentional close

  function connect() {
    if (closed) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws/live`);

    ws.onopen = () => {
      console.info('[RoarGraph] WebSocket connected');
      onConnect?.();
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        onMessage(msg);

        // Mirror events to the global event bus for optional legacy listeners
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
      console.warn('[RoarGraph] WebSocket closed — reconnecting in 2 s…');
      onDisconnect?.();
      if (!closed) reconnectTimer = setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();
  }

  connect();

  return {
    close: () => {
      closed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    },
    send: (data) => ws?.send(JSON.stringify(data)),
  };
}
