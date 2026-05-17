import React from 'react';
import { cn } from '../../utils/cn';

export function NavButton({ icon, label, active, href = "#", className }) {
  return (
    <a 
      className={cn(
        "flex items-center gap-3 p-4 transition-all duration-300 outline-none",
        active 
          ? "bg-primary/10 text-primary border-r-2 border-primary shadow-[inset_0_0_15px_rgba(87,241,219,0.1)] translate-x-1" 
          : "text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface",
        className
      )} 
      href={href}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-label-caps text-label-caps">{label}</span>
    </a>
  );
}
