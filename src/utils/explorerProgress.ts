export type ExplorerBadgeId =
  | 'photo-scout'
  | 'dome-engineer'
  | 'space-scholar'
  | 'solar-watcher'
  | 'silent-radio'
  | 'dust-strategist'
  | 'greenhouse-botanist'
  | 'storm-shield-master'
  | 'outpost-commander';

export type MedalTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type MedalCategory = 'Discovery & Science' | 'Mind-Game Strategy';

export interface ExplorerBadgeDefinition {
  id: ExplorerBadgeId;
  title: string;
  tier: MedalTier;
  category: MedalCategory;
  hint: string;
  mindClue: string;
  howToGuide: string;
  targetRoute: 'home' | 'simulator' | 'learn' | 'observatory';
  actionLabel: string;
}

export interface ExplorerProgressState {
  inspectedDomes: string[];
  inspectedPhotos: number;
  answeredQuizzes: number;
  correctQuizzes: number;
  visitedObservatory: boolean;
  exploredObservatoryTabs: boolean;
  tacticalDecisions: number;
  powerOpsActions: number;
  cropsHarvested: number;
  shelterActions: number;
  completedSols: number;
  missionSuccessCount: number;
  bestMissionScore: number;
  unlockedBadges: ExplorerBadgeId[];
}

export const EXPLORER_BADGES: ExplorerBadgeDefinition[] = [
  {
    id: 'photo-scout',
    title: 'Surface Scout',
    tier: 'Bronze',
    category: 'Discovery & Science',
    hint: 'Click a Mars Surface View photo to inspect it.',
    mindClue: 'Clue: Rusty blankets slide down steep crater walls—look closer to uncover the full story.',
    howToGuide:
      'Open the Mars Surface View card inside the 3D Habitat Schematic (on Home or Simulator) or click any rover card in NASA Observatory.',
    targetRoute: 'observatory',
    actionLabel: 'Inspect Mars Photos',
  },
  {
    id: 'dome-engineer',
    title: 'Dome Engineer',
    tier: 'Silver',
    category: 'Discovery & Science',
    hint: 'Inspect all 3 habitat domes in the 3D schematic.',
    mindClue: 'Clue: Breathable air, solar storage, and water-wall armor—find all three sectors on the base map.',
    howToGuide:
      'In the Outpost Zero 3D Habitat Schematic, click Life Support, Shielded Core, and Solar & Power (or use their tabs below the map).',
    targetRoute: 'home',
    actionLabel: 'Inspect 3D Domes',
  },
  {
    id: 'space-scholar',
    title: 'Space Scholar',
    tier: 'Silver',
    category: 'Discovery & Science',
    hint: 'Answer 3 space science questions correctly in Learn.',
    mindClue: 'Clue: Guessing is luck; proving you know why Martian Sols and dust storms matter earns this crest.',
    howToGuide:
      'Open the Learn page and get at least 3 answers right across the Lesson Quick Checks or the 12-question Knowledge Check Quiz.',
    targetRoute: 'learn',
    actionLabel: 'Open Learn Quiz',
  },
  {
    id: 'solar-watcher',
    title: 'Solar Watcher',
    tier: 'Bronze',
    category: 'Discovery & Science',
    hint: 'Check NASA Observatory space weather or biology filters.',
    mindClue: 'Clue: Before storms strike Mars, scientists watch eruptions leaving the Sun.',
    howToGuide:
      'Visit NASA Observatory and click between Solar Flares / CMEs or filter Space Biology (OSDR) studies.',
    targetRoute: 'observatory',
    actionLabel: 'Watch Space Weather',
  },
  {
    id: 'silent-radio',
    title: 'Silent Radio Tactician',
    tier: 'Gold',
    category: 'Mind-Game Strategy',
    hint: 'Solve a Sol crisis using a checklist or detailed Earth report.',
    mindClue: 'Clue: Radio signals take up to 22 minutes one way. Can you lead without waiting for Earth?',
    howToGuide:
      'In Mission Simulator, resolve an event using an Approved Crew Checklist or send a Detailed Engineering Report via Earth Comms.',
    targetRoute: 'simulator',
    actionLabel: 'Command Simulator',
  },
  {
    id: 'dust-strategist',
    title: 'Dust Buster Strategist',
    tier: 'Gold',
    category: 'Mind-Game Strategy',
    hint: 'Protect solar power by cleaning panels or saving power.',
    mindClue: 'Clue: Fine iron-oxide dust steals watts quietly each Sol. Stop power decay before darkness hits.',
    howToGuide:
      'In Mission Simulator, open the Solar & Power panel and run "Clean Solar Panels" or toggle "Power-Saving Mode".',
    targetRoute: 'simulator',
    actionLabel: 'Manage Solar Grid',
  },
  {
    id: 'greenhouse-botanist',
    title: 'Hydroponic Botanist',
    tier: 'Gold',
    category: 'Mind-Game Strategy',
    hint: 'Grow and harvest a fresh crop batch in the Greenhouse.',
    mindClue: 'Clue: Seeds will not feed your crew overnight—nurture water and grow lights until 100% Harvest.',
    howToGuide:
      'In Mission Simulator, open the Greenhouse tab across Sols to care for crops until Harvest Ready (100%), then click "Harvest Crops".',
    targetRoute: 'simulator',
    actionLabel: 'Grow Mars Crops',
  },
  {
    id: 'storm-shield-master',
    title: 'Storm Shield Master',
    tier: 'Platinum',
    category: 'Mind-Game Strategy',
    hint: 'Reinforce or shelter your crew in the Radiation Shelter.',
    mindClue: 'Clue: Mars has no magnetic shield. When high-energy solar particles race in, water walls save lives.',
    howToGuide:
      'In Mission Simulator, open the Radiation Shelter tab and either "Reinforce Shelter" or move crew into "Enter Storm Shelter".',
    targetRoute: 'simulator',
    actionLabel: 'Protect the Crew',
  },
  {
    id: 'outpost-commander',
    title: 'Outpost Zero Legend',
    tier: 'Platinum',
    category: 'Mind-Game Strategy',
    hint: 'Survive all 10 Sols with a Mission Score of 80 or higher.',
    mindClue: 'Clue: True commanders never sacrifice air for power alone—balance all 4 pillars for 10 full Sols.',
    howToGuide:
      'Complete a full 10-Sol mission in the Simulator with zero failed systems and earn 80+ / 100 on your final Mission Report.',
    targetRoute: 'simulator',
    actionLabel: 'Complete 10-Sol Run',
  },
];

