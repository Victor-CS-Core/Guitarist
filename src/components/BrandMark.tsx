export function BrandMark({ size = 37 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Guitarist sound-hole mark"
    >
      <rect width="48" height="48" rx="15" fill="currentColor" />
      <circle cx="24" cy="24" r="13.5" fill="none" stroke="#f5dfb8" strokeWidth="2" opacity=".95" />
      <circle cx="24" cy="24" r="9" fill="none" stroke="#d39a5b" strokeWidth="1.5" opacity=".8" />
      <path d="M20 17.5 30.5 24 20 30.5Z" fill="#f5dfb8" />
      <circle cx="24" cy="24" r="2.2" fill="#d36f54" />
    </svg>
  );
}
