/**
 * page.tsx — Landing Page (Server Component)
 *
 * This is the main page of SignVault. It composes all the landing page
 * sections in order. Most sections are Client Components (they import
 * Framer Motion), but this file itself stays a Server Component since
 * it just imports and renders them.
 *
 * Page structure:
 *   1. Navbar         — Fixed top bar with logo + dark/light toggle
 *   2. HeroSection    — Main headline, CTA buttons, animated background
 *   3. FeaturesSection — 4 feature cards in a grid
 *   4. HowItWorksSection — 3-step process with connecting line
 *   5. AdBanner       — Placeholder for Google AdSense
 *   6. TrustSection   — Animated user counter + trust/security badges
 *   7. Footer         — Logo, links, copyright
 */

import { Navbar } from '@/components/Navbar'
import { HeroSection } from '@/components/HeroSection'
import { FeaturesSection } from '@/components/FeaturesSection'
import { HowItWorksSection } from '@/components/HowItWorksSection'
import { AdBanner } from '@/components/AdBanner'
import { TrustSection } from '@/components/TrustSection'
import { Footer } from '@/components/Footer'

export default function HomePage() {
  return (
    <>
      {/* Fixed navbar — sits on top of everything */}
      <Navbar />

      {/* Main content — flows naturally down the page */}
      <main>
        {/* 1. Hero — the first thing visitors see */}
        <HeroSection />

        {/* 2. Features — what SignVault can do */}
        <FeaturesSection />

        {/* 3. How It Works — 3-step explainer */}
        <HowItWorksSection />

        {/* 4. Ad Banner — horizontal ad unit placeholder */}
        <AdBanner />

        {/* 5. Trust — user counter and security badges */}
        <TrustSection />
      </main>

      {/* Footer */}
      <Footer />
    </>
  )
}
