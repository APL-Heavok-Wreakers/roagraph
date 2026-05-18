/**
 * k6 Load Test — Cricket Emotion Platform
 * ========================================
 * Simulates a World Cup final last-over scenario:
 *   - Ramp to 200,000 msgs/min across all 3 sources
 *   - Inject cricket-specific synthetic messages (not random text)
 *   - Measure end-to-end latency and Pub/Sub throughput
 *
 * Run: k6 run --vus 500 --duration 5m load_test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ── Custom Metrics ─────────────────────────────────────────────────────────

const publishLatency = new Trend('publish_latency_ms');
const errorRate = new Rate('error_rate');
const messagesPublished = new Counter('messages_published');

// ── Load Profile ───────────────────────────────────────────────────────────
// Simulates match progression: calm overs → building tension → explosive last over

export const options = {
  scenarios: {
    // Phase 1: Normal match flow (overs 1-15)
    steady_state: {
      executor: 'constant-arrival-rate',
      rate: 500,           // 500 msgs/sec = 30k/min
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
    // Phase 2: Death overs tension (overs 16-19)
    building_tension: {
      executor: 'ramping-arrival-rate',
      startRate: 500,
      timeUnit: '1s',
      stages: [
        { duration: '1m', target: 1500 },  // 90k/min
        { duration: '1m', target: 2000 },  // 120k/min
      ],
      preAllocatedVUs: 300,
      maxVUs: 500,
      startTime: '2m',
    },
    // Phase 3: LAST OVER — Everything explodes
    last_over_explosion: {
      executor: 'constant-arrival-rate',
      rate: 3500,          // 3500 msgs/sec = 210k/min (above target)
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 500,
      maxVUs: 1000,
      startTime: '4m',
    },
  },
  thresholds: {
    'publish_latency_ms': ['p(95)<500'],  // 95th percentile < 500ms
    'error_rate': ['rate<0.01'],           // < 1% error rate
    'http_req_duration': ['p(99)<1000'],   // 99th percentile < 1s
  },
};

// ── Synthetic Cricket Emotion Data ─────────────────────────────────────────
// Real-looking messages in English, Hindi, and Hinglish

const TWITTER_MESSAGES = [
  { text: "WHAT A SHOT KOHLI 🔥🔥🔥 THIS IS UNREAL!!!", lang: "en" },
  { text: "SIX!!! MASSIVE SIX!!! INTO THE STANDS!! 💪💪", lang: "en" },
  { text: "Iske baad toh gaya match 😭 no hope left", lang: "hi" },
  { text: "HOW IS THAT NOT OUT??? UMPIRE IS BLIND 😡😡", lang: "en" },
  { text: "bumrah aag laga raha hai 🔥 unstoppable today", lang: "hinglish" },
  { text: "last ball pe 6 chahiye bhai 🙏🙏 please", lang: "hinglish" },
  { text: "CAUGHT!! WHAT A CATCH BY JADEJA!! UNBELIEVABLE!!", lang: "en" },
  { text: "boring cricket yaar dot dot dot 😴", lang: "hinglish" },
  { text: "controversy! that was clearly a no ball wtf", lang: "en" },
  { text: "yeh match toh gaya haath se 😭😭😭 devastated", lang: "hinglish" },
  { text: "CENTURY FOR ROHIT!! 💯💯 HITMAN SUPREMACY!!", lang: "en" },
  { text: "dropped catch??? HOW DO YOU DROP THAT 🤦🤦", lang: "en" },
  { text: "run out! direct hit! game over!", lang: "en" },
  { text: "dil dhadak raha hai bhai last over 🫣🫣", lang: "hinglish" },
  { text: "WICKET! BOWLED HIM!! STUMPS FLYING!! 🏏🔥", lang: "en" },
];

const YOUTUBE_MESSAGES = [
  { text: "SIX SIX SIX 🔥🔥🔥🔥", type: "textMessageEvent" },
  { text: "kya shot mara yaar 💪", type: "textMessageEvent" },
  { text: "out hai out hai pakka out", type: "textMessageEvent" },
  { text: "umpire biased hai clearly 😡", type: "textMessageEvent" },
  { text: "this match is insane!!!!", type: "textMessageEvent" },
  { text: "COME ON INDIA 🇮🇳🇮🇳🇮🇳", type: "textMessageEvent" },
  { text: "heartbreaking 💔 we deserved to win", type: "textMessageEvent" },
  { text: "best match ever no cap 🤯", type: "textMessageEvent" },
];

const WHATSAPP_MESSAGES = [
  { text: "dekh raha hai?? kya shot tha!!", from: "919876543210" },
  { text: "gaya bhai gaya 😭", from: "919876543211" },
  { text: "OUTTTTT!! 🎉🎉🎉", from: "919876543212" },
  { text: "umpire pagal hai kya", from: "919876543213" },
  { text: "last ball 🙏🙏🙏", from: "919876543214" },
];

const INGESTION_URLS = {
  twitter: __ENV.TWITTER_INGESTOR_URL || 'http://localhost:8081',
  youtube: __ENV.YOUTUBE_INGESTOR_URL || 'http://localhost:8082',
  whatsapp: __ENV.WHATSAPP_INGESTOR_URL || 'http://localhost:8083',
};

// ── Test Function ──────────────────────────────────────────────────────────

export default function () {
  // Randomly pick a source (weighted: 50% twitter, 30% youtube, 20% whatsapp)
  const rand = Math.random();
  let source, messages, url;

  if (rand < 0.5) {
    source = 'twitter';
    messages = TWITTER_MESSAGES;
    url = `${INGESTION_URLS.twitter}/ingest`;
  } else if (rand < 0.8) {
    source = 'youtube';
    messages = YOUTUBE_MESSAGES;
    url = `${INGESTION_URLS.youtube}/ingest`;
  } else {
    source = 'whatsapp';
    messages = WHATSAPP_MESSAGES;
    url = `${INGESTION_URLS.whatsapp}/webhook`;
  }

  const msg = messages[Math.floor(Math.random() * messages.length)];
  const payload = JSON.stringify({
    ...msg,
    id: `load_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    source: source,
  });

  const start = Date.now();
  const res = http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '5s',
  });
  const duration = Date.now() - start;

  publishLatency.add(duration);
  messagesPublished.add(1);

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'latency < 500ms': () => duration < 500,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  // Minimal sleep to maintain arrival rate
  sleep(Math.random() * 0.05);
}

// ── Summary Handler ────────────────────────────────────────────────────────

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load_test_results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  return JSON.stringify(data.metrics, null, 2);
}
