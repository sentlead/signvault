# SignVault — Free Online Document Signing Platform

## Project Overview

**SignVault** is a free, ad-supported web application that allows users to upload documents (PDF), place signature fields, sign them digitally, and send documents to others for signing. The product should feel premium despite being free — think "Stripe-level polish meets DocuSign functionality."

**Revenue model:** Google AdSense (non-intrusive banner and sidebar ads).
**Target audience:** Freelancers, small businesses, and individuals who need occasional document signing without a paid subscription.

---

## Tech Stack

Use the following stack. All choices are beginner-friendly, well-documented, and free/open-source:

- **Frontend:** Next.js 14+ (React) with TypeScript
- **Styling:** Tailwind CSS + Framer Motion (animations)
- **Backend/API:** Next.js API routes (built-in)
- **Database:** SQLite via Prisma ORM (simple, no external DB server needed — can migrate to PostgreSQL later)
- **Authentication:** NextAuth.js (email magic links + Google OAuth)
- **PDF handling:** pdf-lib (manipulate PDFs), react-pdf (render PDFs in browser)
- **Signature capture:** signature_pad library
- **File storage:** Local filesystem for development (can move to S3/Cloudflare R2 later)
- **Email:** Resend (free tier, 100 emails/day)
- **Deployment-ready for:** Vercel (free tier)

---

## Design System & UI Requirements

### Visual Identity

- **Design philosophy:** Minimal, modern, premium. Clean whitespace. Subtle micro-interactions. No visual clutter.
- **Font:** Inter (headings) + Inter or IBM Plex Sans (body). Use variable font weights.
- **Border radius:** Consistent 12px on cards, 8px on buttons and inputs.
- **Shadows:** Soft, layered box-shadows (no harsh drop shadows).
- **Spacing:** Generous padding. Let the UI breathe.

### Color Scheme (Light Mode)

- Background: #FAFBFC (very light cool gray)
- Surface/Cards: #FFFFFF
- Primary accent: #6366F1 (indigo)
- Primary hover: #4F46E5
- Text primary: #111827
- Text secondary: #6B7280
- Border: #E5E7EB
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444

### Color Scheme (Dark Mode)

- Background: #0B0F1A (deep navy-black)
- Surface/Cards: #141925
- Primary accent: #818CF8 (lighter indigo)
- Primary hover: #6366F1
- Text primary: #F3F4F6
- Text secondary: #9CA3AF
- Border: #1F2937
- Success: #34D399
- Warning: #FBBF24
- Error: #F87171

### Dark/Light Mode Toggle

- Smooth CSS transition (300ms) when toggling.
- Toggle button in the top navbar — use a sun/moon icon with a satisfying micro-animation.
- Persist preference in localStorage.
- Respect system preference (prefers-color-scheme) as default.

### Abstract Background

- The landing page and auth pages should have a subtle, animated abstract background.
- Use a mesh gradient or soft floating blob animation (CSS or canvas-based).
- Colors should be muted and shift subtly (use the primary accent color at low opacity).
- The background should be decorative only — never compete with content readability.
- On the dashboard/app pages, use a clean solid background instead.

### Micro-Interactions & Animations

- Button hover: gentle scale(1.02) + shadow lift.
- Page transitions: smooth fade-in (Framer Motion).
- Signature placement: drag-and-drop with snap feedback.
- Toast notifications: slide in from top-right with progress bar.
- Loading states: skeleton loaders (not spinners) everywhere.
- Modal dialogs: backdrop blur + scale-in entrance.

### Responsive Design

- Fully responsive: desktop, tablet, mobile.
- Mobile-first approach.
- Signature drawing must work on touch devices.

---

## Page Structure & Features

### 1. Landing Page (`/`)

**Purpose:** Convert visitors into users. Explain the product. Show trust.

**Layout:**
- **Hero section:** Large headline ("Sign documents for free. No tricks."), subheadline, and two CTA buttons ("Get Started — Free" and "See How It Works").
- **Abstract animated background** behind the hero.
- **Feature highlights section:** 3–4 feature cards in a grid (Upload & Sign, Send for Signature, Secure & Legal, Always Free).
- **How it works section:** 3-step visual (Upload → Sign → Done) with simple icons or illustrations.
- **Social proof / trust section:** "Trusted by X users" counter (can be placeholder initially), security badges.
- **Footer:** Links, copyright, privacy policy link, terms link.

**Ad placement:** One horizontal banner ad between "How it works" and the footer.

