'use client'

/**
 * HoroscopumAd.tsx — Compact vertical ad card for horoscopum.com
 *
 * Designed for the dashboard sidebar slot: 180px wide × 150px tall.
 * Animation: a star orbits the moon in a slow circle, stars twinkle,
 * and a constellation slowly draws and redraws itself.
 */

import Link from 'next/link'
import { motion } from 'framer-motion'

const STARS = [
  { x: 10, y: 12, r: 1.2, dur: 2.4, delay: 0.0 },
  { x: 82, y: 18, r: 1.0, dur: 3.1, delay: 0.6 },
  { x: 20, y: 72, r: 1.5, dur: 2.8, delay: 1.1 },
  { x: 88, y: 65, r: 1.0, dur: 2.2, delay: 0.3 },
  { x: 15, y: 44, r: 0.8, dur: 3.5, delay: 1.8 },
  { x: 76, y: 42, r: 1.2, dur: 2.6, delay: 0.9 },
  { x: 50, y:  8, r: 0.9, dur: 3.0, delay: 1.4 },
  { x: 92, y: 85, r: 1.0, dur: 2.3, delay: 0.5 },
]

// Constellation: 5 dots connected by lines (a simple dipper shape)
const CONSTELLATION_DOTS = [
  { cx: 30, cy: 52 },
  { cx: 46, cy: 42 },
  { cx: 62, cy: 46 },
  { cx: 74, cy: 38 },
  { cx: 86, cy: 44 },
]

export function HoroscopumAd() {
  return (
    <Link
      href="https://horoscopum.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Advertisement: Discover your destiny at horoscopum.com"
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400
                 rounded-[8px] overflow-hidden"
    >
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative flex flex-col items-center justify-between
                   rounded-[8px] overflow-hidden select-none"
        style={{
          width: 180,
          height: 150,
          background: 'linear-gradient(160deg, #0d0626 0%, #1e1040 45%, #2d1b69 100%)',
        }}
      >

        {/* ── Twinkling stars ───────────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {STARS.map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2 }}
              animate={{ opacity: [0.1, 0.85, 0.1], scale: [1, 1.4, 1] }}
              transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* ── Constellation (SVG) ───────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg width="180" height="150" viewBox="0 0 180 150" fill="none">
            {/* Lines between dots */}
            {CONSTELLATION_DOTS.slice(0, -1).map((dot, i) => {
              const next = CONSTELLATION_DOTS[i + 1]
              return (
                <motion.line
                  key={i}
                  x1={dot.cx} y1={dot.cy}
                  x2={next.cx} y2={next.cy}
                  stroke="rgba(196,181,253,0.35)"
                  strokeWidth="0.8"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.6, 0.6, 0] }}
                  transition={{
                    duration: 8,
                    delay: i * 0.4,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'easeInOut',
                  }}
                />
              )
            })}
            {/* Dots */}
            {CONSTELLATION_DOTS.map((dot, i) => (
              <motion.circle
                key={i}
                cx={dot.cx} cy={dot.cy} r={1.5}
                fill="rgba(216,180,254,0.7)"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </svg>
        </div>

        {/* ── Moon + orbiting star ──────────────────────────────────────── */}
        <div className="relative flex items-center justify-center mt-5 flex-shrink-0">
          {/* Glow behind moon */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 52,
              height: 52,
              background: 'radial-gradient(circle, rgba(167,139,250,0.45) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Moon emoji */}
          <motion.span
            className="relative text-[28px] leading-none z-10"
            animate={{ rotate: [0, 6, -3, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            role="img"
            aria-label="crescent moon"
          >
            🌙
          </motion.span>
          {/* Orbiting sparkle */}
          <motion.span
            className="absolute text-[10px] leading-none pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50% 50%', marginLeft: 28 }}
          >
            ✦
          </motion.span>
        </div>

        {/* ── Brand name ────────────────────────────────────────────────── */}
        <div className="text-center mt-1 flex-shrink-0">
          <p className="text-white font-bold text-sm tracking-tight leading-tight">
            horoscopum
            <span className="text-purple-300">.com</span>
          </p>
          <p className="text-purple-200/80 text-[10px] mt-0.5">
            Discover your destiny
          </p>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <div className="mb-4 relative overflow-hidden rounded-full flex-shrink-0">
          <div
            className="px-3 py-1 rounded-full text-[10px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            Read your horoscope →
          </div>
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          />
        </div>

        {/* Ad label */}
        <p className="absolute bottom-1 right-1.5 text-[7px] text-purple-400/50 pointer-events-none">
          Ad
        </p>

      </motion.div>
    </Link>
  )
}
