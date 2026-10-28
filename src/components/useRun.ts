import { useEffect, useRef, useState } from "react";

/**
 * Plays a modelled run as a share from 0 to 1 over a few real seconds, or
 * jumps to the end when the reader prefers reduced motion.
 */
export function useRun(animationMs = 2_600) {
  // Share of the modelled duration shown; null before the first run.
  const [share, setShare] = useState<number | null>(null);
  const [ran, setRan] = useState(false);
  const frame = useRef(0);
  const stop = () => cancelAnimationFrame(frame.current);
  useEffect(() => stop, []);

  const run = () => {
    stop();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShare(1);
      setRan(true);
      return;
    }
    const start = performance.now();
    const tick = (time: number) => {
      const next = Math.min((time - start) / animationMs, 1);
      setShare(next);
      if (next < 1) frame.current = requestAnimationFrame(tick);
      else setRan(true);
    };
    setShare(0);
    frame.current = requestAnimationFrame(tick);
  };
  const reset = () => {
    stop();
    setShare(null);
    setRan(false);
  };
  return {
    share,
    ran,
    running: share !== null && share < 1,
    run,
    reset,
  };
}
