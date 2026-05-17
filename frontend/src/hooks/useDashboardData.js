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

  // Generate initial waveform data (e.g. 40 bars)
  const [waveform, setWaveform] = useState(Array.from({ length: 40 }, () => Math.random() * 60 + 20));
  const [isWicketEvent, setIsWicketEvent] = useState(false);
  const [cinematicEvent, setCinematicEvent] = useState(null);

  useEffect(() => {
    // Mock websocket updates
    const interval = setInterval(() => {
      // Social updates
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

    // Random cinematic events
    const cinematicInterval = setInterval(() => {
      const events = ['WICKET', 'BOUNDARY', 'DRS'];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setCinematicEvent(randomEvent);
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        setCinematicEvent(null);
      }, 3000);
    }, 15000); // trigger a random cinematic event every 15 seconds for demo

    return () => {
      clearInterval(interval);
      clearInterval(cinematicInterval);
    };
  }, []);

  useEffect(() => {
    // Waveform real-time streaming
    const waveInterval = setInterval(() => {
      setWaveform(prev => {
        const newWave = [...prev.slice(1)];
        // Create an occasional spike
        const isSpike = Math.random() > 0.95;
        let newValue = Math.random() * 40 + 20; // base noise
        
        if (isSpike) {
          newValue = 95 + Math.random() * 5; // huge spike
          setIsWicketEvent(true);
          setTimeout(() => setIsWicketEvent(false), 2000);
        } else if (isWicketEvent) {
          newValue = 70 + Math.random() * 20; // lingering high energy
        } else {
          // smooth it a bit based on last value
          const lastVal = prev[prev.length - 1];
          newValue = (lastVal + newValue) / 2;
        }
        
        newWave.push(newValue);
        return newWave;
      });
    }, 150); // 150ms tick rate for fast smooth animation

    return () => clearInterval(waveInterval);
  }, [isWicketEvent]);

  // Dynamic City Heatmap Data
  const [cityData, setCityData] = useState([
    { id: 'mumbai', name: 'MUMBAI', x: '35%', y: '55%', sentiment: 'EUPHORIC', intensity: 88, type: 'primary' },
    { id: 'delhi', name: 'DELHI', x: '40%', y: '30%', sentiment: 'TENSE', intensity: 45, type: 'secondary' },
    { id: 'chennai', name: 'CHENNAI', x: '55%', y: '75%', sentiment: 'FRUSTRATED', intensity: 65, type: 'error' },
    { id: 'kolkata', name: 'KOLKATA', x: '75%', y: '45%', sentiment: 'EUPHORIC', intensity: 70, type: 'primary' },
  ]);

  useEffect(() => {
    const cityInterval = setInterval(() => {
      setCityData(prev => prev.map(city => {
        // Random walk for intensity
        let newIntensity = Math.max(10, Math.min(100, city.intensity + (Math.random() * 20 - 10)));
        
        // Occasionally flip sentiment if intensity gets too extreme
        let newType = city.type;
        let newSentiment = city.sentiment;
        if (Math.random() > 0.9) {
          const types = [
            { t: 'primary', s: 'EUPHORIC' }, 
            { t: 'secondary', s: 'TENSE' }, 
            { t: 'error', s: 'FRUSTRATED' }
          ];
          const randomType = types[Math.floor(Math.random() * types.length)];
          newType = randomType.t;
          newSentiment = randomType.s;
        }

        return { ...city, intensity: newIntensity, type: newType, sentiment: newSentiment };
      }));
    }, 2000);

    return () => clearInterval(cityInterval);
  }, []);

  return { insights, peaks, socialFeed, waveform, isWicketEvent, cinematicEvent, cityData };
}
