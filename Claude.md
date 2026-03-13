# Pulse — Claude Code Project Bible

## What We're Building
Pulse is a 6S audit tracking and continuous improvement app for Operational 
Excellence and CI teams in manufacturing, biotech, and life sciences. It helps 
solo OE practitioners run structured workplace audits, track scores over time, 
and close corrective actions — without paper, spreadsheets, or chasing people.

Full PRD is in docs/PRD.md — reference it for feature details, priorities, 
and user journey. Build plan is in docs/BUILD_PLAN.md.

---

## Target Persona
**Tracey — The Hands-On CI Manager**
- Solo OE practitioner managing 6+ departments
- Needs simplicity above everything — if it's not intuitive, her team won't use it
- Primary jobs-to-be-done: run audits, track scores, close actions
- Non-negotiable: a floor-level area owner must be able to complete an audit 
  in under 5 minutes with zero training

---

## Tech Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend & Database:** Supabase (Postgres, Auth, Row Level Security)
- **Email:** Resend
- **AI:** Anthropic API (Claude Sonnet) — claude-sonnet-4-20250514
- **Deployment:** Vercel
- **Charts:** Recharts
- **Date handling:** date-fns

---

## Project Structure
```
pulseapp/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth routes (login, signup)
│   ├── (dashboard)/        # Protected app routes
│   ├── api/                # API routes (Resend, Anthropic)
│   └── page.tsx            # Landing page
├── components/             # Reusable UI components
│   ├── ui/                 # Base components (buttons, cards, inputs)
│   └── [feature]/          # Feature-specific components
├── lib/                    # Utilities and helpers
│   ├── supabase/           # Supabase client setup
│   └── utils.ts            # Shared utilities
├── docs/                   # PRD and build plan reference
├── public/                 # Static assets
└── CLAUDE.md               # This file
```

---

## Database — Supabase Tables
Core tables and their purpose:

| Table | Purpose |
|---|---|
| `organizations` | Top-level org per admin user |
| `areas` | Work areas within an org (Lab A, Warehouse, etc.) |
| `audit_templates` | Master 6S checklist per org |
| `template_items` | Line items within a template, grouped by 6S category |
| `area_template_items` | Per-area toggle overrides (is_active boolean) |
| `audits` | Individual audit records (area, date, auditor) |
| `audit_item_scores` | Score per item per audit (pass/partial/fail + note) |
| `action_items` | Corrective actions generated from findings |

**Always enable RLS on every table.**
Users must only ever see data belonging to their own organization.
Never query without respecting org_id scoping.

---

## Authentication & Roles
- Auth provider: Supabase Auth (email/password)
- Two roles: `admin` and `contributor`
- Store role in Supabase `user_metadata` or a `profiles` table
- **Admin (Tracey):** full access to all areas, template builder, settings, 
  all action items
- **Contributor (area owner):** can conduct audits and update action items 
  in their assigned areas only
- Protect all app routes via `middleware.ts`
- Use `createServerComponentClient` for server components
- Use `createClientComponentClient` for client components
- Never mix server and client Supabase clients

---

## Color Palette
Always use these exact hex values — do not substitute:
```css
--navy:         #2D3272;   /* primary text, headings, navbar */
--blue:         #2D8FBF;   /* primary buttons, links, active states */
--sky:          #5BB8D4;   /* backgrounds, section fills, hover states */
--yellow:       #F5D800;   /* accent only — CTAs, highlights, badges */
--teal:         #2DA870;   /* success, checkmarks, feature icons */
--slate:        #5B7FA6;   /* muted text, borders, dividers */
--white:        #FFFFFF;   /* page background, cards */
--dark-navy:    #252850;   /* body copy, secondary headings */
```

Yellow (#F5D800) is an accent only — use sparingly on CTAs and hover 
states. Do not use as a background color for large areas.

---

## Terminology — Always Use These Terms
Consistent naming matters for the codebase and the UI:

| Use this | Not this |
|---|---|
| `area` | location, zone, department |
| `audit` | inspection, check, review |
| `finding` | defect, issue, problem |
| `action item` | task, ticket, corrective action |
| `score` | grade, rating, result |
| `template` | form, checklist, questionnaire |
| `organization` | company, account, tenant |
| `contributor` | user, member, operator |

---

## AI Features (Anthropic API)
Two AI features are Must Have for MVP:

**F13 — AI Audit Findings Summary**
- Trigger: immediately after audit submission
- Input: all fail/partial findings with notes for that audit
- Output: 2–3 sentence plain-language summary of the audit
- Display: post-submit confirmation screen + Area Detail page
- Model: claude-sonnet-4-20250514
- The audit must save successfully regardless of whether the AI call 
  succeeds — handle API errors gracefully, show summary as optional

**F14 — AI Smart Action Item Descriptions**
- Trigger: when action items are auto-generated from findings
- Input: raw finding note from the audit form
- Output: clear, professional, actionable task description
- Example: "workbench messy" → "Remove non-essential items from Workbench 3 
  and establish a designated storage location for shared tools"
- Apply transformation before saving action items to Supabase
- If API call fails, save the raw finding note as the description instead

**API setup:**
- API key in .env.local as ANTHROPIC_API_KEY
- Never expose the API key client-side
- Always call Anthropic API from a Next.js API route (server-side only)

---

## Key Rules — Always Follow These

**Simplicity first**
- Every UI decision should ask: "Could a non-Lean warehouse manager use 
  this in under 5 minutes with zero training?"
- Prefer fewer fields, fewer steps, fewer clicks
- Empty states must always have a helpful message and a clear CTA

**Mobile first**
- The audit form especially must be thumb-friendly
- Large tap targets (min 44px), no tiny radio buttons
- Test every page at 390px width (iPhone viewport)

**Never do these:**
- Never use localStorage or sessionStorage (not supported in this environment)
- Never expose API keys client-side
- Never query Supabase without org_id scoping
- Never mix server and client Supabase clients
- Never build a feature that isn't in the PRD without asking first
- Never use inline styles when a Tailwind class exists

**Error handling**
- Every Supabase query needs try/catch
- RLS errors (403) should show a friendly "You don't have access" message
- Network failures on audit submit should preserve the user's responses
- AI API failures should degrade gracefully — never block core functionality

**Code quality**
- TypeScript strict mode — no `any` types
- Components under 200 lines — split if longer
- API routes in app/api/ — never call Anthropic or Resend client-side
- Use Tailwind utility classes — no custom CSS unless absolutely necessary

---

## Build Order — Follow the PRD Priority
Build Must Have features (F01–F14) in this order:

1. F01 — User Authentication
2. F02 — Database Setup (Supabase schema)
3. F03 — Organization & Area Management
4. F04 — Audit Template Builder
5. F05 — Area-Level Template Customization
6. F06 — Conduct Audit (mobile-friendly form)
7. F07 — Audit Score Calculation
8. F08 — Action Item Creation from Findings
9. F09 — Action Item Tracker
10. F10 — Per-Area Score Trend Chart
11. F11 — Site Dashboard (Score Rollup)
12. F12 — Role-Based Access
13. F13 — AI Audit Findings Summary
14. F14 — AI Smart Action Item Descriptions

Complete each feature fully and confirm it works before moving to the next.
Ask before making any decisions that affect the database schema.
Nice to Have features (F15–F19) are explicitly deferred — do not build them 
unless asked.

---

## Environment Variables
Required in .env.local:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
ANTHROPIC_API_KEY=
```

Never commit .env.local — it is in .gitignore.