### 2. Authentication Pages (`/login`, `/signup`)

- Clean centered card on abstract background.
- **Sign up options:** Email magic link (primary) and "Continue with Google" button.
- **Login:** Same options.
- Smooth transition between login/signup views.
- No password fields — magic link only (simpler and more secure).

### 3. Dashboard (`/dashboard`)

**Purpose:** Central hub after login. Overview of all documents.

**Layout:**
- **Top navbar:** Logo (left), search bar (center), dark/light toggle + profile avatar/dropdown (right).
- **Sidebar (desktop):** Navigation links — Dashboard, My Documents, Sent for Signing, Templates (future), Settings.
- **Main content area:**
  - **Quick actions row:** Large "Upload & Sign" button, "Send for Signature" button.
  - **Recent documents list/grid:** Show document name, status (Draft, Awaiting Signature, Completed), date, and actions (view, delete).
  - **Status filter tabs:** All, Drafts, Awaiting, Completed.
  - **Empty state:** Friendly illustration + "Upload your first document" CTA when no documents exist.

**Ad placement:** Sidebar ad (right side on desktop, between content sections on mobile). Non-intrusive.

### 4. Document Upload & Preparation (`/documents/new`)

**Step 1 — Upload:**
- Drag-and-drop zone (large, dashed border, with hover animation).
- Also a "Browse files" button as fallback.
- Accept PDF files only (for now). Max 10MB.
- Show upload progress bar with percentage.
- File validation with clear error messages.

**Step 2 — Prepare (place signature fields):**
- **PDF viewer:** Render the uploaded PDF page by page. Scrollable. Zoomable.
- **Toolbar (left sidebar or top bar):**
  - "Signature" field — drag onto the document to place.
  - "Date" field — auto-fills with signing date.
  - "Text" field — for name, title, etc.
  - "Initials" field.
  - Each field shows who it's assigned to (color-coded if multi-party).
- **Field placement:** Click or drag a field type, then click on the PDF to place it. Fields should be resizable and draggable once placed. Click a placed field to delete or configure it.
- **Assign signers panel (if sending to others):** Add signer name + email. Assign fields to specific signers using color coding.
- **Bottom action bar:** "Continue to Sign" or "Send for Signatures" button.

### 5. Signing Experience (`/documents/[id]/sign`)

**For the document owner signing their own doc:**
- Show the PDF with highlighted signature fields.
- Click a signature field to open the signature modal.
- **Signature modal options:**
  - **Draw tab:** Canvas area to draw signature with mouse/finger. Adjustable pen thickness. Clear button.
  - **Type tab:** Type your name → render in 4–5 handwriting-style fonts. Click to select.
  - **Upload tab:** Upload an image of your signature (PNG, JPG).
- "Apply Signature" button → places the signature on the document.
- After all fields are filled: "Finish & Download" button.
- Generate the final signed PDF with signatures embedded (flattened, not editable).

**For external signers (received via email link):**
- No login required (token-based access from email link).
- Same signing experience but scoped to their assigned fields only.
- After signing: "Done! The document owner will be notified."
- Owner receives email notification + can download the completed document.

### 6. Document View (`/documents/[id]`)

- View the signed/unsigned PDF.
- **Details sidebar:** Document name, status, created date, signers list with status (signed/pending), audit trail.
- **Actions:** Download PDF, Resend reminder (if awaiting), Delete.
- Show a badge/watermark indicating "Signed via SignVault" with timestamp.

### 7. Settings Page (`/settings`)

- **Profile:** Name, email, avatar.
- **Preferences:** Default theme (light/dark/system).
- **Saved signatures:** View/delete your saved signatures.
- **Account:** Delete account option.

---

## Core Backend Features

### Document Management

- Upload PDF → store file on disk (path stored in DB).
- Create document record in DB with metadata (name, owner, status, created_at).
- Status workflow: `draft` → `awaiting_signatures` → `completed`.
- Generate signed PDF using pdf-lib (embed signature images, date fields, text fields into the PDF).
- Flatten the final PDF so signatures can't be edited.

### Signing Workflow

- **Self-sign flow:** Upload → Prepare → Sign → Download. All local to the user.
- **Send-for-signature flow:**
  1. Owner uploads and prepares document, assigns fields to signers.
  2. System sends email to each signer with a unique, time-limited signing link (JWT token, 7-day expiry).
  3. Signer clicks link → sees only their fields → signs → fields are saved.
  4. When all signers complete: status → `completed`, owner is notified, signed PDF is generated.
  5. All parties can download the final signed PDF.

