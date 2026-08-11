"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import Preloader from "./Preloader";

const MarkReadyContext = createContext<() => void>(() => {});

export const useMarkReady = () => useContext(MarkReadyContext);

interface Props {
  children: ReactNode;
}

export default function PreloaderProvider({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const markReady = useCallback(() => setReady(true), []);

  const handleComplete = useCallback(() => setLoading(false), []);

  return (
    <>
      {loading && <Preloader ready={ready} onComplete={handleComplete} />}

      <MarkReadyContext.Provider value={markReady}>
        {children}
      </MarkReadyContext.Provider>
    </>
  );
}
