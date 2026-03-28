'use client'

/**
 * HoroscopumAd.tsx — Mockup display ad for horoscopum.com
 *
 * Styled to match the mystical/astrological aesthetic of horoscope sites.
 * Replaces one of the AdSense placeholder slots until real ads are configured.
 */

import Link from 'next/link'
import { Star } from 'lucide-react'

export function HoroscopumAd() {
  return (
    <Link
      href="https://horoscopum.com"
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-[8px] overflow-hidden group"
      aria-label="Advertisement: horoscopum.com"
    >
      <div
        className="relative flex flex-col items-center justify-between p-4 text-center select-none"
        style={{
          width: 180,
          height: 150,
          background: 'linear-gradient(135deg, #1e1040 0%, #2d1b69 50%, #1a0a3c 100%)',
        }}
      >
        {/* Stars decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { top: '8%',  left: '12%', size: 8,  opacity: 0.6 },
            { top: '15%', left: '78%', size: 6,  opacity: 0.4 },
            { top: '55%', left: '88%', size: 5,  opacity: 0.5 },
            { top: '70%', left: '8%',  size: 7,  opacity: 0.4 },
            { top: '85%', left: '55%', size: 5,  opacity: 0.3 },
          ].map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ top: s.top, left: s.left, width: s.size, height: s.size, opacity: s.opacity }}
            />
          ))}
        </div>

        {/* Moon + star icon */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-2xl leading-none" role="img" aria-label="crescent moon">🌙</span>
          <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
        </div>

        {/* Brand name */}
        <div>
          <p className="text-white font-bold text-sm tracking-tight leading-tight">
            horoscopum
            <span className="text-purple-300">.com</span>
          </p>
          <p className="text-purple-200 text-[10px] mt-0.5 leading-tight">
            Discover your destiny
          </p>
        </div>

        {/* CTA */}
        <div
          className="px-3 py-1 rounded-full text-[10px] font-semibold text-white
                     bg-purple-500 group-hover:bg-purple-400 transition-colors"
        >
          Read your horoscope →
        </div>

        {/* Ad label */}
        <p className="absolute bottom-1 right-2 text-[8px] text-purple-400 opacity-60">
          Ad
        </p>
      </div>
    </Link>
  )
}
