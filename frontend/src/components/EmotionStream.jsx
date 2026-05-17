import React from 'react';
import { motion } from 'framer-motion';

export default function EmotionStream() {
  return (
    <div className="col-span-8 flex flex-col gap-6 h-full min-h-[400px]">
      <div className="flex-1 glass-panel rounded-2xl relative overflow-hidden flex flex-col inner-glow">
        <div className="absolute top-4 left-6 z-10">
          <span className="font-label-caps text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">show_chart</span>
            LIVE EMOTION STREAM (SPLINE WAVE)
          </span>
        </div>
        
        {/* Decorative HUD Elements */}
        <div className="absolute top-0 right-0 p-4 font-mono-data text-[10px] text-on-surface-variant/30 text-right">
          COORD: 43.11.23<br/>SIGNAL: OPTIMAL<br/>LATENCY: 12ms
        </div>

        {/* Visualization Area */}
        <div className="flex-1 relative flex items-center justify-center mt-12">
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(87, 241, 219, 0.1) 0%, transparent 70%)' }}></div>
          
          <div className="w-full px-12 space-y-4 relative z-10 h-[200px] flex items-end gap-1">
            {[80, 40, 90, 10].map((h, i) => (
              <div key={`wave1-${i}`} className="flex-1 bg-primary/20 h-full relative group hover:bg-primary/40 transition-colors cursor-pointer rounded-t-sm">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                  className="absolute bottom-0 w-full bg-primary glow-teal rounded-t-sm" 
                />
              </div>
            ))}
            
            {/* Wicket Peak */}
            <div className="flex-1 bg-error/20 h-full relative group cursor-pointer rounded-t-sm">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
                className="absolute bottom-0 w-full bg-error animate-pulse glow-red rounded-t-sm" 
              />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-error whitespace-nowrap"
              >
                WICKET PEAK
              </motion.div>
            </div>

            {[30, 60, 45].map((h, i) => (
              <div key={`wave2-${i}`} className="flex-1 bg-primary/20 h-full relative group hover:bg-primary/40 transition-colors cursor-pointer rounded-t-sm">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.1, type: "spring" }}
                  className="absolute bottom-0 w-full bg-primary glow-teal rounded-t-sm" 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Wave Metadata */}
        <div className="p-6 border-t border-white/5 grid grid-cols-4 gap-4 bg-black/10">
          <div className="glass-panel p-3 rounded-lg border-b border-primary hover:-translate-y-1 transition-transform cursor-default">
            <span className="text-[10px] font-label-caps block text-on-surface-variant/60">AVG PULSE</span>
            <span className="text-xl font-bold">112 BPM</span>
          </div>
          <div className="glass-panel p-3 rounded-lg border-b border-secondary hover:-translate-y-1 transition-transform cursor-default">
            <span className="text-[10px] font-label-caps block text-on-surface-variant/60">VOLATILITY</span>
            <span className="text-xl font-bold text-secondary">HIGH</span>
          </div>
          <div className="glass-panel p-3 rounded-lg border-b border-error hover:-translate-y-1 transition-transform cursor-default">
            <span className="text-[10px] font-label-caps block text-on-surface-variant/60">OUTLIERS</span>
            <span className="text-xl font-bold text-error">12.4%</span>
          </div>
          <div className="glass-panel p-3 rounded-lg border-b border-primary hover:-translate-y-1 transition-transform cursor-default">
            <span className="text-[10px] font-label-caps block text-on-surface-variant/60">SENTIMENT</span>
            <span className="text-xl font-bold text-primary">POSITIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
