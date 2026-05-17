import React from 'react';
import { motion } from 'framer-motion';

export default function AIInsightPanel({ insights }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-panel p-6 rounded-2xl relative overflow-hidden border-t-4 border-primary"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
        <h2 className="font-label-caps text-on-surface">GEMINI INSIGHTS</h2>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + idx * 0.2 }}
            className={`p-4 rounded border-l-2 ${insight.type === 'warning' ? 'bg-primary/5 border-primary' : 'bg-white/5 border-secondary'}`}
          >
            <p className="text-sm italic text-on-surface-variant">"{insight.text}"</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
