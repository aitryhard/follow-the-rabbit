"use client";

import { motion } from "framer-motion";

interface Props {
  step: number;
  total: number;
}

const STAGES = [
  { emoji: "🐾", label: "След..." },
  { emoji: "🐾🐾", label: "Больше следов..." },
  { emoji: "🥕", label: "Морковка?" },
  { emoji: "🐇", label: "Всё ближе..." },
  { emoji: "🐰", label: "Кролик рядом!" },
];

function getStage(step: number, total: number) {
  const progress = step / total;
  if (progress >= 0.95) return 4;
  if (progress >= 0.7) return 3;
  if (progress >= 0.4) return 2;
  if (progress >= 0.15) return 1;
  return 0;
}

export default function ProximityIndicator({ step, total }: Props) {
  const stage = getStage(step, total);
  const progress = Math.round((step / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 shrink-0"
    >
      <motion.span
        key={stage}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-2xl"
      >
        {STAGES[stage].emoji}
      </motion.span>

      <div className="flex flex-col">
        <span className="text-stone-500 text-xs tracking-wider uppercase">
          {STAGES[stage].label}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-24 h-1 bg-stone-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-700/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <span className="text-stone-600 text-xs tabular-nums">
            {step}/{total}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
