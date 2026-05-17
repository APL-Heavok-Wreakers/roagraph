import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ socialFeed }) {
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
        <a className="bg-primary/10 text-primary border-r-2 border-primary flex items-center gap-3 p-4 shadow-[inset_0_0_15px_rgba(87,241,219,0.1)] translate-x-1 transition-transform" href="#">
          <span className="material-symbols-outlined">stream</span>
          <span className="font-label-caps text-label-caps">Global Stream</span>
        </a>
        <a className="text-on-surface-variant/60 flex items-center gap-3 p-4 hover:bg-white/5 hover:text-on-surface transition-colors" href="#">
          <span className="material-symbols-outlined">group</span>
          <span className="font-label-caps text-label-caps">Team Sentiment</span>
        </a>
        <a className="text-on-surface-variant/60 flex items-center gap-3 p-4 hover:bg-white/5 hover:text-on-surface transition-colors" href="#">
          <span className="material-symbols-outlined">psychology</span>
          <span className="font-label-caps text-label-caps">Moment Peaks</span>
        </a>
        <a className="text-on-surface-variant/60 flex items-center gap-3 p-4 hover:bg-white/5 hover:text-on-surface transition-colors" href="#">
          <span className="material-symbols-outlined">insights</span>
          <span className="font-label-caps text-label-caps">Match Intel</span>
        </a>
      </nav>

      {/* Social Feed Simulation */}
      <div className="px-4 space-y-4 overflow-y-auto max-h-[409px] py-4 border-t border-white/5 scrollbar-hide">
        <AnimatePresence>
          {socialFeed.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className={`glass-panel p-3 rounded-lg text-xs space-y-2 border-l-2 ${item.type === 'viral' ? 'border-primary' : 'border-secondary'}`}
            >
              <div className="flex justify-between">
                <span className="font-bold text-on-surface">{item.author}</span>
                <span className={item.type === 'viral' ? 'text-primary' : 'text-secondary'}>{item.platform}</span>
              </div>
              <p className="text-on-surface-variant">{item.text}</p>
              {item.type === 'viral' && (
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">VIRAL SURGE</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-auto px-4 space-y-1">
        <a className="text-on-surface-variant/60 flex items-center gap-3 p-2 hover:text-primary transition-colors" href="#">
          <span className="material-symbols-outlined text-sm">settings</span>
          <span className="font-label-caps text-[10px]">Settings</span>
        </a>
        <a className="text-on-surface-variant/60 flex items-center gap-3 p-2 hover:text-primary transition-colors" href="#">
          <span className="material-symbols-outlined text-sm">help</span>
          <span className="font-label-caps text-[10px]">Support</span>
        </a>
      </div>
    </motion.aside>
  );
}
