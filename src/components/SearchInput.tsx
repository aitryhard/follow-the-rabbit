"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

const RANDOM_STARTERS = [
  "Quantum mechanics",
  "Ancient Rome",
  "Artificial intelligence",
  "The Beatles",
  "Black hole",
  "Renaissance",
  "DNA",
  "Vincent van Gogh",
  "Chess",
  "Solar System",
];

let debounceTimer: ReturnType<typeof setTimeout>;

interface Props {
  onStartTrail: (title: string) => void;
}

export default function SearchInput({ onStartTrail }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(debounceTimer);

    if (value.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data.results);
      setLoading(false);
    }, 300);
  }, []);

  const startTrail = (title: string) => {
    onStartTrail(title);
  };

  const randomStart = () => {
    const pick = RANDOM_STARTERS[Math.floor(Math.random() * RANDOM_STARTERS.length)];
    startTrail(pick);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 1 }}
          className="text-5xl md:text-7xl font-light tracking-wide text-stone-200 mb-4"
        >
          Follow the Rabbit
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="text-stone-500 text-lg tracking-wider"
        >
          Всё в итоге ведёт к Кролику
        </motion.p>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length > 0) {
              startTrail(results[0].title);
            }
          }}
          placeholder="Введите любую тему..."
          className="w-full bg-stone-900/80 border border-stone-800 rounded-2xl px-6 py-5 text-stone-200 text-lg placeholder:text-stone-600 focus:outline-none focus:border-stone-600 transition-colors backdrop-blur-sm"
        />

        <AnimatePresence>
          {focused && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full mt-2 w-full bg-stone-900 border border-stone-800 rounded-xl overflow-hidden z-50 shadow-2xl"
            >
              {results.map((r) => (
                <button
                  key={r.pageid}
                  onClick={() => startTrail(r.title)}
                  className="w-full text-left px-6 py-4 hover:bg-stone-800/60 transition-colors border-b border-stone-800/50 last:border-0"
                >
                  <div className="text-stone-200 font-medium">{r.title}</div>
                  <div className="text-stone-500 text-sm mt-1 line-clamp-2">
                    {r.snippet}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-stone-600 border-t-stone-300 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        onClick={randomStart}
        className="mt-6 mx-auto block text-stone-500 hover:text-stone-300 text-sm tracking-wider transition-colors"
      >
        или начните случайное путешествие
      </motion.button>
    </motion.div>
  );
}
