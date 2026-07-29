# MonetizeMate — Code Review Document

This document explains how the application is built and how it actually behaves at
runtime, so a reviewer doesn't have to reverse-engineer the flow from scratch. It
covers the backend architecture, the authentication flow, the monetization
recommendation engine (the core feature), the AI assistant ("Vessa"), the admin
analytics dashboard, and known risk areas worth a closer look.

---

## 1. Tech Stack & Repo Layout

| Layer | Stack |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui components, Recharts, `html2pdf.js`, `papaparse` |
| Backend | FastAPI (Python), SQLAlchemy ORM, PostgreSQL (via `DATABASE_URL`), JWT auth (`python-jose`), `passlib`/`pbkdf2_sha256` for password hashing |
| AI | Groq API (OpenAI-compatible `/chat/completions`) — models `llama-3.1-8b-instant` (concierge/chat) and `openai/gpt-oss-120b` (questionnaire + recommendation generation) |
| Repo | Two top-level folders: `MonetizeMate-Frontend/` and `MonetizeMate-Backend/`, one git repo |

Frontend talks to the backend **through Next.js API routes** (`app/api/**/route.ts`),
never directly from the browser. Each route reads the session cookie, forwards a
`Bearer` token to FastAPI, and proxies the JSON response back. This is a standard
BFF (backend-for-frontend) pattern — it keeps the JWT out of client-side JS entirely.

```
Browser  →  Next.js route handler (app/api/.../route.ts)  →  FastAPI (/api/v1/...)  →  PostgreSQL
              (reads httpOnly cookie, adds Authorization header)
```

---

## 2. Authentication & Session Flow

- **Sign up** (`app/(auth)/signup/page.tsx` → `POST /api/auth/signup` → `POST /api/v1/register`):
  collects name/email/password plus company profile fields (industry, company size,
  revenue, API maturity, primary objectives, gateway, team size). All of this is
  stored directly on the `Audience` row — there's no separate "profile" table for
  a plain sign-up.
- **Login** (`POST /api/auth/login` → `POST /api/v1/token`, OAuth2 password grant):
  FastAPI's `/token` endpoint verifies the password (`pbkdf2_sha256`) and returns a
  JWT (`{"sub": email}`, `ACCESS_TOKEN_EXPIRE_MINUTES` = 1440 by default). The
  Next.js route then sets that JWT as an **httpOnly cookie** (`session` by default,
  `sameSite=lax`) — the browser never sees the raw token.
- **Every authenticated backend call** requires `Authorization: Bearer <token>`, verified
  by `get_current_user()` in `app/core/security.py`, which decodes the JWT and loads
  the user by the `sub` (email) claim.
- **Forgot / reset password** (`user_endpoints.py`):
  1. `POST /forgot-password/request-link` — generates a `secrets.token_urlsafe(32)`
     token, stores `{email, expires_at}` keyed by a SHA-256 hash of the token in an
     **in-process Python dict** (`password_reset_tokens = {}`), emails a link
     `{FRONTEND_URL}/login?resetToken=...&email=...` via `app/core/email.py` (SMTP).
     Token TTL is `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES` (default 15 min).
  2. `POST /forgot-password` — validates the token against that same in-memory dict
     and updates the password.
  3. ⚠️ **Risk**: because the token store is a plain in-memory dict (not a DB table
     or Redis), it does not survive a process restart or deploy, and won't work
     correctly if the backend ever runs as more than one worker/instance (a reset
     link could be validated on a different process than the one that issued it).
- **Admin auth**: same `Audience` table, gated by an `is_admin` boolean.
  `get_current_admin_user()` wraps `get_current_user()` and 403s non-admins. On
  startup, `ensure_admin_user()` (`database.py`) auto-creates/promotes an admin
  account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars — useful for bootstrapping,
  but worth knowing the default password (`Admin@12345`) is checked into
  `config.py` as a fallback if the env var is unset.
