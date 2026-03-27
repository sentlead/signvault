'use client'

/**
 * AdUnit.tsx — Google AdSense Ad Unit Component
 *
 * A proper AdSense component that:
 *   - Loads the AdSense script lazily (only once) via useEffect
 *   - Shows a subtle placeholder while AdSense hasn't loaded yet
 *   - Reads the publisher ID from NEXT_PUBLIC_ADSENSE_ID
 *   - Falls back gracefully when that env var is not set (shows placeholder only)
 *   - Supports light and dark mode
 *
 * Usage:
 *   <AdUnit slot="1234567890" format="auto" style={{ width: 728, height: 90 }} />
 *
 * To activate real ads:
 *   1. Sign up at https://adsense.google.com
 *   2. Set NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXX in .env
 *   3. Deploy — Google will automatically fill the ad slots
 */

import { useEffect, useRef } from 'react'

// The script src for the AdSense library
const ADSENSE_SCRIPT_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'

interface AdUnitProps {
  /** AdSense ad slot ID (from your AdSense dashboard) */
  slot: string
  /** Ad format — "auto", "horizontal", "rectangle", etc. */
  format?: string
  /** Inline style — use this to set the ad unit dimensions */
  style?: React.CSSProperties
  /** Additional CSS class names for the wrapper div */
  className?: string
}

export function AdUnit({ slot, format = 'auto', style, className = '' }: AdUnitProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID
  const adRef = useRef<HTMLModElement>(null)
  const scriptLoaded = useRef(false)

  useEffect(() => {
    // Don't try to load ads if there's no publisher ID
    if (!publisherId) return

    // Only inject the <script> tag once per page load
    if (!scriptLoaded.current) {
      const existing = document.querySelector(`script[src^="${ADSENSE_SCRIPT_SRC}"]`)
      if (!existing) {
        const script = document.createElement('script')
        script.src = `${ADSENSE_SCRIPT_SRC}?client=${publisherId}`
        script.async = true
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)
      }
      scriptLoaded.current = true
    }

    // Push the ad unit into the AdSense queue so it fills this slot
    try {
      const w = window as Window & { adsbygoogle?: unknown[] }
      w.adsbygoogle = w.adsbygoogle ?? []
      w.adsbygoogle.push({})
    } catch {
      // AdSense not ready yet — it will pick up the ins tag when it loads
    }
  }, [publisherId])

  // If there's no publisher ID, show a clearly-labelled placeholder
  if (!publisherId) {
    return (
      <div
        className={`
          flex items-center justify-center
          bg-sv-surface dark:bg-sv-dark-surface
          border border-dashed border-sv-border dark:border-sv-dark-border
          rounded-[8px] select-none
          ${className}
        `}
        style={style}
        aria-label="Advertisement placeholder"
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-[10px] font-medium tracking-widest uppercase
                        text-sv-secondary dark:text-sv-dark-secondary opacity-50">
            Advertisement
          </p>
          {style?.width && style?.height && (
            <p className="text-[10px] text-sv-secondary dark:text-sv-dark-secondary opacity-30">
              {String(style.width)} × {String(style.height)}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Real AdSense unit — the <ins> tag is how AdSense identifies ad slots
  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client={publisherId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}
