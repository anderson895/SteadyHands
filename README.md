# Steadyhand 🤚
### Cerebral Palsy Therapy App — React Native + Expo Router + SQLite

---

## Setup

```bash
npm install
npx expo start
# Press 'a' for Android
```

---

## File Structure

```
Steadyhand/
├── app.json
├── package.json
├── babel.config.js
├── tsconfig.json
├── expo-env.d.ts
│
├── app/
│   ├── _layout.tsx              ← Root layout (DB init, AuthProvider, Stack)
│   ├── index.tsx                ← Redirect based on auth state + role
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx          ← Auth stack
│   │   ├── login.tsx            ← Login screen
│   │   └── register.tsx         ← Register (patient / caregiver role)
│   │
│   ├── (patient)/
│   │   ├── _layout.tsx          ← Patient bottom tabs
│   │   ├── exercises.tsx        ← Exercise browser + tracing modal
│   │   ├── progress.tsx         ← Stats, goal bar, session history
│   │   └── profile.tsx          ← Profile + logout
│   │
│   └── (caregiver)/
│       ├── _layout.tsx          ← Caregiver bottom tabs
│       ├── dashboard.tsx        ← Patient overview, set goals, details
│       └── profile.tsx          ← Profile + logout
│
└── src/
    ├── components/
    │   ├── TracingCanvas.tsx     ← Letter/number freehand tracing
    │   ├── ShapeTracer.tsx       ← Shape tracing with SVG guides
    │   └── ConnectDots.tsx       ← Tap-to-connect dot patterns
    │
    ├── constants/
    │   ├── exercises.ts          ← LETTERS, NUMBERS, SHAPES, DOT_PATTERNS
    │   └── theme.ts              ← Colors, fonts, shadows
    │
    ├── context/
    │   └── AuthContext.tsx       ← useAuth hook + AuthProvider
    │
    └── database/
        └── db.ts                 ← SQLite v16 async API, all queries
```

---

## Features

### Patient
- **Tracing Exercises** — Letters A–Z, Numbers 0–9, 6 Shapes, 4 Connect-the-Dots patterns
- **Progress Tracking** — Daily goal bar, accuracy score, practice time, weekly overview
- **Session History** — Every completed exercise is logged with duration + accuracy

### Caregiver
- **Dashboard** — All patients shown in card grid with today's count + weekly accuracy
- **Set Daily Goal** — Per-patient exercise target (saved to SQLite)
- **View Details** — Drill into any patient's today sessions

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto |
| username | TEXT UNIQUE | Login |
| password | TEXT | Plain (hash in production) |
| name | TEXT | Display name |
| role | TEXT | `'patient'` or `'caregiver'` |
| daily_goal | INTEGER | Default 5 |

### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto |
| user_id | INTEGER FK | → users.id |
| exercise_type | TEXT | `letter / number / shape / dots` |
| exercise_name | TEXT | e.g. `'A'`, `'Circle'`, `'Dog'` |
| duration_seconds | INTEGER | Time taken |
| accuracy_score | REAL | 0–100 |
| created_at | DATETIME | Timestamp |

---

## Tech Stack
- **Expo 54** + **Expo Router 6** (file-based routing)
- **expo-sqlite v16** (async API)
- **react-native-svg** (tracing canvas)
- **react-native-gesture-handler** (touch input)
- **TypeScript** throughout


npx expo prebuild --clean
eas build -p android --profile preview

<!-- https://expo.dev/accounts/padillajoshuaanderson.pdm/projects/Steadyhand/builds/5f0857a5-d114-46dd-a629-5999ab6d2b04 -->
https://expo.dev/accounts/padillajoshuaanderson.pdm/projects/Steadyhand/builds/d4a31969-709a-412e-86ac-ea2f97f692ad