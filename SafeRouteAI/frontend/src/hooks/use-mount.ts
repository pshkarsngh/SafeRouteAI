"use client";

import { useEffect, useRef } from "react";

export function useMount(callback: () => void) {
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      callback();
    }
  }, [callback]);
}
