import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export function IconButton({ icon, className, ...props }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.2, rotate: 10 }} 
      className={cn("material-symbols-outlined transition-colors cursor-pointer outline-none", className)}
      {...props}
    >
      {icon}
    </motion.button>
  );
}
