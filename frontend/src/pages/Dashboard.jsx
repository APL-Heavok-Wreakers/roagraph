import React from 'react';
import { motion } from 'framer-motion';
import TopNavbar from '../components/TopNavbar';
import Sidebar from '../components/Sidebar';
import MatchScoreCard from '../components/MatchScoreCard';
import EmotionStream from '../components/EmotionStream';
import AIInsightPanel from '../components/AIInsightPanel';
import MomentPeakCard from '../components/MomentPeakCard';
import GeoSentimentMap from '../components/GeoSentimentMap';
import CinematicTransition from '../components/CinematicTransition';
import AmbientParticles from '../components/AmbientParticles';
import { useRealtimeData as useDashboardData } from '../hooks/useRealtimeData';

export default function Dashboard() {
  const { insights, peaks, socialFeed, waveform, isWicketEvent, cinematicEvent, cityData } = useDashboardData();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="font-body-md text-on-background min-h-screen relative bg-background z-0">
      <AmbientParticles />
      <CinematicTransition event={cinematicEvent} />
      <div className="scanline-overlay pointer-events-none"></div>

      <TopNavbar />
      <Sidebar socialFeed={socialFeed} />

      {/* Main Content Canvas */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="ml-72 pt-16 h-screen flex flex-col p-6 gap-6 relative overflow-hidden"
      >
        <motion.div variants={itemVariants}>
          <MatchScoreCard />
        </motion.div>

        {/* Central Visualization Area */}
        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          {/* Center: Massive Emotion Stream */}
          <motion.div variants={itemVariants} className="col-span-8 h-full">
            <EmotionStream waveform={waveform} isWicketEvent={isWicketEvent} />
          </motion.div>

          {/* Right Panel: AI Intel & Map */}
          <motion.div variants={itemVariants} className="col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 pb-20 scrollbar-hide">
            <AIInsightPanel insights={insights} />
            <MomentPeakCard peaks={peaks} />
            <GeoSentimentMap cityData={cityData} />
          </motion.div>
        </div>
      </motion.main>

      {/* Floating Action Indicator (Visual only) */}
      <motion.div
        initial={{ y: 100, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        transition={{ duration: 0.8, delay: 1 }}
        className="fixed bottom-8 left-1/2 px-8 py-4 glass-panel rounded-full border border-primary/30 flex items-center gap-6 z-50 shadow-[0_0_20px_rgba(87,241,219,0.15)]"
      >
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_#57f1db]"
          ></motion.span>
          <span className="font-label-caps text-xs">AI ENGINE: ACTIVE</span>
        </div>
        <div className="h-4 w-px bg-white/10"></div>
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-xs text-on-surface-variant/60">PROCESSING CORES: 128</span>
        </div>
      </motion.div>
    </div>
  );
}
