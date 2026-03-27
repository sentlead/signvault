'use client'

/**
 * AnimatedBackground.tsx
 *
 * A decorative animated background for the Hero section.
 * Renders 4 large blurred blobs (circles) in indigo/purple tones that
 * slowly drift and pulse using Framer Motion keyframe animations.
 *
 * The blobs are positioned absolutely and sit behind all hero content
 * (z-index: -1). They use low opacity so they're subtle, not distracting.
 *
 * 'use client' is needed because Framer Motion animations run in the browser.
 */

import { motion } from 'framer-motion'

// Configuration for each blob: position, size, color, and animation params
const blobs = [
  {
    id: 1,
    // Top-left area
    className: 'top-[-10%] left-[-5%] w-[500px] h-[500px]',
    color: 'bg-sv-primary dark:bg-sv-dark-primary',
    // Animation: drift up/down and pulse size
    animate: {
      x: [0, 30, -20, 0],
      y: [0, -40, 20, 0],
      scale: [1, 1.1, 0.95, 1],
    },
    duration: 18,
  },
  {
    id: 2,
    // Top-right area
    className: 'top-[10%] right-[-10%] w-[400px] h-[400px]',
    color: 'bg-indigo-400 dark:bg-indigo-500',
    animate: {
      x: [0, -40, 20, 0],
      y: [0, 30, -20, 0],
      scale: [1, 0.9, 1.1, 1],
    },
    duration: 22,
  },
  {
    id: 3,
    // Center-bottom
    className: 'bottom-[-20%] left-[30%] w-[350px] h-[350px]',
    color: 'bg-violet-500 dark:bg-violet-600',
    animate: {
      x: [0, 25, -15, 0],
      y: [0, -25, 15, 0],
      scale: [1, 1.05, 0.98, 1],
    },
    duration: 25,
  },
  {
    id: 4,
    // Bottom-left
    className: 'bottom-[5%] left-[-8%] w-[300px] h-[300px]',
    color: 'bg-blue-400 dark:bg-blue-600',
    animate: {
      x: [0, 20, -30, 0],
      y: [0, 20, -10, 0],
      scale: [1, 1.08, 0.95, 1],
    },
    duration: 20,
  },
]

export function AnimatedBackground() {
  return (
    // Outer container: fills the parent (hero section), clips overflow, z-0
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className={`absolute rounded-full opacity-20 dark:opacity-15 blur-3xl ${blob.className} ${blob.color}`}
          animate={blob.animate}
          transition={{
            duration: blob.duration,
            repeat: Infinity,         // Loop forever
            repeatType: 'mirror',     // Smoothly reverse instead of jumping
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
