// The Data Bubble brand mark — a speech bubble with 3 ascending chart bars.
// Fill colour comes from `currentColor` so the parent sets it via text-{colour}.

export function BubbleLogo({ className, bars = "#ffffff" }: { className?: string; bars?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M16 3C8.82 3 3 7.92 3 14C3 17.42 4.84 20.47 7.73 22.46L6.3 27.52C6.14 28.08 6.74 28.56 7.24 28.26L13.03 24.76C13.99 24.92 14.98 25 16 25C23.18 25 29 20.08 29 14C29 7.92 23.18 3 16 3Z"
        fill="currentColor"
      />
      <rect x="10.5" y="15" width="2.3" height="4" rx="0.6" fill={bars} />
      <rect x="14.85" y="12" width="2.3" height="7" rx="0.6" fill={bars} />
      <rect x="19.2" y="9" width="2.3" height="10" rx="0.6" fill={bars} />
    </svg>
  );
}
