# WattZup — Full-Stack Implementation Prompt
## From UI Shell → Production-Ready App (Supabase + AI + Voice + ML)

> **How to use**: Copy the entire prompt below into Claude (Opus recommended) or a capable AI coding assistant. It will generate all the missing server-side logic, client-side services, Supabase schema, and wiring needed to make WattZup fully functional. You only need to plug in your API keys.

---

## THE PROMPT

```
You are an expert full-stack engineer, AI systems architect, and Supabase specialist. I have an existing WattZup frontend (React + Vite + TypeScript + Tailwind + Supabase Auth) that currently only has UI/UX templates — no real data flow, no backend logic, no ML, no voice. I need you to build the COMPLETE server and client-side implementation so the app works as intended.

The app is a predictive electricity budget tracker for Filipino households. Users input their appliances and usage habits, and the app provides live "burn rate" tracking, predicted monthly bills, AI-driven savings tips, community leaderboards, and voice-assisted logging.

---

## EXISTING CODEBASE STRUCTURE

Here's what already exists (DO NOT recreate these — extend them):

```
bh26-HinaraSolutions/
├── .env.example                    # Has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
├── index.html
├── package.json                    # Has: react, supabase-js, @google/genai, express, recharts, lucide-react, motion, tailwindcss, vite
├── vite.config.ts                  # Alias @ = project root, exposes GEMINI_API_KEY
├── tsconfig.json                   # Paths: @/* → ./*
├── src/
│   ├── main.tsx
│   ├── index.css                   # Tailwind v4 with @theme tokens (primary: #705d00, primary-container: #ffd700, etc.)
│   ├── App.tsx                     # Tab router with Supabase auth session check, tabs: dashboard|appliances|insights|community|settings
│   ├── lib/
│   │   ├── supabase.ts             # createClient from env vars
│   │   └── utils.ts                # cn() helper (clsx + tailwind-merge)
│   └── components/
│       ├── Layout.tsx              # Sidebar + Header, has Voice Input button (non-functional), Logout button (works)
│       ├── LandingScreen.tsx       # Marketing landing page (works)
│       ├── LoginScreen.tsx         # Email/password + OAuth (Google/GitHub), sign-up collects appliance quantities in user_metadata
│       ├── DashboardScreen.tsx     # Static mock data, has gauge, mascot, weekly chart, quick log form, AI insights list, community widget
│       ├── AppliancesScreen.tsx    # Reads user_metadata.appliances, shows cards with mock power values, has optimization sidebar
│       ├── AIInsightsScreen.tsx    # Static forecast chart, achievement badges, suggestion cards, "Ask Energy AI" button (non-functional)
│       ├── CommunityScreen.tsx     # Static leaderboard, team challenge, activity feed, invite/join buttons
│       ├── SettingsScreen.tsx      # Static profile form, budget slider, notification toggles, connected devices
│       └── SupabaseSetup.tsx       # Config modal (not currently used in App.tsx)
```

### KEY OBSERVATIONS ABOUT THE EXISTING CODE:
- Auth WORKS (Supabase email/password + OAuth)
- Sign-up stores appliance data in `user_metadata.appliances` as `[{ id, name, quantity, icon }]`
- ALL screens use STATIC MOCK DATA — nothing reads from or writes to Supabase tables
- There are NO Supabase tables created yet (empty project)
- The `@google/genai` package is installed but not used anywhere
- Express is in dependencies but no server file exists
- Voice Input button exists in Layout.tsx but does nothing
- "Ask Energy AI" floating button exists in AIInsightsScreen but does nothing
- Quick Log form exists in DashboardScreen but doesn't submit anywhere
- Meralco rate is hardcoded, no dynamic updates
- No real energy calculations exist — all costs/kWh values are hardcoded strings

---

## WHAT I NEED YOU TO BUILD

### PHASE 1: SUPABASE DATABASE SCHEMA

Create a complete SQL migration file (`supabase/migrations/001_initial_schema.sql`) that I can run in the Supabase SQL Editor. Include:

#### Tables:

1. **`profiles`** (extends auth.users)
   - `id` UUID (FK → auth.users.id, PK)
   - `full_name` TEXT
   - `avatar_url` TEXT
   - `location` TEXT (default: 'Metro Manila')
   - `monthly_budget` NUMERIC (default: 4000)
   - `alert_threshold` INTEGER (default: 80, percentage)
   - `household_size` INTEGER (default: 4)
   - `notify_energy_alerts` BOOLEAN (default: true)
   - `notify_weekly_reports` BOOLEAN (default: true)
   - `notify_community` BOOLEAN (default: false)
   - `notify_badges` BOOLEAN (default: true)
   - `voice_enabled` BOOLEAN (default: true)
   - `created_at`, `updated_at`

2. **`appliances`**
   - `id` UUID (PK, default gen_random_uuid())
   - `user_id` UUID (FK → profiles.id)
   - `appliance_type` TEXT (enum-like: 'ac', 'refrigerator', 'electric_fan', 'washing_machine', 'rice_cooker', 'microwave', 'tv', 'computer', 'water_heater', 'lighting', 'flat_iron', 'water_dispenser', 'router', 'other')
   - `custom_name` TEXT (e.g., "Master Bedroom AC")
   - `wattage` NUMERIC NOT NULL
   - `quantity` INTEGER (default: 1)
   - `is_always_on` BOOLEAN (default: false)
   - `default_daily_hours` NUMERIC (default: 0)
   - `is_active` BOOLEAN (default: true)
   - `created_at`, `updated_at`

3. **`usage_logs`** (daily usage entries)
   - `id` UUID (PK)
   - `user_id` UUID (FK → profiles.id)
   - `appliance_id` UUID (FK → appliances.id)
   - `date` DATE (default: CURRENT_DATE)
   - `hours_used` NUMERIC NOT NULL
   - `estimated_kwh` NUMERIC GENERATED ALWAYS AS (computed from appliance wattage × hours / 1000)
   - `source` TEXT (default: 'manual', options: 'manual', 'voice', 'auto')
   - `created_at`
   - UNIQUE constraint on (appliance_id, date) — one log per appliance per day, upsert on conflict

4. **`energy_rates`**
   - `id` UUID (PK)
   - `provider` TEXT (default: 'Meralco')
   - `rate_per_kwh` NUMERIC NOT NULL (current: 11.8569)
   - `effective_date` DATE
   - `created_at`
   - Most recent row = current rate

5. **`ai_insights`** (cached AI-generated insights per user)
   - `id` UUID (PK)
   - `user_id` UUID (FK → profiles.id)
   - `insight_type` TEXT ('optimization', 'alert', 'achievement', 'forecast')
   - `title` TEXT
   - `description` TEXT
   - `potential_savings` NUMERIC (nullable, in ₱)
   - `is_read` BOOLEAN (default: false)
   - `expires_at` TIMESTAMPTZ
   - `created_at`

6. **`achievements`**
   - `id` UUID (PK)
   - `user_id` UUID (FK → profiles.id)
   - `badge_type` TEXT ('first_week_under_budget', 'seven_day_streak', 'thirty_day_streak', 'off_peak_hero', 'carbon_neutral', 'master_saver', '500kwh_saved', 'community_champion')
   - `earned_at` TIMESTAMPTZ (default: NOW())

7. **`community_teams`**
   - `id` UUID (PK)
   - `name` TEXT (e.g., 'Team Quezon City')
   - `region` TEXT
   - `created_at`

8. **`team_members`**
   - `team_id` UUID (FK → community_teams.id)
   - `user_id` UUID (FK → profiles.id)
   - PK (team_id, user_id)
   - `joined_at`

9. **`challenges`**
   - `id` UUID (PK)
   - `title` TEXT
   - `team_a_id` UUID (FK → community_teams.id)
   - `team_b_id` UUID (FK → community_teams.id)
   - `start_date` DATE
   - `end_date` DATE
   - `is_active` BOOLEAN (default: true)
   - `created_at`

#### Row Level Security (RLS):
- Enable RLS on ALL tables
- Users can only read/write their own data in profiles, appliances, usage_logs, ai_insights, achievements
- energy_rates: readable by all authenticated users, writable by none (admin/service role only)
- community_teams, team_members, challenges: readable by all authenticated users, writable for own membership

#### Database Functions:
- `handle_new_user()` trigger: On auth.users INSERT, create a profiles row and migrate appliances from user_metadata to the appliances table with default wattages
- `get_user_monthly_summary(p_user_id UUID, p_month DATE)`: Returns total_kwh, total_cost, projected_bill, budget_remaining, daily_avg_cost
- `get_leaderboard(p_limit INTEGER)`: Returns top savers by % reduction vs previous month
- `get_team_challenge_stats(p_challenge_id UUID)`: Returns each team's total kWh reduced

#### Default Wattage Constants (used by the trigger and frontend):
Create a reference table or use a CASE statement with these Filipino household defaults:
- ac → 1119W (1.5 HP Inverter), default 8 hrs/day
- refrigerator → 150W, always_on, 24 hrs/day
- electric_fan → 75W, default 10 hrs/day
- washing_machine → 500W, default 1 hr/day
- rice_cooker → 800W, default 1 hr/day
- microwave → 1000W, default 0.5 hrs/day
- tv → 100W, default 5 hrs/day
- computer → 200W, default 6 hrs/day
- water_heater → 1500W, default 0.5 hrs/day
- lighting → 10W (per LED bulb), default 8 hrs/day
- flat_iron → 1000W, default 0.5 hrs/day
- water_dispenser → 100W, always_on, 24 hrs/day
- router → 12W, always_on, 24 hrs/day

#### Seed Data:
- Insert current Meralco rate: ₱11.8569/kWh
- Insert community teams: 'Team Quezon City', 'Team Makati', 'Team Cavite', 'Team Taguig', 'Team Pasig', 'Team Mandaluyong', 'Team Marikina'

---

### PHASE 2: CLIENT-SIDE SERVICE LAYER

Create a `src/lib/` services layer that all components will import from. These replace all hardcoded mock data.

#### File: `src/lib/constants.ts`
```typescript
// Default wattages, appliance type metadata (name, icon emoji, default wattage, default hours, always_on flag)
// Meralco rate fallback
// Budget defaults
// Appliance type → Lucide icon mapping
export const APPLIANCE_DEFAULTS: Record<string, { ... }> = { ... };
export const DEFAULT_RATE_PER_KWH = 11.8569;
```

#### File: `src/lib/energy-calculator.ts`
```typescript
// Pure calculation functions — no API calls
export function calculateDailyKwh(wattage: number, hours: number, quantity: number): number;
export function calculateMonthlyCost(dailyKwh: number, ratePerKwh: number, daysInMonth?: number): number;
export function calculateBurnRate(totalMonthlyEstimate: number, daysElapsed: number, totalDays: number): number;
export function calculateProjectedBill(dailyAvgCost: number, daysInMonth: number): number;
export function calculateBudgetStatus(projected: number, budget: number): 'under' | 'warning' | 'over';
// "What if" scenario calculator
export function calculateWhatIfSavings(currentHours: number, reducedHours: number, wattage: number, rate: number): number;
```

#### File: `src/lib/api.ts`
```typescript
// All Supabase CRUD operations
import { supabase } from './supabase';