const PROGRESS_KEY = 'outpost_zero_explorer_progress_v2';
const LEGACY_PROGRESS_KEY = 'outpost_zero_explorer_progress_v1';
const PROGRESS_EVENT = 'outpost-zero-explorer-progress-updated';
const MEDAL_UNLOCKED_EVENT = 'outpost-zero-medal-unlocked';

export function createDefaultExplorerProgress(): ExplorerProgressState {
  return {
    inspectedDomes: [],
    inspectedPhotos: 0,
    answeredQuizzes: 0,
    correctQuizzes: 0,
    visitedObservatory: false,
    exploredObservatoryTabs: false,
    tacticalDecisions: 0,
    powerOpsActions: 0,
    cropsHarvested: 0,
    shelterActions: 0,
    completedSols: 0,
    missionSuccessCount: 0,
    bestMissionScore: 0,
    unlockedBadges: [],
  };
}

export function getExplorerRank(unlockedCount: number): string {
  if (unlockedCount >= 9) return 'Outpost Zero Legend';
  if (unlockedCount >= 6) return 'Mars Flight Director';
  if (unlockedCount >= 3) return 'Orbital Specialist';
  if (unlockedCount >= 1) return 'Space Cadet';
  return 'Mission Rookie';
}

function computeUnlockedBadges(state: ExplorerProgressState): ExplorerBadgeId[] {
  const earned = new Set<ExplorerBadgeId>(state.unlockedBadges);
  if (state.inspectedPhotos >= 1) earned.add('photo-scout');
  if (state.inspectedDomes.length >= 3) earned.add('dome-engineer');
  if (state.correctQuizzes >= 3) earned.add('space-scholar');
  if (state.visitedObservatory && state.exploredObservatoryTabs) earned.add('solar-watcher');
  if (state.tacticalDecisions >= 1) earned.add('silent-radio');
  if (state.powerOpsActions >= 1) earned.add('dust-strategist');
  if (state.cropsHarvested >= 1) earned.add('greenhouse-botanist');
  if (state.shelterActions >= 1) earned.add('storm-shield-master');
  if (state.missionSuccessCount >= 1 && state.bestMissionScore >= 80) {
    earned.add('outpost-commander');
  }
  return EXPLORER_BADGES.map((b) => b.id).filter((id) => earned.has(id));
}

