"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ArticleData } from "@/types";
import Breadcrumb from "./Breadcrumb";
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
  const [pageKey, setPageKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
        const articleData: ArticleData = await res.json();
        setData(articleData);
        setPageKey((k) => k + 1);
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

  const navigateTo = useCallback(
    (target: string) => {
      if (!data || data.isRabbit) return;
      const nextStep = data.currentStep + 1;

      if (nextStep > totalSteps) {
        setTrail((prev) => [...prev, target, "Кролик"]);
        fetchArticle("Кролик", nextStep);
      } else {
        setTrail((prev) => [...prev, target]);
        fetchArticle(target, nextStep);
      }
    },
    [data, totalSteps, fetchArticle]
  );

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "rabbit-hop" && e.data?.target) {
        navigateTo(e.data.target);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [navigateTo]);

  const iframeSrc =
    data &&
    `/api/render?title=${encodeURIComponent(data.title)}&step=${data.currentStep}&total=${data.totalSteps}&seed=${seed}`;

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
          className="absolute inset-8 md:inset-16 lg:inset-24 bg-white border border-stone-300 rounded-2xl
            shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 shrink-0 gap-3 bg-white">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {data?.isRabbit && <span className="text-2xl shrink-0">🐰</span>}
              <h2 className="text-stone-800 text-base font-normal truncate">
                {data?.title || "Загрузка..."}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 transition-colors text-xl leading-none px-1 shrink-0"
            >
              ×
            </button>
          </div>

          {trail.length > 1 && (
            <div className="px-5 py-2 border-b border-stone-200 overflow-x-auto shrink-0 bg-stone-50">
              <Breadcrumb steps={trail} />
            </div>
          )}

          <div className="flex-1 min-h-0 relative bg-white">
            {loading && !data && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                  <span className="text-stone-500 text-sm">
                    Идём по следу...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="flex flex-col items-center gap-4 text-center px-6">
                  <span className="text-3xl">🐾</span>
                  <p className="text-stone-500 text-sm">{error}</p>
                  <p className="text-stone-400 text-xs">
                    След потерян. Попробуйте другую тему.
                  </p>
                </div>
              </div>
            )}

            {iframeSrc && (
              <motion.div
                key={pageKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  className="w-full h-full border-0"
                  title={data?.title || ""}
                />
              </motion.div>
            )}

            {loading && data && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {data?.isRabbit && !loading && (
            <div className="shrink-0 px-5 py-4 border-t border-stone-200 text-center bg-white">
              <Confetti />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-stone-600 text-base"
              >
                Вы нашли Кролика.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-stone-400 text-sm mt-1"
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