// PROFILES
export async function getProfile(userId: string): Promise<Profile>;
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile>;

// APPLIANCES
export async function getUserAppliances(userId: string): Promise<Appliance[]>;
export async function addAppliance(userId: string, appliance: NewAppliance): Promise<Appliance>;
export async function updateAppliance(id: string, updates: Partial<Appliance>): Promise<Appliance>;
export async function deleteAppliance(id: string): Promise<void>;

// USAGE LOGS
export async function logUsage(log: NewUsageLog): Promise<UsageLog>; // upsert by appliance_id + date
export async function getUserUsageLogs(userId: string, startDate: Date, endDate: Date): Promise<UsageLog[]>;
export async function getTodaysUsage(userId: string): Promise<UsageLog[]>;

// ENERGY RATES
export async function getCurrentRate(): Promise<number>;

// DASHBOARD AGGREGATES
export async function getDashboardData(userId: string): Promise<DashboardData>;
// This calls the get_user_monthly_summary RPC and combines with appliance data

// INSIGHTS
export async function getUserInsights(userId: string): Promise<AiInsight[]>;
export async function markInsightRead(insightId: string): Promise<void>;

// ACHIEVEMENTS
export async function getUserAchievements(userId: string): Promise<Achievement[]>;
export async function checkAndAwardAchievements(userId: string): Promise<Achievement[]>;

