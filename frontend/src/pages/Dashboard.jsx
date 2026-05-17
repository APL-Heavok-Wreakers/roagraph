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
import { useDashboardData } from '../hooks/useDashboardData';

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

    </div>
  );
}
