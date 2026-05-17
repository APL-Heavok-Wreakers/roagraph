import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const GlassPanel = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("glass-panel", className)} {...props}>
      {children}
    </div>
  );
});

GlassPanel.displayName = 'GlassPanel';

export const MotionGlassPanel = motion(GlassPanel);
