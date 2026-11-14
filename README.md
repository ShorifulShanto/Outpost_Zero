# OUTPOST ZERO

**Explore. Build. Survive. Discover.**

Outpost Zero is a responsive, browser-based educational Mars survival simulator and space science platform designed primarily for learners aged **7–12**, while remaining engaging for teenagers, teachers, parents, and space enthusiasts.

---

## 1. Project Introduction

Living on Mars requires solving interconnected engineering challenges. Unlike Earth, Mars has a thin carbon dioxide atmosphere, freezing temperatures, dust storms, heightened space radiation, and a multi-minute radio communication delay with Earth.

**Outpost Zero** puts learners in command of a 4-astronaut research outpost across **10 Martian Sols** (Martian days), combining a deterministic systems simulation with a 10-module learning hub, an interactive Knowledge Check Quiz, and a NASA space-weather data observatory.

---

## 2. Project Objectives

- Teach young learners how **life support**, **power**, **radiation shielding**, **greenhouse food production**, and **communication delays** depend on one another.
- Encourage systems thinking through a **"no free choices"** rule where every engineering action produces both benefits and trade-offs.
- Explain real-world spaceflight science in accessible, encouraging, age-appropriate language.
- Connect gameplay with authentic public space research from NASA and the Canadian Space Agency (CSA) while remaining fully playable offline.

---

## 3. Main Features

- **Space Explorer Home Page**: Mission introduction, interactive Outpost Zero habitat schematic, Mars environmental challenge facts, and featured topic cards for Life Support, Power, and Radiation.
- **10-Sol Mars Mission Simulator**:
  - Tracks **Life Support**, **Power**, and **Radiation Protection** (`0–100%`) with progress bars, numeric indicators, status labels (`Nominal`, `Caution`, `Critical`), icons, and plain-language tooltips.
  - Features **15 distinct Mars events** across seeded Sol windows (`COM-01` Solar Conjunction, `COM-02` Comm Equipment Failure, `PWR-01` Solar Panel Dust, `PWR-02` Battery Inverter Fault, `ENV-01` Regional Dust Storm, `LSS-01/02/03`, `BIO-01` Greenhouse Thermal Alert, `RAD-01` Solar Particle Event Warning, `HAB-00/01/02`, `ROV-01` Rover Failure, `SUP-01` Spare Parts Shortage, and `CREW-01` Crew Fatigue & Minor Strain).
  - Includes a **Communication Delay & Crew Autonomy System** explaining the 3–22 minute one-way (6–44 minute round-trip) speed-of-light delay and Solar Conjunction disruptions, a non-blocking 6-second simulated countdown (*"Simulated communication delay — shortened for gameplay"*), and an interactive 5-part **Detailed Report to Earth** sender.
  - Integrates a **Mars Environment Panel** (`~95% CO2`, `<1% Earth pressure`, `~-53°C` average, dust storms, terrain), **Solar Power & Dust Operations** (~45% max solar flux, ~0.2%/Sol dust benchmark, Emergency Power-Saving Mode, storm-locked panel cleaning, educational alternative power concepts), and **Radiation Protection & Storm Shelter** (GCR vs. SPE, water/polyethylene/regolith shielding, crew shelter controls, and Mars Ice Home research-design disclosure).
  - Supports Pause/Resume, double-execution prevention, `localStorage` persistence with legacy backfill and corrupted-save recovery, End-of-Sol summaries, and an End-of-Mission Report with a **100-Point Mission Performance Score (`30 / 25 / 25 / 20`)**, evidence-based **Mission Control Advisor** recommendations, and a Recharts resource history line chart.
- **Mars Greenhouse Subsystem**:
  - Displays food reserves, crop growth stage/progress, greenhouse health, water availability, greenhouse power draw, irrigation status, and harvest readiness.
  - Provides four interactive trade-off actions (maintain equipment, allocate power to plant growth, repair irrigation, and harvest crops when 100% ready) plus a child-friendly Mars plant science guide.
- **Space Learning Hub (`/learn`)**:
  - **12 interactive educational modules** for ages 7–12 with key facts, NASA examples, **verified NASA OSDR, RadLab, Mars Trek, and CSA research benchmarks**, click-to-reveal vocabulary tooltips, inline module checks, and an offline **12-question Knowledge Check Quiz** with score tracking and replay.
