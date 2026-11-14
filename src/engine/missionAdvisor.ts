import {
  DonkiRadiationContext,
  getDonkiRadiationContext,
} from '../services/nasaDonkiService';
import {
  AdvisorRecommendation,
  GameState,
  MissionScoreBreakdown,
} from '../types/mission';

export function evaluateMissionAdvisor(
  state: GameState,
  donkiContext?: DonkiRadiationContext
): {
  scoreBreakdown: MissionScoreBreakdown;
  recommendations: AdvisorRecommendation[];
} {
  const {
    resources,
    greenhouse,
    powerOps,
    radiationShelter,
    commSystem,
    decisionHistory,
    failureReason,
  } = state;

  const lostPointsNotes: string[] = [];

  // 1. Life Support Management (30 points)
  const lifeBase = Math.round((resources.lifeSupport / 100) * 20);
  const foodAndGh = Math.round(
    (((resources.foodReserves + (greenhouse?.health ?? 75)) / 2) / 100) * 10
  );
  const lifeSupportScore = Math.max(0, Math.min(30, lifeBase + foodAndGh));
  if (lifeSupportScore < 27) {
    lostPointsNotes.push(
      `Life Support (${lifeSupportScore}/30): Ended at ${resources.lifeSupport}% Life Support, ${resources.foodReserves}% Food, and ${greenhouse?.health ?? 0}% Greenhouse.`
    );
  }

  // 2. Power Management (25 points)
  const powerBase = Math.round(
    (((resources.power + resources.batteryReserve) / 2) / 100) * 20
  );
  const dustPenalty =
    (powerOps?.dustAccumulation ?? 0) > 45
      ? -3
      : (powerOps?.dustAccumulation ?? 0) > 25
        ? -1
        : 0;
  const powerBonus =
    powerOps?.powerSavingMode ||
    (powerOps?.actionsUsedThisSol.includes('clean-solar-panels') ?? false)
      ? 5
      : 3;
  const powerScore = Math.max(0, Math.min(25, powerBase + powerBonus + dustPenalty));
  if (powerScore < 22) {
    lostPointsNotes.push(
      `Power (${powerScore}/25): Finished at ${resources.power}% power with ${powerOps?.dustAccumulation ?? 0}% panel dust.`
    );
  }

  // 3. Radiation Protection (25 points)
  const radBase = Math.round((resources.radiationProtection / 100) * 18);
  const shelterBonus = Math.round(
    ((radiationShelter?.shelterReadiness ?? 75) / 100) * 7
  );
  const delayedSpe = decisionHistory.some(
    (d) =>
      d.eventId === 'solar-storm-warning' && d.approach === 'wait-for-earth'
  );
  const spePenalty = delayedSpe ? -4 : 0;
  const radiationScore = Math.max(
    0,
    Math.min(25, radBase + shelterBonus + spePenalty)
  );
  if (radiationScore < 22) {
    lostPointsNotes.push(
      `Radiation (${radiationScore}/25): ${
        delayedSpe
          ? 'Delayed entering shelter during a Solar Particle Event.'
          : `Shielding finished at ${resources.radiationProtection}% (${radiationShelter?.shelterReadiness ?? 0}% shelter readiness).`
      }`
    );
  }

  // 4. Decision Making & Event Response (20 points)
  const totalDecisions = decisionHistory.length;
  let decisionPoints = 6;

  if (totalDecisions > 0) {
    const goodDecisions = decisionHistory.filter(
      (d) =>
        d.approach === 'approved-checklist' || d.approach === 'detailed-report'
    ).length;
    const waitMistakes = decisionHistory.filter(
      (d) => d.approach === 'wait-for-earth'
    ).length;

    const decisionRatio = goodDecisions / totalDecisions;
    decisionPoints += Math.round(decisionRatio * 10);
    decisionPoints -= Math.min(5, waitMistakes * 2);
  }

  if ((commSystem?.reportsSent.length ?? 0) > 0) {
    decisionPoints += 2;
  }
  if ((greenhouse?.actionsUsedThisSol.length ?? 0) > 0 || state.history.length > 3) {
    decisionPoints += 2;
  }
  if (failureReason) {
    decisionPoints = Math.min(decisionPoints, 16);
  }

  const decisionMakingScore = Math.max(0, Math.min(20, decisionPoints));
  if (decisionMakingScore < 18) {
    const waitedCount = decisionHistory.filter(
      (d) => d.approach === 'wait-for-earth'
    ).length;
    lostPointsNotes.push(
      `Decision Making (${decisionMakingScore}/20): ${
        waitedCount > 0
          ? `Waited for Earth ${waitedCount} time(s) instead of following approved checklists right away.`
          : 'Some event trade-offs or Mission Control reports could be strengthened.'
      }`
    );
  }

  const totalScore = Math.max(
    0,
    Math.min(
      100,
      lifeSupportScore + powerScore + radiationScore + decisionMakingScore
    )
  );

  const recommendations: AdvisorRecommendation[] = [];

  // Communication analysis
  const waitedDuringCommsOrEmergency = decisionHistory.find(
    (d) => d.approach === 'wait-for-earth'
  );
  const usedApprovedAutonomy = decisionHistory.some(
    (d) => d.approach === 'approved-checklist'
  );
  if (waitedDuringCommsOrEmergency) {
    recommendations.push({
      domain: 'Communication',
      status: 'Improvement',
      message: `On Sol ${waitedDuringCommsOrEmergency.sol} ("${waitedDuringCommsOrEmergency.eventTitle}"), you waited on Earth instead of using the safety checklist. Act on checklists first, then send Earth a clear report.`,
    });
  } else if (usedApprovedAutonomy || (commSystem?.reportsSent.length ?? 0) > 0) {
    recommendations.push({
      domain: 'Communication',
      status: 'Strength',
      message:
        'Great teamwork! You followed safety checklists right away and kept Earth updated with clear reports.',
    });
  }

  // Power & Dust Storm analysis
  const stormDecision = decisionHistory.find(
    (d) => d.eventId === 'regional-dust-storm'
  );
  if (
    stormDecision?.optionId === 'continue-normal-storm-ops' ||
    resources.power < 35
  ) {
    recommendations.push({
      domain: 'Power',
      status: 'Improvement',
      message:
        'Batteries ran low during dusty or dark conditions. Turn on Power-Saving Mode earlier to protect oxygen scrubbers and heaters.',
    });
  } else {
    recommendations.push({
      domain: 'Power',
      status: 'Strength',
      message: `Steady solar and battery care kept backup power at ${resources.batteryReserve}%.`,
    });
  }

  // Radiation & Shelter analysis
  const resolvedDonkiContext = donkiContext ?? getDonkiRadiationContext();
  const radLabResearchNote = {
    agency: 'NASA RadLab',
    dataType: 'Historical Research' as const,
    title: 'Real Radiation Units (mGy/day vs. mSv/day)',
    detail:
      'ISS detectors measure ~0.27–0.37 mGy/day (~0.50–1.0+ mSv/day) inside Earth’s magnetic shield, while Curiosity on Mars records ~0.21–0.48 mGy/day (~0.64–0.67 mSv/day). Physical mGy and biological mSv measure different things.',
    sourceUrl: 'https://visualization.osdr.nasa.gov/radlab/',
  };
  const speDecision = decisionHistory.find(
    (d) => d.eventId === 'solar-storm-warning'
  );
  if (speDecision?.approach === 'wait-for-earth' || resources.radiationProtection < 40) {
    recommendations.push({
      domain: 'Radiation',
      status: 'Improvement',
      message:
        'Waiting during a Solar Particle Event increased radiation risk. Move the crew inside the water-walled storm shelter right away.',
      nasaContext: {
        sourceLabel: resolvedDonkiContext.sourceLabel,
        observationTitle: resolvedDonkiContext.headline,
        detail: resolvedDonkiContext.scientificContext,
      },
      researchNote: radLabResearchNote,
    });
  } else {
    recommendations.push({
      domain: 'Radiation',
      status: 'Strength',
      message: `Shielding finished strong at ${resources.radiationProtection}% with ${radiationShelter?.shelterReadiness ?? 75}% shelter readiness.`,
      nasaContext: {
        sourceLabel: resolvedDonkiContext.sourceLabel,
        observationTitle: resolvedDonkiContext.headline,
        detail: resolvedDonkiContext.scientificContext,
      },
      researchNote: radLabResearchNote,
    });
  }

  // Habitat & Rover analysis
  const marsTrekNote = {
    agency: 'Mars Trek',
    dataType: 'Terrain Information' as const,
    title: 'Jezero Crater Terrain & Elevation',
    detail:
      'Jezero Crater’s floor lies ~2,700 m below Mars datum with 500–800+ m rim hills, so flat base sites and careful rover routes protect seals and batteries.',
    sourceUrl: 'https://trek.nasa.gov/mars/',
  };
  const deferredHabitat = decisionHistory.find(
    (d) =>
      (d.eventId === 'hab-airlock-malfunction' ||
        d.eventId === 'hab-pressure-leak' ||
        d.eventId === 'habitat-maintenance') &&
      d.approach === 'wait-for-earth'
  );
  if (deferredHabitat) {
    recommendations.push({
      domain: 'Habitat',
      status: 'Improvement',
      message: `Waiting on "${deferredHabitat.eventTitle}" (Sol ${deferredHabitat.sol}) put cabin seals at risk. Seal affected sections and fix airlocks early.`,
      researchNote: marsTrekNote,
    });
  } else if (
    decisionHistory.some(
      (d) => d.eventCategory === 'Habitat' || d.eventCategory === 'Rover'
    )
  ) {
    recommendations.push({
      domain: 'Habitat',
      status: 'Strength',
      message:
        'Airlock seals, leaks, and rover problems were fixed quickly using safety checklists.',
      researchNote: marsTrekNote,
    });
  }

  // Greenhouse & Life Support analysis
  if (
    greenhouse?.powerConsumption === 'Boosted' &&
    resources.power < 35
  ) {
    recommendations.push({
      domain: 'Greenhouse',
      status: 'Improvement',
      message:
        'Boosted grow lights drained batteries when power was low. Switch to standard lighting and use packaged food when electricity is tight.',
      researchNote: {
        agency: 'CSA',
        dataType: 'Educational Material',
        title: 'Space Farming & Nutrition',
        detail:
          'CSA food guides (~1,900–3,200 kcal/day crew needs) pair reliable stored meals with energy-aware greenhouse crops.',
        sourceUrl: 'https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/eating-in-space.asp',
      },
    });
  } else {
    recommendations.push({
      domain: 'Life Support',
      status: resources.lifeSupport >= 50 ? 'Strength' : 'Improvement',
      message:
        resources.lifeSupport >= 50
          ? `Life Support (${resources.lifeSupport}%) and Food (${resources.foodReserves}%) stayed healthy across your Sols.`
          : `Life Support fell to ${resources.lifeSupport}%. Balance oxygen recycling and greenhouse water repairs carefully.`,
      researchNote: {
        agency: 'NASA OSDR / CSA',
        dataType: 'Historical Research',
        title: 'Space Biology & Crew Nutrition',
        detail:
          'NASA OSDR studies (bone OSD-352, muscle OSD-47, immune OSD-738, sleep OSD-253) and CSA nutrition guides (1,900–3,200 kcal/day) show why air, rest, and food all protect crew health.',
        sourceUrl: 'https://osdr.nasa.gov/',
      },
    });
  }

  return {
    scoreBreakdown: {
      lifeSupportScore,
      powerScore,
      radiationScore,
      decisionMakingScore,
      totalScore,
      lostPointsNotes,
    },
    recommendations,
  };
}
