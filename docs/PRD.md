Pulse — Product Requirements Document
MVP PRD — Weekend Build Edition
Target Persona: Tracey · The Hands-On CI Manager
Version 2.0 | March 2026

1. Problem Statement
One-liner: Solo CI practitioners in mid-size manufacturing organizations have no lightweight, structured way to manage multi-area 6S audits, track scores over time, and close action items — so sustainment fails and improvement stalls.

1.1 How the Target Audience Solves It Today
Current MethodCore LimitationPaper checklists on clipboardsGo missing; no trending; no action tracking; re-entry requiredExcel scorecardsManual, fragile, one-person bottleneck; formulas break; no workflowPhoto texts to managerUnstructured; no data capture; unsearchable; unreliableGeneric audit appsNot 6S-specific; require heavy configuration; too complex for floor use
1.2 Market & Competitor Gaps

Enterprise QMS platforms (Intelex, ETQ, MasterControl) are overbuilt, expensive, IT-dependent, and designed for compliance — not floor-level CI culture.
Generic tools (Google Forms, Microsoft Forms) have no 6S structure, no scoring logic, no trend analytics, and no action item workflow.
Spreadsheet-based systems require manual data entry, break under shared use, and produce no automated trend output.
The Gap: No purpose-built, affordable, mobile-first 6S audit tool exists for solo OE practitioners managing multiple areas without IT support.

1.3 Urgency & Quantifiable Impact

4–8 hours/month lost per practitioner to manual score consolidation and reporting
~30–50% of corrective actions from paper-based audits are never formally closed
Audit frequency drops 40–60% when the process is burdensome — leading to program decay
Zero trend data available for leadership reporting without manual reconstruction
Leadership visibility into 6S compliance is higher than ever post-pandemic; practitioners have no credible data to back up their programs


2. Solution
Value Proposition: A purpose-built 6S audit app that lets a solo CI practitioner deploy, manage, and trend audits across multiple areas in minutes — with zero IT involvement, zero Excel, and a corrective action workflow that actually closes the loop.

2.1 Detailed Solution
The app solves Tracey's three core jobs-to-be-done in a single, mobile-first tool:
Job 1 — Run Audits
Tracey (or an empowered area owner) opens the app on a phone or tablet, selects the area, and completes a guided 6S checklist with per-category scoring. Findings are captured inline with notes and optional photos. The audit is submitted in under 5 minutes with no re-entry.
Job 2 — Track Scores
Every submitted audit is automatically stored and plotted. Tracey sees a per-area score trend over time and a site-wide dashboard rollup — ready to present at any ops review with no prep work.
Job 3 — Close Actions
Every finding flagged during an audit auto-generates an assignable action item with owner, due date, and status. Area owners see their own open items. Tracey sees everything. Closed items feed back into audit history.
2.2 Key Differentiators
CapabilityPulseExcel/PaperEnterprise QMS6S-specific design✅ Yes❌ No❌ NoDeploy without IT✅ Yes✅ Yes❌ NoMulti-area trending✅ YesManual✅ YesAction item workflow✅ Yes❌ No✅ YesAffordable for SMB✅ Yes✅ Free❌ NoMobile-first for floor use✅ Yes❌ NoPartial5-min audit completion✅ Yes❌ No❌ NoAI-generated summaries & smart action items✅ Yes❌ No❌ No
2.3 Critical Assumptions

Tracey has authority to adopt a SaaS tool without a formal IT approval process
Area owners will conduct audits independently if the UX is simple enough — under 5 min, zero training
Email-based authentication is sufficient at MVP stage; SSO is a later-stage need
Cloud-hosted, browser-based deployment is acceptable (offline mode is a future feature)
A $0–$99/month price point is accessible without procurement friction for Tracey's budget
Anthropic API responses are fast enough (<3 seconds) to feel seamless post-audit submission; if latency is high, AI summary displays asynchronously after a short delay


