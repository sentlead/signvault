/**
 * proxy.ts
 *
 * Next.js proxy (formerly "middleware") runs on the server before every request.
 * We use it here to protect certain routes — if the user is not logged in
 * and tries to visit a protected page, they get redirected to /login.
 *
 * Protected routes:
 *   /dashboard  — the user's home after logging in
 *   /documents  — document management
 *   /settings   — account settings
 *
 * Public routes (everyone can see them):
 *   /           — marketing homepage
 *   /login      — sign in / sign up
 *   /api/*      — API routes (NextAuth handles its own auth)
 *
 * We use the Node.js runtime (not Edge) because the auth function
 * relies on the Prisma database adapter which requires Node.js.
 */

import { auth } from "@/auth"

export default auth((req) => {
  // req.auth is the current session (null if not logged in)
  const isLoggedIn = !!req.auth

  // Check if this request is for a protected route
  const isProtected =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/documents") ||
    req.nextUrl.pathname.startsWith("/settings")

  // If the user is trying to access a protected page without being logged in,
  // redirect them to /login
  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }
})

// Tell Next.js which routes to run this middleware on.
// We skip: API routes, Next.js static files, images, and favicon.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
