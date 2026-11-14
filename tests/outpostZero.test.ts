import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceToNextSol,
  applyDecision,
  applyGreenhouseAction,
  applyPowerAction,
  applyShelterAction,
  buildMissionReport,
  configureBriefingMission,
  createInitialGameState,
  markCommunicationUsed,
  proceedToSolSummary,
  sendDetailedEarthReport,
  startMission,
  togglePause,
} from '../src/engine/gameEngine.ts';
import { evaluateMissionAdvisor } from '../src/engine/missionAdvisor.ts';
import { MISSION_EVENTS } from '../src/engine/missionData.ts';
import {
  CSA_RESOURCES,
  MARS_TREK_JEZERO_PROFILE,
  OFFICIAL_DATA_SOURCES_DIRECTORY,
  RADLAB_DOSIMETRY_BENCHMARKS,
  SCIENTIFIC_DISCLAIMER,
} from '../src/data/spaceResearchData.ts';
import {
  ALL_QUIZ_QUESTIONS,
  generateQuizBatch,
  KNOWLEDGE_QUIZ_QUESTIONS,
  LEARN_MODULES,
} from '../src/data/learnModules.ts';
import { clearNasaCache } from '../src/services/nasaCache.ts';
import {
  fetchDonkiCmes,
  fetchDonkiSolarFlares,
  getDonkiRadiationContext,
  UNAVAILABLE_FALLBACK_MESSAGE,
} from '../src/services/nasaDonkiService.ts';
import {
  cleanNasaDescription,
  fetchFeaturedMarsSurfaceDeck,
  fetchFeaturedMarsSurfacePhoto,
  fetchMarsImageLibrary,
  fetchNasaApod,
  fetchRealtimeMarsRoverPhotos,
  toOneSentence,
} from '../src/services/nasaMediaService.ts';
import { fetchOsdrStudyCatalog } from '../src/services/nasaOsdrService.ts';
import {
  EXPLORER_BADGES,
  getExplorerRank,
  loadExplorerProgress,
  recordDomeInspected,
  recordPhotoInspected,
  resetExplorerProgress,
} from '../src/utils/explorerProgress.ts';
import { getEarthMarsTelemetry } from '../src/utils/orbitalTelemetry.ts';
import { parseAndValidateGameState } from '../src/utils/storage.ts';

test('1. Initial game state is properly configured for Mars 10-Sol 4-crew outpost', () => {
  const state = createInitialGameState(101);
  assert.equal(state.missionConfig.planet, 'Mars');
  assert.equal(state.missionConfig.maxSols, 10);
  assert.equal(state.missionConfig.crewCount, 4);
  assert.equal(state.crew.members.length, 4);
  assert.equal(state.phase, 'briefing');
  assert.equal(state.currentSol, 1);
  assert.equal(state.environment.localTempCelsius, -53);
  assert.ok(
    state.commSystem.oneWayDelayMinutes >= 3 &&
      state.commSystem.oneWayDelayMinutes <= 22
  );
  assert.equal(state.greenhouse.harvestReadiness, false);
  assert.equal(state.greenhouse.cropGrowthStage, 'Vegetative');
});

test('2. Every mission event enforces trade-offs (no free choices) and includes scientific explanations', () => {
  assert.ok(MISSION_EVENTS.length >= 15);
  for (const event of MISSION_EVENTS) {
    assert.ok(event.options.length >= 2 && event.options.length <= 3);
    assert.ok(event.earthAdvice.headline.length > 0);
    assert.ok(event.earthAdvice.guidance.length > 0);
    assert.ok(event.scientificExplanation.length > 20);
    assert.ok(event.educationalTakeaway.length > 15);

    for (const option of event.options) {
      assert.ok(option.whyExplanation.length > 20);
      assert.ok(option.tradeOffHint.length > 10);

      const values = [
        option.deltas.lifeSupport,
        option.deltas.power,
        option.deltas.radiationProtection,
      ];
      const hasPositive = values.some((v) => v > 0);
      const hasCost = values.some((v) => v < 0) || option.crewEnergyDelta < 0;

      assert.ok(
        hasPositive && hasCost,
        `Option ${option.id} in event ${event.id} must have both a gain and a cost/trade-off`
      );
    }
  }
});

test('3. Normal 10-Sol mission run completes cleanly, honors Pause, and produces 100-point report', () => {
  let state = createInitialGameState(42);
  state = startMission(state);
  assert.equal(state.phase, 'playing');
  assert.equal(state.currentSol, 1);

  const duplicateStart = startMission(state);
  assert.deepEqual(duplicateStart, state);

  state = togglePause(state);
  assert.equal(state.isPaused, true);
  const pausedAttempt = applyDecision(state, state.activeEvent!.options[0].id);
  assert.equal(pausedAttempt.decisionHistory.length, 0);

  state = togglePause(state);
  assert.equal(state.isPaused, false);

  const seenEventIds = new Set<string>();

  for (let sol = 1; sol <= 10; sol++) {
    assert.equal(state.currentSol, sol);
    assert.equal(state.phase, 'playing');
    assert.ok(state.activeEvent);
    seenEventIds.add(state.activeEvent.id);

    const bestOption = state.activeEvent.options.reduce((best, candidate) => {
      const minCand = Math.min(
        state.resources.lifeSupport + candidate.deltas.lifeSupport,
        state.resources.power + candidate.deltas.power,
        state.resources.radiationProtection + candidate.deltas.radiationProtection
      );
      const minBest = Math.min(
        state.resources.lifeSupport + best.deltas.lifeSupport,
        state.resources.power + best.deltas.power,
        state.resources.radiationProtection + best.deltas.radiationProtection
      );
      return minCand > minBest ? candidate : best;
    });

    state = markCommunicationUsed(state);
    assert.equal(state.commAdviceUsedForCurrentEvent, true);

    state = applyDecision(state, bestOption.id);
    assert.equal(state.phase, 'outcome');

    // Double-execution guard
    const doubleDecision = applyDecision(state, bestOption.id);
    assert.equal(doubleDecision.decisionHistory.length, state.decisionHistory.length);

    state = proceedToSolSummary(state);
    if (state.failureReason) break;
    assert.equal(state.phase, 'sol-summary');

    state = advanceToNextSol(state);
  }

  assert.equal(seenEventIds.size, 10, 'All 10 Sols should use distinct mission events');
  assert.equal(state.phase, 'report');
  const report = buildMissionReport(state);
  assert.equal(report.outcome, 'success');
  assert.equal(report.solsSurvived, 10);
  assert.equal(report.history.length, 11);
  assert.ok(report.scoreBreakdown.totalScore > 0 && report.scoreBreakdown.totalScore <= 100);
  assert.ok(report.advisorRecommendations.length >= 3);
});

