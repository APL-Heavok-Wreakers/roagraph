import React from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

export function StatBox({ label, value, valueClassName, withBar, barPercent, barClassName, className }) {
  return (
    <div className={cn("text-center flex flex-col items-center", className)}>
      <span className="block font-label-caps text-[10px] text-on-surface-variant/60">{label}</span>
      <span className={cn("block font-bold", valueClassName)}>{value}</span>
      {withBar && (
        <div className="h-0.5 w-full bg-primary/20 mt-1 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${barPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn("h-full", barClassName)}
          />
        </div>
      )}
    </div>
  );
}
