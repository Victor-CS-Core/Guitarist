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
      <rect width="48" height="48" rx="15" fill="#25252b" />
      <path d="M24 8c10.5 0 17 6.7 17 15.5 0 10.5-9.2 20-17 24-7.8-4-17-13.5-17-24C7 14.7 13.5 8 24 8Z" fill="#d9793e" />
      <path d="M24 14v20M17 19h14M18.5 25h11M20 31h8" stroke="#fff4e6" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="24" cy="35.5" r="1.7" fill="#d36f54" />
    </svg>
  );
}