test('4. Communication delay, detailed report logging, and Solar Conjunction event work accurately', () => {
  let state = startMission(createInitialGameState(7));
  assert.ok(
    state.commSystem.oneWayDelayMinutes >= 3 &&
      state.commSystem.oneWayDelayMinutes <= 22
  );

  // Send detailed Earth report without blocking Sol actions
  state = sendDetailedEarthReport(state, {
    problemDetected: state.activeEvent!.title,
    actionsTaken: 'Checked cabin pressure and backup batteries.',
    remainingResources: '78% Life Support, 76% Power, 80% Radiation',
    crewCondition: 'All 4 astronauts nominal',
    assistanceRequired: 'Confirm checklist alignment.',
  });
  assert.equal(state.commSystem.reportsSent.length, 1);
  assert.equal(state.phase, 'playing');

  // Duplicate report on same Sol is ignored
  const dupReport = sendDetailedEarthReport(state, {
    problemDetected: 'Duplicate',
    actionsTaken: 'None',
    remainingResources: 'None',
    crewCondition: 'None',
    assistanceRequired: 'None',
  });
  assert.equal(dupReport.commSystem.reportsSent.length, 1);

  // Verify Solar Conjunction event triggers conjunctionActive when selected
  const conjunctionEvent = MISSION_EVENTS.find(
    (e) => e.id === 'solar-conjunction-comms'
  )!;
  assert.equal(conjunctionEvent.conjunctionRestricted, true);

  let conjState = startMission(createInitialGameState(1));
  conjState = {
    ...conjState,
    activeEvent: conjunctionEvent,
    commSystem: { ...conjState.commSystem, conjunctionActive: true },
  };
  const waited = applyDecision(conjState, 'wait-for-earth-ping');
  assert.equal(waited.lastDecision?.approach, 'wait-for-earth');
  const report = buildMissionReport(waited);
  assert.ok(
    report.advisorRecommendations.some(
      (r) => r.domain === 'Communication' && r.status === 'Improvement'
    ),
    'Advisor must flag waiting passively during communication restriction'
  );
});

test('5. Regional dust storm, solar dust accumulation, solar-panel cleaning, and Power-Saving Mode behave realistically', () => {
  const stormEvent = MISSION_EVENTS.find((e) => e.id === 'regional-dust-storm')!;
  let state = startMission(createInitialGameState(10));
  state = {
    ...state,
    activeEvent: stormEvent,
    environment: {
      ...state.environment,
      weatherCondition: 'Regional Dust Storm',
    },
    powerOps: {
      ...state.powerOps,
      stormSeverity: 'Regional Storm',
    },
  };

  // Cleaning panels is blocked during active Regional Storm
  const blockedClean = applyPowerAction(state, 'clean-solar-panels');
  assert.equal(blockedClean.powerOps.actionsUsedThisSol.length, 0);

  // Emergency Power-Saving Mode can be activated
  state = applyPowerAction(state, 'toggle-power-saving');
  assert.equal(state.powerOps.powerSavingMode, true);
  assert.equal(state.resources.energyConsumption, 'Low');

  // Apply storm decision — solar generation never automatically hits 0%
  state = applyDecision(state, 'activate-storm-power-saving');
  assert.ok(
    state.resources.solarGeneration >= 15,
    'Solar generation must stay above 0 during dust storm'
  );

  // Overnight upkeep in Power-Saving Mode conserves power and adds dust
  const dustBeforeNight = state.powerOps.dustAccumulation;
  state = proceedToSolSummary(state);
  assert.ok(state.powerOps.dustAccumulation > dustBeforeNight);
  assert.ok(state.lastSolSummary!.dailyUpkeepDeltas.power > 0);
  assert.ok(state.resources.solarGeneration >= 18);

  // On a calm Sol, solar-panel maintenance reduces dust and boosts solar/power at EVA oxygen cost
  state = advanceToNextSol(state);
  state = {
    ...state,
    powerOps: { ...state.powerOps, stormSeverity: 'Clear', dustAccumulation: 40 },
  };
  const lifeBeforeClean = state.resources.lifeSupport;
  const solarBeforeClean = state.resources.solarGeneration;
  state = applyPowerAction(state, 'clean-solar-panels');
  assert.equal(state.powerOps.dustAccumulation, 15);
  assert.ok(state.resources.solarGeneration > solarBeforeClean);
  assert.equal(state.resources.lifeSupport, lifeBeforeClean - 4);
});

test('6. SPE warning & crew shelter actions (enter, reinforce, exit) enforce trade-offs', () => {
  const speEvent = MISSION_EVENTS.find((e) => e.id === 'solar-storm-warning')!;
  let state = startMission(createInitialGameState(5));
  state = {
    ...state,
    activeEvent: speEvent,
    radiationShelter: {
      ...state.radiationShelter,
      radiationAlert: 'SPE Warning',
    },
  };

  // Reinforce shelter
  const readinessBefore = state.radiationShelter.shelterReadiness;
  const powerBefore = state.resources.power;
  state = applyShelterAction(state, 'reinforce-shelter');
  assert.equal(state.radiationShelter.shelterReadiness, Math.min(100, readinessBefore + 14));
  assert.equal(state.resources.power, powerBefore - 6);

  // Enter shelter
  state = applyShelterAction(state, 'enter-shelter');
  assert.equal(state.radiationShelter.crewSheltered, true);
  assert.equal(state.crew.members[0].status, 'Sheltered');

  // Exit shelter
  state = applyShelterAction(state, 'exit-shelter');
  assert.equal(state.radiationShelter.crewSheltered, false);
  assert.equal(state.crew.members[0].status, 'Active');

  // Delaying SPE response penalizes advisor radiation score & flags Improvement
  const delayed = applyDecision(state, 'wait-for-earth-spe-eval');
  const report = buildMissionReport(delayed);
  assert.ok(
    report.advisorRecommendations.some(
      (r) => r.domain === 'Radiation' && r.status === 'Improvement'
    )
  );
});

test('7. Habitat Airlock (HAB-01), Pressure Leak (HAB-02), Rover (ROV-01), Spares (SUP-01), and Crew (CREW-01) events work properly', () => {
  const requiredIds = [
    'hab-airlock-malfunction',
    'hab-pressure-leak',
    'rov-equipment-failure',
    'sup-spare-parts-shortage',
    'crew-minor-injury',
  ];
  for (const id of requiredIds) {
    const ev = MISSION_EVENTS.find((e) => e.id === id);
    assert.ok(ev, `Missing upgraded event ${id}`);
    let state = startMission(createInitialGameState(3));
    state = { ...state, activeEvent: ev };
    const after = applyDecision(state, ev.options[0].id);
    assert.equal(after.phase, 'outcome');
    assert.equal(after.lastDecision?.eventId, id);
  }
});

