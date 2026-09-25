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
      <path d="M24 8c10.5 0 17 6.7 17 15.5 0 10.5-9.2 20-17 24-7.8-4-17-13.5-17-24C7 14.7 13.5 8 24 8Z" fill="#e2763c" />
      <path d="M24 14c6.4 0 10.2 3.8 10.2 8.8 0 6.3-5.7 12.3-10.2 15-4.5-2.7-10.2-8.7-10.2-15 0-5 3.8-8.8 10.2-8.8Z" fill="#fff4e6" />
      <path d="M24 15v19M19.5 19.2h9M19.5 24.2h8M19.5 29.2h6.5" stroke="#25252b" strokeWidth="2" strokeLinecap="round" />
      <path d="M28.7 29.2c2.2-1.2 3.2-2.9 3.2-4.8" fill="none" stroke="#25252b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