- ⚠️ `SECRET_KEY` (used to sign JWTs and hash reset tokens) also has a hardcoded
  fallback (`"your-super-secret-key"`) in `config.py` if the env var is missing —
  fine for local dev, but should be treated as a hard requirement in any real
  deployment.

---

## 3. Core Feature: Monetization Strategy Advisor

This is the one fully-active feature on the dashboard (Analytics Workbench and AI
Monetization Plugin are UI-gated as "Coming Soon" — see §6). It has three entry
points on `/dashboard/strategy-adviser`:

| Path | Status | Notes |
|---|---|---|
| **Answer Questionnaire** | ✅ Active | Described below — this is the real, wired-up flow. |
| Business Data | UI-disabled ("Coming Soon") | The page (`strategy-adviser/business-data/page.tsx`) and its backend (`business_profile_endpoints.py`, `BusinessProfile` model) are **fully built** — profile builder, save/load, PDF export — but the dashboard doesn't link to it yet. |
| AI Chat Advisor | UI-disabled ("Coming Soon") | Backend already has a working endpoint (`POST /strategy-advisor/chat`, see §5) that runs a 5-question conversational discovery flow and returns the same recommendation JSON shape — just not linked from the UI yet. |

### 3.1 Adaptive Questionnaire (`POST /api/v1/questionnaire/next`)

File: `MonetizeMate-Backend/app/api/monetization_recommendation_endpoints.py`

- The frontend (`strategy-adviser/questionnaire/page.tsx`) picks an industry, then
  calls this endpoint once per question, sending the full conversation
  (`{question, answer}` pairs) back each time — there's no server-side session
  state, the client is the source of truth for "what's been asked."
- Questions are **not pre-written** — each one is generated live by the LLM
  (`gpt-oss-120b` via Groq), one MCQ at a time, based on a **phase system**
  (`_questionnaire_phase()`):
  - Q1–3: *Foundations* — business stage, whether a product/API exists yet, target customer, goal.
  - Q4–7: *Customer & Value* — segment, value prop, competition.
  - Q8–11: *Monetization Specifics* — willingness to pay, preferred model, pricing sensitivity.
  - Q12+: *Readiness & Scale* — metering/billing readiness, compliance, team, timeline.
  - This phasing exists specifically so a first-time founder isn't asked pricing/metering
    jargon before establishing basic context.
- Hard bounds: never completes before 10 answered questions, always completes by 15
  (`total_answered >= 15 → {"completed": true}`).
- If the user skips a question, the prompt is told to avoid re-asking a close variant.
- Response is strict JSON (`response_format: json_object`), parsed by
  `_extract_json_object()` with a **hand-rolled JSON repair pass** (`_repair_json()`)
  that walks the string tracking bracket/quote depth to salvage a usable object out
  of a truncated LLM response (a real failure mode with long JSON completions).

### 3.2 Recommendation Generation (`POST /api/v1/monetization/recommend/llm`)

Once the questionnaire finishes, `analyzeAnswers()` in the frontend calls this
endpoint with `{industry, answers[]}`.

- **Prompt**: built by `build_monetization_strategy_messages()` in
  `app/core/prompt_templates.py` — a single, versioned system prompt shared by
  every call (same JSON shape every time, regardless of industry), so the UI never
  has to defensively handle a different response shape.
- **Model catalog grounding**: rather than letting the LLM invent monetization
  models, the prompt embeds a fixed `MONETIZATION_MODEL_CATALOG` of 19 real-world
  models (usage-based, subscription, tiered, data licensing, marketplace commission,
  white-label platform, SDK licensing, etc. — each with `suitable_for`,
  `value_drivers`, `required_capabilities`). The LLM must pick recommendations from
  this catalog by id/name (never invent one) and must **score every single model
  in the catalog** in a `modelMapping` section — this is what powers the "which
  pricing model fits best" comparison table.
