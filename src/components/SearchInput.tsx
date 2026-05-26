"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

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

  const randomStart = async () => {
    const res = await fetch("/api/random");
    const data = await res.json();
    if (data.title) {
      startTrail(data.title);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-xl mx-auto px-4"
    >
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 1.2, ease: "easeOut" }}
          className="mb-8"
        >
          <Image
            src="/rabbitone.png"
            alt="Rabbit"
            width={200}
            height={200}
            className="animate-float select-none mx-auto"
            priority
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="text-5xl md:text-6xl font-light tracking-[0.05em] text-[#e8e4dd] mb-4"
        >
          Follow
          <br />
          the Rabbit
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 1 }}
          className="text-[#6a6560] text-base tracking-[0.15em] uppercase font-light"
        >
          Всё в итоге ведёт к Кролику
        </motion.p>
      </div>

      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
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
            className="w-full bg-[#14120e]/80 border border-[#2a2520] rounded-2xl px-6 py-4
              text-[#e8e4dd] text-base placeholder:text-[#4a4540]
              focus:outline-none focus:border-[#5a5040] focus:bg-[#1a1814]
              transition-all duration-300 backdrop-blur-sm"
          />
        </motion.div>

        <AnimatePresence>
          {focused && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 w-full bg-[#14120e] border border-[#2a2520] rounded-xl
                overflow-hidden z-50 shadow-2xl shadow-black/40"
            >
              {results.map((r) => (
                <button
                  key={r.pageid}
                  onClick={() => startTrail(r.title)}
                  className="w-full text-left px-5 py-4 hover:bg-[#1e1c18] transition-colors
                    border-b border-[#1e1c18] last:border-0"
                >
                  <div className="text-[#e8e4dd] text-sm font-medium">
                    {r.title}
                  </div>
                  <div className="text-[#5a5550] text-xs mt-1 line-clamp-2 leading-relaxed">
                    {r.snippet}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#3a3530] border-t-[#8a7050] rounded-full animate-spin" />
          </div>
        )}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        onClick={randomStart}
        className="mt-8 mx-auto block text-[#5a5550] hover:text-[#8a8070] text-sm
          tracking-[0.1em] uppercase transition-colors duration-300"
      >
        или случайное путешествие
      </motion.button>
    </motion.div>
  );
}