export function loadExplorerProgress(): ExplorerProgressState {
  try {
    if (typeof localStorage === 'undefined') {
      return createDefaultExplorerProgress();
    }
    const raw =
      localStorage.getItem(PROGRESS_KEY) ?? localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (!raw) return createDefaultExplorerProgress();
    const parsed = JSON.parse(raw) as Partial<ExplorerProgressState>;
    const base = createDefaultExplorerProgress();
    const merged: ExplorerProgressState = {
      inspectedDomes: Array.isArray(parsed.inspectedDomes)
        ? parsed.inspectedDomes.filter((d): d is string => typeof d === 'string')
        : base.inspectedDomes,
      inspectedPhotos:
        typeof parsed.inspectedPhotos === 'number' ? parsed.inspectedPhotos : 0,
      answeredQuizzes:
        typeof parsed.answeredQuizzes === 'number' ? parsed.answeredQuizzes : 0,
      correctQuizzes:
        typeof parsed.correctQuizzes === 'number' ? parsed.correctQuizzes : 0,
      visitedObservatory: Boolean(parsed.visitedObservatory),
      exploredObservatoryTabs: Boolean(parsed.exploredObservatoryTabs),
      tacticalDecisions:
        typeof parsed.tacticalDecisions === 'number' ? parsed.tacticalDecisions : 0,
      powerOpsActions:
        typeof parsed.powerOpsActions === 'number' ? parsed.powerOpsActions : 0,
      cropsHarvested:
        typeof parsed.cropsHarvested === 'number' ? parsed.cropsHarvested : 0,
      shelterActions:
        typeof parsed.shelterActions === 'number' ? parsed.shelterActions : 0,
      completedSols:
        typeof parsed.completedSols === 'number' ? parsed.completedSols : 0,
      missionSuccessCount:
        typeof parsed.missionSuccessCount === 'number' ? parsed.missionSuccessCount : 0,
      bestMissionScore:
        typeof parsed.bestMissionScore === 'number' ? parsed.bestMissionScore : 0,
      unlockedBadges: Array.isArray(parsed.unlockedBadges)
        ? (parsed.unlockedBadges.filter((b): b is ExplorerBadgeId =>
            EXPLORER_BADGES.some((def) => def.id === b)
          ) as ExplorerBadgeId[])
        : [],
    };
    merged.unlockedBadges = computeUnlockedBadges(merged);
    return merged;
  } catch {
    return createDefaultExplorerProgress();
  }
}

function saveExplorerProgress(
  previous: ExplorerProgressState,
  next: ExplorerProgressState
): ExplorerProgressState {
  const prevSet = new Set(previous.unlockedBadges);
  const nextBadges = computeUnlockedBadges(next);
  const newlyUnlocked = nextBadges.filter((id) => !prevSet.has(id));

  const normalized: ExplorerProgressState = {
    ...next,
    unlockedBadges: nextBadges,
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(normalized));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: normalized }));
      for (const badgeId of newlyUnlocked) {
        const def = EXPLORER_BADGES.find((b) => b.id === badgeId);
        if (def) {
          window.dispatchEvent(new CustomEvent(MEDAL_UNLOCKED_EVENT, { detail: def }));
        }
      }
    }
  } catch {
    // Ignore storage/browser event errors safely
  }
  return normalized;
}