test('8. Greenhouse subsystem validates crop readiness, irrigation failures, power shortages, and per-Sol limits', () => {
  let state = startMission(createInitialGameState(12));

  // Cannot harvest when cropGrowthProgress < 100
  const unreadyHarvest = applyGreenhouseAction(state, 'harvest-crops');
  assert.equal(unreadyHarvest.greenhouse.actionsUsedThisSol.length, 0);

  // Low power blocks allocate-power
  const lowPowerState = {
    ...state,
    resources: { ...state.resources, power: 10 },
  };
  const blockedBoost = applyGreenhouseAction(lowPowerState, 'allocate-power');
  assert.equal(blockedBoost.greenhouse.actionsUsedThisSol.length, 0);

  // Clogged irrigation slows overnight growth to 4%
  const cloggedState = applyDecision(
    {
      ...state,
      greenhouse: { ...state.greenhouse, irrigationStatus: 'Clogged' },
    },
    state.activeEvent!.options[0].id
  );
  const afterCloggedNight = proceedToSolSummary(cloggedState);
  assert.equal(afterCloggedNight.greenhouse.cropGrowthProgress, 49); // 45 + 4

  // Repair irrigation restores Flowing status at shielding + power cost
  const radBefore = state.resources.radiationProtection;
  state = applyGreenhouseAction(state, 'repair-irrigation');
  assert.equal(state.greenhouse.irrigationStatus, 'Flowing');
  assert.equal(state.resources.radiationProtection, radBefore - 4);

  // Allocate power boosts growth (+30%) and deducts power (-8%)
  const powerBefore = state.resources.power;
  state = applyGreenhouseAction(state, 'allocate-power');
  assert.equal(state.greenhouse.cropGrowthProgress, 75);
  assert.equal(state.greenhouse.cropGrowthStage, 'Flowering');
  assert.equal(state.resources.power, powerBefore - 8);

  // Per-Sol limit of 2 actions prevents a 3rd action
  const thirdAction = applyGreenhouseAction(state, 'maintain-equipment');
  assert.equal(thirdAction.greenhouse.actionsUsedThisSol.length, 2);

  state = applyDecision(state, state.activeEvent!.options[0].id);
  state = proceedToSolSummary(state);
  state = advanceToNextSol(state);
  state = applyGreenhouseAction(state, 'allocate-power');
  assert.equal(state.greenhouse.harvestReadiness, true);

  const foodBefore = state.resources.foodReserves;
  state = applyGreenhouseAction(state, 'harvest-crops');
  assert.equal(state.resources.foodReserves, Math.min(100, foodBefore + 18));
  assert.equal(state.greenhouse.cropGrowthProgress, 20);
  assert.equal(state.greenhouse.harvestReadiness, false);
});

test('9. MissionControlAdvisor awards 100-point rubric accurately and gives decision credit even on failed runs', () => {
  let failedState = startMission(createInitialGameState(9));
  // Make a good approved-checklist decision on Sol 1
  const goodOpt = failedState.activeEvent!.options.find(
    (o) => o.approach === 'approved-checklist'
  ) ?? failedState.activeEvent!.options[0];
  failedState = applyDecision(failedState, goodOpt.id);
  failedState = {
    ...failedState,
    phase: 'report',
    resources: { ...failedState.resources, power: 0, batteryReserve: 0 },
    failureReason: 'Habitat Power reserves reached 0%',
  };
  const failedReport = buildMissionReport(failedState);
  assert.equal(failedReport.outcome, 'failure');
  assert.ok(
    failedReport.scoreBreakdown.decisionMakingScore > 0,
    'Failed missions still receive decision-making points for good choices'
  );

  // Successful mission with less-than-perfect metrics should NOT automatically score 100
  let wonState = startMission(createInitialGameState(8));
  wonState = {
    ...wonState,
    currentSol: 10,
    phase: 'report',
    resources: {
      ...wonState.resources,
      lifeSupport: 65,
      power: 55,
      radiationProtection: 68,
    },
  };
  const wonReport = buildMissionReport(wonState);
  assert.equal(wonReport.outcome, 'success');
  assert.ok(wonReport.scoreBreakdown.totalScore < 100);
  assert.ok(wonReport.scoreBreakdown.lostPointsNotes.length >= 1);
});

test('10. LocalStorage parser validates, backfills older saves, and rejects corrupted data', () => {
  const validState = startMission(createInitialGameState(15));
  const roundTrip = parseAndValidateGameState(JSON.stringify(validState));
  assert.ok(roundTrip);
  assert.equal(roundTrip.currentSol, 1);

  // Simulate older save missing new upgrade fields
  const legacyObj = { ...validState } as Record<string, unknown>;
  delete legacyObj.greenhouse;
  delete legacyObj.environment;
  delete legacyObj.powerOps;
  delete legacyObj.radiationShelter;
  delete legacyObj.commSystem;
  delete legacyObj.missionSeed;

  const backfilled = parseAndValidateGameState(JSON.stringify(legacyObj));
  assert.ok(backfilled);
  assert.equal(backfilled.greenhouse.cropGrowthStage, 'Vegetative');
  assert.equal(backfilled.environment.localTempCelsius, -53);
  assert.equal(backfilled.radiationShelter.shelterReadiness, 80);

  assert.equal(parseAndValidateGameState('not json'), null);
  assert.equal(parseAndValidateGameState('{}'), null);
  assert.equal(
    parseAndValidateGameState(JSON.stringify({ ...validState, currentSol: 99 })),
    null
  );
});

test('11. Learn modules (12 lessons) and offline Knowledge Check Quiz (12 questions) are complete and valid', () => {
  assert.equal(LEARN_MODULES.length, 12);
  const solModule = LEARN_MODULES.find((m) => m.id === 'what-is-sol');
  assert.ok(solModule);
  assert.ok(
    solModule.vocabulary.some(
      (v) => v.term === 'Sol' && v.definition.includes('24 hours and 39 minutes')
    )
  );

  for (const mod of LEARN_MODULES) {
    assert.ok(mod.quickQuestion.correctIndex >= 0);
    assert.ok(mod.quickQuestion.correctIndex < mod.quickQuestion.options.length);
  }

  assert.equal(KNOWLEDGE_QUIZ_QUESTIONS.length, 12);
  assert.ok(ALL_QUIZ_QUESTIONS.length >= 36);
  for (const q of ALL_QUIZ_QUESTIONS) {
    assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length);
    assert.ok(q.explanation.length > 15);
  }

  const batch1 = generateQuizBatch(12);
  assert.equal(batch1.length, 12);
  const batch1Ids = batch1.map((q) => q.id);
  const batch2 = generateQuizBatch(12, batch1Ids);
  assert.equal(batch2.length, 12);
  const overlap = batch2.filter((q) => batch1Ids.includes(q.id));
  assert.equal(
    overlap.length,
    0,
    'Consecutive quiz batches should present 12 completely new questions'
  );
});

