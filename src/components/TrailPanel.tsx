"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ArticleData } from "@/types";
import Breadcrumb from "./Breadcrumb";
import ProximityIndicator from "./ProximityIndicator";
import Confetti from "./Confetti";

interface Props {
  title: string;
  onClose: () => void;
}

export default function TrailPanel({ title: initialTitle, onClose }: Props) {
  const [data, setData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([initialTitle]);
  const contentRef = useRef<HTMLDivElement>(null);

  const totalSteps = useRef(
    Math.floor(Math.random() * 26) + 5 // eslint-disable-line react-hooks/purity
  ).current;
  const seed = useRef(
    Math.random().toString(36).slice(2, 10) // eslint-disable-line react-hooks/purity
  ).current;

  const fetchArticle = useCallback(
    async (title: string, step: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/article?title=${encodeURIComponent(title)}&step=${step}&total=${totalSteps}&seed=${seed}`
        );
        if (!res.ok) {
          throw new Error(`Не удалось загрузить статью «${title}»`);
        }
        const articleData: ArticleData = await res.json();
        setData(articleData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки статьи"
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

  const handleRabbitClick = useCallback(
    (target: string) => {
      if (!data) return;
      const nextStep = data.currentStep + 1;

      if (nextStep > totalSteps) {
        setTrail((prev) => [...prev, target, "Кролик"]);
        fetchArticle("Rabbit", nextStep);
      } else if (data.isRabbit) {
        return;
      } else {
        setTrail((prev) => [...prev, target]);
        fetchArticle(target, nextStep);
      }
    },
    [data, totalSteps, fetchArticle]
  );

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest(".rabbit-mark-link") as HTMLElement | null;
      if (link) {
        e.preventDefault();
        const rabbitTarget = link.getAttribute("data-rabbit-target");
        if (rabbitTarget) {
          handleRabbitClick(rabbitTarget);
        }
      }
    };

    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, [handleRabbitClick]);

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
          className="absolute inset-4 md:inset-8 bg-[#1a1816] border border-stone-800/60 rounded-2xl
            shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/50 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              {data && !data.isRabbit && (
                <ProximityIndicator
                  step={data.currentStep}
                  total={data.totalSteps}
                />
              )}
              {data?.isRabbit && (
                <span className="text-2xl">🐰</span>
              )}
              <h2 className="text-stone-300 text-lg font-light truncate">
                {data?.title || "Загрузка..."}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-stone-300 transition-colors text-xl leading-none px-2"
            >
              ×
            </button>
          </div>

          {trail.length > 1 && (
            <div className="px-6 py-2 border-b border-stone-800/30 overflow-x-auto shrink-0">
              <Breadcrumb steps={trail} />
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loading && !data && !error && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-stone-600 border-t-amber-400/60 rounded-full animate-spin" />
                  <span className="text-stone-500 text-sm">
                    Идём по следу...
                  </span>
                </div>
              </div>
            )}

            {error && !data && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4 text-center">
                  <span className="text-3xl">🐾</span>
                  <p className="text-stone-400 text-sm max-w-xs">
                    {error}
                  </p>
                  <p className="text-stone-600 text-xs">
                    След потерян. Попробуйте другую тему.
                  </p>
                </div>
              </div>
            )}

            {data && (
              <motion.div
                key={data.title + data.currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  ref={contentRef}
                  className="prose prose-invert prose-stone max-w-none
                    prose-headings:font-light prose-headings:text-stone-200
                    prose-p:text-stone-400 prose-p:leading-relaxed
                    prose-a:text-stone-400 prose-a:no-underline hover:prose-a:text-stone-300
                    prose-strong:text-stone-300
                    prose-li:text-stone-400
                    [&_.rabbit-mark-wrap]:inline [&_.rabbit-mark-wrap]:relative
                    [&_.rabbit-mark-link]:text-amber-200/80 [&_.rabbit-mark-link]:cursor-pointer
                    [&_.rabbit-mark-link]:border-b [&_.rabbit-mark-link]:border-dashed
                    [&_.rabbit-mark-link]:border-amber-700/40
                    [&_.rabbit-mark-link]:transition-colors
                    hover:[&_.rabbit-mark-link]:text-amber-200
                    hover:[&_.rabbit-mark-link]:border-amber-400/60
                    [&_.rabbit-mark-icon]:text-sm [&_.rabbit-mark-icon]:ml-0.5
                    [&_.rabbit-mark-icon]:opacity-70
                    [&_.rabbit-mark-icon]:inline-block
                    [&_.mw-editsection]:hidden
                    [&_.mw-empty-elt]:hidden
                    [&_.hatnote]:text-stone-600 [&_.hatnote]:text-sm [&_.hatnote]:italic
                    [&_.infobox]:hidden
                    [&_.thumb]:my-6 [&_.thumb]:opacity-80
                    [&_.thumbinner]:bg-stone-900/50 [&_.thumbinner]:border [&_.thumbinner]:border-stone-800
                    [&_.thumbcaption]:text-stone-500 [&_.thumbcaption]:text-xs
                    [&_img]:rounded-lg
                    [&_table]:hidden
                    [&_.toc]:hidden
                    [&_.navbox]:hidden
                    [&_.reflist]:text-xs [&_.reflist]:text-stone-600
                    [&_.mw-editsection-like]:hidden"
                  dangerouslySetInnerHTML={{ __html: data.html }}
                />
              </motion.div>
            )}

            {loading && data && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-stone-600 border-t-amber-400/60 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {data?.isRabbit && (
            <div className="shrink-0 px-6 py-4 border-t border-stone-800/50 text-center">
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
