import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export function WaveBar({ height, colorClass, glowClass, delay = 0, isWicket = false }) {
  return (
    <div className={cn("flex-1 h-full relative group cursor-pointer rounded-t-sm transition-colors", 
      isWicket ? "bg-error/20" : "bg-primary/20 hover:bg-primary/40")}
    >
      <motion.div 
        animate={{ height: height }}
        transition={{ duration: 0.15, ease: "linear" }}
        className={cn(
          "absolute bottom-0 w-full rounded-t-sm", 
          colorClass, 
          glowClass,
          isWicket && "animate-pulse"
        )} 
      />
      {isWicket && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-error whitespace-nowrap z-20"
        >
          WICKET PEAK
        </motion.div>
      )}
    </div>
  );
}
