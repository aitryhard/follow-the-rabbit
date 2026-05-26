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

function buildIframeDoc(data: ArticleData): string {
  return `<!DOCTYPE html>
<html class="client-nojs vector-feature-language-in-header-enabled vector-feature-language-in-main-page-header-disabled vector-feature-sticky-header-disabled vector-feature-page-tools-pinned-disabled vector-feature-toc-pinned-clientpref-1 vector-feature-main-menu-pinned-disabled vector-feature-limited-width-clientpref-1 vector-feature-limited-width-content-enabled vector-feature-custom-font-size-clientpref-1 vector-feature-appearance-pinned-clientpref-1 vector-feature-night-mode-disabled skin-theme-clientpref-day vector-toc-not-available vector-animations-ready ve-available" lang="ru" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base href="https://ru.wikipedia.org/">
${data.headHtml}
<style>
  .rabbit-mark-wrap { display: inline; position: relative; }
  .rabbit-mark-link {
    color: #b45309 !important;
    cursor: pointer !important;
    border-bottom: 2px dashed rgba(217, 119, 6, 0.6) !important;
    text-decoration: none !important;
    background: rgba(255, 251, 235, 0.9) !important;
    padding: 0 2px !important;
    border-radius: 2px !important;
    font-weight: 600 !important;
  }
  .rabbit-mark-link:hover {
    background: #fef3c7 !important;
    border-bottom-color: #d97706 !important;
    color: #92400e !important;
  }
  .rabbit-mark-icon {
    font-size: 0.85em;
    margin-left: 1px;
    opacity: 0.7;
    display: inline-block;
  }
</style>
</head>
<body class="skin-vector skin-vector-search-vue mediawiki ltr sitedir-ltr mw-hide-empty-elt ns-0 ns-subject mw-editable page-${encodeURIComponent(data.title)} rootpage-${encodeURIComponent(data.title)} skin-vector-2022 action-view uls-dialog-sticky-hide">
<div id="mw-page-base" class="noprint"></div>
<div id="mw-head-base" class="noprint"></div>
<div id="content" class="mw-body ve-init-mw-desktopArticleTarget-targetContainer" role="main">
  <div id="bodyContent" class="vector-body">
    <div id="mw-content-text" class="mw-body-content">
      <div class="mw-content-ltr mw-parser-output" lang="ru" dir="ltr">
        ${data.html}
      </div>
    </div>
  </div>
</div>
<script>
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.rabbit-mark-link');
    if (link) {
      e.preventDefault();
      var target = link.getAttribute('data-rabbit-target');
      if (target) {
        window.parent.postMessage({ type: 'rabbit-hop', target: target }, '*');
      }
    }
  });
  document.querySelectorAll('a[href^="/wiki/"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      var title = a.getAttribute('href').replace('/wiki/', '').replace(/#.*$/, '');
      window.parent.postMessage({ type: 'rabbit-hop', target: decodeURIComponent(title) }, '*');
    });
  });
</script>
</body>
</html>`;
}

export default function TrailPanel({ title: initialTitle, onClose }: Props) {
  const [data, setData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([initialTitle]);
  const [iframeKey, setIframeKey] = useState(0);
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
        setIframeKey((k) => k + 1);
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

            {data && (
              <motion.div
                key={iframeKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={buildIframeDoc(data)}
                  className="w-full h-full border-0"
                  title={data.title}
                  sandbox="allow-scripts allow-same-origin"
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
