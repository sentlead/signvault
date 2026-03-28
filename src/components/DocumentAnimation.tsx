'use client'

/**
 * DocumentAnimation.tsx
 *
 * A looping Framer Motion animation placed in the hero section.
 * Tells the SignVault story visually in one 10-second cycle:
 *
 *   0–2s   Document card settles in, pen cursor appears
 *   2–5s   Signature draws across the field
 *   5–6s   Checkmark pops onto the signer row, badge flips to "Signed"
 *   6–7s   Shimmer sweep plays across the card
 *   7–9s   Email envelope lifts off and flies away with confetti
 *   9–10s  Everything fades/resets for the next loop
 */

import { motion } from 'framer-motion'

const T = 10 // cycle length in seconds

/** Convert an absolute second value into a [0,1] fraction of the cycle */
const f = (s: number) => +(s / T).toFixed(4)

// ── Signature SVG path ────────────────────────────────────────────────────────
// A hand-crafted cursive stroke that fills the signature field
const SIG = 'M 12 26 C 22 8, 38 6, 50 18 C 56 26, 64 28, 72 22 C 82 14, 88 10, 100 17 C 110 23, 118 27, 128 20 C 138 13, 148 17, 158 25 C 163 29, 169 27, 174 23'

export function DocumentAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.0, ease: 'easeOut' }}
      className="relative mx-auto mt-14 w-full max-w-[400px] select-none"
      aria-hidden="true"
    >
      {/* ── Ambient glow ─────────────────────────────────────────────────── */}
      <div className="absolute inset-x-12 -bottom-4 h-12 rounded-full
                      bg-sv-primary/20 dark:bg-sv-dark-primary/20 blur-2xl pointer-events-none" />

      {/* ── Card — gently bobs up and down ───────────────────────────────── */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative rounded-2xl overflow-hidden shadow-2xl
                   bg-white dark:bg-sv-dark-surface
                   border border-sv-border dark:border-sv-dark-border"
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-3.5 flex items-center gap-3
                        border-b border-sv-border dark:border-sv-dark-border">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-sv-primary dark:bg-sv-dark-primary
                          flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-bold tracking-tight">SV</span>
          </div>
          {/* Title skeleton */}
          <div className="flex-1 min-w-0">
            <div className="h-2.5 w-32 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-1.5 w-20 rounded-full bg-slate-100 dark:bg-slate-800 mt-1.5" />
          </div>
          {/* Status badge: Pending ⟶ Signed */}
          <div className="relative flex-shrink-0 h-5 w-16">
            <motion.span
              className="absolute inset-0 flex items-center justify-center
                         px-2 rounded-full text-[10px] font-semibold whitespace-nowrap
                         bg-amber-100 dark:bg-amber-900/40
                         text-amber-700 dark:text-amber-300"
              animate={{ opacity: [1, 1, 0, 0, 1] }}
              transition={{ duration: T, repeat: Infinity,
                times: [0, f(5.2), f(6.0), f(9.5), f(T)] }}
            >
              Pending
            </motion.span>
            <motion.span
              className="absolute inset-0 flex items-center justify-center
                         px-2 rounded-full text-[10px] font-semibold whitespace-nowrap
                         bg-emerald-100 dark:bg-emerald-900/40
                         text-emerald-700 dark:text-emerald-300"
              animate={{ opacity: [0, 0, 1, 1, 0] }}
              transition={{ duration: T, repeat: Infinity,
                times: [0, f(5.8), f(6.4), f(9.5), f(T)] }}
            >
              ✓ Signed
            </motion.span>
          </div>
        </div>

        {/* ── Document body lines ───────────────────────────────────────── */}
        <div className="px-5 py-4 space-y-2">
          {[94, 100, 86, 74, 90, 58].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        {/* ── Signer row ────────────────────────────────────────────────── */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                          bg-slate-50 dark:bg-slate-800/60">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full flex-shrink-0
                            bg-gradient-to-br from-indigo-400 to-violet-500
                            flex items-center justify-center
                            text-white text-[10px] font-bold">
              JD
            </div>
            {/* Name skeleton */}
            <div className="flex-1 min-w-0">
              <div className="h-2 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-1.5 w-28 rounded-full bg-slate-100 dark:bg-slate-600 mt-1" />
            </div>
            {/* Check that pops in when signed */}
            <motion.div
              className="w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0
                         flex items-center justify-center"
              animate={{
                scale:   [0, 0, 0, 1.3, 1,   1,   0  ],
                opacity: [0, 0, 0, 1,   1,   1,   0  ],
              }}
              transition={{ duration: T, repeat: Infinity,
                times: [0, f(4.8), f(5.4), f(5.9), f(6.2), f(9.5), f(T)] }}
            >
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5"
                  stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* ── Signature field ───────────────────────────────────────────── */}
        <div className="px-5 pb-5">
          <div className="relative rounded-xl overflow-hidden
                          border border-dashed
                          border-slate-200 dark:border-sv-dark-border p-3">

            <p className="text-[10px] uppercase tracking-wide font-semibold
                          text-slate-400 dark:text-slate-500 mb-2">
              Signature
            </p>

            {/* SVG canvas for the animated signature */}
            <div className="relative h-10">
              <svg viewBox="0 0 200 40" className="w-full h-full">
                <defs>
                  <linearGradient id="svSigGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <motion.path
                  d={SIG}
                  fill="none"
                  stroke="url(#svSigGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{
                    pathLength: [0, 0, 1,    1,    1,    0   ],
                    opacity:    [0, 0, 1,    1,    1,    0   ],
                  }}
                  transition={{ duration: T, repeat: Infinity,
                    times: [0, f(2.2), f(5.0), f(6.8), f(9.5), f(T)],
                    ease: 'easeInOut' }}
                />
              </svg>

              {/* Pen tip — glides across the signature field while drawing */}
              <motion.div
                className="absolute top-0 left-0 pointer-events-none"
                animate={{
                  x:       [  0,   0,   4, 164, 164,   0],
                  y:       [ 32,  20,  14,   8,   8,  32],
                  opacity: [  0,   1,   1,   1,   0,   0],
                  rotate:  [  0,   0, -25, -25, -25,   0],
                }}
                transition={{ duration: T, repeat: Infinity,
                  times: [0, f(1.8), f(2.2), f(5.0), f(5.4), f(6.0)],
                  ease: 'easeInOut' }}
              >
                {/* Minimalist pen SVG */}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 1.5 L12.5 3.5 L4.5 11.5 L1.5 12.5 L2.5 9.5 Z"
                    fill="#6366f1" stroke="#4338ca" strokeWidth="0.5" />
                  <path d="M9 3 L11 5" stroke="#c7d2fe" strokeWidth="0.8"
                    strokeLinecap="round" />
                </svg>
              </motion.div>
            </div>

          </div>
        </div>

        {/* ── Shimmer sweep — plays during the "sending" transition ─────── */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
          }}
          animate={{ x: ['-130%', '130%', '130%'] }}
          transition={{ duration: T, repeat: Infinity,
            times: [f(6.2), f(7.0), f(T)], ease: 'easeInOut' }}
        />
      </motion.div>

      {/* ── Email envelope that lifts off ─────────────────────────────────── */}
      <motion.div
        className="absolute bottom-10 right-5 pointer-events-none"
        animate={{
          x:       [  0,   0,  55,  70],
          y:       [  0,   0, -90, -115],
          opacity: [  0,   0,   1,   0],
          scale:   [0.5, 0.5,   1, 0.8],
          rotate:  [  0,   0, -18, -22],
        }}
        transition={{ duration: T, repeat: Infinity,
          times: [0, f(6.8), f(8.0), f(9.0)], ease: 'easeOut' }}
      >
        <div className="w-10 h-8 rounded-lg shadow-lg
                        bg-sv-primary dark:bg-sv-dark-primary
                        shadow-sv-primary/40 dark:shadow-sv-dark-primary/40
                        flex items-center justify-center">
          <svg viewBox="0 0 24 18" className="w-7 h-5" fill="none">
            <rect x="1" y="1" width="22" height="16" rx="2"
              stroke="white" strokeWidth="1.5" />
            <path d="M1 4 l11 7 11-7"
              stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </motion.div>

      {/* ── Confetti burst ────────────────────────────────────────────────── */}
      {[
        { dx: -18, dy: -44, color: '#6366f1', t0: f(7.0) },
        { dx:  24, dy: -36, color: '#8b5cf6', t0: f(7.1) },
        { dx:  -6, dy: -54, color: '#ec4899', t0: f(7.15) },
        { dx:  32, dy: -48, color: '#06b6d4', t0: f(7.05) },
        { dx: -30, dy: -30, color: '#f59e0b', t0: f(7.2)  },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute bottom-14 right-8 w-2 h-2 rounded-full pointer-events-none"
          style={{ backgroundColor: dot.color }}
          animate={{
            x:       [0,     0,     dot.dx, dot.dx],
            y:       [0,     0,     dot.dy, dot.dy],
            opacity: [0,     0,     1,      0     ],
            scale:   [0,     0,     1,      0     ],
          }}
          transition={{ duration: T, repeat: Infinity,
            times: [0, dot.t0, f(8.2), f(9.0)], ease: 'easeOut' }}
        />
      ))}

    </motion.div>
  )
}