- **Requested JSON shape** (`MONETIZATION_STRATEGY_JSON_SHAPE`) has five sections,
  all mandatory: `recommendations` (3-5, each with reasoning, pros/cons/risks,
  `strategicFit` scores across 4 dimensions, `whyThisStrategy`, `nextSteps`,
  a `revisitTrigger`), `pricing` (concrete tiers), `packaging` (bundles + upsell
  path), `roadmap` (phased rollout), `modelMapping` (all 19 models scored/ranked).
- Called with `temperature=0.35` (low, for structural consistency) and
  `max_tokens=8500` (raised specifically because scoring all 19 catalog models adds
  meaningfully to completion length).
- **Normalization layer**: the raw LLM JSON is never trusted as-is. A family of
  `_normalize_*()` functions (recommendations, pricing, packaging, roadmap, strategic
  fit, risk severity, model mapping) clamp scores to 0–100, backfill missing fields
  with sane defaults, and guarantee every field the frontend expects is present —
  this is the safety net that keeps a slightly-malformed LLM response from ever
  reaching the UI as broken JSON.
- On success, `log_recommendation_activity()` (in `admin_endpoints.py`) writes an
  `AdminActivity` row (`activity_type="recommendation_generated"`) — this is what
  feeds the admin dashboard's "Assessments Completed" metric and Recent Activity feed.
- **Retry/rate-limit handling**: `call_groq_sync()` retries up to 3 times on HTTP
  429, respecting `Retry-After` if present, with exponential backoff otherwise.

### 3.3 How the result is actually shown

This is **not** a server-rendered page reload — it's a client-side handoff:

1. `questionnaire/page.tsx` gets the recommendation JSON back, writes the whole
   thing into `sessionStorage['recommendations_data']`, and navigates to
   `/dashboard/recommendation?analysisSource=...&selectedIndustry=...` (query params
   only carry small metadata, not the payload).
2. `recommendation/page.tsx` reads `sessionStorage` on mount and renders from that.
   ⚠️ Consequence: a hard refresh or a deep link to `/dashboard/recommendation`
   without having just come from the questionnaire will find nothing in
   `sessionStorage` and bounce the user back to `/dashboard/strategy-adviser`.
3. Recommendations render as ranked strategy cards (icon, score, pros/cons, risk
   list, "why this strategy," next steps). `SHOW_PRICING_PACKAGING_ROADMAP` is
   currently `false` — pricing/packaging/roadmap data is still fetched and stored,
   just not rendered in the UI right now (a one-line flip re-enables it).
