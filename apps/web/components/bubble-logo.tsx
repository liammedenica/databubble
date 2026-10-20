// DataBubble brand mark: three bubbles rising — the big one solid, the two
// smaller ones fading as they float up. Fill colour comes from `currentColor`
// so a parent can set `text-brand`.

export function BubbleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12"   cy="12"   r="11"  fill="currentColor" />
      <circle cx="25.5" cy="21.5" r="5.5" fill="currentColor" fillOpacity="0.7" />
      <circle cx="18"   cy="29"   r="3"   fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}