- **NASA & Space Research Observatory (`/observatory`)**:
  - Integrates NASA's official **DONKI Solar Flares (`FLR`) & Coronal Mass Ejections (`CME`)**, **Astronomy Picture of the Day (`APOD`)**, **NASA Image and Video Library (`images-api.nasa.gov/search`)**, and **NASA OSDR (`osdr.nasa.gov/osdr/data/search`)** covering bone, muscle, immune, and sleep/circadian spaceflight studies.
  - Features response validation, local TTL caching (`15 min` DONKI / `30 min` APOD & Images / `60 min` OSDR), rate-limit handling (`HTTP 429`), reliable offline fallback datasets, and a 4-category transparency legend (**Live NASA Data**, **Cached NASA Data**, **Archived NASA Data**, **Educational & Simulated**).
  - Includes a **NASA RadLab & MSL RAD Dosimetry** comparison (preserving `mGy/day` vs. `mSv/day` and ISS LEO vs. Mars surface context), **NASA Mars Trek Jezero Crater Terrain** profile, **Canadian Space Agency (CSA)** food/nutrition/STEM resources, and a unified **Data Sources & Space Agency Resources Directory** with all 7 official agency portals.
  - Supplies DONKI, OSDR, RadLab, Mars Trek, and CSA scientific context to Mission Control Advisor recommendations without altering deterministic gameplay math.
- **About Page (`/about`)**:
  - Explains educational goals, simulator trade-offs, scientific simplifications, research attributions, and independent non-endorsed status.

---

## 4. Technology Stack

Based on `package.json`:

- **Framework**: React `^19.0.1`, React DOM `^19.0.1`
- **Language**: TypeScript `^7.0.2`
- **Build Tool**: Vite `^8.3.0` (`@vitejs/plugin-react ^6.1.1`)
- **Styling**: Tailwind CSS `^4.3.3` (`@tailwindcss/vite ^4.3.3`)
- **Charts**: Recharts
- **Icons**: Lucide React `^0.546.0`
- **Testing Runner**: Node.js built-in test runner (`node:test`) executed via `tsx ^4.21.0`

---

## 5. Project Structure

```text
/
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── tests/
│   └── outpostZero.test.ts             # 19 deterministic engine, subsystem, advisor, storage & NASA/CSA tests
└── src/
    ├── App.tsx                         # Root router, simulator state & localStorage sync
    ├── index.css                       # Tailwind CSS v4, typography, starfield & focus styles
    ├── main.tsx                        # React entry point
    ├── types/
    │   └── mission.ts                  # Core TypeScript interfaces (GameState, Advisor, Subsystems)
    ├── engine/
    │   ├── gameEngine.ts               # Pure deterministic mission, power, shelter & greenhouse engine
    │   ├── missionAdvisor.ts           # 100-point rubric & evidence-based advisor evaluation
    │   └── missionData.ts              # 10-Sol config, environment facts, power concepts & 15 events
    ├── data/
    │   ├── learnModules.ts             # 12 learning modules, vocabulary & offline quiz questions
    │   └── spaceResearchData.ts        # Verified RadLab dosimetry, Mars Trek terrain, CSA & 7-source directory
    ├── services/
    │   ├── nasaCache.ts                # Safe TTL cache (localStorage + memory fallback) & URL sanitizer
    │   ├── nasaDonkiService.ts         # NASA DONKI FLR & CME client, validator, cache & radiation context
    │   ├── nasaMediaService.ts         # NASA APOD & Image Library (images-api.nasa.gov) client & fallback
    │   └── nasaOsdrService.ts          # NASA OSDR space-biology query client (bone, muscle, immune, sleep)
    ├── utils/
    │   └── storage.ts                  # LocalStorage persistence, backfill & schema validation
    └── components/
        ├── Navbar.tsx                  # Responsive 72px 3-zone navigation header
        ├── HomePage.tsx                # Space Explorer landing page
        ├── OutpostSchematic.tsx        # Interactive vector habitat engineering diagram
        ├── MissionSimulator.tsx        # 10-Sol simulator console, subsystems deck & turn flow
        ├── ResourceCard.tsx            # Primary resource meter, sub-metrics & tooltip
        ├── GreenhousePanel.tsx         # Mars Greenhouse subsystem UI & plant science guide
        ├── MarsEnvironmentPanel.tsx    # Live weather/temp & expandable Mars environment facts
        ├── PowerOperationsPanel.tsx    # Dust, storm lock, power-saving & alternative power concepts
        ├── RadiationShelterPanel.tsx   # Crew shelter controls, GCR vs SPE & Mars Ice Home context
        ├── CommunicationDelayPanel.tsx # Earth 6s delay simulator, conjunction notice & Earth report
        ├── MissionReportView.tsx       # 100-pt rubric, Advisor feedback, Recharts graph & log
        ├── LearnPage.tsx               # 12 modules + offline Knowledge Check Quiz
        ├── ObservatoryPage.tsx         # Live/archived DONKI solar flares & NASA archive portals
        └── AboutPage.tsx               # Educational overview, simplifications & attributions
```

