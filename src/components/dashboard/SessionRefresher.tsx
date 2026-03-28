'use client'

/**
 * SessionRefresher — forces a NextAuth JWT refresh and reloads the page.
 *
 * Used after a Stripe upgrade so the session picks up the new plan value
 * without requiring the user to manually sign out and back in.
 *
 * Renders nothing visible. Just runs the refresh on mount then removes
 * the ?upgraded=1 param from the URL.
 */

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function SessionRefresher() {
  const { update } = useSession()
  const router = useRouter()

  useEffect(() => {
    async function refresh() {
      // Force NextAuth to re-fetch the user's plan from the DB into the JWT
      await update()
      // Remove ?upgraded=1 from the URL and do a hard reload so the
      // server component re-renders with the fresh session plan value
      window.location.replace('/dashboard')
    }
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
