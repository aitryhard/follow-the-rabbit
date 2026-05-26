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
  const contentRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!data?.headHtml) return;

    const temp = document.createElement("div");
    temp.innerHTML = data.headHtml;
    const links = temp.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"]'
    );
    const styleEls: (HTMLLinkElement | HTMLStyleElement)[] = [];

    links.forEach((link) => {
      const clone = link.cloneNode(true) as HTMLLinkElement;
      document.head.appendChild(clone);
      styleEls.push(clone);
    });

    const inlineStyles = temp.querySelectorAll("style");
    inlineStyles.forEach((s) => {
      const clone = s.cloneNode(true) as HTMLStyleElement;
      document.head.appendChild(clone);
      styleEls.push(clone);
    });

    return () => {
      styleEls.forEach((el) => el.remove());
    };
  }, [data?.headHtml]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchArticle(initialTitle, 1);
  }, [initialTitle, fetchArticle]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRabbitClick = useCallback(
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

          <div className="flex-1 min-h-0 overflow-y-auto bg-white">
            {loading && !data && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                  <span className="text-stone-500 text-sm">
                    Идём по следу...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4 text-center px-6">
                  <span className="text-3xl">🐾</span>
                  <p className="text-stone-500 text-sm">{error}</p>
                  <p className="text-stone-400 text-xs">
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
                  className="mw-parser-output p-6
                    [&_.rabbit-mark-wrap]:inline [&_.rabbit-mark-wrap]:relative
                    [&_.rabbit-mark-link]:!text-[#b45309] [&_.rabbit-mark-link]:!cursor-pointer
                    [&_.rabbit-mark-link]:!border-b-2 [&_.rabbit-mark-link]:!border-dashed
                    [&_.rabbit-mark-link]:!border-amber-500/60
                    [&_.rabbit-mark-link]:!no-underline
                    [&_.rabbit-mark-link]:!bg-amber-50/80
                    [&_.rabbit-mark-link]:px-0.5 [&_.rabbit-mark-link]:rounded
                    hover:[&_.rabbit-mark-link]:!bg-amber-100
                    hover:[&_.rabbit-mark-link]:!border-amber-600
                    [&_.rabbit-mark-icon]:text-sm [&_.rabbit-mark-icon]:ml-0.5
                    [&_.rabbit-mark-icon]:opacity-70
                    [&_.rabbit-mark-icon]:inline-block
                    [&_.mw-editsection]:hidden
                    [&_.hatnote]:!text-stone-500 [&_.hatnote]:!text-sm
                    [&_.infobox]:!float-right [&_.infobox]:!ml-4 [&_.infobox]:!mb-4
                    [&_.thumb]:!my-4
                    [&_.toc]:!bg-stone-50 [&_.toc]:!border [&_.toc]:!border-stone-200
                    [&_.toc]:!p-4 [&_.toc]:!rounded-lg
                    [&_.navbox]:hidden
                    [&_.reflist]:!text-xs [&_.reflist]:!text-stone-500
                  "
                  dangerouslySetInnerHTML={{ __html: data.html }}
                />
              </motion.div>
            )}

            {loading && data && (
              <div className="flex justify-center py-8">
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