---

## 6. Local Setup Instructions

### Prerequisites

- **Node.js** 20+ (tested on Node `v22.23.2`)
- **npm** (included with Node.js)

### 7. Installation Commands

```bash
npm install
```

### 8. Development Server Command

```bash
npm run dev
```

This runs `vite --port=3000 --host=0.0.0.0`, serving the application locally at `http://localhost:3000`.

### 9. Production Build Command

```bash
npm run build
```

To preview the built production bundle locally:

```bash
npm run preview
```

---

## 10. NASA API Configuration

The NASA Data Observatory and Radiation Advisor context connect to four official public NASA endpoints:

- **NASA DONKI Solar Flares**: `https://api.nasa.gov/DONKI/FLR` (`startDate`, `endDate`, `api_key`)
- **NASA DONKI Coronal Mass Ejections**: `https://api.nasa.gov/DONKI/CME` (`startDate`, `endDate`, `api_key`)
- **NASA Astronomy Picture of the Day**: `https://api.nasa.gov/planetary/apod` (`api_key`, `thumbs=true`)
- **NASA Image and Video Library**: `https://images-api.nasa.gov/search` (`q`, `media_type=image`, `page_size=8` — no API key required)

For keyed endpoints, `api_key` resolves from `import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'`. NASA observations supply scientific context only and never alter deterministic simulator calculations.

### 11. `VITE_NASA_API_KEY` Configuration

By default, the app uses NASA's public `DEMO_KEY` (which has stricter hourly/daily rate limits). To use your own free NASA Open APIs key locally:

1. Copy `.env.example` to `.env.local` (never commit `.env.local`).
2. Set:
   ```env
   VITE_NASA_API_KEY="YOUR_FREE_NASA_API_KEY"
   ```
3. Restart the Vite dev server (`npm run dev`).

### 12. Client-Side Environment Variable Security Note

Any environment variable prefixed with `VITE_` is embedded directly into the client-side JavaScript bundle by Vite and is **publicly visible to anyone inspecting network requests or browser source code**.

- **Only** use public/rate-limited client keys such as a free NASA Open APIs key in `VITE_NASA_API_KEY`.
- **Never** place private secrets, database credentials, or server-only API keys (such as `GEMINI_API_KEY`) in any `VITE_` variable.

---

## 13. NASA and CSA Data Sources

Outpost Zero references the following seven official public space agency resources, clearly labeled by data category:

- **NASA Open APIs (`Live Data`)**: APOD and DONKI API gateway (`https://api.nasa.gov/`).
- **NASA DONKI (`Live Data` + `Archived Reference`)**: Solar Flares (`FLR`) and Coronal Mass Ejections (`CME`) (`https://kauai.ccmc.gsfc.nasa.gov/DONKI/`).
- **NASA Image and Video Library (`Live Data`)**: Official Perseverance, Curiosity, and Mars imagery (`https://images.nasa.gov/`, `https://images-api.nasa.gov/search`).
- **NASA OSDR (`Historical Research` + `Live Metadata Query`)**: Real spaceflight biology accessions (`OSD-352` bone, `OSD-47` muscle, `OSD-738` immune, `OSD-253` sleep/circadian) (`https://osdr.nasa.gov/`).
- **NASA RadLab & MSL RAD (`Historical Research`)**: ISS TEPC (`~0.27–0.37 mGy/day`, `~0.50–1.0+ mSv/day`) and Curiosity RAD Mars surface (`~0.21–0.48 mGy/day`, `~0.64–0.67 mSv/day`) dosimetry (`https://visualization.osdr.nasa.gov/radlab/`). *Note: Absorbed dose (`mGy`) and dose equivalent (`mSv`) are distinct units, and ISS Low Earth Orbit measurements are never conflated with Mars surface data.*
- **NASA Mars Trek (`Terrain Information`)**: Jezero Crater elevation (`~2,700 m` below datum, `~500–800+ m` rim relief) and rover hazard terrain context (`https://trek.nasa.gov/mars/`).
- **Canadian Space Agency (`Educational Material`)**: Controlled Environment Agriculture (Naurvik, Deep Space Food Challenge), astronaut nutrition (`1,900–3,200 kcal/day`), crew health, and youth STEM programs (`https://www.asc-csa.gc.ca/eng/youth-educators/` & `https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/eating-in-space.asp`).

