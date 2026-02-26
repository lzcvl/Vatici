export function OrigamiBird({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <polygon points="4,36 24,8 44,36" fill="currentColor" opacity="0.3" />
      <polygon points="4,36 24,8 24,36" fill="currentColor" opacity="0.6" />
      <polygon points="24,8 44,36 34,24" fill="currentColor" opacity="0.9" />
      <polygon points="4,36 24,36 14,28" fill="currentColor" opacity="0.45" />
    </svg>
  )
}

export function OrigamiDiamond({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <polygon points="16,2 30,16 16,30 2,16" fill="currentColor" opacity="0.3" />
      <polygon points="16,2 30,16 16,16" fill="currentColor" opacity="0.6" />
      <polygon points="16,2 2,16 16,16" fill="currentColor" opacity="0.45" />
      <polygon points="2,16 16,30 16,16" fill="currentColor" opacity="0.35" />
      <polygon points="30,16 16,30 16,16" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

export function OrigamiStar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="currentColor" opacity="0.3" />
      <polygon points="16,2 20,12 16,16 12,12" fill="currentColor" opacity="0.7" />
      <polygon points="20,12 30,12 22,19 16,16" fill="currentColor" opacity="0.5" />
      <polygon points="22,19 25,30 16,23 16,16" fill="currentColor" opacity="0.85" />
      <polygon points="16,23 7,30 10,19 16,16" fill="currentColor" opacity="0.4" />
      <polygon points="10,19 2,12 12,12 16,16" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

export function OrigamiArrowUp({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <polygon points="12,2 22,18 12,14" fill="currentColor" opacity="0.8" />
      <polygon points="12,2 2,18 12,14" fill="currentColor" opacity="0.5" />
      <polygon points="2,18 22,18 12,22" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

export function OrigamiArrowDown({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <polygon points="12,22 22,6 12,10" fill="currentColor" opacity="0.8" />
      <polygon points="12,22 2,6 12,10" fill="currentColor" opacity="0.5" />
      <polygon points="2,6 22,6 12,2" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

export function OrigamiCrane({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      {/* Body */}
      <polygon points="20,40 32,16 44,40" fill="currentColor" opacity="0.35" />
      <polygon points="20,40 32,16 32,40" fill="currentColor" opacity="0.6" />
      <polygon points="32,16 44,40 32,40" fill="currentColor" opacity="0.8" />
      {/* Left wing */}
      <polygon points="20,40 4,32 16,28" fill="currentColor" opacity="0.5" />
      <polygon points="20,40 16,28 26,32" fill="currentColor" opacity="0.7" />
      {/* Right wing */}
      <polygon points="44,40 60,32 48,28" fill="currentColor" opacity="0.5" />
      <polygon points="44,40 48,28 38,32" fill="currentColor" opacity="0.7" />
      {/* Tail */}
      <polygon points="28,40 36,40 32,52" fill="currentColor" opacity="0.45" />
    </svg>
  )
}
