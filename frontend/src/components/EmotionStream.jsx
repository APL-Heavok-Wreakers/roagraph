import React from 'react';
import { motion } from 'framer-motion';
import { MotionGlassPanel } from './ui/GlassPanel';
import { WaveBar } from './ui/WaveBar';

export default function EmotionStream({ waveform = [], isWicketEvent = false }) {
  // If no dynamic waveform is provided, provide a fallback pattern
  const bars = waveform.length > 0 
    ? waveform 
    : [80, 40, 90, 10, 100, 30, 60, 45, 80, 40, 90, 10, 100, 30, 60, 45, 80, 40, 90, 10];

  return (
    <div className="flex flex-col gap-6 h-full min-h-[400px]">
      <MotionGlassPanel className="flex-1 rounded-2xl relative overflow-hidden flex flex-col inner-glow">
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
          
          <div className="w-full px-12 space-y-4 relative z-10 h-[200px] flex items-end gap-[2px]">
            {bars.map((h, i) => {
              // Highlight the last few bars heavily if there's a wicket event
              const isRecentWicket = isWicketEvent && i > bars.length - 10;
              const isCurrentWicketPeak = isRecentWicket && h > 85;
              
              return (
                <WaveBar 
                  key={`wave-${i}`} 
                  height={`${h}%`} 
                  colorClass={isCurrentWicketPeak ? "bg-error" : "bg-primary"} 
                  glowClass={isCurrentWicketPeak ? "glow-red" : "glow-teal"} 
                  delay={0}
                  isWicket={isCurrentWicketPeak}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Wave Metadata */}
        <div className="p-6 border-t border-white/5 grid grid-cols-4 gap-4 bg-black/10">
          <motion.div whileHover={{ y: -5, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <MotionGlassPanel className="p-3 rounded-lg border-b border-primary cursor-default bg-transparent backdrop-blur-none border-t-0 border-x-0 h-full">
              <span className="text-[10px] font-label-caps block text-on-surface-variant/60">AVG PULSE</span>
              <span className="text-xl font-bold">112 BPM</span>
            </MotionGlassPanel>
          </motion.div>
          <motion.div whileHover={{ y: -5, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <MotionGlassPanel className="p-3 rounded-lg border-b border-secondary cursor-default bg-transparent backdrop-blur-none border-t-0 border-x-0 h-full">
              <span className="text-[10px] font-label-caps block text-on-surface-variant/60">VOLATILITY</span>
              <span className="text-xl font-bold text-secondary">HIGH</span>
            </MotionGlassPanel>
          </motion.div>
          <motion.div whileHover={{ y: -5, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <MotionGlassPanel className="p-3 rounded-lg border-b border-error cursor-default bg-transparent backdrop-blur-none border-t-0 border-x-0 h-full">
              <span className="text-[10px] font-label-caps block text-on-surface-variant/60">OUTLIERS</span>
              <span className="text-xl font-bold text-error">12.4%</span>
            </MotionGlassPanel>
          </motion.div>
          <motion.div whileHover={{ y: -5, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <MotionGlassPanel className="p-3 rounded-lg border-b border-primary cursor-default bg-transparent backdrop-blur-none border-t-0 border-x-0 h-full">
              <span className="text-[10px] font-label-caps block text-on-surface-variant/60">SENTIMENT</span>
              <span className="text-xl font-bold text-primary">POSITIVE</span>
            </MotionGlassPanel>
          </motion.div>
        </div>
      </MotionGlassPanel>
    </div>
  );
}
