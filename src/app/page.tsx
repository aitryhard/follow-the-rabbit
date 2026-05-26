"use client";

import { useState, useCallback } from "react";
import SearchInput from "@/components/SearchInput";
import TrailPanel from "@/components/TrailPanel";

export default function Home() {
  const [trailTitle, setTrailTitle] = useState<string | null>(null);

  const handleStartTrail = useCallback((title: string) => {
    setTrailTitle(title);
  }, []);

  const handleClose = useCallback(() => {
    setTrailTitle(null);
  }, []);

  return (
    <>
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <SearchInput onStartTrail={handleStartTrail} />
      </main>

      {trailTitle && (
        <TrailPanel title={trailTitle} onClose={handleClose} />
      )}
    </>
  );
}