*Independent Educational Project Notice: Outpost Zero is not officially endorsed, sponsored, or affiliated with NASA or the Canadian Space Agency, and displays no official NASA logos.*

---

## 14. Scientific Limitations

- Habitat health (`Life Support`, `Power`, `Radiation Protection`) is modeled on a simplified `0–100%` scale for ages 7–12 rather than physical mass/energy units (kg, kWh, mSv).
- Crop growth stages progress within a 10-Sol game window as a game-balancing assumption rather than real multi-week agricultural timelines.
- The 4–24 minute one-way Earth–Mars light-time communication delay is shortened to a 6-second gameplay countdown.
- Real Mars habitat engineering requires detailed thermal, chemical, orbital, and biomedical modeling.

---

## 15. Offline Behavior and Archived Fallback

Outpost Zero is built so the entire educational game works **without an internet connection**:

- The Home Page, 10-Sol Mission Simulator, Greenhouse Subsystem, 12 Learn Modules, Knowledge Check Quiz, and `localStorage` save/restore run 100% client-side.
- Validated live responses are cached locally with TTL (`15 min` for DONKI FLR/CME; `30 min` for APOD and NASA Image Library) and labeled `CACHED NASA DATA` when served from cache.
- If any NASA API is offline, rate-limited (`HTTP 429`), times out, or returns zero/invalid records, `src/services/nasaDonkiService.ts` and `src/services/nasaMediaService.ts` fall back cleanly to archived educational reference datasets and display:
  > *"NASA live data is temporarily unavailable. Showing archived educational information."*
- The `REAL NASA DATA (LIVE)` badge is displayed **only** when validated records were freshly retrieved from a live NASA endpoint.

---

## 16. Testing Instructions

Run TypeScript type-checking (`tsc --noEmit`):

```bash
npm run lint
```

Run the automated unit & integration test suite (game engine, greenhouse rules, `localStorage` recovery, learn/quiz integrity, and NASA DONKI service fallback):

```bash
npx tsx --test tests/outpostZero.test.ts
```

Verify the production Vite bundle compiles cleanly:

```bash
npm run build
```

---

## 17. Vercel Deployment Steps

Outpost Zero builds as a static Single-Page Application (SPA) with Vite:

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Import the project in **Vercel**.
3. Set **Framework Preset** to `Vite`.
4. Confirm build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. *(Optional)* Add `VITE_NASA_API_KEY` in Vercel Project **Environment Variables** if you do not want to rely on `DEMO_KEY`.
6. Deploy. Because navigation is handled via React state inside `src/App.tsx`, no custom server rewrites are needed.

---

## 18. GitHub Pages Deployment Steps

GitHub Pages is supported because Outpost Zero is a client-side Vite React SPA using state-based navigation.

- **If deploying to a user/organization root site** (`https://<username>.github.io/`):
  1. Run `npm run build`.
  2. Publish the generated `dist/` folder to your `gh-pages` branch or GitHub Pages workflow.
- **If deploying to a project subpath** (`https://<username>.github.io/<repo-name>/`):
  `vite.config.ts` currently uses Vite's default `base: '/'`. Build with the repository base path flag so asset URLs resolve under the subpath:
  ```bash
  npx vite build --base=/<repo-name>/
  ```
  Then publish the contents of `dist/` using `gh-pages` or GitHub Actions (`actions/upload-pages-artifact` + `actions/deploy-pages`).

---

## 19. Known Limitations and Future Improvements

- **Known Limitations**:
  - NASA `DEMO_KEY` shares public hourly/daily rate limits; heavy traffic without a custom `VITE_NASA_API_KEY` will trigger `HTTP 429` and fall back cleanly to cached or archived educational datasets.
  - Client-side `DONKI` queries use the user's browser clock (`YYYY-MM-DD`); if a device clock is set to a future date, NASA's API may return no records and trigger the archived fallback.
  - Mission persistence is browser-local (`localStorage`) with no cloud account sync.
- **Future Improvements**:
  - Add difficulty presets (Explorer vs. Flight Director modes) and classroom teacher summary exports.
  - Expand the NASA Observatory with interactive Mars Trek elevation cross-sections and orbital geometry visualizers.
  - Add keyboard-shortcut hints and printable mission certificates at the end of a successful 10-Sol run.
