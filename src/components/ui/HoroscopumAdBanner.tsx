'use client'

/**
 * HoroscopumAdBanner.tsx — Full-width leaderboard banner for horoscopum.com
 *
 * Used in AdBanner (homepage). Wide format (~90px tall, full width).
 * Deep space aesthetic: twinkling stars, shooting star, drifting zodiac
 * symbols, pulsing moon glow, shimmer CTA.
 */

import Link from 'next/link'
import { motion } from 'framer-motion'

const STARS = [
  { x:  4, y: 20, r: 1.5, dur: 2.1, delay: 0.0 },
  { x: 10, y: 65, r: 1.0, dur: 3.4, delay: 0.7 },
  { x: 16, y: 35, r: 2.0, dur: 2.8, delay: 1.2 },
  { x: 22, y: 78, r: 1.2, dur: 2.3, delay: 0.3 },
  { x: 28, y: 15, r: 1.0, dur: 3.1, delay: 1.8 },
  { x: 34, y: 55, r: 1.5, dur: 2.6, delay: 0.5 },
  { x: 40, y: 30, r: 1.0, dur: 3.8, delay: 2.1 },
  { x: 47, y: 70, r: 2.0, dur: 2.2, delay: 0.9 },
  { x: 54, y: 18, r: 1.2, dur: 3.5, delay: 1.5 },
  { x: 60, y: 82, r: 1.0, dur: 2.9, delay: 0.2 },
  { x: 66, y: 42, r: 1.8, dur: 2.4, delay: 1.1 },
  { x: 72, y: 58, r: 1.0, dur: 3.2, delay: 0.6 },
  { x: 78, y: 25, r: 1.5, dur: 2.7, delay: 1.9 },
  { x: 84, y: 72, r: 1.2, dur: 2.0, delay: 0.4 },
  { x: 90, y: 38, r: 1.0, dur: 3.6, delay: 1.3 },
  { x: 95, y: 60, r: 1.8, dur: 2.5, delay: 0.8 },
]

const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

export function HoroscopumAdBanner() {
  return (
    <Link
      href="https://horoscopum.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Advertisement: Discover your destiny at horoscopum.com"
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400
                 rounded-[12px] overflow-hidden"
    >
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative w-full overflow-hidden rounded-[12px] select-none"
        style={{
          height: 90,
          background: 'linear-gradient(100deg, #0d0626 0%, #1e1040 35%, #2d1b69 65%, #1a0a3c 100%)',
        }}
      >

        {/* Twinkling star field */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {STARS.map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2 }}
              animate={{ opacity: [0.15, 0.9, 0.15], scale: [1, 1.3, 1] }}
              transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* Shooting star */}
        <motion.div
          className="absolute pointer-events-none"
          style={{ top: '22%', left: 0 }}
          animate={{ x: ['-5%', '110%'], opacity: [0, 1, 1, 0], scaleX: [0.5, 1, 1, 0.5] }}
          transition={{ duration: 1.2, delay: 1.5, repeat: Infinity, repeatDelay: 5.5, ease: 'easeIn' }}
        >
          <div
            className="rounded-full"
            style={{
              width: 60,
              height: 1.5,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
              boxShadow: '0 0 6px 1px rgba(200,180,255,0.6)',
            }}
          />
        </motion.div>

        {/* Drifting zodiac symbols */}
        {ZODIAC.slice(0, 5).map((symbol, i) => (
          <motion.span
            key={i}
            className="absolute text-purple-300/20 font-serif pointer-events-none"
            style={{ fontSize: 18 + (i % 3) * 4, left: `${8 + i * 18}%`, top: i % 2 === 0 ? '8%' : '55%' }}
            animate={{ y: [0, -6, 0], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 4 + i * 0.7, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {symbol}
          </motion.span>
        ))}

        {/* Main content */}
        <div className="relative h-full flex items-center gap-5 px-6 z-10">

          {/* Moon with pulsing glow */}
          <div className="relative flex-shrink-0">
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 48, height: 48,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)',
              }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              className="relative text-3xl leading-none"
              animate={{ rotate: [0, 8, -4, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              role="img" aria-label="crescent moon"
            >
              🌙
            </motion.span>
          </div>

          {/* Brand copy */}
          <div className="flex-shrink-0">
            <p className="text-white font-bold text-lg leading-tight tracking-tight">
              horoscopum<span className="text-purple-300">.com</span>
            </p>
            <p className="text-purple-200 text-xs leading-snug">
              ✦ Discover what the stars have in store for you
            </p>
          </div>

          <div className="hidden sm:block w-px h-10 bg-purple-500/30 flex-shrink-0 mx-1" />

          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {['♈ Aries', '♍ Virgo', '♓ Pisces'].map((sign) => (
              <span key={sign} className="text-purple-200/70 text-xs">{sign}</span>
            ))}
            <span className="text-purple-400/50 text-xs">+9 more</span>
          </div>

          <div className="flex-1" />

          {/* CTA with shimmer */}
          <div className="relative flex-shrink-0 overflow-hidden rounded-full">
            <div
              className="px-5 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                boxShadow: '0 0 16px rgba(139,92,246,0.5)',
              }}
            >
              Read your horoscope →
            </div>
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
            />
          </div>

        </div>

        <p className="absolute bottom-1 right-2 text-[8px] text-purple-400/50 pointer-events-none">
          Ad
        </p>

      </motion.div>
    </Link>
  )
}
