# Funnel Health Diagnostic Quiz

A self-contained, lead-gen diagnostic at **`/funnel-quiz`**. Six unscored profile
questions + 27 scored diagnostic questions (9 categories × 3). It gates results
behind name + email, computes a Funnel Health Score, ranks the top funnel leaks,
raises revenue-critical warnings, and (optionally) stores the submission in Supabase.

## Files

| File | Purpose |
| --- | --- |
| `quizData.js` | All 33 questions, options, point values, categories, result/category bands, critical-override list. **Scoring values live here for logic only — they are never rendered to participants.** |
| `scoring.js` | Pure scoring: total risk, health score, per-category scores + severity, top-3 leaks, critical flags. |
| `FunnelQuiz.jsx` | The multi-step page (intro → questions → lead gate → results). |
| `supabaseClient.js` | Best-effort insert to Supabase via its REST API (anon key only). |
| `theme.js` | Shared visual tokens mirroring the main site's randomized theme. |
| `../../supabase/schema.sql` | Table + Row-Level-Security policy to run once in Supabase. |

## Scoring (per spec)

```
Funnel Health Score = 100 − ((Total Risk Points ÷ Max Applicable Points) × 100)   // rounded
```

- Each scored question: A/B/C/D → 0/1/2/3 points. Max risk = 27 × 3 = **81**.
- **Overall bands:** 85–100 Strong and Scalable · 70–84 Functional with Hidden Leaks · 50–69 Revenue Leakage Risk · 0–49 Critical Funnel Blindness.
- **Category bands** (each category max 9): 0–2 Healthy · 3–4 Improvement · 5–6 High-risk · 7–9 Critical. The three highest-scoring categories are shown as the primary leaks.
- **Critical override:** questions 12, 18, 22, 24, 25 raise a prominent warning when answered with 2 or 3 points.

## Supabase setup

1. In the Supabase SQL editor, run [`supabase/schema.sql`](../../supabase/schema.sql). It creates
   `public.funnel_quiz_submissions` and an **insert-only** RLS policy for the `anon` role.
2. Copy `.env.example` → `.env` and set:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<public anon key>
   ```
3. Restart `npm run dev` so Vite picks up the env vars.

Persistence is **best-effort**: if the table/policy/env is missing, the results screen
still renders and a warning is logged to the console. Submissions are readable via the
Supabase dashboard or the `service_role` key (server side) — the browser cannot read them
back (insert-only policy).

> ⚠️ **Never** put the Supabase `service_role` key in this frontend or in `.env`
> (any `VITE_`-prefixed value is shipped to the browser). It bypasses RLS.

## Submissions dashboard

A private, password-gated dashboard lives at **`/funnel-quiz/admin`**. It lists every
submission and, per person, shows their score, top leaks, critical warnings, and **all 33
selections** (6 profile + 27 diagnostic, as the actual option text they chose). It also
exports everything to CSV.

**How it's secured (no password = no data):**

- The public quiz writes with the **anon** key, which is **insert-only** under RLS — it
  cannot read submissions back.
- Reading requires the **service_role** key, which lives **only on the Express server**
  (never shipped to the browser).
- The dashboard API (`/api/quiz/dashboard/*`) checks `QUIZ_DASHBOARD_PASSWORD`
  (constant-time compare) and issues a 12h JWT. Every read requires that token.

So there is no client path to the data without the password.

Dashboard files: [`QuizDashboard.jsx`](./QuizDashboard.jsx) (frontend) and
[`../../server/src/routes/quiz.js`](../../server/src/routes/quiz.js) (API). The API server
must be running for the dashboard to work (`npm run server:dev` in dev; the container runs
it automatically).

## Environment variables

| Variable | Used by | When | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | frontend | **build** time | Public. In Docker pass as `--build-arg`. |
| `VITE_SUPABASE_ANON_KEY` | frontend | **build** time | Public (RLS-protected). |
| `SUPABASE_URL` | server | runtime | Falls back to `VITE_SUPABASE_URL`. |
| `SUPABASE_SERVICE_ROLE_KEY` | server | runtime | **Secret.** Never expose to the browser. |
| `QUIZ_DASHBOARD_PASSWORD` | server | runtime | Password for `/funnel-quiz/admin`. |

Locally, all of these live in the gitignored root `.env` (Vite and the server both read it).
`.env` is excluded from the Docker build context (`.dockerignore`), so in production:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://<ref>.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=<anon> \
  -t automation-paths .

docker run -p 8080:8080 \
  -e SUPABASE_URL=https://<ref>.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=<service_role> \
  -e QUIZ_DASHBOARD_PASSWORD='<password>' \
  automation-paths
```

## Editing the quiz

Change wording, options, or point values in `quizData.js` only. As long as each scored
question keeps four options with points `0,1,2,3`, the scoring, bands, and results adapt
automatically.