4. **PDF export is entirely client-side.** `app/utils/executiveReport.ts` exports a
   set of HTML-building helper functions (`xrHeader`, `xrHero`, `xrPricingTable`,
   `xrRoadmap`, `xrRisksAndNextSteps`, etc.) that assemble a styled HTML document
   in the browser; `downloadHtmlAsPdf()` (`app/utils/pdf.ts`) then rasterizes that
   HTML to a PDF via `html2pdf.js` — no backend involvement in the PDF itself.
   - There's a separate, **optional** enrichment call, `POST
     /monetization/enhance-pdf`, that asks the LLM for longer narrative prose
     (executive summary, strategic fit analysis, risk deep-dive, etc.) to make the
     downloaded report read like a consultant-written document rather than just the
     structured recommendation fields.
   - Because PDF generation happens entirely in the browser, the backend has no
     natural way to know a download happened — so the frontend explicitly pings
     `POST /activity/track-download` afterward purely so the admin dashboard can
     count it.

### 3.4 Legacy / unused recommendation code

The same file also still contains an **older, simpler system** that the current
frontend does not call:
- A static `Questionnaire` DB model + CRUD (`questionnaire_endpoints.py`,
  `GET/POST /questionnaire/`) — fixed, admin-authored questions rather than
  LLM-generated ones.
- `POST /monetization/recommend` and `GET /monetization/recommend/from-file/{id}` —
  a keyword-matching scorer (`score_models()`) over 5 hardcoded pricing models
  (checks literal substrings like `"user base"`, `"premium prices"` in question text).

This looks like an earlier iteration that was superseded by the LLM-driven flow in
§3.1–3.2. Worth confirming with the team whether it's still needed for anything
(e.g. a bulk/file-based import path) or safe to remove.

---

## 4. Database Models (SQLAlchemy)

| Model | Purpose | Notable fields |
|---|---|---|
| `Audience` (`audience.py`) | The user account table (name is legacy — it's really "users") | All signup/company-profile fields live here directly. ⚠️ **No `created_at`/signup-date column** — there's no way to know when a user joined without a migration. |
| `AdminActivity` (`admin_activity.py`) | Event log for the admin dashboard | `activity_type` (`recommendation_generated`, `report_downloaded`), `industry`, `persona`, `strategy`, `created_at` (naive UTC `datetime.utcnow()`). |
| `File` (`file.py`) | Uploaded analytics/prediction files | `decision_metrics` string tags the upload's purpose (`"analytics"`/`"prediction"`/`"strategy"`); `upload_time` (also naive UTC). |
| `BusinessProfile` (`business_profile.py`) | Saved reusable business profiles for the (UI-hidden) Business Data flow | |
| `GatewayConnection` (`gateway_connection.py`) | API gateway connection config for the (UI-hidden) AI Monetization Plugin | |
| `Questionnaire` (`questionnaire.py`) | Static question bank used only by the legacy scoring endpoints (§3.4) | |

Schema management is informal: `create_tables()` calls
`Base.metadata.create_all()` then `ensure_admin_schema()` runs hand-written
`ALTER TABLE ... ADD COLUMN` statements for any columns missing from `audiences` —
there's no Alembic/migration framework, so schema changes are applied via this
ad-hoc "add if missing" function in `database.py`.

⚠️ **Timestamp serialization bug (fixed this session)**: `created_at`/`upload_time`
are naive UTC datetimes. Serializing them with plain `.isoformat()` (no `Z`/offset)
caused the frontend's `new Date(...)` to parse them as *local* time instead of UTC,
silently shifting every displayed timestamp. Fixed in `admin_endpoints.py` via a
`_isoformat_utc()` helper that appends `Z`. Any other place in the codebase that
serializes a naive UTC datetime the same way (e.g. if `File.upload_time` is ever
surfaced directly to the UI) would have the identical bug.

---

## 5. AI Concierge ("Vessa")

Two-tier design, in `ConciergeBubble.tsx` (frontend) +
`concierge_endpoints.py` (backend):

1. **Instant, local answers** (`answerFromLocalKnowledge()` in
   `ConciergeBubble.tsx`) — a keyword-matched knowledge base covering sign up,
   login, forgot password, getting started, the dashboard, each feature's status,
   the questionnaire flow, the recommendation report, and terminology. This runs
   entirely client-side with **no network call and no auth required** — it works
   even on the login/signup pages before a session exists.
2. **LLM fallback** (`POST /api/concierge` → `POST /api/v1/concierge/chat`) — only
   reached if the local knowledge base has no match. Requires an authenticated
   session (the Next.js route 401s without a session cookie). Uses
   `llama-3.1-8b-instant`, with a system prompt that now also encodes the full app
   workflow (not just data analysis), so it can answer more complex or compound
   questions the local base doesn't catch. If a file is loaded
   (`load_file_summary()`), it injects a computed summary (row/column counts, top
   endpoints/clients/countries, error rates, revenue) as context so answers can
   reference real numbers.
3. **`POST /strategy-advisor/chat`** — a separate endpoint for the (currently
   UI-hidden) "AI Chat Advisor" conversational discovery flow. Asks a fixed
   sequence of 5 discovery questions (`DISCOVERY_QUESTIONS`) by raw turn-count
   (not keyword matching — free-form answers like "internal" or "2M requests/month"
   can't be reliably parsed by keywords), then hands off to the LLM once 5+ user
   turns exist, returning the same `recommendations` JSON shape as §3.2 so it could
   plug into the same recommendation UI once launched.
4. **`GET /concierge/suggestions`** — context-aware quick-suggestion chips, varies
   if a file is loaded.

---

## 6. Admin Dashboard & Analytics

File: `admin_endpoints.py` (backend), `app/admin/dashboard/page.tsx` (frontend).

- **`GET /admin/insights`** — the main aggregation endpoint, computed **on every
  request** (no caching/pre-aggregation): total users, companies, assessments,
  reports, completion rate, industry/company-size/country/maturity/gateway
  distributions, personas, preferred pricing models, business objectives, a
  7-day activity timeline (bar chart), AI-derived use cases per industry, feature
  usage/download counts, and a **Recent Activity** feed (capped at 5, was
  previously capped at 12 with the UI only meant to show 5 — fixed this session).
- Persona, preferred-pricing-model, and readiness-score are **not stored** — they're
  computed on the fly per user from their profile fields
  (`_persona_for_user()`, `_preferred_pricing_model()`, `_readiness_score()`), using
  simple rule tables (e.g. industry → persona name, API maturity → a 0–90 score).
- **`GET /admin/users/export`** (added this session) — the full user roster
  (every non-admin user, not just the 5 shown on the dashboard), including account
  fields, computed persona/pricing model/readiness score, and feature usage
  (assessments completed, reports downloaded, files uploaded, which features
  they've touched, last activity timestamp). The frontend converts this to CSV
  client-side via `papaparse` and triggers a browser download — no CSV generation
  happens on the backend.
- **`POST /activity/track-download`** — the only way report downloads get counted,
  since PDF generation is entirely client-side (see §3.3).
- The "AI-Derived Use Cases" section groups users by a hardcoded
  `USE_CASE_BY_INDUSTRY`/`USE_CASE_DETAIL_BY_INDUSTRY` mapping (industry → a
  canned use-case template) rather than anything LLM-generated — despite the name,
  this part is static/rule-based, not AI output.

---

## 7. Where Things Stand vs. the Dashboard UI

The dashboard shows only one active feature, but the backend has more built than
the UI currently exposes:

| Feature | Frontend UI | Backend |
|---|---|---|
| Strategy Advisor → Answer Questionnaire | ✅ Live | ✅ Live (§3.1–3.2) |
| Strategy Advisor → Business Data | 🔒 "Coming Soon" | ✅ Fully built (`business_profile_endpoints.py`, profile CRUD, PDF export) |
| Strategy Advisor → AI Chat Advisor | 🔒 "Coming Soon" | ✅ Working endpoint (`/strategy-advisor/chat`, §5.3) |
| Analytics Workbench | 🔒 "Coming Soon" | ✅ Six working endpoints in `dashboard_endpoints.py` (overview/analysis/temporal/clients/distribution/rankings by file id) |
| AI Monetization Plugin | 🔒 "Coming Soon" | Partial — `GatewayConnection` model + `api_source_endpoints.py` exist |

Worth flagging to the team: several of these are one dashboard-link away from being
enabled, not blocked on backend work.

---

## 8. Summary of Risk Areas to Watch

1. **In-memory password reset tokens** — won't survive restarts or multiple
   worker processes (§2).
2. **Hardcoded fallback secrets** — `SECRET_KEY` and `ADMIN_PASSWORD` both have
   defaults baked into `config.py` if env vars are absent (§2).
3. **No migration framework** — schema changes rely on a hand-written
   "add column if missing" function (§4).
4. **No user signup-date field** — `Audience` has no `created_at` (§4).
5. **Naive-UTC timestamps** — any new endpoint that serializes `created_at`/
   `upload_time` needs the same `Z`-suffix treatment as the recent fix, or it will
   reproduce the same timezone display bug (§4).
6. **`sessionStorage`-based result handoff** — recommendation results don't survive
   a hard refresh or direct link (§3.3); fine for the current single-session flow,
   but worth knowing if a "share this report" or "resume later" feature is ever wanted.
7. **Legacy scoring system** — the static-questionnaire + keyword-scoring endpoints
   (§3.4) appear unused by the current UI; confirm before removing.
8. **Admin insights computed per-request** — fine at current scale; would need
   caching if the user/activity tables grow significantly.
