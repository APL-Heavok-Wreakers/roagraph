import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function AmbientParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // vw
      y: Math.random() * 120, // vh (start a bit lower)
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * -20, // Negative delay so they are already on screen
      type: Math.random() > 0.6 ? 'primary' : 'secondary',
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-50">
      {/* Background soft glow blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 90, 0] 
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[150px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1],
          rotate: [0, -90, 0] 
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-[40%] -right-[10%] w-[40vw] h-[60vw] rounded-full bg-secondary/10 blur-[150px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[40vw] rounded-full bg-error/10 blur-[150px]"
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            opacity: 0, 
            y: `${p.y}vh`, 
            x: `${p.x}vw` 
          }}
          animate={{ 
            opacity: [0, 0.8, 0],
            y: [`${p.y}vh`, `${p.y - 30}vh`],
            x: [`${p.x}vw`, `${p.x + (Math.random() * 10 - 5)}vw`]
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            delay: p.delay,
            ease: "linear"
          }}
          className={`absolute rounded-full shadow-[0_0_8px_currentColor] ${p.type === 'primary' ? 'bg-primary text-primary' : 'bg-secondary text-secondary'}`}
          style={{ width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
}
