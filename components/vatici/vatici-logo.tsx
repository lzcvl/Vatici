"use client"

import { useId } from "react"

interface VaticiLogoProps {
  className?: string
  height?: number
}

export function VaticiLogo({ className = "", height = 32 }: VaticiLogoProps) {
  const uid = useId().replace(/:/g, "")
  // Aspect ratio of the trimmed logo content: ~4.57:1
  const width = Math.round(height * 4.57)

  // Gradient id helper to avoid collisions when multiple logos render
  const g = (n: number) => `${uid}_vl${n}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="192 314 640 140"
      width={width}
      height={height}
      className={className}
      aria-label="VATICI"
      role="img"
    >
      <defs>
        {/* Fold gradients - white highlights to simulate paper folds on dark bg */}
        <linearGradient id={g(1)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -109.9547 -99.3115)" x1="120.196" y1="75.204" x2="100.257" y2="122.137">
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="53%" stopColor="#ffffff" stopOpacity="0.06"/>
          <stop offset="79%" stopColor="#ffffff" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.18"/>
        </linearGradient>
        <linearGradient id={g(2)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -109.9547 -99.3115)" x1="120.196" y1="75.204" x2="100.257" y2="122.137">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={g(3)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -86.5437 -99.3115)" x1="100.114" y1="122.979" x2="81.462" y2="78.636">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.4"/>
          <stop offset="24%" stopColor="#a5b4fc" stopOpacity="0.28"/>
          <stop offset="58%" stopColor="#a5b4fc" stopOpacity="0.12"/>
          <stop offset="87%" stopColor="#a5b4fc" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={g(4)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -90.0453 -99.3116)" x1="99.695" y1="74.299" x2="80.555" y2="123.910">
          <stop offset="22%" stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="47%" stopColor="#ffffff" stopOpacity="0.08"/>
          <stop offset="78%" stopColor="#ffffff" stopOpacity="0.16"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.22"/>
        </linearGradient>
        <linearGradient id={g(5)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -90.0453 -99.3116)" x1="99.695" y1="74.299" x2="80.555" y2="123.910">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.3"/>
          <stop offset="78%" stopColor="#a5b4fc" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={g(6)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -113.4564 -99.3116)" x1="118.920" y1="121.819" x2="100.460" y2="76.054">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0"/>
          <stop offset="33%" stopColor="#a5b4fc" stopOpacity="0.1"/>
          <stop offset="72%" stopColor="#a5b4fc" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.3"/>
        </linearGradient>
        <linearGradient id={g(7)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -85.4595 -80.729)" x1="98.757" y1="80.729" x2="79.028" y2="80.729">
          <stop offset="26%" stopColor="#ffffff" stopOpacity="0.22"/>
          <stop offset="46%" stopColor="#ffffff" stopOpacity="0.16"/>
          <stop offset="76%" stopColor="#ffffff" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={g(8)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -100.0006 -99.3114)" x1="100.001" y1="76.362" x2="100.001" y2="124.554">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.35"/>
          <stop offset="1.4%" stopColor="#a5b4fc" stopOpacity="0.34"/>
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={g(9)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -107.2402 -80.7292)" x1="98.223" y1="88.587" x2="108.279" y2="79.824">
          <stop offset="26%" stopColor="#ffffff" stopOpacity="0.22"/>
          <stop offset="46%" stopColor="#ffffff" stopOpacity="0.16"/>
          <stop offset="76%" stopColor="#ffffff" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={g(10)} gradientUnits="userSpaceOnUse" x1="94.079" y1="99.399" x2="120.521" y2="99.399">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.3"/>
          <stop offset="28%" stopColor="#a5b4fc" stopOpacity="0.2"/>
          <stop offset="67%" stopColor="#a5b4fc" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={g(11)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -86.7794 -99.3115)" x1="86.779" y1="79.324" x2="86.779" y2="120.082">
          <stop offset="22%" stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.06"/>
          <stop offset="79%" stopColor="#ffffff" stopOpacity="0.14"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2"/>
        </linearGradient>
        <linearGradient id={g(12)} gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1 -86.7794 -99.3115)" x1="86.779" y1="79.324" x2="86.779" y2="120.082">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.35"/>
          <stop offset="1.2%" stopColor="#a5b4fc" stopOpacity="0.34"/>
          <stop offset="87%" stopColor="#a5b4fc" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <g transform="matrix(2.7365 0 0 2.7365 512 384)">
        <g>
          {/* V */}
          <g transform="matrix(1 0 0 1 -88.2245 -0.0877)">
            <g>
              <polygon fill="currentColor" points="11.72,-25.22 0.07,6.05 -11.72,-25.22 -26.98,-25.22 -7.96,25.22 -7.07,25.22 7.3,25.22 8.19,25.22 26.98,-25.22"/>
              <g transform="matrix(1 0 0 1 9.9547 0)">
                <polygon fill={`url(#${g(1)})`} points="-17.03,25.22 -1.76,25.22 17.03,-25.22 1.76,-25.22"/>
              </g>
              <g transform="matrix(1 0 0 1 9.9547 0)">
                <polygon fill={`url(#${g(2)})`} points="-17.03,25.22 -1.76,25.22 17.03,-25.22 1.76,-25.22"/>
              </g>
              <g transform="matrix(1 0 0 1 -13.4564 0)">
                <polygon fill={`url(#${g(3)})`} points="1.74,-25.22 -13.53,-25.22 5.49,25.22 6.38,25.22 13.53,6.05"/>
              </g>
            </g>
          </g>
          {/* A */}
          <g transform="matrix(1 0 0 1 -39.7684 -0.0877)">
            <g>
              <polygon fill="currentColor" points="26.98,25.22 7.96,-25.22 7.07,-25.22 -7.3,-25.22 -8.19,-25.22 -26.98,25.22 -11.72,25.22 -0.07,-6.05 11.72,25.22"/>
              <g transform="matrix(1 0 0 1 -9.9547 0)">
                <polygon fill={`url(#${g(4)})`} points="17.03,-25.22 1.76,-25.22 -17.03,25.22 -1.76,25.22"/>
              </g>
              <g transform="matrix(1 0 0 1 -9.9547 0)">
                <polygon fill={`url(#${g(5)})`} points="17.03,-25.22 1.76,-25.22 -17.03,25.22 -1.76,25.22"/>
              </g>
              <g transform="matrix(1 0 0 1 13.4564 0)">
                <polygon fill={`url(#${g(6)})`} points="13.53,25.22 -5.49,-25.22 -6.38,-25.22 -13.53,-6.05 -1.74,25.22"/>
              </g>
            </g>
          </g>
          {/* T */}
          <g transform="matrix(1 0 0 1 3.9169 -0.0874)">
            <g>
              <polygon fill="currentColor" points="21.78,-25.22 -7.3,-25.22 -7.3,-25.22 -21.78,-25.22 -21.78,-11.95 -7.3,-11.95 -7.3,-11.95 -7.3,-11.95 -7.3,25.22 7.3,25.22 7.3,-11.95 21.78,-11.95"/>
              <g transform="matrix(1 0 0 1 -14.5404 -18.5821)">
                <polygon fill={`url(#${g(7)})`} points="-7.24,6.64 -7.24,-6.64 7.24,-6.64 7.24,6.64"/>
              </g>
              <g transform="matrix(1 0 0 1 0.0006 0.0002)">
                <polygon fill={`url(#${g(8)})`} points="-7.3,25.22 7.3,25.22 7.3,-11.95 -7.3,-25.22"/>
              </g>
              <g transform="matrix(1 0 0 1 7.2403 -18.582)">
                <polygon fill={`url(#${g(9)})`} points="14.54,-6.64 -14.54,-6.64 0.06,6.64 14.54,6.64"/>
              </g>
            </g>
          </g>
          {/* I (first) */}
          <g transform="matrix(1 0 0 1 38.196 -0.0877)">
            <g>
              <polygon fill="currentColor" points="-7.3,-25.21 -7.3,-10.6 -7.3,-7.99 -7.3,25.21 7.3,25.21 7.3,-7.99 7.3,-10.6 7.3,-25.21"/>
              <g transform="matrix(1 0 0 1 -0.0151 7.3157)">
                <rect fill={`url(#${g(8)})`} x="-7.3" y="-17.9" width="14.6" height="35.8"/>
              </g>
              <g transform="matrix(1 0 0 1 -0.0062 -17.9089)">
                <polygon fill={`url(#${g(9)})`} points="7.29,-7.29 -7.29,-7.29 7.29,7.29"/>
              </g>
              <g transform="matrix(1 0 0 1 0 -17.9026)">
                <polygon fill={`url(#${g(8)})`} points="7.32,7.32 -7.32,-7.32 -7.32,7.32"/>
              </g>
            </g>
          </g>
          {/* C */}
          <g transform="matrix(1 0 0 1 73.0734 0)">
            <g>
              <polygon fill="currentColor" points="20.52,-12.03 20.52,-25.31 -5.92,-25.31 -5.92,-25.31 -20.52,-12.03 -20.52,12.03 -5.92,25.13 -5.92,25.31 20.52,25.31 20.52,12.03 -5.92,12.03 -5.92,-12.03"/>
              <g transform="matrix(1 0 0 1 7.3 0)">
                <path fill={`url(#${g(10)})`} transform="translate(-107.3,-99.399)" d="M94.08 87.37V74.09h26.44v13.27H94.08ZM120.52 124.7v-13.27H94.08v13.27h26.44Z"/>
              </g>
              <g transform="matrix(1 0 0 1 -13.2206 -0.0874)">
                <polygon fill={`url(#${g(11)})`} points="-7.3,12.12 7.3,25.22 7.3,-25.22 -7.3,-11.95"/>
              </g>
              <g transform="matrix(1 0 0 1 -13.2206 -0.0874)">
                <polygon fill={`url(#${g(12)})`} points="-7.3,12.12 7.3,25.22 7.3,-25.22 -7.3,-11.95"/>
              </g>
            </g>
          </g>
          {/* I (second) */}
          <g transform="matrix(1 0 0 1 107.892 -0.0877)">
            <g>
              <polygon fill="currentColor" points="-7.3,-25.21 -7.3,-10.6 -7.3,-7.99 -7.3,25.21 7.3,25.21 7.3,-7.99 7.3,-10.6 7.3,-25.21"/>
              <g transform="matrix(1 0 0 1 -0.0151 7.3157)">
                <rect fill={`url(#${g(8)})`} x="-7.3" y="-17.9" width="14.6" height="35.8"/>
              </g>
              <g transform="matrix(1 0 0 1 -0.0062 -17.9089)">
                <polygon fill={`url(#${g(9)})`} points="7.29,-7.29 -7.29,-7.29 7.29,7.29"/>
              </g>
              <g transform="matrix(1 0 0 1 0 -17.9026)">
                <polygon fill={`url(#${g(8)})`} points="7.32,7.32 -7.32,-7.32 -7.32,7.32"/>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}