3. Prioritized Features
Features are classified as Must Have (MVP), Nice to Have (V1.1), or Not Prioritized (V2+). Must Haves represent the smallest viable version of the product that solves Tracey's core problem. F13 and F14 are AI-powered features using the Anthropic API (Claude Sonnet) and are included as Must Haves because they integrate directly into existing MVP flows with minimal added complexity.
#Feature NameDescriptionPriorityF01User AuthenticationEmail/password sign-up, login, logout, and basic session management. Required to support multi-user access and data security.Must HaveF02Database SetupCloud database to persist users, organizations, areas, audit templates, audit records, scores, and action items. Core technical foundation.Must HaveF03Organization & Area ManagementAdmin can create an organization and add named work areas (e.g., Lab A, Warehouse, Production Floor). Each area is independently auditable.Must HaveF04Audit Template BuilderCreate a standard 6S audit checklist (one per organization) with customizable line items per 6S category (Sort, Set, Shine, Standardize, Sustain, Safety).Must HaveF05Area-Level Template CustomizationAbility to toggle on/off specific line items from the master template for individual areas (e.g., skip lab-specific items in warehouse).Must HaveF06Conduct Audit (Mobile-Friendly Form)Step-by-step guided audit form on mobile/tablet. Score each item (pass/partial/fail), add a text finding note per item. Submit when complete.Must HaveF07Audit Score CalculationAuto-calculate overall 6S score (%) upon audit submission. Store score with timestamp and area. Display score immediately post-submission.Must HaveF08Action Item Creation from FindingsAny item scored 'fail' or 'partial' auto-generates a draft action item. User can confirm, assign an owner (name/email), set due date, and save.Must HaveF09Action Item TrackerList view of all open action items by area. Show owner, due date, status (Open / In Progress / Closed). Allow status updates. Filter by area or status.Must HaveF10Per-Area Score Trend ChartLine chart showing audit scores over time for a selected area. Displays last 10 audits minimum. Simple, clean, shareable visual.Must HaveF11Site Dashboard (Score Rollup)Single-page view showing latest audit score per area, color-coded by performance (green/yellow/red). At-a-glance site status for Tracey's ops meetings.Must HaveF12Role-Based Access (Admin + Contributor)Admin (Tracey) has full access. Contributors (area owners) can conduct audits and update action items in their assigned areas only.Must HaveF13AI Audit Findings SummaryAfter an audit is submitted, the Anthropic API (Claude) reads all fail/partial findings and generates a 2–3 sentence plain-language summary. Displayed on post-submit confirmation screen and Area Detail page. Tracey can paste directly into ops meeting updates.Must HaveF14AI Smart Action Item DescriptionsWhen a finding auto-generates an action item, the Anthropic API rewrites the raw audit note into a clear, professional, actionable task description. If API fails, raw finding note is saved instead.Must HaveF15Audit History LogView a list of all past audits for an area with date, score, and auditor name. Tap to view full audit detail.Nice to HaveF16Photo Attachment on FindingsAllow user to attach a photo to a finding note during audit. Mobile camera integration required.Nice to HaveF17Email Notifications for Action ItemsSend automated email to action item owner when assigned, and a reminder when due date is approaching.Nice to HaveF18Audit Schedule / Frequency SettingSet expected audit frequency per area. Flag areas as overdue on the dashboard if no audit within the window.Nice to HaveF19PDF Export of Audit ResultsExport a completed audit as a formatted PDF for sharing with leadership.Nice to HaveF20AI Trend Insight CalloutsAI adds a one-line insight below the trend chart. Deferred to V1.1 after core AI features are validated.Not PrioritizedF21AI Monthly OE Report DraftAt month-end, AI drafts a 1-page leadership summary. High value but complex — deferred to V2.Not PrioritizedF22Multi-Site / Multi-Organization SupportSupport multiple sites under one enterprise account. Needed for Persona 1 (Marcus) but not Tracey's core use case at MVP.Not PrioritizedF23SSO / SAML IntegrationEnterprise single sign-on. Unnecessary friction for Tracey's self-service onboarding.Not Prioritized

4. Core User Journey
4.1 Logical User Flow
New Admin (Tracey): Sign Up → Create Organization → Add Areas → Build Audit Template → Invite Area Owners → Conduct First Audit → Review Dashboard
Returning Admin: Login → Dashboard → Spot underperforming area → Open Area Detail → Review trend & open actions → Conduct or assign audit
Area Owner (Contributor): Login → See their area → Tap 'Start Audit' → Complete guided form → Review auto-generated action items → Update status as work completes
4.2 Page-by-Page Breakdown
Page 1: Login / Sign-Up Page
Entry point for all users. Email/password authentication. First-time users create an account and an organization name.

