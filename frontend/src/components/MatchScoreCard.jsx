import React from 'react';
import { motion } from 'framer-motion';

export default function MatchScoreCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex justify-between items-end"
    >
      <div>
        <h1 className="font-headline-lg text-primary uppercase tracking-tight">Emotional Flux Analysis</h1>
        <p className="text-on-surface-variant/60 font-label-caps">Real-time Telemetry Overlay // Session 2</p>
      </div>
      
      <div className="glass-panel px-6 py-3 rounded-xl flex items-center gap-8 border-t-2 border-primary">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-label-caps text-on-surface-variant/60 uppercase">India</span>
          <span className="text-2xl font-bold">142/3</span>
        </div>
        <div className="h-8 w-px bg-white/10"></div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-label-caps text-on-surface-variant/60 uppercase">Overs</span>
          <span className="text-2xl font-bold">14.3</span>
        </div>
        <div className="h-8 w-px bg-white/10"></div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-label-caps text-on-surface-variant/60 uppercase">Run Rate</span>
          <motion.span 
            key="runrate"
            initial={{ scale: 1.2, color: "#fff" }}
            animate={{ scale: 1, color: "#57f1db" }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-primary"
          >
            9.79
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