test('12. NASA DONKI FLR service handles offline failures, 429 rate-limits, empty arrays, caching, and valid live payloads', async () => {
  const originalFetch = globalThis.fetch;
  clearNasaCache();

  try {
    globalThis.fetch = (async () => {
      throw new Error('Network offline');
    }) as typeof fetch;
    const offlineResult = await fetchDonkiSolarFlares(30);
    assert.equal(offlineResult.source, 'archived');
    assert.equal(offlineResult.statusMessage, UNAVAILABLE_FALLBACK_MESSAGE);
    assert.ok(offlineResult.records.length > 0);

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: 'OVER_RATE_LIMIT' }), {
        status: 429,
      })) as typeof fetch;
    const rateLimited = await fetchDonkiSolarFlares(30);
    assert.equal(rateLimited.source, 'archived');

    globalThis.fetch = (async () =>
      new Response(JSON.stringify([]), { status: 200 })) as typeof fetch;
    const emptyResult = await fetchDonkiSolarFlares(30);
    assert.equal(emptyResult.source, 'archived');

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify([
          {
            flrID: '2026-01-01T10:00:00-FLR-001',
            beginTime: '2026-01-01T10:00Z',
            peakTime: '2026-01-01T10:15Z',
            classType: 'M3.2',
            activeRegionNum: 14001,
            sourceLocation: 'N10W20',
            link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/12345/-1',
            instruments: [{ displayName: 'GOES-P: EXIS 1.0-8.0' }],
          },
        ]),
        { status: 200 }
      )) as typeof fetch;
    const liveResult = await fetchDonkiSolarFlares(30);
    assert.equal(liveResult.source, 'live');
    assert.equal(liveResult.records.length, 1);
    assert.equal(liveResult.records[0].classType, 'M3.2');
    assert.equal(liveResult.records[0].activeRegionNum, 14001);

    // Subsequent call returns cached data without fetching
    globalThis.fetch = (async () => {
      throw new Error('Should not hit network when cached');
    }) as typeof fetch;
    const cachedResult = await fetchDonkiSolarFlares(30);
    assert.equal(cachedResult.source, 'cached');
    assert.equal(cachedResult.records[0].classType, 'M3.2');
  } finally {
    clearNasaCache();
    globalThis.fetch = originalFetch;
  }
});

test('13. NASA DONKI CME service validates cmeAnalyses, supports TTL cache + forceRefresh, and handles 429/offline', async () => {
  const originalFetch = globalThis.fetch;
  clearNasaCache();

  try {
    globalThis.fetch = (async () => {
      throw new Error('Offline');
    }) as typeof fetch;
    const offlineCme = await fetchDonkiCmes(30);
    assert.equal(offlineCme.source, 'archived');
    assert.ok(offlineCme.records.length > 0);

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: 'OVER_RATE_LIMIT' }), {
        status: 429,
      })) as typeof fetch;
    const rateLimitedCme = await fetchDonkiCmes(30);
    assert.equal(rateLimitedCme.source, 'archived');

    let fetchCount = 0;
    globalThis.fetch = (async () => {
      fetchCount += 1;
      return new Response(
        JSON.stringify([
          {
            activityID: '2026-02-10T08:00:00-CME-001',
            startTime: '2026-02-10T08:00Z',
            sourceLocation: 'S12W30',
            activeRegionNum: 14050,
            note: 'Wide fast halo CME observed by LASCO.',
            link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/99999/-1',
            instruments: [{ displayName: 'SOHO: LASCO/C2' }],
            cmeAnalyses: [
              { isMostAccurate: false, speed: 600, type: 'S', halfAngle: 20 },
              { isMostAccurate: true, speed: 1350, type: 'O', halfAngle: 48 },
            ],
          },
        ]),
        { status: 200 }
      );
    }) as typeof fetch;

    const liveCme = await fetchDonkiCmes(30);
    assert.equal(liveCme.source, 'live');
    assert.equal(fetchCount, 1);
    assert.equal(liveCme.records[0].speedKmS, 1350);
    assert.equal(liveCme.records[0].cmeType, 'O');
    assert.equal(liveCme.records[0].halfAngleDeg, 48);

    const cachedCme = await fetchDonkiCmes(30);
    assert.equal(cachedCme.source, 'cached');
    assert.equal(fetchCount, 1);

    const refreshedCme = await fetchDonkiCmes(30, { forceRefresh: true });
    assert.equal(refreshedCme.source, 'live');
    assert.equal(fetchCount, 2);
  } finally {
    clearNasaCache();
    globalThis.fetch = originalFetch;
  }
});

test('14. NASA APOD service handles image, video thumbnail, caching, 429 rate-limit, and offline fallback', async () => {
  const originalFetch = globalThis.fetch;
  clearNasaCache();

  try {
    globalThis.fetch = (async () => {
      throw new Error('Offline');
    }) as typeof fetch;
    const offlineApod = await fetchNasaApod();
    assert.equal(offlineApod.source, 'archived');
    assert.equal(offlineApod.record.url, null);

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: 'RATE_LIMIT' }), { status: 429 })) as typeof fetch;
    const rateLimitedApod = await fetchNasaApod();
    assert.equal(rateLimitedApod.source, 'archived');

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          date: '2026-03-01',
          title: 'Martian Sunset Video',
          explanation: 'Dust scatters blue light near the Martian horizon.',
          media_type: 'video',
          url: 'https://www.youtube.com/embed/example',
          thumbnail_url: 'https://apod.nasa.gov/apod/image/2603/mars_thumb.jpg',
          copyright: 'NASA/JPL-Caltech',
        }),
        { status: 200 }
      )) as typeof fetch;
    const videoApod = await fetchNasaApod();
    assert.equal(videoApod.source, 'live');
    assert.equal(videoApod.record.mediaType, 'video');
    assert.equal(videoApod.record.url, 'https://apod.nasa.gov/apod/image/2603/mars_thumb.jpg');

    const cachedApod = await fetchNasaApod();
    assert.equal(cachedApod.source, 'cached');

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          date: '2026-03-02',
          title: 'Jezero Crater Panorama',
          explanation: 'Ancient river delta layers imaged from orbit.',
          media_type: 'image',
          url: 'https://apod.nasa.gov/apod/image/2603/jezero.jpg',
          hdurl: 'https://apod.nasa.gov/apod/image/2603/jezero_hd.jpg',
        }),
        { status: 200 }
      )) as typeof fetch;
    const imageApod = await fetchNasaApod({ forceRefresh: true });
    assert.equal(imageApod.source, 'live');
    assert.equal(imageApod.record.mediaType, 'image');
    assert.equal(imageApod.record.hdUrl, 'https://apod.nasa.gov/apod/image/2603/jezero_hd.jpg');

    // Step back 1 day when today's APOD returns HTTP 500
    clearNasaCache();
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('date=')) {
        return new Response(
          JSON.stringify({
            date: '2026-11-13',
            title: 'Apollo 12 and Surveyor 3',
            explanation: 'Astronaut Pete Conrad inspects Surveyor 3 on the Moon.',
            media_type: 'image',
            url: 'https://apod.nasa.gov/apod/image/2611/surveyor3.jpg',
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ code: 500, msg: 'Internal Service Error' }), {
        status: 500,
      });
    }) as typeof fetch;
    const steppedApod = await fetchNasaApod();
    assert.equal(steppedApod.source, 'live');
    assert.equal(steppedApod.record.date, '2026-11-13');

    // Reject generic NASA Science logo placeholder responses -> archived saved data
    clearNasaCache();
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          date: '2024-05-14',
          title: 'NASA Science',
          explanation: 'Discover the cosmos!',
          media_type: 'image',
          url: 'https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png',
        }),
        { status: 200 }
      )) as typeof fetch;
    const placeholderRejected = await fetchNasaApod({ date: '2024-05-14' });
    assert.equal(placeholderRejected.source, 'archived');
  } finally {
    clearNasaCache();
    globalThis.fetch = originalFetch;
  }
});

