import React from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from './ui/GlassPanel';
import { cn } from '../../utils/cn';

export default function MomentPeakCard({ peaks }) {
  return (
    <GlassPanel className="p-6 rounded-2xl flex-1 border-t-4 border-secondary">
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="font-label-caps text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">bolt</span>
          MOMENT PEAKS
        </h2>
        
        <div className="space-y-3">
          {peaks.map((peak, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
              className="flex items-center gap-4 p-3 glass-panel rounded-lg transition-colors cursor-pointer"
            >
              <div className={cn(
                "w-10 h-10 rounded flex items-center justify-center",
                peak.type === 'euphoria' ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'
              )}>
                <span className="material-symbols-outlined">{peak.icon}</span>
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold block">{peak.title}</span>
                <span className="text-[10px] text-on-surface-variant/60">{peak.subtitle}</span>
              </div>
              <span className={cn(
                "font-bold",
                peak.type === 'euphoria' ? 'text-primary' : 'text-error'
              )}>{peak.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </GlassPanel>
  );
}
