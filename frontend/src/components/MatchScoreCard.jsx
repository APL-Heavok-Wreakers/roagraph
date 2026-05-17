import React from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from './ui/GlassPanel';

export default function MatchScoreCard() {
  return (
    <div className="flex justify-between items-end">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <h1 className="font-headline-lg text-primary uppercase tracking-tight">Emotional Flux Analysis</h1>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/30">
            <motion.span 
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#57f1db]"
            ></motion.span>
            <span className="font-label-caps text-[10px] text-primary">AI ENGINE: ACTIVE</span>
          </div>
        </div>
        <p className="text-on-surface-variant/60 font-label-caps">Real-time Telemetry Overlay // Session 2</p>
      </div>
      
      <GlassPanel className="px-6 py-3 rounded-xl flex items-center gap-8 border-t-2 border-primary bg-transparent backdrop-blur-none border-x-0 border-b-0">
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
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-2xl font-bold text-primary"
          >
            9.79
          </motion.span>
        </div>
      </GlassPanel>
    </div>
  );
}