test('15. NASA Image and Video Library (images-api.nasa.gov) parses Perseverance/Curiosity items, caches, and falls back offline', async () => {
  const originalFetch = globalThis.fetch;
  clearNasaCache();

  try {
    globalThis.fetch = (async () => {
      throw new Error('Offline');
    }) as typeof fetch;
    const offlineGallery = await fetchMarsImageLibrary('Perseverance');
    assert.equal(offlineGallery.source, 'archived');
    assert.ok(offlineGallery.items.length > 0);
    assert.equal(offlineGallery.items[0].missionTag, 'Perseverance');

    let requestedUrl = '';
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return new Response(
        JSON.stringify({
          collection: {
            items: [
              {
                data: [
                  {
                    nasa_id: 'PIA25000',
                    title: 'Perseverance Drills Jezero Delta Rock',
                    description: 'Mars 2020 rover core sample target.',
                    date_created: '2026-02-14T12:00:00Z',
                    center: 'JPL',
                    keywords: ['Mars', 'Perseverance', 'Jezero'],
                  },
                ],
                links: [
                  {
                    href: 'https://images-assets.nasa.gov/image/PIA25000/PIA25000~thumb.jpg',
                  },
                ],
              },
              {
                data: [
                  {
                    nasa_id: 'PIA25001',
                    title: 'Curiosity Inspects Sulfate Ridge',
                    description: 'MSL rover drives across Mount Sharp.',
                    date_created: '2026-02-12T08:30:00Z',
                    center: 'JPL',
                    keywords: ['Mars', 'Curiosity'],
                  },
                ],
                links: [
                  {
                    href: 'https://images-assets.nasa.gov/image/PIA25001/PIA25001~thumb.jpg',
                  },
                ],
              },
            ],
          },
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const liveGallery = await fetchMarsImageLibrary('all');
    assert.equal(liveGallery.source, 'live');
    assert.ok(requestedUrl.startsWith('https://images-api.nasa.gov/search'));
    assert.ok(!requestedUrl.includes('mars-photos'));
    assert.equal(liveGallery.items.length, 2);
    assert.equal(liveGallery.items[0].missionTag, 'Perseverance');
    assert.equal(liveGallery.items[1].missionTag, 'Curiosity');

    const cachedGallery = await fetchMarsImageLibrary('all');
    assert.equal(cachedGallery.source, 'cached');
  } finally {
    clearNasaCache();
    globalThis.fetch = originalFetch;
  }
});

test('16. DONKI radiation context enriches MissionControlAdvisor without changing deterministic 100-point scores', async () => {
  const originalFetch = globalThis.fetch;
  clearNasaCache();

  try {
    let state = startMission(createInitialGameState(21));
    state = applyDecision(state, state.activeEvent!.options[0].id);

    const baselineEvaluation = evaluateMissionAdvisor(state);
    const archivedContext = getDonkiRadiationContext();
    assert.equal(archivedContext.source, 'archived');

    // Seed live FLR & CME cache and obtain cached context
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/DONKI/FLR')) {
        return new Response(
          JSON.stringify([
            {
              flrID: '2026-04-01-FLR',
              beginTime: '2026-04-01T09:00Z',
              classType: 'X2.4',
            },
          ]),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify([
          {
            activityID: '2026-04-01-CME',
            startTime: '2026-04-01T09:30Z',
            cmeAnalyses: [{ isMostAccurate: true, speed: 1420, type: 'O', halfAngle: 44 }],
          },
        ]),
        { status: 200 }
      );
    }) as typeof fetch;

    await fetchDonkiSolarFlares(30);
    await fetchDonkiCmes(30);
    const cachedContext = getDonkiRadiationContext();
    assert.equal(cachedContext.source, 'cached');
    assert.equal(cachedContext.sourceLabel, 'Cached NASA Data');

    const enrichedEvaluation = evaluateMissionAdvisor(state, cachedContext);
    assert.deepEqual(
      enrichedEvaluation.scoreBreakdown,
      baselineEvaluation.scoreBreakdown,
      'NASA DONKI context must never alter deterministic simulator scores'
    );

    const radRec = enrichedEvaluation.recommendations.find((r) => r.domain === 'Radiation');
    assert.ok(radRec?.nasaContext);
    assert.equal(radRec.nasaContext.sourceLabel, 'Cached NASA Data');
    assert.ok(radRec.nasaContext.observationTitle.includes('X2.4'));
    assert.ok(radRec.nasaContext.observationTitle.includes('1420 km/s'));
  } finally {
    clearNasaCache();
    globalThis.fetch = originalFetch;
  }
});

test('17. NASA OSDR service fetches bone, muscle, immune, and sleep studies, caches results, and falls back offline', async () => {
  const originalFetch = globalThis.fetch;
  clearNasaCache();

  try {
    globalThis.fetch = (async () => {
      throw new Error('Offline');
    }) as typeof fetch;
    const offlineOsdr = await fetchOsdrStudyCatalog();
    assert.equal(offlineOsdr.source, 'archived');
    assert.equal(offlineOsdr.studies.length, 4);
    assert.deepEqual(
      offlineOsdr.studies.map((s) => s.domain),
      ['bone', 'muscle', 'immune', 'sleep']
    );

    let callCount = 0;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      callCount += 1;
      const url = new URL(String(input));
      const acc = url.searchParams.get('term') ?? 'OSD-47';
      return new Response(
        JSON.stringify({
          hits: {
            hits: [
              {
                _source: {
                  Accession: acc,
                  'Study Title': `Verified Live ${acc} Space Biology Study`,
                  Organism: ['Mus musculus'],
                  'Managing NASA Center': 'Ames Research Center',
                },
              },
            ],
          },
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const liveOsdr = await fetchOsdrStudyCatalog();
    assert.equal(liveOsdr.source, 'live');
    assert.equal(callCount, 4);
    assert.ok(liveOsdr.studies.every((s) => s.title.includes('Verified Live')));

    const cachedOsdr = await fetchOsdrStudyCatalog();
    assert.equal(cachedOsdr.source, 'cached');
    assert.equal(callCount, 4);
  } finally {
    clearNasaCache();
    globalThis.fetch = originalFetch;
  }
});

test('18. RadLab dosimetry, Mars Trek terrain, CSA resources, and 7-agency Data Sources Directory maintain scientific accuracy & valid HTTPS URLs', () => {
  // RadLab distinguishes ISS LEO vs Mars surface and mGy vs mSv
  assert.ok(RADLAB_DOSIMETRY_BENCHMARKS.some((b) => !b.isMarsSurface && b.detector.includes('TEPC')));
  assert.ok(RADLAB_DOSIMETRY_BENCHMARKS.some((b) => b.isMarsSurface && b.detector.includes('RAD')));
  for (const bench of RADLAB_DOSIMETRY_BENCHMARKS) {
    assert.ok(bench.doseEquivalentRate.includes('mSv/day'));
    assert.ok(bench.sourceUrl.startsWith('https://'));
  }

  // Mars Trek Jezero Crater elevation
  assert.ok(MARS_TREK_JEZERO_PROFILE.floorElevationDatum.includes('2,700 m'));
  assert.ok(MARS_TREK_JEZERO_PROFILE.portalUrl.startsWith('https://trek.nasa.gov/mars'));

  // CSA covers food/CEA, crew health/nutrition, and youth STEM
  assert.equal(CSA_RESOURCES.length, 3);
  for (const csa of CSA_RESOURCES) {
    assert.ok(csa.url.startsWith('https://www.asc-csa.gc.ca/'));
  }

  // All 7 required agencies/resources in Data Sources Directory
  const expectedIds = [
    'nasa-open-apis',
    'nasa-donki',
    'nasa-osdr',
    'nasa-radlab',
    'nasa-mars-trek',
    'nasa-image-library',
    'csa-resources',
  ];
  assert.deepEqual(
    OFFICIAL_DATA_SOURCES_DIRECTORY.map((d) => d.id),
    expectedIds
  );
  for (const entry of OFFICIAL_DATA_SOURCES_DIRECTORY) {
    assert.ok(entry.url.startsWith('https://'));
    assert.ok(
      ['Live Data', 'Historical Research', 'Terrain Information', 'Educational Material'].includes(
        entry.categoryType
      )
    );
  }
  assert.ok(SCIENTIFIC_DISCLAIMER.includes('not endorsed'));

  // Learn modules with researchBenchmark have valid URLs
  const benchmarkedModules = LEARN_MODULES.filter((m) => m.researchBenchmark);
  assert.ok(benchmarkedModules.length >= 6);
  for (const mod of benchmarkedModules) {
    assert.ok(mod.researchBenchmark!.url.startsWith('https://'));
  }
});

test('19. MissionControlAdvisor attaches RadLab, OSDR, CSA, and Mars Trek researchNotes without altering 100-point rubric scores', () => {
  let state = startMission(createInitialGameState(18));
  const habEvent = MISSION_EVENTS.find((e) => e.id === 'hab-airlock-malfunction')!;
  state = { ...state, activeEvent: habEvent };
  state = applyDecision(state, habEvent.options[0].id);

  const report = buildMissionReport(state);
  const radRec = report.advisorRecommendations.find((r) => r.domain === 'Radiation');
  const habRec = report.advisorRecommendations.find((r) => r.domain === 'Habitat');
  const lifeRec = report.advisorRecommendations.find((r) => r.domain === 'Life Support');

  assert.ok(radRec?.researchNote?.detail.includes('mGy'));
  assert.ok(radRec?.researchNote?.detail.includes('mSv'));
  assert.ok(habRec?.researchNote?.title.includes('Jezero'));
  assert.ok(lifeRec?.researchNote?.detail.includes('OSD-352'));
  assert.ok(lifeRec?.researchNote?.detail.includes('1,900–3,200 kcal/day'));
  assert.ok(report.scoreBreakdown.totalScore >= 0 && report.scoreBreakdown.totalScore <= 100);
});

test('20. Featured Mars surface photo uses links[0].href, 1-sentence captions, and reliable offline fallback', async () => {
  const originalFetch = globalThis.fetch;
  clearNasaCache();

  try {
    assert.equal(
      toOneSentence('Mars soil is rusty red. It also has giant volcanoes and canyons.'),
      'Mars soil is rusty red.'
    );

    globalThis.fetch = (async () => {
      throw new Error('Offline');
    }) as typeof fetch;
    const offlinePhoto = await fetchFeaturedMarsSurfacePhoto();
    assert.equal(offlinePhoto.isLiveNasa, false);
    assert.equal(offlinePhoto.imageUrl, null);
    assert.equal(offlinePhoto.source, 'archived');

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          collection: {
            items: [
              {
                data: [
                  {
                    nasa_id: 'PIA26001',
                    title: 'Jezero Crater Horizon Panorama',
                    description:
                      'Perseverance captured rocky terraces in Jezero Crater. Additional long details follow here.',
                    date_created: '2026-03-10T00:00:00Z',
                    center: 'JPL',
                  },
                ],
                links: [
                  {
                    href: 'https://images-assets.nasa.gov/image/PIA26001/PIA26001~thumb.jpg',
                  },
                  {
                    href: 'https://images-assets.nasa.gov/image/PIA26001/secondary.jpg',
                  },
                ],
              },
            ],
          },
        }),
        { status: 200 }
      )) as typeof fetch;

    const livePhoto = await fetchFeaturedMarsSurfacePhoto();
    assert.equal(livePhoto.isLiveNasa, true);
    assert.equal(
      livePhoto.imageUrl,
      'https://images-assets.nasa.gov/image/PIA26001/PIA26001~thumb.jpg'
    );
    assert.equal(
      livePhoto.caption,
      'Perseverance captured rocky terraces in Jezero Crater.'
    );
  } finally {
    clearNasaCache();
    globalThis.fetch = originalFetch;
  }
});

