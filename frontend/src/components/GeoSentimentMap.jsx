import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionGlassPanel } from './ui/GlassPanel';
import { cn } from '../utils/cn';

export default function GeoSentimentMap({ cityData = [] }) {
  
  // Find the city with the highest intensity to display in the overlay
  const topCity = cityData.reduce((prev, current) => 
    (prev.intensity > current.intensity) ? prev : current
  , cityData[0] || { name: 'MUMBAI', sentiment: 'EUPHORIC', intensity: 88, type: 'primary' });

  return (
    <MotionGlassPanel 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-2xl overflow-hidden flex-1 min-h-[150px] relative"
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

      {/* Animated Heatmap Nodes */}
      <AnimatePresence>
        {cityData.map(city => {
          // Map intensity to scale (0.8 to 2.5)
          const scale = 0.8 + (city.intensity / 100) * 1.7;
          
          const bgClass = city.type === 'primary' ? 'bg-primary' : city.type === 'error' ? 'bg-error' : 'bg-secondary';
          const shadowClass = city.type === 'primary' ? 'shadow-[0_0_15px_#57f1db]' : city.type === 'error' ? 'shadow-[0_0_15px_#ffb4ab]' : 'shadow-[0_0_15px_#ffb95f]';

          return (
            <div key={city.id} className="absolute" style={{ left: city.x, top: city.y, transform: 'translate(-50%, -50%)' }}>
              {/* Outer pulsing ring */}
              <motion.div 
                animate={{ scale: [scale, scale * 1.5, scale], opacity: [0.8, 0, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.5 + Math.random() }}
                className={cn("absolute inset-0 rounded-full", bgClass)}
              />
              {/* Inner glowing core */}
              <motion.div 
                layout
                animate={{ scale }}
                transition={{ type: "spring", bounce: 0.4 }}
                className={cn(
                  "relative w-3 h-3 rounded-full transition-colors duration-1000", 
                  bgClass,
                  shadowClass
                )}
              />
            </div>
          );
        })}
      </AnimatePresence>

      {/* Map Overlay Stats */}
      <div className="absolute bottom-4 left-4 right-4 bg-surface-dim/90 p-3 rounded-lg border border-white/10 z-10 transition-colors duration-500">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold">{topCity.name}</span>
          <span className={cn("transition-colors duration-500", topCity.type === 'primary' ? 'text-primary' : topCity.type === 'error' ? 'text-error' : 'text-secondary')}>{topCity.sentiment}</span>
        </div>
        <div className="h-1 w-full bg-white/5 mt-1 overflow-hidden rounded-full">
          <motion.div 
            key={topCity.id + topCity.type} // force re-animate on change
            initial={{ width: 0 }}
            animate={{ width: `${topCity.intensity}%` }}
            transition={{ duration: 1, type: 'spring' }}
            className={cn("h-full transition-colors duration-500", topCity.type === 'primary' ? 'bg-primary' : topCity.type === 'error' ? 'bg-error' : 'bg-secondary')}
          />
        </div>
      </div>
    </MotionGlassPanel>
  );
}
