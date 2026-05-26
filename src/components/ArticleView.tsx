"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { ArticleData } from "@/types";
import Breadcrumb from "./Breadcrumb";
import ProximityIndicator from "./ProximityIndicator";
import Confetti from "./Confetti";

interface Props {
  data: ArticleData;
  seed: string;
}

export default function ArticleView({ data, seed }: Props) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [trail, setTrail] = useState<string[]>(() => {
    if (typeof window === "undefined") return [data.title];

    try {
      const stored = sessionStorage.getItem(`trail-${seed}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.includes(data.title)) {
          return [...parsed, data.title];
        }
        return parsed;
      }
    } catch {
      // ignore
    }

    return [data.title];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(`trail-${seed}`, JSON.stringify(trail));
    } catch {
      // ignore
    }
  }, [trail, seed]);

  const handleRabbitClick = useCallback(
    (target: string) => {
      const nextStep = data.currentStep + 1;
      const isLastStep = nextStep >= data.totalSteps;

      if (isLastStep) {
        const newTrail = [...trail, target, "Rabbit"];
        setTrail(newTrail);
        router.push(
          `/?title=Rabbit&step=${nextStep + 1}&total=${data.totalSteps}&seed=${seed}`
        );
      } else {
        const newTrail = [...trail, target];
        setTrail(newTrail);
        router.push(
          `/?title=${encodeURIComponent(target)}&step=${nextStep}&total=${data.totalSteps}&seed=${seed}`
        );
      }
    },
    [data.currentStep, data.totalSteps, seed, router, trail]
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

  const startNewTrail = () => {
    try {
      sessionStorage.removeItem(`trail-${seed}`);
    } catch {
      // ignore
    }
    router.push("/");
  };

  return (
    <AnimatePresence>
      <motion.div
        key={data.title + data.currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-3xl mx-auto"
      >
        <header className="mb-10 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <motion.h1
                layout
                className="text-3xl md:text-4xl font-light text-stone-200 mb-2"
              >
                {data.title}
              </motion.h1>
              {!data.isRabbit && (
                <p className="text-stone-600 text-sm">
                  {data.rabbitMarks.length} rabbit{" "}
                  {data.rabbitMarks.length === 1 ? "mark" : "marks"} hidden in
                  this article
                </p>
              )}
            </div>

            {!data.isRabbit && (
              <ProximityIndicator
                step={data.currentStep}
                total={data.totalSteps}
              />
            )}
          </div>

          <Breadcrumb steps={trail} />
        </header>

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

        {data.isRabbit && <Confetti />}

        <footer className="mt-16 pt-8 border-t border-stone-800/50 flex justify-between items-center">
          {data.isRabbit ? (
            <div className="text-center w-full">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-stone-500 text-lg"
              >
                You found the Rabbit.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-stone-600 text-sm mt-2"
              >
                {trail.length - 1} hops through the rabbit hole
              </motion.p>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                onClick={startNewTrail}
                className="mt-6 px-6 py-2 rounded-full border border-stone-700 text-stone-400
                  hover:border-stone-500 hover:text-stone-200 transition-colors text-sm"
              >
                Follow another trail
              </motion.button>
            </div>
          ) : (
            <>
              <p className="text-stone-600 text-xs">
                Step {data.currentStep} of {data.totalSteps}
              </p>
            </>
          )}
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
