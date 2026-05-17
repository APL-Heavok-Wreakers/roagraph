import React from 'react';
import { motion } from 'framer-motion';
import { StatBox } from './ui/StatBox';
import { IconButton } from './ui/IconButton';

export default function TopNavbar() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-surface-dim/80 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
    >
      <div className="flex items-center gap-6">
        <motion.span 
          whileHover={{ scale: 1.05 }}
          className="font-headline-lg text-primary tracking-tighter uppercase drop-shadow-[0_0_8px_rgba(87,241,219,0.6)]"
        >
          CROWD PULSE
        </motion.span>
        
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="font-label-caps text-[10px] text-on-surface-variant/60">MATCH STATUS</span>
            <span className="font-bold text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              LIVE: IND vs AUS
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex gap-6 border-x border-white/10 px-8">
          <StatBox label="TENSION" value="42%" valueClassName="text-secondary" />
          <StatBox 
            label="EUPHORIA" 
            value="87%" 
            valueClassName="text-primary" 
            className="w-24"
            withBar 
            barPercent={87}
            barClassName="bg-primary shadow-[0_0_8px_#57f1db]" 
          />
          <StatBox label="FRUSTRATION" value="12%" valueClassName="text-error" />
          <StatBox label="DISBELIEF" value="29%" valueClassName="text-on-tertiary-container" />
        </div>

        <div className="flex gap-4 items-center">
          <IconButton icon="analytics" className="text-primary hover:text-white" />
          <IconButton icon="sensors" className="text-primary hover:text-white" />
          <IconButton icon="notifications" className="text-primary hover:text-white" />
          
          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30">
            <img 
              alt="User Profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrXodG7_bvmuqFJuwZSXG8CCEuRqNquByYMVoiPljuXs9rBbqg-G3OA072K62F17M9Ui7gFNg9AzJ8cM_IYCi8FqEvBYSdkmlQZsMHsIf0zukUo_-sxEuorphrrZNU3muTgHhPQOlgJU9y3aVc3PaiKpAdT8MT2euBNo5XGf_QoubLylzyMB77QmN9tDgfZK3XusnojzQxp_306e4kFs77OXFmyTYpCsauH7X6jZmJbRUqfXuImh-Ay226ga2M-gNpfdQzSAygiJ4"
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