test('21. Mars Surface Explorer deck preserves full untruncated descriptions and explorer progress degrades safely in Node', async () => {
  const originalFetch = globalThis.fetch;
  clearNasaCache();

  try {
    const cleaned = cleanNasaDescription(
      '<p>Mars is a dusty place and in some locations thick blankets of its characteristic rusty dust coat crater slopes.</p> Wind gusts move grains downhill.'
    );
    assert.ok(!cleaned.includes('<p>'));
    assert.ok(cleaned.includes('coat crater slopes'));
    assert.ok(cleaned.includes('Wind gusts move grains downhill.'));

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          collection: {
            items: [
              {
                data: [
                  {
                    nasa_id: 'PIA26002',
                    title: 'Slope Streaks on a Dusty Planet',
                    description:
                      'Mars is a dusty place and in some locations thick blankets of its characteristic dust slide down steep slopes forming dark streaks.',
                    date_created: '2026-04-01T00:00:00Z',
                    center: 'JPL',
                  },
                ],
                links: [
                  {
                    href: 'https://images-assets.nasa.gov/image/PIA26002/PIA26002~thumb.jpg',
                  },
                ],
              },
            ],
          },
        }),
        { status: 200 }
      )) as typeof fetch;

    const deck = await fetchFeaturedMarsSurfaceDeck();
    assert.equal(deck.length, 1);
    assert.equal(deck[0].title, 'Slope Streaks on a Dusty Planet');
    assert.ok(deck[0].fullDescription.includes('forming dark streaks.'));

    // Explorer progress helpers & 9 mind-game medals operate cleanly in Node
    assert.equal(EXPLORER_BADGES.length, 9);
    for (const badge of EXPLORER_BADGES) {
      assert.ok(badge.mindClue.length > 15);
      assert.ok(badge.howToGuide.length > 15);
    }
    assert.equal(getExplorerRank(0), 'Mission Rookie');
    assert.equal(getExplorerRank(9), 'Outpost Zero Legend');

    const fallbackProg = loadExplorerProgress();
    assert.ok(Array.isArray(fallbackProg.unlockedBadges));
    assert.doesNotThrow(() => recordDomeInspected('lifeSupport'));
    assert.doesNotThrow(() => recordPhotoInspected());
  } finally {
    clearNasaCache();
    globalThis.fetch = originalFetch;
  }
});