### Email Notifications

Use Resend API (free tier). Send these emails:
- "You've been asked to sign a document" — to each signer, with signing link.
- "Reminder: document awaiting your signature" — manual resend by owner.
- "All parties have signed!" — to owner when complete.
- Emails should be cleanly designed HTML emails with the SignVault branding.

### Audit Trail

For each document, log:
- Document created (timestamp, by whom)
- Signature fields placed (timestamp)
- Document sent for signing (timestamp, to whom)
- Each signing event (timestamp, signer email, IP address)
- Document completed (timestamp)

Store in DB. Display on the document view page.

### Database Schema (Prisma)

```
User
  - id
  - email
  - name
  - avatarUrl (optional)
  - createdAt

Document
  - id
  - name
  - ownerId (FK → User)
  - fileUrl (path to original PDF)
  - signedFileUrl (path to final signed PDF, nullable)
  - status (draft | awaiting_signatures | completed)
  - createdAt
  - completedAt (nullable)

Signer
  - id
  - documentId (FK → Document)
  - name
  - email
  - token (unique JWT for signing link)
  - status (pending | signed)
  - signedAt (nullable)
  - signedIp (nullable)

SignatureField
  - id
  - documentId (FK → Document)
  - signerId (FK → Signer, nullable — null if owner's own field)
  - type (signature | date | text | initials)
  - pageNumber
  - x (position)
  - y (position)
  - width
  - height
  - value (the actual signature data / text, filled on signing)

AuditLog
  - id
  - documentId (FK → Document)
  - action
  - actorEmail
  - ipAddress (nullable)
  - timestamp

SavedSignature
  - id
  - userId (FK → User)
  - imageData (base64 PNG of the signature)
  - label (e.g., "My formal signature")
  - createdAt
```

---

## Ads Integration

- Use Google AdSense.
- **Ad placements (non-intrusive):**
  - Landing page: one horizontal banner between content sections.
  - Dashboard: sidebar ad on desktop / between-content on mobile.
  - Document view page: small banner below the document viewer.
- **No ads during the signing flow** — keep the signing experience clean and professional, especially for external signers.
- Ads must respect dark/light mode (use responsive ad units).
- Include an `ads.txt` file at the root for AdSense verification.

---

## Security Considerations

- All signing links use JWT tokens with 7-day expiry.
- Rate-limit API routes (especially email sending).
- Sanitize all file uploads (verify PDF MIME type, limit file size).
- Store files outside the public directory.
- Use HTTPS in production (Vercel handles this).
- Passwords are never stored — magic link auth only.
- CSRF protection via NextAuth.js built-in.

---

## Build Phases

### Phase 1: Foundation & Landing Page
Set up the Next.js project, Tailwind, dark/light mode, and build the landing page with the abstract animated background. No functionality yet — just a beautiful, responsive frontend.

### Phase 2: Authentication
Set up NextAuth.js with email magic links and Google OAuth. Build login/signup pages. Set up Prisma + SQLite database with the User model.

### Phase 3: Dashboard & Document Upload
Build the dashboard layout (sidebar, navbar, content area). Implement PDF upload with drag-and-drop. Store files and create document records in the DB.

### Phase 4: PDF Viewer & Field Placement
Render uploaded PDFs in the browser. Build the toolbar for placing signature/date/text fields. Implement drag, resize, and delete for placed fields.

### Phase 5: Self-Signing Flow
Build the signature modal (draw, type, upload). Apply signatures to fields. Generate the final signed PDF with pdf-lib. Allow download.

### Phase 6: Send-for-Signature Flow
Add signer management (name + email assignment). Send signing request emails via Resend. Build the external signer experience (token-based, no login). Handle completion and notifications.

### Phase 7: Polish & Ads
Add Google AdSense integration. Build the audit trail display. Add toast notifications, loading skeletons, empty states. Final responsive and accessibility pass.

---

## Important Notes for Claude Code

- Start each phase by confirming the file structure before writing code.
- Use TypeScript throughout — no `any` types.
- Every component should support dark mode via Tailwind's `dark:` variant.
- Use Next.js App Router (not Pages Router).
- Write clean, well-commented code. Kris is not a programmer, so comments explaining what each part does are essential.
- Test each feature before moving to the next phase.
- When in doubt, choose the simpler approach. This is an MVP.
- Commit messages should be clear and describe what was built.
