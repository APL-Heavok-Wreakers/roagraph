import { useState, useEffect, useRef } from 'react'
import { createWebSocket, fetchCitySplit, fetchMatchState, fetchIPLMatch, fetchMomentCards } from './api/roargraph.js'

const EMOTION_COLORS = {
  joy: '#00b894', euphoria: '#fdcb6e', outrage: '#e17055',
  anxiety: '#e056a0', tension: '#e056a0', frustration: '#e17055',
  devastation: '#d63031', disbelief: '#0984e3', neutral: '#636e72'
}
const TYPE_COLORS = { MOMENT_CARD: '#fdcb6e', SPIKE_ALERT: '#e17055', CONTROVERSY: '#e056a0', DEAD_CROWD: '#636e72' }

export default function App() {
  const [connected, setConnected] = useState(false)
  const [pulse, setPulse] = useState(null)
  const [cities, setCities] = useState([])
  const [matchState, setMatchState] = useState({})
  const [iplMatch, setIplMatch] = useState({})
  const [momentCards, setMomentCards] = useState([])
  const wsRef = useRef(null)

  useEffect(() => {
    // WebSocket connection
    wsRef.current = createWebSocket(
      (msg) => {
        if (msg.event === 'EMOTION_PULSE') setPulse(msg.data)
        if (msg.event === 'SPIKE_ALERT') {
          setMomentCards(prev => [{ ...msg.data, id: msg.event_id, ts: Date.now() }, ...prev].slice(0, 20))
        }
      },
      () => setConnected(true),
      () => setConnected(false)
    )

    // Poll REST endpoints
    const poll = async () => {
      try {
        const [c, s, m, mc] = await Promise.all([
          fetchCitySplit(8), fetchMatchState(), fetchIPLMatch(), fetchMomentCards(20)
        ])
        setCities(c.cities || [])
        setMatchState(s)
        setIplMatch(m)
        if (mc.cards?.length) setMomentCards(mc.cards.slice(0, 20))
      } catch (e) {}
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => { clearInterval(t); wsRef.current?.close() }
  }, [])

  const intensity = pulse?.global_intensity ?? 0
  const dist = pulse?.distribution ?? {}
  const teamA = iplMatch?.teams_short?.team_a || iplMatch?.team_a || 'MI'
  const teamB = iplMatch?.teams_short?.team_b || iplMatch?.team_b || 'CSK'
  const sortedEmotions = Object.entries(dist).sort((a, b) => b[1] - a[1])

  // Compute team sentiments from cities
  const avgA = cities.length ? cities.reduce((s, c) => s + (c.team_a_sentiment || 0), 0) / cities.length : 0
  const avgB = cities.length ? cities.reduce((s, c) => s + (c.team_b_sentiment || 0), 0) / cities.length : 0

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>🏏 <span>RoarGraph</span></h1>
          <span className="live-badge">● LIVE</span>
          <span className="match-name">{iplMatch?.name || 'IPL 2026 • Loading match...'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span className="ws-label">
            <span className={`ws-dot ${connected ? 'connected' : 'disconnected'}`}></span>
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
          <div className="stats-bar">
            <div className="stat"><span className="stat-val">{pulse?.over ?? matchState?.over ?? '–'}</span><span className="stat-label">Over</span></div>
            <div className="stat"><span className="stat-val">{pulse?.ball ?? matchState?.ball ?? '–'}</span><span className="stat-label">Ball</span></div>
            <div className="stat"><span className="stat-val">{(matchState?.messages_ingested || 0).toLocaleString()}</span><span className="stat-label">Messages</span></div>
            <div className="stat"><span className="stat-val">{pulse?.message_rate ?? '–'}</span><span className="stat-label">msg/s</span></div>
            <div className="stat"><span className="stat-val">{matchState?.ws_clients ?? '–'}</span><span className="stat-label">Viewers</span></div>
          </div>
        </div>
      </header>

      <div className="grid">
        {/* Global Intensity */}
        <div className="card">
          <div className="card-title">🔥 Global Intensity</div>
          <div className="big-number" style={{ color: intensity > 0.7 ? '#e17055' : intensity > 0.5 ? '#fdcb6e' : '#a29bfe' }}>
            {intensity.toFixed(2)}
          </div>
          <div className="intensity-meter">
            <div className="intensity-fill" style={{
              width: `${Math.round(intensity * 100)}%`,
              background: intensity > 0.7 ? '#e17055' : intensity > 0.5 ? '#fdcb6e' : '#6c5ce7'
            }} />
          </div>
          <div className="top-label">
            Top: <strong style={{ color: EMOTION_COLORS[pulse?.top_emotion] || '#fff' }}>{pulse?.top_emotion || '—'}</strong>
          </div>
        </div>

        {/* Emotion Distribution */}
        <div className="card wide">
          <div className="card-title">📊 Emotion Distribution (Live)</div>
          <div className="emotion-bars">
            {sortedEmotions.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Connecting to stream...</span>}
            {sortedEmotions.map(([em, pct]) => (
              <div key={em} className="emotion-bar">
                <div className="em-label" style={{ color: EMOTION_COLORS[em] || '#888' }}>{em}</div>
                <div className="em-track">
                  <div className="em-fill" style={{ width: `${Math.round(pct * 100)}%`, background: EMOTION_COLORS[em] || '#888' }}>
                    {Math.round(pct * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Sentiment */}
        <div className="card">
          <div className="card-title">⚔️ Team Sentiment Split</div>
          <div className="team-split">
            <div className="team-block a">
              <div className="team-name">🏏 {teamA}</div>
              <div className="team-score">{iplMatch?.team_a_score || ''}</div>
              <div className="team-val" style={{ color: avgA >= 0 ? '#00b894' : '#d63031' }}>
                {avgA >= 0 ? '+' : ''}{avgA.toFixed(2)}
              </div>
            </div>
            <div className="team-block b">
              <div className="team-name">🏏 {teamB}</div>
              <div className="team-score">{iplMatch?.team_b_score || ''}</div>
              <div className="team-val" style={{ color: avgB >= 0 ? '#00b894' : '#d63031' }}>
                {avgB >= 0 ? '+' : ''}{avgB.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* City Leaderboard */}
        <div className="card">
          <div className="card-title">🏙️ City Intensity Leaderboard</div>
          <div className="city-list">
            {cities.map(c => {
              const color = EMOTION_COLORS[c.dominant_emotion] || '#888'
              return (
                <div key={c.city} className="city-row">
                  <span className="city-name">{c.city}</span>
                  <span>🔥 {c.avg_intensity?.toFixed(2)}</span>
                  <span className="city-badge" style={{ background: `${color}22`, color }}>{c.dominant_emotion}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{c.message_count} msgs</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Moment Cards */}
        <div className="card wide">
          <div className="card-title">⚡ Moment Cards (Auto-Generated)</div>
          <div className="moment-feed">
            {momentCards.length === 0
              ? <div className="empty-state">Waiting for first spike...</div>
              : momentCards.map((card, i) => {
                  const color = TYPE_COLORS[card.trigger_type] || '#a29bfe'
                  return (
                    <div key={card.id || i} className="moment-item" style={{ borderLeftColor: color }}>
                      <div className="moment-type" style={{ color }}>{card.trigger_type} — {card.dominant_emotion}</div>
                      <div className="moment-spike">
                        {card.spike_multiplier}x spike · Intensity {card.intensity}
                      </div>
                      {card.narrative && <div className="moment-detail">{card.narrative}</div>}
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>
    </>
  )
}
