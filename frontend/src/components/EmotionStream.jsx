import React from 'react';
import { MotionGlassPanel, GlassPanel } from './ui/GlassPanel';
import { WaveBar } from './ui/WaveBar';

export default function EmotionStream() {
  const waves = [
    { height: "80%", colorClass: "bg-primary", glowClass: "glow-teal" },
    { height: "40%", colorClass: "bg-primary", glowClass: "glow-teal" },
    { height: "90%", colorClass: "bg-primary", glowClass: "glow-teal" },
    { height: "10%", colorClass: "bg-primary", glowClass: "glow-teal" },
    { height: "100%", colorClass: "bg-error", glowClass: "glow-red", isWicket: true },
    { height: "30%", colorClass: "bg-primary", glowClass: "glow-teal" },
    { height: "60%", colorClass: "bg-primary", glowClass: "glow-teal" },
    { height: "45%", colorClass: "bg-primary", glowClass: "glow-teal" },
  ];

  return (
    <div className="col-span-8 flex flex-col gap-6 h-full min-h-[400px]">
      <GlassPanel className="flex-1 rounded-2xl relative overflow-hidden flex flex-col inner-glow">
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
            {waves.map((w, i) => (
              <WaveBar 
                key={`wave-${i}`} 
                height={w.height} 
                colorClass={w.colorClass} 
                glowClass={w.glowClass} 
                delay={i * 0.1}
                isWicket={w.isWicket}
              />
            ))}
          </div>
        </div>

        {/* Bottom Wave Metadata */}
        <div className="p-6 border-t border-white/5 grid grid-cols-4 gap-4 bg-black/10">
          <GlassPanel className="p-3 rounded-lg border-b border-primary hover:-translate-y-1 transition-transform cursor-default bg-transparent backdrop-blur-none border-t-0 border-x-0">
            <span className="text-[10px] font-label-caps block text-on-surface-variant/60">AVG PULSE</span>
            <span className="text-xl font-bold">112 BPM</span>
          </GlassPanel>
          <GlassPanel className="p-3 rounded-lg border-b border-secondary hover:-translate-y-1 transition-transform cursor-default bg-transparent backdrop-blur-none border-t-0 border-x-0">
            <span className="text-[10px] font-label-caps block text-on-surface-variant/60">VOLATILITY</span>
            <span className="text-xl font-bold text-secondary">HIGH</span>
          </GlassPanel>
          <GlassPanel className="p-3 rounded-lg border-b border-error hover:-translate-y-1 transition-transform cursor-default bg-transparent backdrop-blur-none border-t-0 border-x-0">
            <span className="text-[10px] font-label-caps block text-on-surface-variant/60">OUTLIERS</span>
            <span className="text-xl font-bold text-error">12.4%</span>
          </GlassPanel>
          <GlassPanel className="p-3 rounded-lg border-b border-primary hover:-translate-y-1 transition-transform cursor-default bg-transparent backdrop-blur-none border-t-0 border-x-0">
            <span className="text-[10px] font-label-caps block text-on-surface-variant/60">SENTIMENT</span>
            <span className="text-xl font-bold text-primary">POSITIVE</span>
          </GlassPanel>
        </div>
      </GlassPanel>
    </div>
  );
}
