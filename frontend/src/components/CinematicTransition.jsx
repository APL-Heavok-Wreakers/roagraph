import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

export default function CinematicTransition({ event }) {
  if (!event) return null;

  let config = {
    title: "",
    subtitle: "",
    color: "",
    bgGlow: "",
    icon: ""
  };

  switch (event) {
    case 'WICKET':
      config = {
        title: "WICKET",
        subtitle: "MASSIVE SHIFT DETECTED",
        color: "text-error",
        bgGlow: "bg-error/20",
        icon: "crisis_alert"
      };
      break;
    case 'BOUNDARY':
      config = {
        title: "BOUNDARY",
        subtitle: "EUPHORIA SURGE",
        color: "text-primary",
        bgGlow: "bg-primary/20",
        icon: "bolt"
      };
      break;
    case 'DRS':
      config = {
        title: "DRS REVIEW",
        subtitle: "TENSION PEAKING",
        color: "text-secondary",
        bgGlow: "bg-secondary/20",
        icon: "policy"
      };
      break;
    default:
      return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      >
        {/* Dark backdrop with color tint */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          className={cn("absolute inset-0 bg-background backdrop-blur-sm", config.bgGlow)} 
        />
        
        {/* Scanline intense overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_51%)] bg-[length:100%_4px] opacity-30 z-0"></div>

        <motion.div 
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 1.2, opacity: 0, filter: "blur(10px)" }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="relative z-10 flex flex-col items-center justify-center text-center glass-panel px-32 py-16 rounded-3xl border-2"
          style={{ borderColor: `var(--color-${config.color.split('-')[1]})` }} // Approximate dynamic border
        >
          <motion.span 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.2 }}
            className={cn("material-symbols-outlined text-8xl mb-4 drop-shadow-[0_0_30px_currentColor]", config.color)}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {config.icon}
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, letterSpacing: "-0.1em" }}
            animate={{ opacity: 1, letterSpacing: "0.05em" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={cn("text-7xl font-headline-lg uppercase font-black tracking-widest drop-shadow-[0_0_20px_currentColor]", config.color)}
          >
            {config.title}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-on-surface-variant font-label-caps tracking-[0.3em] mt-4 text-xl"
          >
            {config.subtitle}
          </motion.p>

          {/* Cinematic Lines */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={cn("h-px w-full absolute top-10", config.bgGlow.replace('/20', ''))} 
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={cn("h-px w-full absolute bottom-10", config.bgGlow.replace('/20', ''))} 
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
