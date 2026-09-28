import { useEffect, useRef, useState } from "react";
import { elapsedSeconds } from "./timer";

/**
 * Practice-session stopwatch.
 *
 * Accumulates run segments so pauses (and tab hides) don't count toward the
 * recorded time. Returns the live second count plus controls; the caller owns
 * higher-level session state (started/finished) and reads the final duration
 * with `elapsed()` after `pause()`.
 */
export function useSessionTimer() {
  const segments = useRef<Array<{ start: number; end: number }>>([]);
  const start = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  function pause() {
    if (start.current !== null) {
      segments.current.push({ start: start.current, end: performance.now() });
      start.current = null;
    }
    setRunning(false);
    setSeconds(elapsedSeconds(segments.current, null, performance.now()));
  }

  function begin() {
    start.current = performance.now();
    setRunning(true);
  }

  /** Total recorded seconds across segments, without changing timer state. */
  function elapsed() {
    return elapsedSeconds(segments.current, null, performance.now());
  }

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(
      () =>
        setSeconds(
          elapsedSeconds(segments.current, start.current, performance.now()),
        ),
      200,
    );
    const hide = () => {
      if (document.hidden) {
        if (start.current !== null) {
          segments.current.push({
            start: start.current,
            end: performance.now(),
          });
          start.current = null;
        }
        setRunning(false);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [running]);

  return { seconds, setSeconds, running, begin, pause, elapsed };
}
