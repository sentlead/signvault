/**
 * lib/signing-token.ts
 *
 * Utilities for creating and verifying signer JWT tokens.
 * Each token encodes: { signerId, documentId } and expires in 7 days.
 * Signed with AUTH_SECRET so they can't be forged.
 *
 * We use the `jose` library which works in both Node.js and Edge runtimes.
 */

import { SignJWT, jwtVerify } from 'jose'

// Use the same secret as NextAuth so we don't need a separate env var
const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)

/**
 * Create a signed JWT for an external signer.
 * The token encodes which signer it is and which document they should sign.
 * It expires after 7 days — if the link is not used, a new one must be sent.
 */
export async function createSigningToken(
  signerId: string,
  documentId: string
): Promise<string> {
  return new SignJWT({ signerId, documentId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret)
}

/**
 * Verify a signing token.
 * Returns the decoded payload if the token is valid and not expired.
 * Returns null if the token is invalid, expired, or tampered with.
 */
export async function verifySigningToken(
  token: string
): Promise<{ signerId: string; documentId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      signerId: payload.signerId as string,
      documentId: payload.documentId as string,
    }
  } catch {
    // Token is invalid, expired, or the signature doesn't match
    return null
  }
}
