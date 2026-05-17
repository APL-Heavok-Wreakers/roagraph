import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export function NavButton({ icon, label, active, href = "#", className }) {
  return (
    <motion.a 
      whileHover="hover"
      className={cn(
        "flex items-center gap-3 p-4 transition-all duration-300 outline-none block",
        active 
          ? "bg-primary/10 text-primary border-r-2 border-primary shadow-[inset_0_0_15px_rgba(87,241,219,0.1)] translate-x-1" 
          : "text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface",
        className
      )} 
      href={href}
    >
      <motion.span 
        variants={{ hover: { scale: 1.2, rotate: 5 } }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className="material-symbols-outlined"
      >
        {icon}
      </motion.span>
      <span className="font-label-caps text-label-caps">{label}</span>
    </motion.a>
  );
}
