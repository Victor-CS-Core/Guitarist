import type { ReactNode } from "react";

/**
 * Single-select chip group: a labelled row of toggle chips sharing the
 * filter-chips styling. The selected chip gets aria-pressed + .active.
 * Options use the repo's existing { key, label } convention.
 */
export function ChipGroup<T extends string>({
  label,
  labelId,
  groupLabel,
  options,
  value,
  onChange,
}: {
  /** Visible label rendered above the chips. */
  label?: ReactNode;
  /** id applied to the label span, for aria-labelledby. */
  labelId?: string;
  /** aria-label for the group (use instead of labelId). */
  groupLabel?: string;
  options: readonly { key: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="filter-group">
      {label ? (
        <span className="filter-label" id={labelId}>
          {label}
        </span>
      ) : null}
      <div
        className="filter-chips"
        role="group"
        aria-label={groupLabel}
        aria-labelledby={labelId}
      >
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={value === o.key}
            className={value === o.key ? "active" : ""}
            title={o.title}
            onClick={() => onChange(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
