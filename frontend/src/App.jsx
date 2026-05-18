import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import NoLiveMatch from './pages/NoLiveMatch';

function App() {
  // Toggle this state to simulate whether a live match is currently happening
  const [isLiveMatch, setIsLiveMatch] = useState(false);

  return (
    <>
      {/* Dev Toggle Button for demonstration purposes */}
      <button 
        onClick={() => setIsLiveMatch(!isLiveMatch)}
        className="fixed bottom-6 right-6 z-50 bg-surface/80 backdrop-blur-md border border-surface/50 text-on-surface px-5 py-3 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-primary/20 hover:border-primary/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center gap-2 group"
      >
        <span className="material-symbols-outlined text-[20px] text-primary group-hover:animate-pulse">
          {isLiveMatch ? 'power_settings_new' : 'play_circle'}
        </span>
        {isLiveMatch ? 'End Match' : 'Start Match'}
      </button>

      {isLiveMatch ? <Dashboard /> : <NoLiveMatch />}
    </>
  );
}

export default App;
