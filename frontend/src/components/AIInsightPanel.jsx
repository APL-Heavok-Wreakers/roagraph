import React from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from './ui/GlassPanel';
import { cn } from '../utils/cn';

export default function AIInsightPanel({ insights }) {
  return (
    <GlassPanel className="p-4 rounded-2xl relative overflow-hidden border-t-4 border-primary">
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          <h2 className="font-label-caps text-on-surface text-xs">GEMINI INSIGHTS</h2>
        </div>
        
        <div className="space-y-2">
          {insights.map((insight, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.2 }}
              className={cn(
                "p-4 rounded border-l-2",
                insight.type === 'warning' ? 'bg-primary/5 border-primary' : 'bg-white/5 border-secondary'
              )}
            >
              <p className="text-sm italic text-on-surface-variant">"{insight.text}"</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </GlassPanel>
  );
}
