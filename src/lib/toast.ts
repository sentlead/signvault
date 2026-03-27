/**
 * toast.ts — Lightweight toast notification API
 *
 * Works by dispatching a custom browser event ("signvault:toast") on the window
 * object. This means you can call toast.success(...) from ANYWHERE — server
 * actions, fetch handlers, deep components — without passing callbacks or
 * using React context.
 *
 * The ToastContainer component (in Toast.tsx) listens for these events and
 * renders the stack of notifications.
 *
 * Usage:
 *   import { toast } from '@/lib/toast'
 *   toast.success('Document deleted.')
 *   toast.error('Upload failed. Please try again.')
 *   toast.warning('This link expires in 24 hours.')
 *   toast.info('Sending signature request...')
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastPayload {
  id: string
  message: string
  variant: ToastVariant
}

/** The custom event name we dispatch on window */
const EVENT_NAME = 'signvault:toast'

/** Fire a toast notification (works anywhere in the browser) */
function dispatch(variant: ToastVariant, message: string): void {
  // Guard against SSR — window doesn't exist on the server
  if (typeof window === 'undefined') return

  const payload: ToastPayload = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message,
    variant,
  }

  window.dispatchEvent(
    new CustomEvent<ToastPayload>(EVENT_NAME, { detail: payload })
  )
}

/** The public API — import and call these anywhere */
export const toast = {
  success: (message: string) => dispatch('success', message),
  error:   (message: string) => dispatch('error',   message),
  warning: (message: string) => dispatch('warning', message),
  info:    (message: string) => dispatch('info',    message),
}

/** The event name — imported by ToastContainer to add its listener */
export { EVENT_NAME as TOAST_EVENT_NAME }