export function recordDomeInspected(domeId: string): ExplorerProgressState {
  const current = loadExplorerProgress();
  if (current.inspectedDomes.includes(domeId)) {
    return current;
  }
  return saveExplorerProgress(current, {
    ...current,
    inspectedDomes: [...current.inspectedDomes, domeId],
  });
}

export function recordPhotoInspected(): ExplorerProgressState {
  const current = loadExplorerProgress();
  return saveExplorerProgress(current, {
    ...current,
    inspectedPhotos: current.inspectedPhotos + 1,
  });
}

export function recordQuizAnswered(isCorrect = false): ExplorerProgressState {
  const current = loadExplorerProgress();
  return saveExplorerProgress(current, {
    ...current,
    answeredQuizzes: current.answeredQuizzes + 1,
    correctQuizzes: current.correctQuizzes + (isCorrect ? 1 : 0),
  });
}

export function recordObservatoryVisited(exploredTab = false): ExplorerProgressState {
  const current = loadExplorerProgress();
  if (
    current.visitedObservatory &&
    (!exploredTab || current.exploredObservatoryTabs)
  ) {
    return current;
  }
  return saveExplorerProgress(current, {
    ...current,
    visitedObservatory: true,
    exploredObservatoryTabs: current.exploredObservatoryTabs || exploredTab,
  });
}

export function recordTacticalDecision(): ExplorerProgressState {
  const current = loadExplorerProgress();
  return saveExplorerProgress(current, {
    ...current,
    tacticalDecisions: current.tacticalDecisions + 1,
  });
}

export function recordPowerOpsAction(): ExplorerProgressState {
  const current = loadExplorerProgress();
  return saveExplorerProgress(current, {
    ...current,
    powerOpsActions: current.powerOpsActions + 1,
  });
}

export function recordCropHarvested(): ExplorerProgressState {
  const current = loadExplorerProgress();
  return saveExplorerProgress(current, {
    ...current,
    cropsHarvested: current.cropsHarvested + 1,
  });
}

export function recordShelterAction(): ExplorerProgressState {
  const current = loadExplorerProgress();
  return saveExplorerProgress(current, {
    ...current,
    shelterActions: current.shelterActions + 1,
  });
}

export function recordSolCompleted(solNumber = 1): ExplorerProgressState {
  const current = loadExplorerProgress();
  return saveExplorerProgress(current, {
    ...current,
    completedSols: Math.max(current.completedSols, solNumber),
  });
}

export function recordMissionFinished(
  outcome: 'success' | 'failure',
  totalScore: number
): ExplorerProgressState {
  const current = loadExplorerProgress();
  return saveExplorerProgress(current, {
    ...current,
    missionSuccessCount:
      current.missionSuccessCount + (outcome === 'success' ? 1 : 0),
    bestMissionScore: Math.max(current.bestMissionScore, totalScore),
  });
}

export function subscribeExplorerProgress(
  onChange: (state: ExplorerProgressState) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => {
    onChange(loadExplorerProgress());
  };
  window.addEventListener(PROGRESS_EVENT, handler);
  return () => window.removeEventListener(PROGRESS_EVENT, handler);
}

export function subscribeMedalUnlocked(
  onUnlock: (badge: ExplorerBadgeDefinition) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<ExplorerBadgeDefinition>;
    if (custom.detail) {
      onUnlock(custom.detail);
    }
  };
  window.addEventListener(MEDAL_UNLOCKED_EVENT, handler);
  return () => window.removeEventListener(MEDAL_UNLOCKED_EVENT, handler);
}

export function resetExplorerProgress(): ExplorerProgressState {
  const fresh = createDefaultExplorerProgress();
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(PROGRESS_KEY);
      localStorage.removeItem(LEGACY_PROGRESS_KEY);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: fresh }));
    }
  } catch {
    // Ignore storage errors safely
  }
  return fresh;
}
