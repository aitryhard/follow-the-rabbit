"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ArticleData } from "@/types";
import Breadcrumb from "./Breadcrumb";
import Confetti from "./Confetti";

interface Props {
  title: string;
  onClose: () => void;
}

export default function TrailPanel({ title: initialTitle, onClose }: Props) {
  const [rabbitMark, setRabbitMark] = useState<{
    text: string;
    target: string;
  } | null>(null);
  const [currentTitle, setCurrentTitle] = useState(initialTitle);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([initialTitle]);
  const [isRabbit, setIsRabbit] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [pageKey, setPageKey] = useState(0);

  const [totalSteps] = useState(() => Math.floor(Math.random() * 26) + 5);
  const [seed] = useState(() => Math.random().toString(36).slice(2, 10));

  const fetchArticle = useCallback(
    async (title: string, step: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/article?title=${encodeURIComponent(
            title
          )}&step=${step}&total=${totalSteps}&seed=${seed}`
        );
        if (!res.ok) {
          throw new Error(`Не удалось загрузить «${title}»`);
        }
        const data: ArticleData = await res.json();
        setRabbitMark(data.rabbitMarks[0] || null);
        setIsRabbit(data.isRabbit);
        setCurrentStep(data.currentStep);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки"
        );
      } finally {
        setLoading(false);
      }
    },
    [totalSteps, seed]
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchArticle(initialTitle, 1);
  }, [initialTitle, fetchArticle]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const goNext = useCallback(() => {
    if (!rabbitMark || isRabbit) return;

    const nextStep = currentStep + 1;

    if (nextStep > totalSteps) {
      setTrail((prev) => [...prev, rabbitMark.text, "Кролик"]);
      setCurrentTitle("Кролик");
      setPageKey((k) => k + 1);
      fetchArticle("Кролик", nextStep);
    } else {
      setTrail((prev) => [...prev, rabbitMark.text]);
      setCurrentTitle(rabbitMark.target);
      setPageKey((k) => k + 1);
      fetchArticle(rabbitMark.target, nextStep);
    }
  }, [rabbitMark, currentStep, totalSteps, isRabbit, fetchArticle]);

  const progress = totalSteps > 0 ? currentStep / totalSteps : 0;
  const trailEmoji =
    progress >= 0.9 ? "🐰" : progress >= 0.7 ? "🐇" : progress >= 0.4 ? "🥕" : "🐾";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-8 md:inset-16 lg:inset-24 bg-[#1a1816] border border-stone-800/60 rounded-2xl
            shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-800/50 shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {isRabbit && <span className="text-2xl shrink-0">🐰</span>}
              <h2 className="text-stone-300 text-base font-light truncate">
                {currentTitle}
              </h2>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {!isRabbit && rabbitMark && !loading && (
                <button
                  onClick={goNext}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                    bg-stone-800/50 border border-stone-700/40 text-stone-300 text-sm
                    hover:bg-stone-700/50 hover:border-amber-700/40 hover:text-amber-200
                    transition-colors group whitespace-nowrap"
                >
                  <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                    {trailEmoji}
                  </span>
                  <span className="max-w-[160px] truncate">
                    {rabbitMark.text}
                  </span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-stone-500 hover:text-stone-300 transition-colors text-xl leading-none px-1"
              >
                ×
              </button>
            </div>
          </div>

          {trail.length > 1 && (
            <div className="px-5 py-2 border-b border-stone-800/30 overflow-x-auto shrink-0">
              <Breadcrumb steps={trail} />
            </div>
          )}

          <div className="flex-1 min-h-0 relative">
            {loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1a1816] z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-stone-600 border-t-amber-400/60 rounded-full animate-spin" />
                  <span className="text-stone-500 text-sm">
                    Идём по следу...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1a1816] z-10">
                <div className="flex flex-col items-center gap-4 text-center px-6">
                  <span className="text-3xl">🐾</span>
                  <p className="text-stone-400 text-sm">{error}</p>
                  <p className="text-stone-600 text-xs">
                    След потерян. Попробуйте другую тему.
                  </p>
                </div>
              </div>
            )}

            <iframe
              key={pageKey}
              src={`/api/page-proxy?title=${encodeURIComponent(currentTitle)}`}
              className="w-full h-full border-0"
              title={currentTitle}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>

          {isRabbit && !loading && (
            <div className="shrink-0 px-5 py-4 border-t border-stone-800/50 text-center">
              <Confetti />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-stone-400 text-base"
              >
                Вы нашли Кролика.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-stone-600 text-sm mt-1"
              >
                {trail.length} прыжков через кроличью нору
              </motion.p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
