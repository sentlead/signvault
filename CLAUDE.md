@AGENTS.md
@AGENTS.md

# SignVault — Instructions for Claude Code

## About This Project
SignVault is a free/freemium document signing platform (like DocuSign). The developer (Kris) is not a programmer, so write clear comments explaining what each part does. When in doubt, choose the simpler approach.

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript
- Prisma 7 + SQLite
- Tailwind CSS 4 + Framer Motion
- NextAuth v5 (magic links + Google + Apple)
- pdf-lib, react-pdf, signature_pad
- Stripe (subscriptions), Resend (emails)

## Quality Checks — Do These After EVERY Change
1. **Lint**: Run `npx eslint .` and fix any errors
2. **Build**: Run `npm run build` and make sure it completes without errors
3. **Test**: If tests exist, run them. When building new features, write tests for critical logic (API routes, plan limits, usage tracking)

Do NOT skip these steps. Catch bugs immediately, not later.

## Code Standards
- Use TypeScript throughout — no `any` types
- Every component must support dark mode via Tailwind's `dark:` variant
- Use Next.js App Router (not Pages Router)
- Write clear, well-commented code
- Keep commits clear and descriptive

## Database
- After any changes to `prisma/schema.prisma`, run `npx prisma db push`
- SQLite database is at `dev.db` (development only)

## File Structure
- `src/app/` — Pages and API routes
- `src/components/` — React components
- `src/lib/` — Shared utilities (Prisma, Stripe, emails, plans, etc.)
- `src/types/` — TypeScript type definitions
- `prisma/` — Database schema and migrations
- `public/` — Static assets
- `uploads/` — Uploaded documents (local dev only)