test('22. Landing site trade-offs, live NASA space weather Sol 2 SPE, orbital telemetry, and demo reset work accurately', () => {
  const base = createInitialGameState(555);
  const delta = configureBriefingMission(base, {
    landingSite: 'neretva-delta',
    spaceWeatherMode: 'live-nasa',
  });

  assert.equal(delta.missionConfig.landingSite, 'neretva-delta');
  assert.equal(delta.resources.lifeSupport, 82);
  assert.equal(delta.resources.power, 72);
  assert.equal(delta.greenhouse.waterAvailability, 84);
  assert.equal(delta.powerOps.dustAccumulation, 16);

  // Advance to Sol 2 in live-nasa mode and confirm SPE event triggers
  let sim = startMission(delta);
  sim = applyDecision(sim, sim.activeEvent!.options[0].id);
  sim = proceedToSolSummary(sim);
  sim = advanceToNextSol(sim);
  assert.equal(sim.currentSol, 2);
  assert.equal(sim.activeEvent?.id, 'solar-storm-warning');

  const report = buildMissionReport(sim);
  assert.equal(report.landingSiteName, 'Neretva Vallis Delta');
  assert.equal(report.spaceWeatherMode, 'live-nasa');
  assert.equal(report.missionSeed, 555);

  const telemetry = getEarthMarsTelemetry(new Date('2026-11-14T00:00:00Z'));
  assert.ok(telemetry.distanceMillionKm >= 50 && telemetry.distanceMillionKm <= 410);
  assert.ok(telemetry.oneWayLightMinutes >= 2.8 && telemetry.oneWayLightMinutes <= 23);

  const reset = resetExplorerProgress();
  assert.equal(reset.unlockedBadges.length, 0);
  assert.equal(reset.bestMissionScore, 0);
});