// COMMUNITY
export async function getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
export async function getActiveChallenges(): Promise<Challenge[]>;
export async function joinTeam(userId: string, teamId: string): Promise<void>;
export async function getTeams(): Promise<CommunityTeam[]>;

// TYPES (export all from here or separate types.ts)
export interface Profile { ... }
export interface Appliance { ... }
export interface UsageLog { ... }
export interface DashboardData { totalKwh, totalCost, projectedBill, burnRate, budgetRemaining, budgetStatus, dailyAvgCost, daysLeft, percentUsed }
// etc.
```

#### File: `src/lib/types.ts`
Define all TypeScript interfaces matching the Supabase schema. Export everything.

#### File: `src/hooks/useAuth.ts`
```typescript
// Custom hook that provides: user, profile, session, loading, signOut
// Auto-fetches profile on session change
// Provides updateProfile method
```

#### File: `src/hooks/useDashboard.ts`
```typescript
// Custom hook: fetches and computes all dashboard data
// Returns: { dashboardData, todaysUsage, weeklyData, loading, refresh }
// Auto-refreshes on usage log changes (Supabase realtime subscription)
```

#### File: `src/hooks/useAppliances.ts`
```typescript
// Custom hook: CRUD for appliances
// Returns: { appliances, addAppliance, updateAppliance, deleteAppliance, loading }
```

---

### PHASE 3: EXPRESS BACKEND SERVER

Create `server/` directory with a lightweight Express API server for things that can't run client-side (AI inference, voice processing, rate scraping).

#### File: `server/index.ts`
```typescript
// Express server entry point
// Middleware: cors, json parser, Supabase service-role auth verification
// Routes: /api/ai/*, /api/voice/*, /api/rates/*
// Port: 3001
```

#### File: `server/routes/ai.ts`
```typescript
// POST /api/ai/generate-insights
// - Receives: userId, appliance data, usage patterns, current rate
// - Calls Google Gemini API (@google/genai) with a structured prompt
// - Prompt template asks Gemini to analyze the user's energy data and return JSON with:
//   - 3-5 personalized optimization tips with potential ₱ savings
//   - Predicted bill accuracy assessment
//   - Appliance-specific recommendations
//   - Weather-adjusted advice (if weather data provided)
// - Stores results in ai_insights table
// - Returns insights array

