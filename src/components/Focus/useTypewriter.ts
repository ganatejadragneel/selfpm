import { useEffect, useRef, useState } from 'react';

/**
 * Types a phrase out, holds it, deletes it back, and repeats.
 *
 * Used for the Seeker Title's placeholder. The prompt is an invitation, and a
 * line that writes itself reads like one — a static grey sentence reads like a
 * disabled field.
 *
 * It stops the moment the seeker has anything to say: `active: false` freezes
 * the animation and hands back the full phrase, so the caret never competes with
 * their own text or eats CPU behind a filled field. Honours
 * prefers-reduced-motion by rendering the phrase whole and never animating.
 */
export function useTypewriter(
  phrase: string,
  active: boolean,
  opts: { typeMs?: number; deleteMs?: number; holdMs?: number; restartMs?: number } = {},
): string {
  const { typeMs = 45, deleteMs = 22, holdMs = 2200, restartMs = 600 } = opts;

  const reduceMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [text, setText] = useState(active && !reduceMotion ? '' : phrase);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active || reduceMotion) {
      setText(phrase);
      return;
    }

    let cancelled = false;
    // Local, not state: driving this off React state would re-run the effect on
    // every character and restart the whole cycle.
    let i = 0;
    let deleting = false;

    const step = () => {
      if (cancelled) return;
      if (!deleting) {
        i += 1;
        setText(phrase.slice(0, i));
        if (i >= phrase.length) {
          deleting = true;
          timer.current = setTimeout(step, holdMs);
          return;
        }
        timer.current = setTimeout(step, typeMs);
      } else {
        i -= 1;
        setText(phrase.slice(0, Math.max(0, i)));
        if (i <= 0) {
          deleting = false;
          timer.current = setTimeout(step, restartMs);
          return;
        }
        timer.current = setTimeout(step, deleteMs);
      }
    };

    timer.current = setTimeout(step, restartMs);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [phrase, active, reduceMotion, typeMs, deleteMs, holdMs, restartMs]);

  return text;
}
