import { useState, useEffect } from 'react';
import { wsService } from '../services/websocketService';

const initialInsights = [
  { text: "Waiting for live match intelligence...", type: 'info' }
];

const initialPeaks = [
  { icon: 'sports_cricket', title: 'MATCH START', subtitle: 'Awaiting data', value: '0%', type: 'euphoria' }
];

export function useRealtimeData() {
  const [isConnected, setIsConnected] = useState(false);
  const [insights, setInsights] = useState(initialInsights);
  const [peaks, setPeaks] = useState(initialPeaks);
  const [socialFeed, setSocialFeed] = useState([]);
  const [waveform, setWaveform] = useState(Array.from({ length: 40 }, () => 20));
  const [isWicketEvent, setIsWicketEvent] = useState(false);
  const [emotions, setEmotions] = useState({ tension: 0, euphoria: 0, frustration: 0, disbelief: 0 });

  useEffect(() => {
    // 1. Start the WebSocket Connection
    wsService.connect();

    // 2. Subscribe to standard WebSocket events
    const unsubConnection = wsService.subscribe('connectionChange', (status) => {
      setIsConnected(status);
    });

    const unsubInsights = wsService.subscribe('insight', (data) => {
      setInsights(prev => [data, ...prev].slice(0, 3));
    });

    const unsubPeaks = wsService.subscribe('peak', (data) => {
      setPeaks(prev => [data, ...prev].slice(0, 3));
    });

    const unsubSocial = wsService.subscribe('social', (data) => {
      setSocialFeed(prev => [data, ...prev].slice(0, 15));
    });
    
    const unsubEmotions = wsService.subscribe('emotions', (data) => {
      setEmotions(data);
    });

    // We can also receive direct waveform updates if the backend streams it
    const unsubWaveform = wsService.subscribe('waveform', (data) => {
      if (data.values) setWaveform(data.values);
      if (data.isWicketEvent !== undefined) setIsWicketEvent(data.isWicketEvent);
    });

    // 3. Cleanup on unmount
    return () => {
      unsubConnection();
      unsubInsights();
      unsubPeaks();
      unsubSocial();
      unsubEmotions();
      unsubWaveform();
      wsService.disconnect();
    };
  }, []);

  return { isConnected, insights, peaks, socialFeed, waveform, isWicketEvent, emotions };
}
