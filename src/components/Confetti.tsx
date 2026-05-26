"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
  "#f0e6d3",
  "#d4a574",
  "#a67c52",
  "#8b5e3c",
  "#c9a87c",
  "#e8d5b7",
  "#b8956a",
];

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 90 + 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 6,
    delay: Math.random() * 1.5,
    duration: Math.random() * 2 + 2,
    rotation: Math.random() * 360,
  }));
}

export default function Confetti() {
  const [visible, setVisible] = useState(true);
  const particles = useMemo(() => generateParticles(), []);

  setTimeout(() => setVisible(false), 6000);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                opacity: 1,
                y: -20,
                x: `${p.x}vw`,
                rotate: 0,
              }}
              animate={{
                opacity: [1, 1, 0],
                y: "110vh",
                rotate: p.rotation * 3,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeIn",
              }}
              className="absolute"
              style={{
                left: `${p.x}vw`,
                width: p.size,
                height: p.size * 1.4,
                backgroundColor: p.color,
                borderRadius: p.size / 4,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
