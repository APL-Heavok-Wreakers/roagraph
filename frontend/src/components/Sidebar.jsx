import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavButton } from './ui/NavButton';
import { MotionGlassPanel } from './ui/GlassPanel';
import { cn } from '../utils/cn';

export default function Sidebar({ socialFeed }) {
  const navItems = [
    { icon: "stream", label: "Global Stream", active: true },
    { icon: "group", label: "Team Sentiment" },
    { icon: "psychology", label: "Moment Peaks" },
    { icon: "insights", label: "Match Intel" },
  ];

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="h-screen w-72 fixed left-0 top-0 bg-surface-container/60 backdrop-blur-2xl border-r border-white/5 shadow-2xl flex flex-col pt-20 pb-8 z-40"
    >
      <div className="px-6 mb-8">
        <span className="font-label-caps text-on-surface tracking-widest block">PAVILION CHATTER</span>
        <span className="text-xs text-on-surface-variant/60 uppercase">Live Social Intelligence</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item, idx) => (
          <NavButton key={idx} icon={item.icon} label={item.label} active={item.active} />
        ))}
      </nav>

      {/* Social Feed Simulation */}
      <div className="px-4 space-y-4 overflow-y-auto max-h-[409px] py-4 border-t border-white/5 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {socialFeed.map((item) => (
            <MotionGlassPanel 
              key={item.id}
              layout
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.25 }}
              className={cn("p-3 rounded-lg text-xs space-y-2 border-l-2", item.type === 'viral' ? 'border-primary' : 'border-secondary')}
            >
              <div className="flex justify-between">
                <span className="font-bold text-on-surface">{item.author}</span>
                <span className={item.type === 'viral' ? 'text-primary' : 'text-secondary'}>{item.platform}</span>
              </div>
              <p className="text-on-surface-variant">{item.text}</p>
              {item.type === 'viral' && (
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">VIRAL SURGE</span>
              )}
            </MotionGlassPanel>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-auto px-4 space-y-1">
        <NavButton icon="settings" label="Settings" className="p-2 text-[10px] [&>span:first-child]:text-sm" />
        <NavButton icon="help" label="Support" className="p-2 text-[10px] [&>span:first-child]:text-sm" />
      </div>
    </motion.aside>
  );
}
