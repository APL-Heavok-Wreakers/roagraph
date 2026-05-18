import React from 'react';
import { motion } from 'framer-motion';
import AmbientParticles from '../components/AmbientParticles';
import TopNavbar from '../components/TopNavbar';
import Sidebar from '../components/Sidebar';

const upcomingMatches = [
  {
    id: 1,
    team1: "CSK",
    team2: "RCB",
    team1Full: "Chennai Super Kings",
    team2Full: "Royal Challengers Bengaluru",
    date: "Today",
    time: "19:30 IST",
    venue: "M. A. Chidambaram Stadium, Chennai"
  },
  {
    id: 2,
    team1: "MI",
    team2: "GT",
    team1Full: "Mumbai Indians",
    team2Full: "Gujarat Titans",
    date: "Tomorrow",
    time: "19:30 IST",
    venue: "Wankhede Stadium, Mumbai"
  },
  {
    id: 3,
    team1: "KKR",
    team2: "SRH",
    team1Full: "Kolkata Knight Riders",
    team2Full: "Sunrisers Hyderabad",
    date: "20 May",
    time: "15:30 IST",
    venue: "Eden Gardens, Kolkata"
  }
];

export default function NoLiveMatch() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80 } }
  };

  return (
    <div className="font-body-md text-on-background min-h-screen relative bg-background z-0">
      <AmbientParticles />
      <div className="scanline-overlay pointer-events-none"></div>

      {/* Reusing TopNavbar and Sidebar if we want the shell to remain, but without live data */}
      <TopNavbar />
      <Sidebar socialFeed={[]} />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="ml-72 pt-24 h-screen flex flex-col items-center px-8 relative overflow-hidden"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-primary mb-4 tracking-wider uppercase drop-shadow-[0_0_15px_rgba(var(--color-primary),0.5)]">
            Standby Mode
          </h1>
          <p className="text-xl text-on-surface/70 font-light max-w-2xl mx-auto">
            No live IPL match is currently in progress. The roar of the crowd is paused. Prepare for the upcoming clashes.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full max-w-5xl">
          <h2 className="text-2xl font-heading font-semibold text-on-surface mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary">event_upcoming</span>
            Upcoming Matches
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingMatches.map((match) => (
              <motion.div
                key={match.id}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-surface/40 backdrop-blur-md border border-surface/50 rounded-xl p-6 relative overflow-hidden group shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:border-primary/50"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-surface/80 flex items-center justify-center border border-surface text-lg font-bold text-on-surface shadow-inner shadow-black/50">
                      {match.team1}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center px-4">
                    <span className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">VS</span>
                    <div className="w-8 h-[1px] bg-secondary/50"></div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-surface/80 flex items-center justify-center border border-surface text-lg font-bold text-on-surface shadow-inner shadow-black/50">
                      {match.team2}
                    </div>
                  </div>
                </div>

                <div className="text-center relative z-10 border-t border-surface/50 pt-4 mt-2">
                  <div className="flex items-center justify-center gap-2 text-primary font-bold text-lg mb-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {match.date} • {match.time}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-on-surface/60 text-sm">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    <span className="truncate" title={match.venue}>{match.venue}</span>
                  </div>
                </div>
                
                {/* Team Full Names - Reveal on Hover */}
                <div className="absolute -bottom-10 left-0 right-0 bg-surface/90 text-center py-2 text-xs text-on-surface/80 font-medium transition-all duration-300 group-hover:bottom-0 border-t border-primary/20 backdrop-blur-lg">
                  {match.team1Full} vs {match.team2Full}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      </motion.main>
    </div>
  );
}
