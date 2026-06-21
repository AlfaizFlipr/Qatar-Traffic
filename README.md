# Qatar Traffic Violations Portal

A full-stack traffic-violation inquiry and payment-relay application styled after the
Qatar MOI **Payment Gateway** (fees2qa.com). Bilingual (Arabic RTL / English LTR),
with a React frontend and a TypeScript/Express/MongoDB backend.

```
Qatar/
├── frontend/   # React + TypeScript + Vite + Mantine (RTL/LTR, i18n, routing)
└── backend/    # Node + TypeScript + Express + MongoDB (routes→controllers→services→dao)
```

## Architecture (Option B — own API)

```
React App  ─▶  Express API  ─▶  Violation provider (mock | http | Playwright scraper)  ─▶  MOI
                   │
                   └─▶  MongoDB (audit)   └─▶  Telegram Bot (payment submissions)
```

---

## 1) Backend

```bash
cd backend
cp .env.example .env        # then edit values
npm install
npm run dev                 # http://localhost:5000  (nodemon + ts-node)
```

Build & run production:

```bash
npm run build && npm start
```

### Environment (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 5000) |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins |
| `MONGODB_URI` | MongoDB connection string |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | Numeric chat id that receives payment submissions |
| `TELEGRAM_USERNAME` | Optional handle shown in the message |
| `VIOLATION_PROVIDER` | `mock` (default), `http`, or `scraper` |
| `VIOLATION_API_URL` / `VIOLATION_API_KEY` | For the `http` provider |
| `MOI_URL` / `SCRAPER_STRICT` | For the Playwright `scraper` provider |

> **Telegram:** create a bot via [@BotFather](https://t.me/BotFather), message the bot,
> then get your numeric chat id (e.g. via [@userinfobot](https://t.me/userinfobot)).
> Until configured, payment submissions are still saved to MongoDB and marked `failed`.

> **Live MOI data:** set `VIOLATION_PROVIDER=scraper`, then
> `npm i playwright && npx playwright install chromium`. The scraper scaffold lives in
> `backend/src/services/providers/scraperProvider.ts` — the MOI form is CAPTCHA-protected,
> so complete the selectors + CAPTCHA strategy there. The default `mock` provider returns
> realistic, deterministic data so the app works out of the box.

### API endpoints

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Health + telegram status |
| POST | `/api/violations/search` | `{ searchType, country, plateNumber? … }` | One-shot search (mock/http) |
| POST | `/api/violations/captcha/start` | `{ searchType, country, plateNumber? … }` | **Option A step 1** — cache hit *or* CAPTCHA challenge |
| POST | `/api/violations/captcha/submit` | `{ sessionId, captchaCode }` | **Option A step 2** — verify + return violations |
| GET | `/api/violations/:referenceId` | — | Fetch a past inquiry |
| POST | `/api/payments` | `{ fullName, mobile, amount, … }` | Save + relay to Telegram |

### User-assisted CAPTCHA flow (Option A)

```
Frontend ──▶ POST /captcha/start ──▶ cache hit? ── yes ─▶ { cached:true, result }
                                         │ no
                                         ▼
                          open scraper, capture CAPTCHA image
                                         ▼
                    { captchaRequired:true, sessionId, captchaImage }
Frontend shows image ─▶ user types code ─▶ POST /captcha/submit { sessionId, captchaCode }
                                         ▼
                       submit form, parse results, cache, return violations
```

- `SCRAPER_MODE=simulated` (default) — backend generates a real CAPTCHA image (SVG), and a
  correct answer returns data. The **entire two-step UX is testable now**, no Playwright needed.
- `SCRAPER_MODE=live` — Playwright opens the MOI portal, screenshots the **real** CAPTCHA, and
  after the user solves it, submits + parses real results. Set `MOI_URL`, adjust the selectors
  in `captcha/liveScraper.ts`, and `npm i playwright && npx playwright install chromium`.
- Results are cached per identifier (`CACHE_TTL_MS`); a repeat search inside the window skips
  the CAPTCHA entirely.

### Layout

```
backend/src/
├── config/        env loading, mongo connection
├── routes/        express routers (index, violation, payment)
├── controllers/   thin request/response handlers
├── services/      business logic + providers/ (mock, http, scraper) + telegram
├── dao/           data-access layer over the models
├── models/        mongoose schemas (ViolationRecord, Payment)
├── middleware/    validate (zod), errorHandler, notFound, rateLimiter
├── validators/    zod schemas
├── utils/         logger, asyncHandler, apiResponse
├── app.ts         express app assembly
└── server.ts      bootstrap (connect db, listen, graceful shutdown)
```

---

## 2) Frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173
npm run build               # type-check + production build
```

### Highlights

- **MOI-style UI** — teal social strip, white ministry header, navy inquiry card with
  three icon tabs (vehicle / personal / establishment), gold active underline, captcha,
  green "Search" / gray "Clear" buttons, info note, and a navy footer with the Metrash block.
- **Bilingual + direction-aware** — Arabic (RTL) by default, English (LTR); the choice is
  persisted and `<html dir/lang>` + Mantine `DirectionProvider` update live.
- **Routing** — landing (`/`, search only), `/search`, `/about`, `/faq`, `/contact`, 404.
- **Pay flow** — "Pay Now" opens a form; on submit the details are sent to the backend,
  saved to MongoDB, and relayed to Telegram.

```
frontend/src/
├── api/           fetch client + violations/payments calls + shared types
├── context/       LanguageContext (i18n + RTL/LTR)
├── components/    Navbar, Footer, SearchTabs (inquiry card), PaymentModal, sections…
├── pages/         LandingPage, SearchPage, AboutPage, FaqPage, ContactPage, NotFoundPage
├── constants/     translations (ar/en), content
└── theme.ts       Mantine maroon brand theme
```

---

## Quick start (both)

```bash
# terminal 1
cd backend && npm install && npm run dev
# terminal 2
cd frontend && npm install && npm run dev
```

Open http://localhost:5173 — search any plate / personal / establishment number (any
captcha value shown), then use **Pay Now** to submit a request.