F01 — User Authentication
F12 — Role assignment begins here (first user = Admin)

Page 2: Dashboard (Home)
Site-wide status at a glance. Color-coded area cards show latest score, last audit date, and overdue flag.

F11 — Site Dashboard / Score Rollup
F03 — Area list with add/manage areas
F18 (Nice to Have) — Overdue flags per area

Page 3: Area Detail Page
Drill-down for a single area. Shows trend chart, AI-generated audit summary, recent audit history, and open action items.

F10 — Per-Area Score Trend Chart
F13 — AI Audit Findings Summary (latest audit)
F15 (Nice to Have) — Audit History Log
F09 — Action Item Tracker filtered to this area

Page 4: Conduct Audit Page
Mobile-first guided audit form. On submit: score is calculated, AI summary is generated, and smart action items are created.

F06 — Conduct Audit Form (mobile-first)
F07 — Score Calculation on Submit
F13 — AI Findings Summary generated on submit
F08 — Action Item Draft Generation
F14 — AI Smart Action Item Descriptions applied automatically
F16 (Nice to Have) — Photo attachment per finding

Page 5: Action Items Page
Organization-wide action item tracker. Filter by area, status, or owner. All action item descriptions are AI-enhanced.

F09 — Action Item Tracker (full list)
F14 — AI-enhanced descriptions visible on all auto-generated items
F12 — Role-filtered view (admin sees all, contributor sees own area)
F17 (Nice to Have) — Email notification triggers

Page 6: Settings / Admin Page
Admin-only. Manage the audit template, areas, and team members.

F03 — Organization & Area Management
F04 — Audit Template Builder
F05 — Area-Level Template Customization
F02 — Database config handled transparently
F12 — Invite users and assign roles


5. Out of Scope & Limitations
5.1 What the MVP Will NOT Do

No multi-site / multi-organization support — single org only at MVP
No offline mode — requires internet connection to conduct audits
No SSO or enterprise identity management — email/password only
No PDF export of audit results
No email notifications — action item follow-up is manual at MVP
No custom scoring weights — all 6S categories weighted equally
No in-app comments or collaboration threads on action items
No API integrations (ERP, CMMS, etc.)
No audit scheduling or calendar integration
No AI trend insight callouts (F20) or AI monthly report drafts (F21) — deferred to V1.1 and V2 respectively

5.2 Manual Workarounds for MVP Gaps
MVP GapManual WorkaroundNo email notificationsTracey manually shares the action items URL with owners at weekly check-insNo PDF exportScreenshot dashboard for ops meetings; browser print-to-PDF as stopgapNo audit schedulingTracey sets calendar reminders manually; overdue status tracked by eyeNo photo attachmentsAdd finding notes with descriptive text; photos shared separately via text/emailNo offline modeConduct audits in areas with WiFi or hotspot; paper as backup if neededAI summary slow or unavailableScore and action items save immediately; AI summary displays async. If Anthropic API is down, summary is skipped gracefully — core audit flow is unaffected

6. Success Metrics
Three north-star metrics to validate product-market fit within the first 60 days post-launch:
MetricDefinition & RationaleMVP TargetAudit Completion Rate% of started audits that are submitted. Validates that the UX is simple enough for floor-level completion without abandonment.≥ 85% completion rateWeekly Active Users# of unique users conducting or updating audits/actions per week. Validates adoption beyond the admin and signals real organizational use.≥ 3 WAU within 30 days of onboardingAction Item Closure Rate% of auto-generated action items marked Closed within 30 days. Validates that the tool drives real improvement, not just data capture.≥ 50% closed within 30 days

Weekend Build Constraint: The MVP must be buildable in a single weekend using AI coding tools. All Must Have features (F01–F14) are scoped to support this timeline. F13 and F14 each require a single Anthropic API call wired into an existing flow — estimated 30–45 min each. Nice to Have and Not Prioritized features are explicitly deferred.

