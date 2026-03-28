/**
 * SignVaultLogo.tsx — SVG logo mark for SignVault
 *
 * A shield with a purple-to-indigo gradient, white inner window,
 * and a pen-nib icon (blade + V chevron) inside.
 *
 * Usage:
 *   <SignVaultLogo size={32} />
 *   <SignVaultLogo size={40} className="..." />
 */

interface SignVaultLogoProps {
  size?: number
  className?: string
}

export function SignVaultLogo({ size = 32, className }: SignVaultLogoProps) {
  const h = Math.round(size * 112 / 100)
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sv-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7B6FE0" />
          <stop offset="100%" stopColor="#2E1A96" />
        </linearGradient>
      </defs>

      {/* Outer shield — gradient fill */}
      <path
        d="M21,5 H79 Q90,5 90,17 V65 Q90,95 50,110 Q10,95 10,65 V17 Q10,5 21,5 Z"
        fill="url(#sv-grad)"
      />

      {/* Inner shield — white window */}
      <path
        d="M24,14 H76 Q83,14 83,22 V63 Q83,88 50,101 Q17,88 17,63 V22 Q17,14 24,14 Z"
        fill="white"
      />

      {/* Pen nib — blade (elongated diamond) */}
      <path
        d="M50,22 C63,30 65,45 50,57 C35,45 37,30 50,22 Z"
        fill="#3B27A8"
      />

      {/* Pen nib — center slit */}
      <line
        x1="50" y1="26" x2="50" y2="53"
        stroke="white" strokeWidth="2" strokeLinecap="round"
      />

      {/* Pen nib — V chevron */}
      <path
        d="M39,59 L50,70 L61,59 L57,59 L50,66 L43,59 Z"
        fill="#3B27A8"
      />

      {/* Pen nib — stem */}
      <rect x="47" y="70" width="6" height="9" rx="2" fill="#3B27A8" />
    </svg>
  )
}
