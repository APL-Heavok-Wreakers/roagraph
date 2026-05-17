import React from 'react';
import { motion } from 'framer-motion';
import { MotionGlassPanel } from './ui/GlassPanel';

export default function GeoSentimentMap() {
  return (
    <MotionGlassPanel 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-2xl overflow-hidden h-[300px] relative"
    >
      <div className="absolute top-4 left-4 z-10 bg-surface-dim/80 px-3 py-1 rounded-full border border-white/10">
        <span className="font-label-caps text-[10px] text-primary">GEOSPATIAL SENTIMENT</span>
      </div>

      {/* Decorative Map Element */}
      <div className="absolute inset-0 grayscale opacity-40 mix-blend-screen overflow-hidden">
        <img 
          className="w-full h-full object-cover" 
          alt="Map of India" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo50cMK1Wbza58hXvazzXYvuSbXDvKGcgGwmHnBVMtS2vHO4ZE2bUyMZg60lvgGSONHRKIKu3n9kKw_4_5OTagQ9jRfi_Z3-HSGw5wcduH1P2jJiM_aUg52VyRfyorVgJAhcHND7nZR8lgil7Z8Sv49Z7PMTvsV9lBoxanlcUJF09UBV0SjTG1LMLCdQ4e-cY7E0oVKWRWvIokYZc01L2wA7b4e6sbhaEXXAXdgkDu_0dzIvFOd1FKVVi-3EhyKqMR8SRq2zYAfUI"
        />
      </div>

      {/* Pulsing City Nodes */}
      <motion.div className="absolute top-1/2 left-1/4 w-3 h-3 bg-primary rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }}></motion.div>
      <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_#57f1db]"></div>
      
      <motion.div className="absolute top-[55%] left-1/3 w-3 h-3 bg-error rounded-full" animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}></motion.div>
      <div className="absolute top-[55%] left-1/3 w-3 h-3 bg-error rounded-full shadow-[0_0_10px_#ffb4ab]"></div>
      
      <motion.div className="absolute top-[70%] left-1/2 w-3 h-3 bg-secondary rounded-full" animate={{ scale: [1, 1.8, 1], opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}></motion.div>
      <div className="absolute top-[70%] left-1/2 w-3 h-3 bg-secondary rounded-full shadow-[0_0_10px_#ffb95f]"></div>

      {/* Map Overlay Stats */}
      <div className="absolute bottom-4 left-4 right-4 bg-surface-dim/90 p-3 rounded-lg border border-white/10">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold">MUMBAI</span>
          <span className="text-primary">EUPHORIC</span>
        </div>
        <div className="h-1 w-full bg-white/5 mt-1 overflow-hidden rounded-full">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "88%" }}
            transition={{ duration: 1, delay: 1 }}
            className="h-full bg-primary"
          />
        </div>
      </div>
    </MotionGlassPanel>
  );
}
