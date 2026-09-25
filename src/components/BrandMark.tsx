export function BrandMark({ size = 37 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label="Guitarist soundhole logo"
    >
      <rect width="512" height="512" rx="116" fill="#26262c" />
      <circle cx="256" cy="256" r="130" fill="none" stroke="#f7f1e5" strokeWidth="30" />
      <circle cx="256" cy="256" r="96" fill="none" stroke="#e07a35" strokeWidth="16" />
      <circle cx="256" cy="256" r="78" fill="#17171c" />
    </svg>
  );
}
