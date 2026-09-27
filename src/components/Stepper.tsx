import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";

/**
 * Minus/value/plus stepper sharing the .stepper styling (used for assignment
 * minutes and rounds). Value is a display string so callers control units.
 */
export function Stepper({
  label,
  value,
  decrementLabel = "Decrease",
  incrementLabel = "Increase",
  onDecrement,
  onIncrement,
  disableDecrement = false,
  disableIncrement = false,
}: {
  /** aria-label for the group, e.g. "G major minutes". */
  label: string;
  /** Display text between the buttons, e.g. "5m" or "×3". */
  value: ReactNode;
  decrementLabel?: string;
  incrementLabel?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  disableDecrement?: boolean;
  disableIncrement?: boolean;
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={decrementLabel}
        disabled={disableDecrement}
        onClick={onDecrement}
      >
        <Minus size={14} />
      </button>
      <span>{value}</span>
      <button
        type="button"
        aria-label={incrementLabel}
        disabled={disableIncrement}
        onClick={onIncrement}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