test('23. Mars survival consequences: radiation leak, crop spoilage/reseed, crew health loss, and legacy save backfill', () => {
  // 1. Radiation leak & cumulative mSv dose + reinforce sealing
  let radState = startMission(createInitialGameState(77));
  radState = {
    ...radState,
    resources: {
      ...radState.resources,
      radiationProtection: 30,
      solarWeatherAlert: 'Storm Watch',
    },
    radiationShelter: {
      ...radState.radiationShelter,
      crewSheltered: false,
      radiationAlert: 'SPE Warning',
    },
  };
  radState = applyDecision(radState, radState.activeEvent!.options[0].id);
  radState = proceedToSolSummary(radState);
  assert.equal(radState.radiationShelter.radiationLeakActive, true);
  assert.ok(radState.radiationShelter.cumulativeDoseMSv > 0.67);

  radState = advanceToNextSol(radState);
  const radBeforeSeal = radState.resources.radiationProtection;
  radState = applyShelterAction(radState, 'reinforce-shelter');
  assert.equal(radState.radiationShelter.radiationLeakActive, false);
  assert.ok(radState.resources.radiationProtection > radBeforeSeal);

  // 2. Two consecutive low-power Sols (<25%) spoil Greenhouse crops; reseed-crops recovers
  let cropState = startMission(createInitialGameState(88));
  cropState = applyDecision(cropState, cropState.activeEvent!.options[0].id);
  cropState = {
    ...cropState,
    resources: { ...cropState.resources, power: 18, batteryReserve: 18 },
  };
  cropState = proceedToSolSummary(cropState);
  assert.equal(cropState.greenhouse.lowPowerStreak, 1);
  assert.equal(cropState.greenhouse.cropsSpoiled, false);

  cropState = advanceToNextSol(cropState);
  cropState = applyDecision(cropState, cropState.activeEvent!.options[0].id);
  cropState = {
    ...cropState,
    resources: { ...cropState.resources, power: 18, batteryReserve: 18 },
  };
  cropState = proceedToSolSummary(cropState);
  assert.equal(cropState.greenhouse.lowPowerStreak, 2);
  assert.equal(cropState.greenhouse.cropsSpoiled, true);
  assert.equal(cropState.greenhouse.cropGrowthStage, 'Spoiled');
  assert.equal(cropState.greenhouse.cropGrowthProgress, 0);
  assert.equal(cropState.greenhouse.harvestReadiness, false);

  cropState = advanceToNextSol(cropState);
  cropState = {
    ...cropState,
    resources: { ...cropState.resources, power: 50 },
  };
  // allocate-power blocked while spoiled
  const blockedBoost = applyGreenhouseAction(cropState, 'allocate-power');
  assert.equal(blockedBoost.greenhouse.actionsUsedThisSol.length, 0);

  cropState = applyGreenhouseAction(cropState, 'reseed-crops');
  assert.equal(cropState.greenhouse.cropsSpoiled, false);
  assert.equal(cropState.greenhouse.cropGrowthStage, 'Seedling');
  assert.equal(cropState.greenhouse.cropGrowthProgress, 15);

  // 3. Severe low health -> Incapacitated & Deceased (irreversible) -> Crew Health abort
  let crewState = startMission(createInitialGameState(99));
  crewState = {
    ...crewState,
    resources: {
      ...crewState.resources,
      lifeSupport: 15,
      power: 15,
      radiationProtection: 25,
    },
    crew: {
      ...crewState.crew,
      members: crewState.crew.members.map((m, idx) =>
        idx < 2 ? { ...m, health: 12 } : { ...m, health: 80 }
      ),
    },
  };
  crewState = applyDecision(crewState, crewState.activeEvent!.options[0].id);
  crewState = proceedToSolSummary(crewState);
  const deceasedCount = crewState.crew.members.filter(
    (m) => m.status === 'Deceased'
  ).length;
  assert.ok(deceasedCount >= 2);
  assert.ok(crewState.failureReason?.includes('casualty') || crewState.failureReason?.includes('unable'));

  const crewReport = buildMissionReport(crewState);
  assert.equal(crewReport.outcome, 'failure');
  assert.equal(crewReport.failedSystem, 'Crew Health');
  assert.ok(crewReport.crewAlive <= 2);

  // 4. Legacy save backfill fills new survival fields cleanly
  const validSave = startMission(createInitialGameState(50));
  const legacySave = JSON.parse(JSON.stringify(validSave)) as Record<string, unknown>;
  const legacyMembers = (legacySave.crew as { members: Record<string, unknown>[] }).members;
  legacyMembers.forEach((m) => delete m.health);
  delete (legacySave.greenhouse as Record<string, unknown>).lowPowerStreak;
  delete (legacySave.greenhouse as Record<string, unknown>).cropsSpoiled;
  delete (legacySave.radiationShelter as Record<string, unknown>).radiationLeakActive;
  delete (legacySave.radiationShelter as Record<string, unknown>).cumulativeDoseMSv;

  const parsedLegacy = parseAndValidateGameState(JSON.stringify(legacySave));
  assert.ok(parsedLegacy);
  assert.equal(parsedLegacy.crew.members[0].health, 100);
  assert.equal(parsedLegacy.greenhouse.lowPowerStreak, 0);
  assert.equal(parsedLegacy.greenhouse.cropsSpoiled, false);
  assert.equal(parsedLegacy.radiationShelter.radiationLeakActive, false);
  assert.equal(parsedLegacy.radiationShelter.cumulativeDoseMSv, 0.67);
});

test('24. Real-time Perseverance Rover feed parses mars.nasa.gov raw images, caches, falls back to images-api, and handles offline mode', async () => {
  const originalFetch = globalThis.fetch;
  clearNasaCache();

  try {
    // 1. Live mars.nasa.gov raw images payload
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('mars.nasa.gov/rss/api')) {
        return new Response(
          JSON.stringify({
            images: [
              {
                imageid: 'MARS2020-TEST-1',
                sol: 2031,
                date_taken_utc: '2026-11-06T12:16:25.848',
                title: 'Mars Perseverance Sol 2031: SuperCam Camera',
                caption: 'Captured on Mars by Perseverance SuperCam.',
                credit: 'NASA/JPL-Caltech/LANL',
                link: 'https://mars.nasa.gov/mars2020/multimedia/raw-images/TEST-1',
                camera: { instrument: 'SUPERCAM_RMI' },
                image_files: {
                  medium: 'https://mars.nasa.gov/mars2020-raw-images/test_800.jpg',
                  large: 'https://mars.nasa.gov/mars2020-raw-images/test_1200.jpg',
                },
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const liveFeed = await fetchRealtimeMarsRoverPhotos();
    assert.equal(liveFeed.source, 'live');
    assert.equal(liveFeed.photos.length, 1);
    assert.equal(liveFeed.photos[0].sol, 2031);
    assert.equal(liveFeed.photos[0].camera, 'SuperCam Micro-Imager');
    assert.equal(
      liveFeed.photos[0].imageUrl,
      'https://mars.nasa.gov/mars2020-raw-images/test_800.jpg'
    );

    // 2. Cached result works without extra fetch
    const cachedFeed = await fetchRealtimeMarsRoverPhotos();
    assert.equal(cachedFeed.source, 'cached');

    // 3. Falls back cleanly to live images-api.nasa.gov if mars.nasa.gov returns 503
    clearNasaCache();
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('mars.nasa.gov')) {
        return new Response('Service Unavailable', { status: 503 });
      }
      if (url.includes('images-api.nasa.gov')) {
        return new Response(
          JSON.stringify({
            collection: {
              items: [
                {
                  data: [
                    {
                      nasa_id: 'PIA26000',
                      title: 'Perseverance Tracks in Jezero Crater',
                      description: 'Rover wheel tracks on Martian dust.',
                      date_created: '2026-11-01T00:00:00Z',
                      center: 'JPL',
                      keywords: ['Mars', 'Perseverance'],
                    },
                  ],
                  links: [
                    {
                      href: 'https://images-assets.nasa.gov/image/PIA26000/PIA26000~thumb.jpg',
                    },
                  ],
                },
              ],
            },
          }),
          { status: 200 }
        );
      }
      throw new Error('Unexpected fetch');
    }) as typeof fetch;

    const backupLive = await fetchRealtimeMarsRoverPhotos({ forceRefresh: true });
    assert.equal(backupLive.source, 'live');
    assert.equal(backupLive.photos[0].id, 'PIA26000');

    // 4. Falls back cleanly to archived AI reference when completely offline
    clearNasaCache();
    globalThis.fetch = (async () => {
      throw new Error('Offline');
    }) as typeof fetch;
    const offlineFeed = await fetchRealtimeMarsRoverPhotos({ forceRefresh: true });
    assert.equal(offlineFeed.source, 'archived');
    assert.equal(offlineFeed.photos[0].imageUrl, null);
  } finally {
    clearNasaCache();
    globalThis.fetch = originalFetch;
  }
});

