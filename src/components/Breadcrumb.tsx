"use client";

import { motion } from "framer-motion";

interface Props {
  steps: string[];
  onStepClick?: (index: number) => void;
}

export default function Breadcrumb({ steps, onStepClick }: Props) {
  if (steps.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 flex-wrap text-sm"
    >
      {steps.map((step, i) => (
        <span key={i} className="flex items-center gap-2">
          <button
            onClick={() => onStepClick?.(i)}
            className={
              i === steps.length - 1
                ? "text-amber-700 font-medium cursor-default"
                : "text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            }
            disabled={i === steps.length - 1}
          >
            {step}
          </button>
          {i < steps.length - 1 && (
            <span className="text-stone-300">→</span>
          )}
        </span>
      ))}
    </motion.div>
  );
}
