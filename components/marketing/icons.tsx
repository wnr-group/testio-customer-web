export function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" aria-hidden className={className} fill="none">
      <path d="M2 44C18 8 62 0 98 6c-6 34-42 52-72 46-10-2-18-6-24-8Z" fill="currentColor" />
      <path d="M8 44C34 30 66 16 96 8" stroke="rgb(0 0 0 / 0.18)" strokeWidth="2" />
    </svg>
  )
}
