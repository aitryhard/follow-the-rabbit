"use client";

import { motion } from "framer-motion";

interface Props {
  steps: string[];
}

export default function Breadcrumb({ steps }: Props) {
  if (steps.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 flex-wrap text-sm"
    >
      {steps.map((step, i) => (
        <span key={i} className="flex items-center gap-2">
          <span
            className={
              i === steps.length - 1
                ? "text-amber-700 font-medium"
                : "text-stone-400"
            }
          >
            {step}
          </span>
          {i < steps.length - 1 && (
            <span className="text-stone-300">→</span>
          )}
        </span>
      ))}
    </motion.div>
  );
}
