# Outpost Zero

**Explore. Build. Survive. Discover.** · *Blast Off to Something New*

Outpost Zero is an interactive **10-Sol Mars habitat engineering simulator** and space-science learning web application designed for young explorers (**ages 7–12**), parents, classrooms, and space enthusiasts. Command a 4-astronaut crew at Jezero Crater, navigate genuine engineering trade-offs where no choice is free, inspect live and archived NASA/CSA space science, and earn your downloadable Flight Certificate.

---

## Features

- **10-Sol Mars Mission Simulator**
  - Manage **Life Support**, **Power**, and **Radiation Protection** (`0–100%`) across 10 Martian Sols using a strict **"no free choices"** trade-off engine across 16 mission events.
  - **4-Astronaut Crew**: Lead Commander **Maya Chen**, Botanist **Mateo Silva**, Systems Engineer **Priya Nair**, and Medical Officer **Leo Vance**.
  - **3 Jezero Crater Landing Zones**: Choose between *Jezero Crater Floor* (balanced), *Neretva Vallis Delta* (+Life Support & water ice, dustier solar panels), and *Jezero Rim Ridge* (+Sunlight & elevation, steeper rover wear).
  - **Space Weather Modes**: Play a balanced 10-Sol baseline mission or switch to **NASA DONKI Mode** to face real-world solar-storm dynamics (including a Sol 2 Solar Particle Event).
  - **Live Mars Scene Visualizer**: Animated habitat window (`MarsSpaceCanvas`) showing sunlight levels, red dust coating solar panels, dust storms, frost, and radiation hazards so young players visually understand every constraint.
  - **Interactive Habitat Subsystems**:
    - *Mars Greenhouse*: Maintain equipment, boost grow lights, clear clogged irrigation valves, and harvest crops.
    - *Solar Power & Dust Operations*: Brush dust off panels (locked during active dust storms) and toggle low-power survival mode.
    - *Radiation Shelter*: Move astronauts inside water-and-polyethylene storm shelters and reinforce shielding during solar flares.
    - *Earth–Mars Communication Delay*: Live orbital distance and one-way light-time readout (`3–22 min` real delay simulated as a kid-friendly 6-second countdown with optional radio chime).
  - **Two-Tier Reset**: Use **Restart** for a quick replay with a fresh Mission Code (`OZ-####`), or **Full Reset (Demo)** for classroom and exhibition kiosks.

- **100-Point Mission Report & Downloadable Certificate**
  - View a clear score breakdown (`Life Support 30 + Power 25 + Radiation 25 + Decisions 20`), Mission Control Advisor feedback, an interactive 10-Sol resource chart, and a full Sol-by-Sol decision log.
  - Enter your **Commander Name** and click **Download Certificate** to save a high-resolution PNG Flight Certificate with your rank and score.

- **Space Learning Hub & Dynamic 36-Question Quiz**
  - **12 Bite-Sized STEM Lessons** covering Martian Sols, oxygen recycling, hydroponic food, solar power, dust storms, radiation shielding, communication delays, and astronaut health—each with rotating **Quick Check** practice questions.
  - **Never-Repeating Knowledge Check Quiz**: Powered by a **36-question bank** dealt in **non-overlapping 12-question batches** (`Batch #1`, `Batch #2`, `Batch #3`) with shuffled answer choices and a `New Question Batch` button for endless replayability.

- **9 Explorer Medals**
  - Unlock **Bronze**, **Silver**, and **Gold** medals across gameplay, 3D habitat dome exploration, quiz mastery, and NASA Observatory discovery, complete with celebratory notifications and a Medals & Guide modal.

- **NASA & Space Observatory (Live + Offline Resilient)**
  - **Live Mars Perseverance Rover Raw Photos** (`mars.nasa.gov`) with lightweight thumbnail loading and a full-resolution photo viewer modal.
  - **NASA Astronomy Picture of the Day (`APOD`)** with an interactive **date picker**, automatic 1-day UTC fallback if today's APOD is unavailable, and clean filtering of placeholder payloads.
  - **NASA Image & Video Library** searchable gallery (*All Rovers*, *Perseverance*, *Curiosity*, *Mars Surface*).
  - **Space Weather (`DONKI FLR & CME`)**, **Astronaut Health (`OSDR`)**, **Radiation Benchmarks (`RadLab & Curiosity RAD`)**, **Jezero Terrain (`Mars Trek`)**, and **Canadian Space Agency (`CSA`)** food/STEM resources.
  - Clearly tags every record as **`LIVE NASA`** or **`FROM SAVED DATA`**, caches media cleanly across refreshes without flickering, and works **100% offline** with built-in educational archives.

---

## Resources & Data Sources Used

Outpost Zero connects to official public space agency endpoints and educational references:

| Resource | What It Provides in Outpost Zero | Link |
| :--- | :--- | :--- |
| **NASA Mars 2020 Raw Images** | Live Perseverance rover photos directly from Jezero Crater | [mars.nasa.gov/mars2020](https://mars.nasa.gov/mars2020/multimedia/raw-images/) |
| **NASA Open APIs (`APOD`)** | Daily space photography with interactive date lookup | [api.nasa.gov](https://api.nasa.gov/) |
| **NASA DONKI (`FLR` & `CME`)** | Solar flare & coronal mass ejection space-weather records | [kauai.ccmc.gsfc.nasa.gov/DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) |
| **NASA Image & Video Library** | Curated Perseverance, Curiosity & Mars surface imagery | [images.nasa.gov](https://images.nasa.gov/) |
| **NASA OSDR** | Spaceflight bone (`OSD-352`), muscle (`OSD-47`), immune (`OSD-738`) & sleep (`OSD-253`) studies | [osdr.nasa.gov](https://osdr.nasa.gov/) |
| **NASA RadLab & Curiosity RAD** | Real ISS (`mGy/day`) vs. Mars surface (`mSv/day`) radiation benchmarks | [visualization.osdr.nasa.gov/radlab](https://visualization.osdr.nasa.gov/radlab/) |
| **NASA Mars Trek** | Jezero Crater elevation (`-2,700 m`) & terrain hazard context | [trek.nasa.gov/mars](https://trek.nasa.gov/mars/) |
| **Canadian Space Agency (CSA)** | Controlled-environment food, astronaut nutrition (`1,900–3,200 kcal/day`) & youth STEM | [asc-csa.gc.ca](https://www.asc-csa.gc.ca/eng/youth-educators/) |

*Attribution & Honesty Notice: Outpost Zero is an independent educational project and is not officially endorsed by or affiliated with NASA or CSA. Per NASA Media Usage Guidelines (14 CFR Part 1221), official agency insignias are not displayed, and saved/archived datasets are explicitly labeled **`FROM SAVED DATA`**.*

---

## Tech Stack & Project Structure

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion, Recharts (lazy-loaded for Mission Reports)
- **Testing**: Node built-in test runner via `tsx` (`24` automated unit & integration tests)

```text
├── public/                     # Static assets, cropped Outpost Zero PNG logo, favicon
├── src/
│   ├── assets/images/          # Bundled offline Martian fallback photography
│   ├── components/             # Home, Simulator, Subsystem Panels, Observatory, Learn, Medals & Modals
│   ├── data/                   # 12 STEM lessons & 36-question rotating quiz bank
│   ├── engine/                 # Deterministic 10-Sol simulation engine, 16 mission events & scoring
│   ├── services/               # NASA Rover, APOD, Image Library, DONKI, OSDR/RadLab & local caching
│   ├── types/                  # Shared TypeScript interfaces for missions, events & reports
│   └── utils/                  # Explorer medal progress, certificate PNG exporter & storage helpers
├── tests/                      # 24 automated tests covering engine rules, quiz batches & NASA fallbacks
├── .env.example                # Empty template for optional VITE_NASA_API_KEY
├── README.md                   # Traditional project documentation (this file)
└── PROMPT_README.md            # Plain-English modular Master Prompt for recreating Outpost Zero
```

---

## Quick Player Guide

1. **Explore Home**: Click the 3D habitat domes (*Life Support*, *Shielded Core*, *Power Grid*), switch between the 4 Mars Hazards, and inspect the live *Mars Surface View*.
2. **Choose Your Landing Zone**: Open **Simulator**, pick a Jezero Crater landing site and Space Weather mode, and click **Launch Mission**.
3. **Survive 10 Sols**: Solve each Sol's emergency trade-off, keep **Greenhouse**, **Solar Panels**, and **Radiation Shelter** healthy, watch how Martian weather changes outside, and send your Earth radio report when ready.
4. **Earn Your Certificate**: Complete Sol 10, type your **Commander Name**, and download your PNG Flight Certificate.
5. **Learn & Collect Medals**: Visit **Learn** (take fresh 12-question quiz batches) and **Observatory** (inspect live Perseverance photos, APOD dates, and solar storms) to unlock all **9 Explorer Medals**.

---

## Local Setup & Verification

### Prerequisites
- Node.js 20+ and npm

### Run Locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

### Optional NASA API Key (`.env.local`)
By default, `APOD` and `DONKI` requests use NASA's public `DEMO_KEY` (which has stricter hourly limits), while Mars Perseverance raw images and the NASA Image Library require no key. To use your own free NASA API key:
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Add your key in `.env.local`:
   ```env
   VITE_NASA_API_KEY=your_free_nasa_api_key
   ```
3. `.gitignore` ignores `.env` and `.env.*` files so keys are never committed to Git. *(Keep `.env.example` empty.)*

### Verify Types, Tests & Production Build
```bash
npm run lint
npx tsx --test tests/outpostZero.test.ts
npm run build
```