// POST /api/ai/chat
// - Receives: userId, message (from "Ask Energy AI" button)
// - Fetches user's appliance & usage context from Supabase
// - Sends to Gemini with system prompt:
//   "You are Zippy, the WattZup energy assistant. You're a friendly Filipino energy advisor.
//    You speak in a mix of English and light Filipino (Taglish). You give practical, specific
//    advice about electricity savings based on the user's actual appliance data and usage patterns.
//    Always reference their specific appliances and ₱ amounts. Be encouraging and use ⚡ emoji."
// - Returns AI response text

// POST /api/ai/what-if
// - Receives: scenario parameters (appliance changes)
// - Uses Gemini to generate a natural language summary of the impact
// - Returns structured savings prediction + narrative explanation
```

#### File: `server/routes/voice.ts`
```typescript
// POST /api/voice/transcribe
// - Receives: audio blob (from Web Speech API or file upload)
// - Option A (recommended, free): Use the Web Speech API on the CLIENT side (browser-native),
//   then send the transcribed text here for parsing
// - This endpoint receives the TRANSCRIBED TEXT and:
//   - Uses Gemini to parse natural language into structured usage log data
//   - Example: "I used the AC for 6 hours and the fan for 12 hours today"
//     → [{ appliance_type: 'ac', hours: 6, date: today }, { appliance_type: 'electric_fan', hours: 12, date: today }]
//   - Validates against user's registered appliances
//   - Calls the usage log upsert for each parsed entry
//   - Returns: { parsed_entries: [...], confirmation_text: "Got it! Logged 6h AC and 12h fan for today. ⚡" }
```

#### File: `server/routes/rates.ts`
```typescript
// GET /api/rates/current
// - Returns the most recent rate from energy_rates table
//
// POST /api/rates/update (protected — admin only or cron job)
// - Fetches current Meralco rate from a public source or hardcoded update
// - Inserts new row into energy_rates table
// - NOTE: Meralco doesn't have a public API. Options:
//   a) Manual update via admin endpoint
//   b) Scrape from meralco.com.ph (fragile)
//   c) Hardcode and update monthly
//   Recommend option (a) with a simple admin UI in settings
```

#### File: `server/lib/gemini.ts`
```typescript
// Gemini API client wrapper
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateInsights(context: UserEnergyContext): Promise<Insight[]>;
export async function chatWithAI(message: string, context: UserEnergyContext): Promise<string>;
export async function parseVoiceInput(transcript: string, userAppliances: Appliance[]): Promise<ParsedUsageEntry[]>;
```

#### File: `server/lib/ml-predictor.ts`
```typescript
// Q-Learning / Predictive Model for bill estimation
// This is a SIMPLIFIED version suitable for a hackathon/MVP:
//
// The "ML model" works as follows:
// 1. BASELINE PREDICTION: Sum of (appliance_wattage × daily_hours × quantity × days_remaining × rate) for all appliances
// 2. HISTORICAL ADJUSTMENT: If user has 7+ days of usage_logs, calculate the actual vs predicted ratio
//    and apply as a correction factor (simple exponential moving average)
// 3. WEATHER ADJUSTMENT: If temperature > 32°C, increase AC predictions by 15-25% (more runtime expected)
//    If temperature < 25°C, decrease AC predictions by 10%
// 4. TREND DETECTION: Compare last 7 days average to previous 7 days. If increasing trend, project forward.
//
// This is NOT a full Q-learning implementation but achieves the "wow factor" of adaptive predictions
// that improve over time as the user logs more data.
//
// Export:
export function predictMonthlyBill(params: {
  appliances: Appliance[],
  usageLogs: UsageLog[],
  ratePerKwh: number,
  currentDayOfMonth: number,
  daysInMonth: number,
  temperature?: number,
}): {
  predictedBill: number,
  confidence: { low: number, high: number },
  adjustmentFactors: { historical: number, weather: number, trend: number },
  dailyForecast: { date: string, predictedKwh: number }[]
};
```

---

### PHASE 4: VOICE INPUT INTEGRATION

#### File: `src/lib/voice.ts`
```typescript
// Client-side voice input using the Web Speech API (FREE, no API key needed)
//
// Uses browser's built-in SpeechRecognition API
// Falls back gracefully if not supported (show error toast)
//
// Flow:
// 1. User clicks 🎤 Voice Input button in Layout.tsx sidebar
// 2. Opens a modal/overlay with a pulsing mic animation
// 3. SpeechRecognition starts listening
// 4. Shows live transcript as user speaks
// 5. On speech end, sends transcript to POST /api/voice/transcribe
// 6. Server parses with Gemini and returns structured entries
// 7. Client shows confirmation: "Logged: AC 6h, Fan 12h ⚡"
// 8. Usage logs are created/updated in Supabase
//
// Export:
export function startListening(onTranscript: (text: string) => void, onEnd: () => void): void;
export function stopListening(): void;
export function isSupported(): boolean;
```

#### File: `src/components/VoiceInputModal.tsx`
```typescript
// Full voice input UI component
// - Pulsing yellow mic circle when listening
// - Live transcript display
// - "Processing..." state when sending to server
// - Confirmation with parsed entries
// - Error handling for unsupported browsers
```

---

### PHASE 5: COMPONENT REWIRING

Now update ALL existing components to use real data. For each component, specify EXACTLY what changes:

#### `src/App.tsx` — Changes:
- Wrap with context providers (AuthProvider, or pass user/profile down)
- No structural changes needed, auth flow already works

#### `src/components/DashboardScreen.tsx` — Changes:
- Import and use `useDashboard()` hook
- Replace ALL hardcoded values:
  - "₱125 per day" → `dashboardData.burnRate`
  - "₱3,850" predicted bill → `dashboardData.projectedBill`
  - "Under Budget" → based on `dashboardData.budgetStatus`
  - weeklyData array → from `useDashboard().weeklyData`
  - Alert banner text → dynamic based on projectedBill vs budget
  - Mascot speech bubble → rotate through latest ai_insights
  - Quick Log form → calls `api.logUsage()` on submit, refreshes dashboard
  - AI Insights sidebar list → from `api.getUserInsights()`
  - Community Savings widget → from `api.getLeaderboard(3)`
  - userAppliances dropdown → from `useAppliances().appliances`

#### `src/components/AppliancesScreen.tsx` — Changes:
- Import `useAppliances()` hook
- Replace mock appliance cards with real data from Supabase `appliances` table
- "Add New Appliance" button → opens a real form modal that:
  - Lets user select type (with auto-filled wattage from APPLIANCE_DEFAULTS)
  - Calls `api.addAppliance()`
  - Refreshes list
- Each appliance card shows REAL calculated cost: `calculateMonthlyCost(wattage * quantity, hours, rate)`
- Toggle switch on each card → calls `api.updateAppliance(id, { is_active })`
- Optimization sidebar → populated from `ai_insights` where type = 'optimization'
- Chart bars in each card → from last 7 days of usage_logs for that appliance

#### `src/components/AIInsightsScreen.tsx` — Changes:
- Forecast chart → real data from `usage_logs` (last 7 days actual) + `ml-predictor` predictions
- Achievement badges → from `api.getUserAchievements()`, show earned vs locked
- Optimization suggestions → from `api.getUserInsights()` where type = 'optimization'
- "Ask Energy AI" button → opens a chat modal that:
  - Shows a text input
  - Sends to POST /api/ai/chat
  - Displays AI response in a Zippy-style speech bubble
  - Maintains conversation history in state
- Hero section stats → from real calculated data
- "₱450 this month" → actual calculated savings vs previous month

#### `src/components/CommunityScreen.tsx` — Changes:
- Leaderboard → from `api.getLeaderboard(10)`
- "You (Sarah)" → current user's actual position
- Team challenge → from `api.getActiveChallenges()`
- Activity feed → from a Supabase query on recent achievements across all users (public data)
- "Invite Friends" → generate a referral link
- "Browse Local" → show list of teams from `api.getTeams()`

#### `src/components/SettingsScreen.tsx` — Changes:
- Profile form → populated from `api.getProfile()`, saves with `api.updateProfile()`
- Budget slider → reads/writes `profiles.monthly_budget`
- Alert threshold slider → reads/writes `profiles.alert_threshold`
- Notification toggles → reads/writes profile notification fields
- Connected Devices → reads from `appliances` table (acts as alias for "My Appliances")
- "Save Changes" button → actually saves

#### `src/components/Layout.tsx` — Changes:
- Voice Input button → triggers `VoiceInputModal`
- "Your Impact" CO2 display → calculated: total_kwh_saved × 0.7 kg CO2/kWh (Philippine grid emission factor)
- Notification bell → shows count of unread `ai_insights`

---

### PHASE 6: ENVIRONMENT VARIABLES

Update `.env.example` to:
```env
# Supabase (Client-side)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase (Server-side — for service role operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Server
PORT=3001
```

---

### PHASE 7: PACKAGE.JSON UPDATES

Add these scripts:
```json
{
  "scripts": {
    "dev": "concurrently \"vite --port=3000 --host=0.0.0.0\" \"tsx watch server/index.ts\"",
    "dev:client": "vite --port=3000 --host=0.0.0.0",
    "dev:server": "tsx watch server/index.ts",
    "build": "vite build",
    "start:server": "tsx server/index.ts"
  }
}
```

Add these dependencies if missing:
```
concurrently, cors, @types/cors
```

---

### PHASE 8: VITE PROXY CONFIG

Update `vite.config.ts` to proxy `/api` requests to the Express server:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

---

## COMPLETE FILE MAP (what you need to create/modify)

### NEW FILES TO CREATE:
```
supabase/
└── migrations/
    └── 001_initial_schema.sql        ← Full SQL schema + RLS + triggers + seed data

