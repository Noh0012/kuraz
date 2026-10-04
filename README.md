# Kuraz

Kuraz is an Android study app for Ethiopian Grade 9–12 students. It has video lessons, a question bank (QBank) and timed tests, including Grade 12 national-exam practice papers. Each student signs up for a grade, and buying a package for that grade unlocks its content. *Kuraz* is the small kerosene lamp generations of students studied by.

| Part | Stack |
|---|---|
| `mobile/` | Expo SDK 57 (React Native 0.86), Expo Router, TypeScript, TanStack Query |
| `backend/` | Node 24, Express 5, TypeScript, zod |
| `supabase/` | Postgres migrations, seed content, generated seed SQL |

## How it fits together

- **Auth**: the app signs students in with Supabase Auth (email and password) through `@supabase/supabase-js`. It doesn't use Supabase for anything else.
- **Data**: every screen calls the Kuraz API (`/v1/*`) with the Supabase access token. The API verifies the token with `auth.getClaims()` (ES256 via JWKS) and queries Postgres with the **secret key**.
- **RLS** is enabled on every table with **no policies**, so a client using the publishable key can't read anything directly. Only the API can.
- **Entitlements**: an item is open if `is_free`, or if the student has an active subscription to a package for that grade that includes the content type (`videos`, `qbank` or `tests`). Locked items still appear in lists with `locked: true`.
- **No answer leaks**:
  - Video URLs are returned only by `GET /videos/:id` after the access check.
  - QBank answers are revealed only by `POST /questions/:id/answer`.
  - Tests are scored on the server, the deadline is enforced (30 s grace), and the review is available only after submitting.
- **Payments are stubbed**: `POST /v1/subscriptions` activates a package immediately (`PAYMENTS_PROVIDER=stub`). Buying again while active queues a renewal. A real provider (e.g. Chapa) would create a pending subscription there and activate it from its webhook.

## First-time setup

1. **Backend secret key.** Copy `backend/.env.example` to `backend/.env`. Paste the secret key (`sb_secret_…`) from Supabase Dashboard > Project Settings > API Keys. Never put it in the app.
2. **Install** (Node 22+):
   ```sh
   cd backend && npm install
   cd ../mobile && npm install
   ```
3. **Run the API**: `cd backend && npm run dev`. It prints the LAN URLs it listens on. Open `http://<PC-IP>:4000/v1/health` in your phone's browser to check that the phone can reach it. If it can't, set your Wi-Fi network to *Private* in Windows, or allow port 4000 in Windows Firewall.
4. **Run the app**: `cd mobile && npx expo start`. Scan the QR code with **Expo Go** (Android, same Wi-Fi). The app calls the API on the same PC that serves the bundle, so you don't need to configure the API URL in development.
5. Optional: `npx expo start --web` gives a quick browser preview.

Supabase project: `quboqjxcatqypcqurgjx` (`https://quboqjxcatqypcqurgjx.supabase.co`). `mobile/.env` holds its URL and publishable key; both are public.

## Database

- **Migrations** are in `supabase/migrations/` (`0001_core` … `0005_functions`) and are already applied to the project.
- **After changing the schema**, regenerate `backend/src/db/types.ts`, for example with the Supabase MCP `generate_typescript_types` or `npx supabase gen types typescript --project-id quboqjxcatqypcqurgjx`.

### Seed content

- **Source**: `supabase/seed-data/*.json` contains real practice content: 5 subjects per grade, 45 chapters, 135 lessons, 195 QBank questions, and 60 questions across 6 Grade 12 national-exam style papers. The papers are original practice questions, not reproductions of actual ESSLCE papers.
- **Build**: `cd backend && npm run seed:build` generates `supabase/seed.sql`, plus per-grade chunks in `supabase/seed/`. IDs are deterministic, so re-applying updates rows instead of duplicating them.
- **Checksum**: the build prints a `question_md5`. After applying the SQL, compare it with the result of this query:
  ```sql
  select md5(string_agg(id::text || '|' || stem || '|' || correct_option || '|' || explanation, E'\n' order by id)) from public.questions;
  ```
- **Lesson videos are placeholders**: public sample films (Big Buck Bunny, Sintel, …). Replace `videos.source_url` and `videos.duration_seconds` with real lessons.
- **Hosting real lessons**: Supabase Storage on the free plan caps files at 50 MB, so host lessons on a video service (Bunny, Mux or Cloudflare Stream) and store the HLS or MP4 URL.

### Managing content

There is no admin panel yet. Use **Supabase Studio > Table editor**:
- Add rows to `subjects` → `chapters` → `videos` / `questions`, and `tests` + `test_questions`.
- `questions.options` is a JSON array: `[{"key":"A","text":"…"}, …]`. `correct_option` is the key.
- QBank questions have a `chapter_id`. Exam-paper questions leave it empty, so they never appear in the QBank.
- Flip `is_free` to make an item part of the free tier.
- To grant a student a plan manually, insert a `subscriptions` row with `status = 'active'`, `starts_at`, `expires_at` and a unique `tx_ref`.

## Testing

```sh
cd backend && npm test && npm run typecheck   # entitlements, answer hiding, scoring, deadlines, QOTD, auth
cd mobile && npm run typecheck && npx expo-doctor
```

## API

All routes are under `/v1`. Every route needs `Authorization: Bearer <supabase access token>` except `/health` and `/grades`.

- **Account**: `GET /health`, `GET /grades`, `GET|PATCH /me`, `POST /me/avatar` (multipart `avatar`), `DELETE /me`
- **Home**: `GET /home` (most watched, continue watching, plan, question of the day, free counts)
- **Videos**: `GET /subjects`, `GET /subjects/:id/videos`, `GET /videos/continue`, `GET /videos/:id`, `PUT /videos/:id/progress`
- **QBank**: `GET /subjects/:id/qbank`, `GET /qbank/chapters/:id/questions`, `POST /questions/:id/answer`, `GET /qotd`
- **Tests**: `GET /tests?type=national|mock|unit`, `GET /tests/:id`, `POST /tests/:id/attempts` (start or resume), `PUT /attempts/:id/answers` (autosave), `POST /attempts/:id/submit`, `GET /attempts/:id`
- **Other**: `GET /search?q=&scope=`, `GET|POST /bookmarks`, `DELETE /bookmarks/:type/:id`, `GET /packages`, `GET|POST /subscriptions`, `POST /issues`

Response types live in `backend/src/contracts.ts`. `npm run contracts:sync` copies them to the app.

## Release checklist

- Deploy the API over **HTTPS**, because release APKs block plain HTTP. Then set `EXPO_PUBLIC_API_URL` for the EAS build: `eas env:create` or the `env` block in `eas.json`.
- Build an APK: `npx eas-cli@latest build -p android --profile preview` (needs an Expo account).
- Replace the placeholder support contacts in `mobile/src/lib/config.ts`.
- Set up custom SMTP in Supabase before adding password reset or email confirmation.
- Connect a real payment provider in place of the stub.
- Free Supabase projects pause after about a week without activity.
