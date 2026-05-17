import { useState, useEffect } from 'react';

const mockInsights = [
  { text: "Crowd confidence dropping rapidly. Historical data suggests high anxiety during the 15th over when facing Starc.", type: 'warning' },
  { text: "Sentiment shift detected: Neutral fans moving towards 'Supportive' as Kohli crosses 50.", type: 'info' }
];

const mockPeaks = [
  { icon: 'sports_cricket', title: 'BOUNDARY ALERT', subtitle: 'Euphoria Peak @ 14:12', value: '92%', type: 'euphoria' },
  { icon: 'close', title: 'DRS DRAMA', subtitle: 'Frustration Peak @ 13:55', value: '78%', type: 'error' }
];

const mockSocial = [
  { id: 1, author: '@CricketFanatic', platform: 'X', text: "Kohli's cover drive is just pure therapy for the soul. 87% euphoria in my living room right now! #INDvsAUS", type: 'viral' },
  { id: 2, author: 'Rahul K.', platform: 'WA', text: "Check that DRS! I'm holding my breath. Tension is off the charts.", type: 'normal' }
];

export function useDashboardData() {
  const [insights, setInsights] = useState(mockInsights);
  const [peaks, setPeaks] = useState(mockPeaks);
  const [socialFeed, setSocialFeed] = useState(mockSocial);

  useEffect(() => {
    // Mock websocket updates
    const interval = setInterval(() => {
      // randomly add a new social message
      if (Math.random() > 0.7) {
        const newMessage = {
          id: Date.now(),
          author: `User_${Math.floor(Math.random() * 1000)}`,
          platform: 'X',
          text: "What an incredible moment! The crowd is going wild. 🔥",
          type: Math.random() > 0.8 ? 'viral' : 'normal'
        };
        setSocialFeed(prev => [newMessage, ...prev].slice(0, 10)); // keep last 10
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { insights, peaks, socialFeed };
}