server/
├── index.ts                          ← Express entry point
├── middleware/
│   └── auth.ts                       ← Supabase JWT verification middleware
├── routes/
│   ├── ai.ts                         ← /api/ai/* routes (insights, chat, what-if)
│   ├── voice.ts                      ← /api/voice/* routes (parse transcript)
│   └── rates.ts                      ← /api/rates/* routes
└── lib/
    ├── gemini.ts                     ← Google Gemini client wrapper
    ├── ml-predictor.ts               ← Bill prediction engine
    └── supabase-admin.ts             ← Supabase service-role client

src/lib/
├── constants.ts                      ← Appliance defaults, rate constants
├── energy-calculator.ts              ← Pure calculation functions
├── api.ts                            ← All Supabase CRUD operations
├── types.ts                          ← TypeScript interfaces
└── voice.ts                          ← Web Speech API client

src/hooks/
├── useAuth.ts                        ← Auth + profile hook
├── useDashboard.ts                   ← Dashboard data hook
└── useAppliances.ts                  ← Appliance CRUD hook

src/components/
└── VoiceInputModal.tsx               ← Voice input UI
```

### EXISTING FILES TO MODIFY:
```
.env.example                          ← Add GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, PORT
package.json                          ← Add scripts + dependencies
vite.config.ts                        ← Add proxy config
src/components/DashboardScreen.tsx     ← Wire to real data
src/components/AppliancesScreen.tsx    ← Wire to real CRUD
src/components/AIInsightsScreen.tsx    ← Wire to AI + real data
src/components/CommunityScreen.tsx     ← Wire to leaderboard + challenges
src/components/SettingsScreen.tsx      ← Wire to profile CRUD
src/components/Layout.tsx             ← Wire voice + notifications
```

---

## IMPLEMENTATION RULES

1. **Preserve all existing UI/styling** — Do NOT change any Tailwind classes, component structure, or visual design. Only add data fetching, state management, and event handlers.
2. **Use the existing Tailwind v4 @theme tokens** — All colors reference the existing CSS custom properties (primary, primary-container, surface, etc.)
3. **Filipino-specific context** — All calculations use Philippine Peso (₱), Meralco rates, Filipino appliance names, and Philippine grid emission factors.
4. **Error handling everywhere** — Every API call should have try/catch, show user-friendly error toasts, and have loading states.
5. **TypeScript strict** — All functions fully typed, no `any` types except where matching existing code patterns.
6. **Supabase Realtime** — Use Supabase realtime subscriptions in `useDashboard` so the dashboard updates live when new usage logs are inserted.
7. **Progressive enhancement for voice** — If Web Speech API is not supported, disable the voice button and show a tooltip explaining it's not available in this browser.
8. **The ML predictor runs SERVER-SIDE** — Predictions are computed on the Express server and returned via API. The client never runs ML logic directly.
9. **Gemini prompts must be Filipino-contextualized** — Reference Meralco, Philippine weather, Filipino household patterns, and use Taglish in the chatbot personality.
10. **All monetary values in ₱** — Format with `₱` prefix and 2 decimal places for display, store as NUMERIC in Supabase.

---

## OUTPUT FORMAT

Generate ALL files listed above with COMPLETE, production-ready code. No placeholders, no "// TODO", no "implement this later". Every function body must be fully implemented. Start with the SQL migration, then the server, then the client services, then the component modifications.

For each modified component, show the COMPLETE updated file (not just diffs) so I can copy-paste replace.
```

---

## AFTER RUNNING THIS PROMPT

### Setup Checklist:
1. **Run the SQL migration** in your Supabase Dashboard → SQL Editor
2. **Set up Supabase Auth providers** (Email + Google + GitHub) in Dashboard → Auth → Providers
3. **Create `.env`** from `.env.example` with your real keys
4. **Install new dependencies**: `npm install concurrently cors @types/cors`
5. **Start both servers**: `npm run dev`
6. **Test the flow**: Sign up → Add appliances → Log usage → See predictions update

### API Keys You Need:
| Key | Where to Get It | Cost |
|-----|----------------|------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API | Free tier available |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Free tier available |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Free tier available |
| `GEMINI_API_KEY` | Google AI Studio (aistudio.google.com) | Free tier: 15 RPM |
| Voice Input | None needed — uses browser Web Speech API | Free |
