import { CrewMember, MissionEvent, ResourceKey } from '../types/mission';

export const MISSION_CONFIG = {
  planet: 'Mars' as const,
  outpostName: 'Outpost Zero',
  maxSols: 10,
  crewCount: 4,
  outpostType: 'Small Research Outpost',
};

export const MARS_ENVIRONMENT_FACTS = {
  atmosphere: 'Approximately 95% carbon dioxide (CO2), with trace nitrogen and argon.',
  pressure: 'Less than 1% of Earth’s average surface atmospheric pressure.',
  temperature:
    'Average surface temperature around -53°C, with wide seasonal and day-to-night swings.',
  dustStorms:
    'Regional and global dust storms can suspend fine dust for weeks, dimming sunlight.',
  terrain:
    'Rocky plains, wind-carved sand dunes, impact craters, steep cliffs, and ancient volcanoes.',
};

export const ALTERNATIVE_POWER_CONCEPTS = [
  {
    name: 'Nuclear Fission Reactors',
    summary:
      'Compact surface fission reactors could supply steady electricity day and night, even through long dust storms.',
  },
  {
    name: 'Radioisotope Power Systems (MMRTGs)',
    summary:
      'Convert natural heat from decaying plutonium into continuous low-level electricity for rovers and backup sensors.',
  },
  {
    name: 'Fuel Cells',
    summary:
      'Store chemical energy (such as hydrogen and oxygen) to generate backup power and clean water during dark periods.',
  },
  {
    name: 'Wind & Geothermal (Practical Limits)',
    summary:
      'Mars air is under 1% as dense as Earth’s, so winds push weakly on turbines, and accessible underground geothermal heat remains unproven.',
  },
];

export const INITIAL_CREW: CrewMember[] = [
  {
    id: 'cmd-maya',
    name: 'Maya Chen',
    role: 'Mission Commander',
    specialty: 'Flight Systems & Safety',
    energy: 92,
    status: 'Active',
  },
  {
    id: 'bot-mateo',
    name: 'Mateo Silva',
    role: 'Botanist & Life Support',
    specialty: 'Hydroponics & Oxygen',
    energy: 90,
    status: 'Active',
  },
  {
    id: 'eng-priya',
    name: 'Priya Nair',
    role: 'Power & Habitat Engineer',
    specialty: 'Solar Arrays & Shielding',
    energy: 91,
    status: 'Active',
  },
  {
    id: 'med-leo',
    name: 'Leo Vance',
    role: 'Medical & Comms Officer',
    specialty: 'Crew Health & Deep Space Link',
    energy: 89,
    status: 'Active',
  },
];

export const RESOURCE_TOOLTIPS: Record<
  ResourceKey,
  { title: string; summary: string; realScience: string }
> = {
  lifeSupport: {
    title: 'Life Support (Oxygen, Water & Food)',
    summary:
      'Measures breathable oxygen, clean recycled air, and food grown or stored inside the habitat.',
    realScience:
      'Mars air is ~95% carbon dioxide at <1% of Earth pressure, so sealed habitats recycle air/water and grow supplemental crops indoors.',
  },
  power: {
    title: 'Power (Solar Generation & Batteries)',
    summary:
      'Tracks electricity made by solar panels and stored in outpost batteries for heaters, lights, and air scrubbers.',
    realScience:
      'Maximum solar flux on Mars is ~45% of Earth values, and dust accumulation (~0.2% per Sol benchmark in rover studies) plus storms reduce output.',
  },
  radiationProtection: {
    title: 'Radiation Protection (GCR & SPE Shielding)',
    summary:
      'Shows how well habitat walls, water tanks, polyethylene lining, and shelters reduce crew radiation dose.',
    realScience:
      'Mars lacks a global magnetic field, exposing the surface to steady Galactic Cosmic Rays (GCR) and occasional Solar Particle Events (SPE).',
  },
};

export const MISSION_EVENTS: MissionEvent[] = [
  // EARLY MISSION (Sol 1-3)
  {
    id: 'solar-conjunction-comms',
    code: 'COM-01',
    title: 'Solar Conjunction Communication Restriction',
    category: 'Communications',
    severity: 'Alert',
    solWindow: [1, 2],
    conjunctionRestricted: true,
    environmentCondition: 'Solar Conjunction Window',
    description:
      'The Sun is moving near the direct line of sight between Earth and Mars. Solar radio interference is distorting transmissions, leaving Outpost Zero with limited or delayed guidance from Earth.',
    scientificExplanation:
      'During solar conjunction (roughly every 26 months), hot solar plasma scatters radio waves. Even on normal days, one-way signals take 3–22 minutes (6–44 minutes round-trip), so crews must be ready to act autonomously.',
    educationalTakeaway:
      'Astronauts train to follow approved safety checklists independently whenever Earth is unreachable or too far away to answer in time.',
    affectedSystems: ['lifeSupport', 'power', 'radiationProtection'],
    options: [
      {
        id: 'follow-autonomous-checklist',
        label: 'Follow Approved Autonomous Operations Checklist',
        actionSummary:
          'Verify airlocks, run automated diagnostics, and keep routine science at conservative settings.',
        tradeOffHint:
          'Protects Life Support & Shielding safely, at the cost of a small Power diagnostic draw.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: +4,
          power: -5,
          radiationProtection: +4,
          batteryReserve: -5,
        },
        crewEnergyDelta: -4,
        crewStatusEffect: 'Active',
        whyExplanation:
          'Running the pre-approved autonomous checklist kept cabin life support and radiation seals verified without waiting on noisy radio links. Automated diagnostics used a modest amount of battery power.',
        lessonTag:
          'Approved safety checklists allow crews to protect habitat systems independently during communication blackouts.',
      },
      {
        id: 'queue-detailed-status-bundle',
        label: 'Transmit Compressed Telemetry & Detailed Status Report',
        actionSummary:
          'Log system health, crew status, and power reserves for Earth while switching radios to low-power standby.',
        tradeOffHint:
          'Conserves Power and updates Mission Control, while slowing crew maintenance shifts.',
        approach: 'detailed-report',
        deltas: {
          lifeSupport: -3,
          power: +6,
          radiationProtection: +2,
          batteryReserve: +6,
        },
        crewEnergyDelta: -5,
        crewStatusEffect: 'Active',
        energyConsumptionEffect: 'Low',
        whyExplanation:
          'Bundling a concise status report and pausing high-gain radio sweeps saved battery power during conjunction. Crew spent extra time logging checks, slightly delaying minor life-support upkeep.',
        lessonTag:
          'Structured status reports give Earth full context while conserving transmitter power.',
      },
      {
        id: 'wait-for-earth-ping',
        label: 'Hold All Decisions & Wait for Clear Signal from Earth',
        actionSummary:
          'Keep crew indoors resting while the high-gain dish searches continuously for an Earth reply.',
        tradeOffHint:
          'Avoids outdoor suit oxygen use (+2% Life Support), but drains Power searching and delays habitat checks.',
        approach: 'wait-for-earth',
        deltas: {
          lifeSupport: +2,
          power: -10,
          radiationProtection: -4,
          batteryReserve: -10,
        },
        crewEnergyDelta: +2,
        crewStatusEffect: 'Resting',
        whyExplanation:
          'Keeping the crew resting indoors saved EVA suit oxygen briefly, yet leaving the high-gain dish searching through solar interference drained batteries and delayed outer shielding checks.',
        lessonTag:
          'Waiting passively on Earth when communication is restricted wastes power and delays needed checks.',
      },
    ],
    earthAdvice: {
      headline: 'Conjunction Autonomy Reminder',
      guidance:
        'During solar conjunction, Earth cannot send real-time help. Follow your approved autonomous operations checklist and send compact summary logs when the link clears.',
      scienceFact:
        'NASA pauses most rover driving commands for roughly two weeks during Mars solar conjunction to avoid corrupted radio instructions.',
    },
  },
  {
    id: 'comm-equipment-failure',
    code: 'COM-02',
    title: 'Communication Equipment Failure',
    category: 'Communications',
    severity: 'Alert',
    solWindow: [1, 3],
    environmentCondition: 'Dust Haze',
    description:
      'Electrostatic dust shifted the High-Gain Dish antenna out of alignment, interrupting weather forecasts from Mars orbiters and slowing messages to Earth.',
    scientificExplanation:
      'Focused parabolic dishes aim radio waves across millions of kilometers using far less electricity than wide omnidirectional backup beacons.',
    educationalTakeaway:
      'Maintaining focused antennas preserves both early space-weather warnings and electrical battery reserves.',
    affectedSystems: ['radiationProtection', 'power', 'lifeSupport'],
    options: [
      {
        id: 'manual-dish-realign',
        label: 'Follow EVA Checklist to Realign Antenna Manually',
        actionSummary:
          'Send Leo and Priya following safety tethers to clear dust and re-aim the dish.',
        tradeOffHint:
          'Restores Radiation weather alerts and saves Power, but spends suit Oxygen and crew energy.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: -6,
          power: +5,
          radiationProtection: +9,
          oxygenAvailability: -6,
          shieldingCondition: +6,
        },
        crewEnergyDelta: -8,
        crewStatusEffect: 'Repair Duty',
        exposureRiskEffect: 'Low',
        solarAlertEffect: 'Clear',
        whyExplanation:
          'Following the EVA alignment checklist restored orbital solar-weather warnings and cut radio power waste. Stepping outside spent spacesuit oxygen and crew energy.',
        lessonTag:
          'Restoring focused communication dishes improves radiation warning readiness while saving transmitter power.',
      },
      {
        id: 'overdrive-omni-beacon',
        label: 'Boost Backup Beacon & Send Detailed Report to Earth',
        actionSummary:
          'Send a full problem-and-resource report from indoors using the wide backup radio.',
        tradeOffHint:
          'Avoids outdoor EVA oxygen loss, but drains Power batteries heavily.',
        approach: 'detailed-report',
        deltas: {
          lifeSupport: +2,
          power: -12,
          radiationProtection: +5,
          batteryReserve: -12,
          shieldingCondition: +3,
        },
        crewEnergyDelta: -3,
        crewStatusEffect: 'Active',
        energyConsumptionEffect: 'High',
        solarAlertEffect: 'Clear',
        whyExplanation:
          'Boosting the indoor backup transmitter kept astronauts inside and sent Earth a detailed status report, but broadcasting in every direction consumed significant battery power.',
        lessonTag:
          'Omnidirectional backup beacons avoid EVA risk at a high electrical cost.',
      },
    ],
    earthAdvice: {
      headline: 'Deep Space Antenna Diagnostics',
      guidance:
        'Without orbital weather telemetry, you lose early warnings for Solar Particle Events. Re-aiming the dish physically saves battery power if Life Support oxygen is healthy.',
      scienceFact:
        'At closest approach radio signals take ~3 minutes one-way; at farthest orbital separation they take ~22 minutes one-way.',
    },
  },
  {
    id: 'solar-panel-dust',
    code: 'PWR-01',
    title: 'Solar Panel Dust Accumulation',
    category: 'Power',
    severity: 'Alert',
    solWindow: [2, 4],
    environmentCondition: 'Dust Haze',
    description:
      'Fine red iron-oxide dust has settled across the east solar array wing. Combined with daily dust buildup, solar charging has dropped noticeably.',
    scientificExplanation:
      'Mars receives at most ~45% of Earth’s sunlight flux. Studied lander and rover solar panels experienced roughly ~0.2% dust degradation per Sol (though rates vary by site and wind).',
    educationalTakeaway:
      'Regular solar-panel maintenance keeps batteries charged before dust storms arrive.',
    affectedSystems: ['power', 'radiationProtection', 'lifeSupport'],
    options: [
      {
        id: 'eva-manual-brush',
        label: 'Follow Safety Protocol for Dust-Brushing EVA',
        actionSummary:
          'Suit up Priya and Mateo to sweep dust off the solar panels during calm midday.',
        tradeOffHint:
          'Strongly restores Solar Generation & Power, but consumes suit Oxygen and adds minor radiation exposure.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: -7,
          power: +14,
          radiationProtection: -6,
          oxygenAvailability: -7,
          solarGeneration: +18,
          dustAccumulation: -35,
          shieldingCondition: -3,
        },
        crewEnergyDelta: -9,
        crewStatusEffect: 'Repair Duty',
        energyConsumptionEffect: 'Balanced',
        exposureRiskEffect: 'Moderate',
        solarAlertEffect: 'Advisory',
        whyExplanation:
          'Brushing away iron-oxide dust let sunlight reach the solar cells again, restoring Power and Solar Generation. Stepping outside used spacesuit oxygen and exposed workers briefly to unshielded sky radiation.',
        lessonTag:
          'Cleaning dusty solar arrays restores power output while spending suit oxygen and EVA time.',
      },
      {
        id: 'electrostatic-dust-pulse',
        label: 'Activate Indoor Electrostatic Dust Shield',
        actionSummary:
          'Send high-voltage pulses across the panels from inside the habitat.',
        tradeOffHint:
          'Keeps crew safely indoors, but spends battery power first for moderate dust clearing.',
        approach: 'standard-engineering',
        deltas: {
          lifeSupport: +2,
          power: +4,
          radiationProtection: +2,
          batteryReserve: -6,
          solarGeneration: +10,
          dustAccumulation: -18,
        },
        crewEnergyDelta: -2,
        crewStatusEffect: 'Active',
        energyConsumptionEffect: 'Balanced',
        exposureRiskEffect: 'Low',
        solarAlertEffect: 'Clear',
        whyExplanation:
          'Electrostatic pulses shook loose surface dust without an EVA, keeping crew radiation exposure low, though pulsing the panels required battery energy upfront.',
        lessonTag:
          'Remote dust-clearing tools reduce EVA risk in exchange for moderate battery usage.',
      },
      {
        id: 'shift-to-low-power',
        label: 'Conserve Power & Wait for Martian Wind Gusts',
        actionSummary:
          'Dim non-essential lights and leave panels uncleaned while hoping winds clear dust.',
        tradeOffHint:
          'Protects crew indoors, but leaves Solar Generation low and slows Greenhouse output.',
        approach: 'wait-for-earth',
        deltas: {
          lifeSupport: -6,
          power: -8,
          radiationProtection: +3,
          foodReserves: -5,
          solarGeneration: -6,
          dustAccumulation: +6,
        },
        crewEnergyDelta: -3,
        crewStatusEffect: 'Resting',
        energyConsumptionEffect: 'Low',
        exposureRiskEffect: 'Low',
        whyExplanation:
          'Waiting indoors avoided EVA oxygen use, yet dusty panels continued starving battery reserves and slowed greenhouse plant growth.',
        lessonTag:
          'Relying only on Martian wind gusts leaves solar output vulnerable when batteries are needed.',
      },
    ],
    earthAdvice: {
      headline: 'Solar Array Recovery Guidance',
      guidance:
        'Fine Martian dust clings via static electricity. If Radiation Protection is above 55%, a scheduled EVA clears the most dust; otherwise use indoor electrostatic pulses.',
      scienceFact:
        'NASA’s Spirit and Opportunity rovers relied on occasional Martian wind "cleaning events" to brush dust off their solar wings.',
    },
  },
  {
    id: 'greenhouse-failure',
    code: 'BIO-01',
    title: 'Greenhouse Thermal & Valve Alert',
    category: 'Life Support',
    severity: 'Alert',
    solWindow: [2, 4],
    environmentCondition: 'Clear Martian Sky',
    description:
      'Freezing night temperatures (-53°C average) stiffened a greenhouse thermal valve, chilling the hydroponic lettuce trays and slowing oxygen output.',
    scientificExplanation:
      'Mars’s cold, thin atmosphere carries heat away poorly but chills exposed pipes fast at night. Hydroponic crops require steady warmth, water, nutrients, and LED light.',
    educationalTakeaway:
      'Greenhouse crops contribute fresh vitamins and oxygen, yet compete with habitat heating and battery power.',
    affectedSystems: ['lifeSupport', 'power', 'radiationProtection'],
    options: [
      {
        id: 'emergency-grow-heaters',
        label: 'Divert Thermal Loop & Boost LEDs to Save Crops',
        actionSummary:
          'Follow botanical recovery checklist to pump warm water and raise grow lights.',
        tradeOffHint:
          'Rescues Greenhouse crops and Life Support, but draws Power and borrows jacket water.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: +9,
          power: -10,
          radiationProtection: -5,
          foodReserves: +10,
          batteryReserve: -10,
          shieldingCondition: -5,
        },
        crewEnergyDelta: -5,
        crewStatusEffect: 'Active',
        greenhouseEffect: 'Thriving',
        energyConsumptionEffect: 'High',
        whyExplanation:
          'Warm water thawed the hydroponic loop in time, boosting fresh food and plant oxygen. Heating the dome drew heavily on batteries and temporarily borrowed water from the shielding jacket.',
        lessonTag:
          'Protecting greenhouse crops supports life support while competing directly with power and water reserves.',
      },
      {
        id: 'harvest-early-ration',
        label: 'Seal Frost Pipe & Switch Temporarily to Packaged Rations',
        actionSummary:
          'Close off the chilled bay to save power and feed the crew from stored packaged food.',
        tradeOffHint:
          'Conserves Power and Radiation Shielding, but reduces Greenhouse health and fresh food.',
        approach: 'standard-engineering',
        deltas: {
          lifeSupport: -7,
          power: +7,
          radiationProtection: +3,
          foodReserves: -9,
          batteryReserve: +7,
        },
        crewEnergyDelta: -4,
        crewStatusEffect: 'Active',
        greenhouseEffect: 'Damaged',
        energyConsumptionEffect: 'Low',
        whyExplanation:
          'Isolating the chilled section preserved electricity and kept shielding water untouched, showing why packaged food reserves remain vital backups when crops slow down.',
        lessonTag:
          'Stored packaged food keeps astronauts safe when greenhouse energy must be conserved.',
      },
    ],
    earthAdvice: {
      headline: 'Botanical Recovery Assessment',
      guidance:
        'Check your battery reserves first: if Power is above 50%, warming the hydroponic loop preserves future harvests; if Power is low, isolate the bay and rely on stored rations.',
      scienceFact:
        'Untreated Martian regolith contains toxic perchlorate salts, so Mars greenhouses use sealed hydroponic trays rather than raw outdoor dirt.',
    },
  },
  {
    id: 'habitat-maintenance',
    code: 'HAB-00',
    title: 'Habitat Composite Seal Inspection',
    category: 'Habitat',
    severity: 'Advisory',
    solWindow: [1, 3],
    environmentCondition: 'Clear Martian Sky',
    description:
      'Thermal expansion between cold Martian nights and midday sun created tiny hairline wear in the outer composite insulation near Crew Quarters.',
    scientificExplanation:
      'Martian surface temperatures swing widely every Sol, stressing habitat seals, gaskets, and radiation shielding layers.',
    educationalTakeaway:
      'Preventive habitat maintenance stops small wear from becoming larger energy and shielding losses.',
    affectedSystems: ['radiationProtection', 'lifeSupport', 'power'],
    options: [
      {
        id: 'apply-polymer-sealant',
        label: 'Apply Regolith-Polymer Composite Patch Now',
        actionSummary:
          'Follow maintenance checklist to seal the outer wall using polymer binder and UV curing lamps.',
        tradeOffHint:
          'Strengthens Radiation Shielding and insulation, but costs Power and crew work time.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: -3,
          power: -8,
          radiationProtection: +12,
          batteryReserve: -8,
          shieldingCondition: +14,
        },
        crewEnergyDelta: -7,
        crewStatusEffect: 'Repair Duty',
        energyConsumptionEffect: 'Balanced',
        exposureRiskEffect: 'Low',
        whyExplanation:
          'Curing a Martian soil-polymer patch sealed heat leaks and reinforced outer shielding. Running UV curing lamps and crew shifts spent battery power and energy.',
        lessonTag:
          'Preventive structural maintenance protects both thermal insulation and radiation shielding.',
      },
      {
        id: 'crank-cabin-heaters',
        label: 'Raise Cabin Heaters & Defer Patch Until Later',
        actionSummary:
          'Keep the interior warm with extra electrical heating and monitor sensors.',
        tradeOffHint:
          'Keeps Life Support cozy right now, but drains Power and lets shielding wear continue.',
        approach: 'wait-for-earth',
        deltas: {
          lifeSupport: +3,
          power: -9,
          radiationProtection: -8,
          shieldingCondition: -8,
          batteryReserve: -9,
        },
        crewEnergyDelta: -2,
        crewStatusEffect: 'Active',
        energyConsumptionEffect: 'High',
        exposureRiskEffect: 'Elevated',
        whyExplanation:
          'Extra electric heating kept indoor temperatures comfortable briefly, yet leaving the outer seal unpatched wasted battery power and weakened shielding.',
        lessonTag:
          'Postponing outer habitat repairs increases heater demand and leaves shielding degraded.',
      },
    ],
    earthAdvice: {
      headline: 'Structural Integrity & Insulation Guidance',
      guidance:
        'Sealing small insulation cracks early prevents compounding heater drain across later Sols.',
      scienceFact:
        'Engineers study mixing Martian regolith with binders to 3D-print thick radiation-shielding shells.',
    },
  },

  // MIDDLE MISSION (Sol 4-6)
  {
    id: 'regional-dust-storm',
    code: 'ENV-01',
    title: 'Regional Dust Storm Approaching',
    category: 'Power',
    severity: 'Emergency',
    solWindow: [4, 5],
    environmentCondition: 'Regional Dust Storm',
    description:
      'Orbital cameras show a fast-moving regional dust storm sweeping across Jezero Sector. Sunlight will dim sharply—not to zero, but enough to drop solar power and coat exposed equipment.',
    scientificExplanation:
      'Mars dust storms lift fine particles high into the thin atmosphere, scattering sunlight and lowering solar generation while depositing dust on arrays. Battery reserves must bridge essential systems.',
    educationalTakeaway:
      'During a regional dust storm, solar generation drops but rarely hits zero—conserving non-essential power protects batteries and life support.',
    affectedSystems: ['power', 'lifeSupport', 'radiationProtection'],
    options: [
      {
        id: 'activate-storm-power-saving',
        label: 'Activate Power-Saving Mode & Prioritize Essential Systems',
        actionSummary:
          'Follow storm checklist: dim non-essential science/greenhouse lights and protect oxygen scrubbers and heaters.',
        tradeOffHint:
          'Protects Power batteries and essential Life Support, while slowing crop growth.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: -4,
          power: +6,
          radiationProtection: +2,
          solarGeneration: -14,
          batteryReserve: +8,
          dustAccumulation: +18,
          foodReserves: -4,
        },
        crewEnergyDelta: -4,
        crewStatusEffect: 'Active',
        energyConsumptionEffect: 'Low',
        stormSeverityEffect: 'Regional Storm',
        solarAlertEffect: 'Advisory',
        whyExplanation:
          'Switching to Power-Saving Mode kept oxygen scrubbers and core heaters running on battery reserves even though storm clouds dimmed solar generation. Dimming grow lights slowed food growth slightly.',
        lessonTag:
          'Reducing non-essential electricity during a dust storm protects battery reserves for essential life support.',
      },
      {
        id: 'continue-normal-storm-ops',
        label: 'Continue Normal Operations & Full Greenhouse Lighting',
        actionSummary:
          'Keep all science labs and high-output grow lights running through the storm.',
        tradeOffHint:
          'Preserves Food growth today, but heavily drains Battery Reserves as solar flux drops.',
        approach: 'standard-engineering',
        deltas: {
          lifeSupport: +3,
          power: -16,
          radiationProtection: -2,
          solarGeneration: -16,
          batteryReserve: -16,
          dustAccumulation: +22,
        },
        crewEnergyDelta: -3,
        crewStatusEffect: 'Active',
        energyConsumptionEffect: 'High',
        stormSeverityEffect: 'Regional Storm',
        whyExplanation:
          'Keeping full lighting preserved plant growth for the day, but running full load while storm dust dimmed sunlight drained batteries rapidly.',
        lessonTag:
          'Continuing full power draw during a dust storm risks draining outpost batteries.',
      },
      {
        id: 'send-storm-report-partial-cut',
        label: 'Cut Lab Power, Log Storm Data & Send Detailed Report',
        actionSummary:
          'Reduce lab equipment power moderately and send Earth a status report on storm opacity and battery margin.',
        tradeOffHint:
          'Balances moderate battery savings and Earth awareness, while letting dust build up.',
        approach: 'detailed-report',
        deltas: {
          lifeSupport: -2,
          power: -5,
          radiationProtection: +3,
          solarGeneration: -12,
          batteryReserve: -4,
          dustAccumulation: +16,
        },
        crewEnergyDelta: -5,
        crewStatusEffect: 'Active',
        energyConsumptionEffect: 'Balanced',
        stormSeverityEffect: 'Regional Storm',
        whyExplanation:
          'Trimming lab power softened the storm battery drop while informing Earth, though dust still reduced solar panel output until conditions clear.',
        lessonTag:
          'Partial load shedding softens storm battery drain while keeping essential research logs updated.',
      },
    ],
    earthAdvice: {
      headline: 'Regional Dust Storm Power Strategy',
      guidance:
        'Solar panels still generate partial power under dusty skies, not zero—yet batteries will drain if you keep non-essential lighting on. Use Power-Saving Mode and wait until winds calm before cleaning panels.',
      scienceFact:
        'In 2018 a planet-encircling dust storm blocked so much sunlight that NASA’s solar-powered Opportunity rover lost battery charge, while nuclear-powered Curiosity kept operating.',
    },
  },
  {
    id: 'power-malfunction',
    code: 'PWR-02',
    title: 'Battery Inverter Fault & Reserve Drop',
    category: 'Power',
    severity: 'Emergency',
    solWindow: [4, 6],
    environmentCondition: 'Clear Martian Sky',
    description:
      'A voltage inverter inside Battery Bank B tripped during freezing night operations, cutting power flow toward habitat heaters.',
    scientificExplanation:
      'Outpost batteries require thermal insulation in -53°C average cold and reliable power electronics to feed life-support heaters.',
    educationalTakeaway:
      'Fast fault isolation prevents heater shutoffs without compromising outer airlock seals.',
    affectedSystems: ['power', 'lifeSupport', 'radiationProtection'],
    options: [
      {
        id: 'install-spare-inverter',
        label: 'Follow Repair Checklist: Swap in Backup Inverter',
        actionSummary:
          'Isolate Battery Bank B and install the spare electrical inverter from habitat stores.',
        tradeOffHint:
          'Restores strong Power stability, but uses shared cooling fluid (Life Support) and crew labor.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: -6,
          power: +12,
          radiationProtection: -3,
          batteryReserve: +14,
          oxygenAvailability: -5,
        },
        crewEnergyDelta: -9,
        crewStatusEffect: 'Repair Duty',
        energyConsumptionEffect: 'Balanced',
        whyExplanation:
          'Installing the spare inverter restored full battery flow to heaters. Sharing coolant during the swap briefly dipped Life Support and outer sensor shielding.',
        lessonTag:
          'Following approved internal repair checklists restores power safely without opening outer airlocks.',
      },
      {
        id: 'bridge-auxiliary-rover-cells',
        label: 'Link Pressurized Rover Batteries Through Airlock Port',
        actionSummary:
          'Connect external rover battery cables to keep indoor heaters warm immediately.',
        tradeOffHint:
          'Boosts Life Support warmth and moderate Power, but reduces outer Radiation seal.',
        approach: 'standard-engineering',
        deltas: {
          lifeSupport: +4,
          power: +5,
          radiationProtection: -9,
          batteryReserve: +6,
          shieldingCondition: -9,
        },
        crewEnergyDelta: -5,
        crewStatusEffect: 'Active',
        energyConsumptionEffect: 'Balanced',
        exposureRiskEffect: 'Moderate',
        whyExplanation:
          'Rover cells kept cabin heaters running smoothly, yet routing cables through the airlock service port weakened outer radiation sealing.',
        lessonTag:
          'Cross-linking rover power helps in emergencies but can compromise outer habitat sealing.',
      },
    ],
    earthAdvice: {
      headline: 'Inverter Fault Isolation Procedure',
      guidance:
        'Check Radiation Protection before opening any airlock cable port. Internal inverter replacement preserves the habitat hull.',
      scienceFact:
        'Spacecraft electronics use redundant buses so one failed inverter does not black out life support.',
    },
  },
  {
    id: 'oxygen-recycling-problem',
    code: 'LSS-01',
    title: 'Oxygen Recycling & CO2 Scrubber Saturation',
    category: 'Life Support',
    severity: 'Emergency',
    solWindow: [5, 6],
    environmentCondition: 'Clear Martian Sky',
    description:
      'Carbon dioxide scrubbers clogged faster than scheduled, causing indoor CO2 levels to rise. Left unchecked, high CO2 causes fatigue and headaches.',
    scientificExplanation:
      'Closed-loop life support removes exhaled CO2 and regenerates oxygen through electrolysis and Sabatier reactors, which require substantial electricity.',
    educationalTakeaway:
      'Clean breathable air depends directly on electrical power and spare filter maintenance.',
    affectedSystems: ['lifeSupport', 'power', 'radiationProtection'],
    options: [
      {
        id: 'run-sabatier-overdrive',
        label: 'Follow Air Checklist: Overdrive CO2-to-Oxygen Reactor',
        actionSummary:
          'Boost power to the chemical air processor to scrub CO2 and replenish oxygen fast.',
        tradeOffHint:
          'Strongly restores Life Support oxygen, but heavily drains Power batteries.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: +13,
          power: -13,
          radiationProtection: -2,
          oxygenAvailability: +15,
          batteryReserve: -13,
        },
        crewEnergyDelta: -4,
        crewStatusEffect: 'Active',
        energyConsumptionEffect: 'High',
        whyExplanation:
          'Running the high-temperature oxygen reactor cleared CO2 quickly and refilled oxygen reserves, consuming substantial battery electricity.',
        lessonTag:
          'Chemical air regeneration protects breathing air quickly at a steep electrical power cost.',
      },
      {
        id: 'replace-zeolite-cartridges',
        label: 'Swap Backup Scrubber Cartridges & Seal Core Bay',
        actionSummary:
          'Use spare chemical cartridges and close non-essential bays to shrink active air volume.',
        tradeOffHint:
          'Gains moderate Life Support and saves Power, while stressing Greenhouse access.',
        approach: 'standard-engineering',
        deltas: {
          lifeSupport: +6,
          power: +4,
          radiationProtection: +3,
          oxygenAvailability: +10,
          foodReserves: -5,
        },
        crewEnergyDelta: -7,
        crewStatusEffect: 'Resting',
        greenhouseEffect: 'Strained',
        energyConsumptionEffect: 'Low',
        whyExplanation:
          'Backup cartridges absorbed CO2 with minimal electricity, and sealing the core conserved air. Isolating the greenhouse bay paused crop tending.',
        lessonTag:
          'Backup cartridges save electrical power when battery reserves are tight.',
      },
    ],
    earthAdvice: {
      headline: 'Cabin Air Quality Protocol',
      guidance:
        'Never wait on Earth when CO2 climbs—follow the scrubber checklist immediately. Overdrive the reactor if Power exceeds 40%; otherwise use backup cartridges.',
      scienceFact:
        'On the ISS, astronauts rely on the Carbon Dioxide Removal Assembly and Oxygen Generation System to keep cabin air Earth-like.',
    },
  },
  {
    id: 'water-reclaimer-clog',
    code: 'LSS-02',
    title: 'Water Reclaimer & Irrigation Loop Clog',
    category: 'Life Support',
    severity: 'Alert',
    solWindow: [5, 6],
    environmentCondition: 'Clear Martian Sky',
    description:
      'Mineral scale slowed the water recovery loop that supplies crew drinking water, oxygen electrolysis, greenhouse irrigation, and shielding water jackets.',
    scientificExplanation:
      'In a closed-loop habitat, the same water molecules cycle between crew hydration, oxygen production, plant roots, and hydrogen-rich radiation walls.',
    educationalTakeaway:
      'Water connects drinking supplies, crop irrigation, oxygen making, and radiation shielding.',
    affectedSystems: ['lifeSupport', 'radiationProtection', 'power'],
    options: [
      {
        id: 'flush-with-shield-water',
        label: 'Backflush Filters Using Shielding Reserve Water',
        actionSummary:
          'Push clean jacket water through the clogged loop to clear mineral scale fast.',
        tradeOffHint:
          'Restores Life Support water & oxygen, but lowers Radiation jacket shielding.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: +11,
          power: -4,
          radiationProtection: -9,
          oxygenAvailability: +9,
          shieldingCondition: -9,
        },
        crewEnergyDelta: -5,
        crewStatusEffect: 'Repair Duty',
        whyExplanation:
          'Backflushing cleared the reclaimer immediately so drinking water and oxygen kept flowing, while borrowing water thinned the outer radiation jacket.',
        lessonTag:
          'Using shielding water for repairs restores life support quickly while reducing radiation thickness.',
      },
      {
        id: 'steam-boil-filter',
        label: 'Run High-Heat Electric Steam Sterilization',
        actionSummary:
          'Boil off mineral scale electrically while keeping radiation water jackets full.',
        tradeOffHint:
          'Protects Radiation Shielding and restores Life Support, but costs heavy Power.',
        approach: 'standard-engineering',
        deltas: {
          lifeSupport: +8,
          power: -12,
          radiationProtection: +2,
          oxygenAvailability: +8,
          batteryReserve: -12,
        },
        crewEnergyDelta: -4,
        crewStatusEffect: 'Active',
        energyConsumptionEffect: 'High',
        whyExplanation:
          'Thermal sterilization cleared mineral buildup without draining shielding water, demanding a heavy burst of battery power.',
        lessonTag:
          'Electric steam cleaning preserves water shielding in exchange for high battery use.',
      },
    ],
    earthAdvice: {
      headline: 'Closed-Loop Water Recovery Tip',
      guidance:
        'Keep the water loop moving so both oxygen generation and greenhouse irrigation stay healthy.',
      scienceFact:
        'NASA’s ISS Environmental Control system recycles ~98% of cabin water from humidity and wastewater.',
    },
  },
  {
    id: 'food-shortage',
    code: 'LSS-03',
    title: 'Calorie & Greenhouse Yield Deficit',
    category: 'Life Support',
    severity: 'Alert',
    solWindow: [4, 6],
    environmentCondition: 'Clear Martian Sky',
    description:
      'Lower natural sunlight meant greenhouse trays grew slower than projected, tightening daily meal reserves for the 4-person crew.',
    scientificExplanation:
      'Crops cannot replace all packaged food overnight; hydroponic LED lighting competes directly with habitat batteries for electricity.',
    educationalTakeaway:
      'Stored packaged food remains an essential safety reserve alongside fresh greenhouse harvests.',
    affectedSystems: ['lifeSupport', 'power', 'radiationProtection'],
    options: [
      {
        id: 'supercharge-led-spectrum',
        label: 'Extend LED Grow-Light Photoperiod',
        actionSummary:
          'Run full-spectrum grow lights longer overnight to speed up sprout growth.',
        tradeOffHint:
          'Boosts Food Reserves & Life Support, but drains overnight Power batteries.',
        approach: 'standard-engineering',
        deltas: {
          lifeSupport: +10,
          power: -11,
          radiationProtection: 0,
          foodReserves: +12,
          batteryReserve: -11,
        },
        crewEnergyDelta: -2,
        crewStatusEffect: 'Active',
        greenhouseEffect: 'Thriving',
        energyConsumptionEffect: 'High',
        whyExplanation:
          'Extra LED light accelerated photosynthesis and lifted food reserves, while keeping grow lamps glowing overnight drained battery power.',
        lessonTag:
          'Artificial grow lighting converts electrical energy into edible plant calories.',
      },
      {
        id: 'switch-calorie-conservation',
        label: 'Use Stored Packaged Rations & Lighten Heavy Shifts',
        actionSummary:
          'Rely on sealed Earth rations and pause strenuous maintenance for one Sol.',
        tradeOffHint:
          'Saves Power and stabilizes Life Support, while deferring Radiation wall upkeep.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: +3,
          power: +6,
          radiationProtection: -7,
          foodReserves: +4,
          shieldingCondition: -7,
        },
        crewEnergyDelta: -5,
        crewStatusEffect: 'Resting',
        greenhouseEffect: 'Strained',
        energyConsumptionEffect: 'Low',
        whyExplanation:
          'Packaged rations fed the crew cleanly without extra grow-light power, though deferring maintenance shifts left shielding unattended.',
        lessonTag:
          'Stored packaged food protects nutrition whenever electricity must be saved for survival systems.',
      },
    ],
    earthAdvice: {
      headline: 'Crew Nutrition & Energy Balance',
      guidance:
        'Avoid running boosted greenhouse lights if your battery reserve is low—packaged rations exist precisely for low-power periods.',
      scienceFact:
        'Real space food systems combine shelf-stable packaged meals with small fresh-crop chambers like ISS Veggie.',
    },
  },

  // LATER MISSION (Sol 7-10)
  {
    id: 'solar-storm-warning',
    code: 'RAD-01',
    title: 'Solar Particle Event (SPE) Warning',
    category: 'Radiation',
    severity: 'Emergency',
    solWindow: [7, 8],
    environmentCondition: 'Solar Particle Advisory',
    description:
      'Space-weather monitors warn that an active solar region has launched a burst of energetic protons toward Mars. Not every flare reaches Mars with high dose, yet sensors show this SPE requires protective shelter action.',
    scientificExplanation:
      'Astronauts face two distinct radiation hazards: continuous background Galactic Cosmic Rays (GCR) from outside our solar system, and sudden Solar Particle Events (SPE) from solar storms. Hydrogen-rich water, polyethylene, and regolith reduce radiation dose—but no shield eliminates radiation 100%.',
    educationalTakeaway:
      'Moving into an internal water-and-polyethylene shelter during an SPE warning lowers radiation dose while trading time and power.',
    affectedSystems: ['radiationProtection', 'power', 'lifeSupport'],
    options: [
      {
        id: 'seal-storm-shelter',
        label: 'Follow SPE Checklist: Move Crew into Prepared Radiation Shelter',
        actionSummary:
          'Move all four astronauts inside the water-and-polyethylene inner shelter and pause non-essential tasks.',
        tradeOffHint:
          'Strongly protects Radiation Shielding & crew safety, while costing Power and delaying greenhouse/lab work.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: -5,
          power: -9,
          radiationProtection: +12,
          foodReserves: -4,
          batteryReserve: -9,
          shieldingCondition: +8,
          shelterReadiness: +8,
        },
        crewEnergyDelta: -5,
        crewStatusEffect: 'Sheltered',
        energyConsumptionEffect: 'High',
        exposureRiskEffect: 'Low',
        solarAlertEffect: 'Storm Watch',
        shelterEffect: true,
        whyExplanation:
          'Moving into the prepared internal shelter placed water tanks, polyethylene lining, and regolith between the crew and incoming solar protons. Running shelter air scrubbers and pausing science cost battery power and research time.',
        lessonTag:
          'Moving crews promptly into hydrogen-rich shelters is the safest response to an SPE warning.',
      },
      {
        id: 'wait-for-earth-spe-eval',
        label: 'Delay Sheltering & Wait for Earth Dose Analysis',
        actionSummary:
          'Keep crew working in the outer dome while waiting 20+ minutes for Earth confirmation.',
        tradeOffHint:
          'Keeps science running briefly, but increases crew Radiation exposure risk.',
        approach: 'wait-for-earth',
        deltas: {
          lifeSupport: +2,
          power: +2,
          radiationProtection: -14,
          shieldingCondition: -8,
        },
        crewEnergyDelta: -4,
        crewStatusEffect: 'Active',
        exposureRiskEffect: 'Elevated',
        solarAlertEffect: 'Storm Watch',
        whyExplanation:
          'Waiting for Earth during an active SPE warning left astronauts in less-shielded outer bays while high-energy particles arrived.',
        lessonTag:
          'During Solar Particle Events, waiting on delayed Earth replies exposes crews unnecessarily.',
      },
      {
        id: 'conserve-power-shelter',
        label: 'Shelter Under Passive Regolith & Power Down Non-Essentials',
        actionSummary:
          'Move crew into core shelter with minimal fan power while sending Earth a detailed radiation report.',
        tradeOffHint:
          'Saves Power and protects shelter status, but chills Life Support slightly.',
        approach: 'detailed-report',
        deltas: {
          lifeSupport: -7,
          power: +6,
          radiationProtection: +6,
          oxygenAvailability: -5,
          batteryReserve: +6,
        },
        crewEnergyDelta: -7,
        crewStatusEffect: 'Sheltered',
        energyConsumptionEffect: 'Low',
        exposureRiskEffect: 'Low',
        solarAlertEffect: 'Storm Watch',
        shelterEffect: true,
        whyExplanation:
          'Using passive regolith and polyethylene shelter walls kept crew safe and saved battery power, while low fan speeds slightly reduced air comfort.',
        lessonTag:
          'Low-power sheltering balances radiation safety when electrical batteries are scarce.',
      },
    ],
    earthAdvice: {
      headline: 'SPE Shelter Protocol',
      guidance:
        'Unlike steady Galactic Cosmic Rays (GCR), Solar Particle Events arrive in intense bursts that water and polyethylene stop effectively. Shelter immediately rather than waiting for Earth.',
      scienceFact:
        'Experimental concepts like the Mars Ice Home propose thick water-ice walls to block radiation—though they remain research designs rather than proven operational habitats.',
    },
  },
  {
    id: 'hab-airlock-malfunction',
    code: 'HAB-01',
    title: 'HAB-01: Outer Airlock Hatch Malfunction',
    category: 'Habitat',
    severity: 'Emergency',
    solWindow: [7, 9],
    environmentCondition: 'Clear Martian Sky',
    description:
      'Fine Martian grit jammed the outer airlock latch sensor, preventing the hatch from sealing automatically after a sample transfer.',
    scientificExplanation:
      'Airlocks are two-door pressurized chambers keeping breathable indoor air separated from Mars’s <1% pressure atmosphere. A stuck hatch sensor must be isolated safely.',
    educationalTakeaway:
      'Isolating a malfunctioning airlock immediately protects habitat air pressure before attempting repairs.',
    affectedSystems: ['lifeSupport', 'radiationProtection', 'power'],
    options: [
      {
        id: 'isolate-and-repair-airlock',
        label: 'Follow Airlock Checklist: Seal Inner Bulkhead & Clean Sensor',
        actionSummary:
          'Lock the inner pressure door immediately, depressurize safely, and clear grit from the latch.',
        tradeOffHint:
          'Protects Life Support air and Radiation seal, at the cost of Power and crew effort.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: +8,
          power: -9,
          radiationProtection: +6,
          oxygenAvailability: +6,
          batteryReserve: -9,
          shieldingCondition: +5,
        },
        crewEnergyDelta: -8,
        crewStatusEffect: 'Repair Duty',
        whyExplanation:
          'Sealing the inner bulkhead immediately stopped air risk, and cycling the airlock pumps cleared the jammed latch safely. Pumping airlocks takes noticeable electrical power.',
        lessonTag:
          'Isolating an affected airlock immediately prevents cabin pressure loss.',
      },
      {
        id: 'postpone-airlock-repair',
        label: 'Keep Inner Hatch Closed & Postpone Latch Repair',
        actionSummary:
          'Leave the outer airlock offline and ask Earth for diagnostic review.',
        tradeOffHint:
          'Saves Power right now, but limits EVA egress and lowers outer Radiation seal margin.',
        approach: 'wait-for-earth',
        deltas: {
          lifeSupport: -4,
          power: +4,
          radiationProtection: -8,
          shieldingCondition: -8,
        },
        crewEnergyDelta: -2,
        crewStatusEffect: 'Active',
        whyExplanation:
          'Postponing the latch repair saved pump power, yet left the outer chamber unsealed and blocked emergency EVA exit.',
        lessonTag:
          'Postponing airlock repairs saves electricity short-term while leaving habitat margins vulnerable.',
      },
    ],
    earthAdvice: {
      headline: 'Airlock Isolation & Latch Clearing',
      guidance:
        'Always verify the inner pressure door is locked first, then cycle and brush Martian dust out of the latch seals.',
      scienceFact:
        'Lunar and Martian dust particles are sharp and cling electrostatically, making airlock seals a major engineering focus.',
    },
  },
  {
    id: 'hab-pressure-leak',
    code: 'HAB-02',
    title: 'HAB-02: Habitat Pressure Leak Alert',
    category: 'Habitat',
    severity: 'Emergency',
    solWindow: [7, 9],
    environmentCondition: 'Clear Martian Sky',
    description:
      'Pressure gauges in Science Bay B show a slow drop as air leaks past a fatigued gasket into the ultra-thin Martian atmosphere.',
    scientificExplanation:
      'Because outside Mars pressure is under 1% of Earth’s, pressurized habitats work like submarines in reverse—any seal gap pushes indoor oxygen outward.',
    educationalTakeaway:
      'Quickly isolating a leaking compartment and sealing it preserves breathable oxygen for the whole crew.',
    affectedSystems: ['lifeSupport', 'power', 'radiationProtection'],
    options: [
      {
        id: 'isolate-bay-patch-weld',
        label: 'Follow Leak Checklist: Isolate Bay & Apply Sealant Patch',
        actionSummary:
          'Close bulkhead doors, locate the leaking gasket with ultrasonic sensors, and bond a composite patch.',
        tradeOffHint:
          'Stops Life Support oxygen loss and restores Radiation seal, but costs Power and crew energy.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: +10,
          power: -10,
          radiationProtection: +6,
          oxygenAvailability: +10,
          batteryReserve: -10,
          shieldingCondition: +6,
        },
        crewEnergyDelta: -8,
        crewStatusEffect: 'Repair Duty',
        energyConsumptionEffect: 'High',
        whyExplanation:
          'Isolating the compartment immediately stopped oxygen loss across the rest of the base, and bonding the patch restored hull integrity using curing-lamp power.',
        lessonTag:
          'Compartment isolation plus prompt patching prevents small leaks from draining habitat oxygen.',
      },
      {
        id: 'boost-o2-make-up-wait',
        label: 'Top Off Cabin Air & Send Leak Report to Earth',
        actionSummary:
          'Feed reserve oxygen into the bay while sending Earth sensor logs before patching.',
        tradeOffHint:
          'Saves Power from heavy curing tools (+4% Power), but spends Oxygen reserves and lowers outer shielding.',
        approach: 'detailed-report',
        deltas: {
          lifeSupport: -8,
          power: +4,
          radiationProtection: -6,
          oxygenAvailability: -9,
          batteryReserve: +4,
          shieldingCondition: -6,
        },
        crewEnergyDelta: -3,
        crewStatusEffect: 'Active',
        whyExplanation:
          'Pumping makeup oxygen kept pressure steady temporarily and avoided heavy curing-lamp electricity while Earth received the report, yet delayed sealing allowed oxygen reserves to bleed out.',
        lessonTag:
          'Feeding extra oxygen into a leak buys only brief time—sealing the leak must come first.',
      },
    ],
    earthAdvice: {
      headline: 'Pressure Leak Emergency Response',
      guidance:
        'Do not wait for Earth on an active air leak: isolate the bay and patch the gasket immediately, then send a post-repair report.',
      scienceFact:
        'On the ISS, crew members use ultrasonic leak detectors to pinpoint tiny air leaks in module seals.',
    },
  },
  {
    id: 'rov-equipment-failure',
    code: 'ROV-01',
    title: 'ROV-01: Pressurized Rover Equipment Failure',
    category: 'Rover',
    severity: 'Alert',
    solWindow: [8, 9],
    environmentCondition: 'Dust Haze',
    description:
      'While surveying rocky crater terrain near Outpost Zero, the pressurized rover’s steering actuator stalled in soft Martian sand, stranding geological tools outside.',
    scientificExplanation:
      'Martian terrain mixes sharp volcanic rock, crater slopes, and fine sand traps that stress rover wheel drives and battery heaters.',
    educationalTakeaway:
      'Recovering or safely shutting down rover equipment protects crew safety without wasting habitat resources.',
    affectedSystems: ['power', 'lifeSupport', 'radiationProtection'],
    options: [
      {
        id: 'remote-rocker-recovery',
        label: 'Execute Autonomous Rover Drive-Out & Low-Power Diagnostic',
        actionSummary:
          'Use pre-programmed wheel wiggle sequences from indoors to free the rover and park it safely.',
        tradeOffHint:
          'Avoids EVA Radiation exposure and saves suit Oxygen, at a moderate Power telemetry cost.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: +2,
          power: -7,
          radiationProtection: +5,
          batteryReserve: -7,
        },
        crewEnergyDelta: -4,
        crewStatusEffect: 'Active',
        whyExplanation:
          'Running the autonomous traction recovery sequence freed the rover remotely without sending astronauts outside, saving suit oxygen and avoiding radiation exposure while drawing moderate power.',
        lessonTag:
          'Remote robotic recovery solves terrain hazards without risking crew EVA exposure.',
      },
      {
        id: 'eva-tow-assist',
        label: 'Send Two-Astronaut EVA Team with Tow Cable',
        actionSummary:
          'Suit up Priya and Maya to manually clear sand and recover rover sample canisters.',
        tradeOffHint:
          'Saves habitat Power and recovers science gear, but costs EVA Oxygen and radiation dose.',
        approach: 'standard-engineering',
        deltas: {
          lifeSupport: -7,
          power: +5,
          radiationProtection: -7,
          oxygenAvailability: -7,
          shieldingCondition: -4,
        },
        crewEnergyDelta: -9,
        crewStatusEffect: 'Repair Duty',
        exposureRiskEffect: 'Moderate',
        whyExplanation:
          'Clearing sand manually saved base electricity and rescued rover samples, while spending spacesuit oxygen and surface radiation time.',
        lessonTag:
          'Manual EVA repairs save electrical power in exchange for oxygen and radiation budget.',
      },
    ],
    earthAdvice: {
      headline: 'Rover Mobility Recovery Advice',
      guidance:
        'Try indoor remote wheel-recovery sequences before sending astronauts on a dusty terrain EVA.',
      scienceFact:
        'Real Mars rovers like Curiosity and Perseverance use autonomous hazard-avoidance software because Earth operators cannot steer them in real time.',
    },
  },
  {
    id: 'sup-spare-parts-shortage',
    code: 'SUP-01',
    title: 'SUP-01: Spare Parts & Filter Shortage',
    category: 'Crew & Supplies',
    severity: 'Alert',
    solWindow: [8, 10],
    environmentCondition: 'Clear Martian Sky',
    description:
      'Inventory checks show replacement air-scrubber gaskets and water pump seals are running low with no cargo resupply ship arriving before Sol 10.',
    scientificExplanation:
      'Resupply rockets from Earth can only launch efficiently roughly every 26 months, so Mars outposts rely on 3D printing, recycling, and smart rationing.',
    educationalTakeaway:
      'Careful spare-parts planning keeps life support and power systems reliable until the end of a mission.',
    affectedSystems: ['lifeSupport', 'power', 'radiationProtection'],
    options: [
      {
        id: 'fabricate-3d-printed-seals',
        label: '3D-Print Polymer Replacement Parts Indoors',
        actionSummary:
          'Use the habitat’s polymer fabricator to manufacture fresh pump seals and scrubber gaskets.',
        tradeOffHint:
          'Replenishes Life Support and Shielding spares, but consumes Power and crew time.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: +9,
          power: -10,
          radiationProtection: +5,
          oxygenAvailability: +7,
          batteryReserve: -10,
        },
        crewEnergyDelta: -6,
        crewStatusEffect: 'Repair Duty',
        energyConsumptionEffect: 'High',
        whyExplanation:
          'On-site 3D printing produced fresh seals for oxygen and water loops without waiting years for a cargo rocket, using extra electrical power to heat the printer.',
        lessonTag:
          'In-space manufacturing turns stored raw filament and electricity into critical spare parts.',
      },
      {
        id: 'repurpose-science-spares',
        label: 'Repurpose Lab Hardware & Send Resupply Manifest to Earth',
        actionSummary:
          'Borrow non-essential science gaskets and transmit a detailed inventory report to Earth.',
        tradeOffHint:
          'Saves Power and maintains steady Life Support, while reducing experimental shielding spares.',
        approach: 'detailed-report',
        deltas: {
          lifeSupport: +4,
          power: +4,
          radiationProtection: -6,
          shieldingCondition: -6,
        },
        crewEnergyDelta: -4,
        crewStatusEffect: 'Active',
        whyExplanation:
          'Repurposing lab parts kept air filters working without spending 3D-printer electricity, and sent Earth a detailed parts manifest, though fewer spare seals remained for outer bays.',
        lessonTag:
          'Repurposing non-critical parts saves power while reducing backup margins elsewhere.',
      },
    ],
    earthAdvice: {
      headline: 'Logistics & In-Space Manufacturing Tip',
      guidance:
        'If your Power reserves exceed 45%, 3D-printing fresh seals boosts both Life Support and Habitat readiness for the final Sols.',
      scienceFact:
        'NASA already tests 3D printers aboard the ISS to make tools and spare parts on demand instead of launching every wrench from Earth.',
    },
  },
  {
    id: 'crew-minor-injury',
    code: 'CREW-01',
    title: 'CREW-01: Crew Fatigue & Minor Wrist Strain',
    category: 'Crew & Supplies',
    severity: 'Advisory',
    solWindow: [8, 10],
    environmentCondition: 'Clear Martian Sky',
    description:
      'After heavy repair shifts, Engineer Priya strained her wrist moving a tool rack and Medical Officer Leo notes the team needs rest and careful workload balance.',
    scientificExplanation:
      'Astronaut health is a top mission priority. Working while overtired raises the risk of mistakes with life-support valves or spacesuits.',
    educationalTakeaway:
      'Protecting crew rest and rotating responsibilities keeps the whole outpost safer and prevents larger errors.',
    affectedSystems: ['lifeSupport', 'power', 'radiationProtection'],
    options: [
      {
        id: 'medical-rest-rotation',
        label: 'Follow Medical Checklist: Rest Priya & Rotate Duties',
        actionSummary:
          'Apply wrist brace, assign light indoor monitoring, and redistribute chores across the crew.',
        tradeOffHint:
          'Restores Crew Energy & steady Life Support care, while slowing outer maintenance slightly.',
        approach: 'approved-checklist',
        deltas: {
          lifeSupport: +4,
          power: -4,
          radiationProtection: -3,
        },
        crewEnergyDelta: +12,
        crewStatusEffect: 'Resting',
        whyExplanation:
          'Giving Priya proper medical rest and rotating indoor duties lifted crew energy and prevented tired mistakes, while automated systems used a little extra power and paused outer checks.',
        lessonTag:
          'Prioritizing crew health and rest prevents dangerous errors later in the mission.',
      },
      {
        id: 'push-normal-schedule',
        label: 'Keep Full Maintenance Schedule & Log Medical Report',
        actionSummary:
          'Ask the crew to finish all scheduled tasks while sending a medical status note to Earth.',
        tradeOffHint:
          'Keeps Power & Shielding inspections on schedule, but tires Crew Energy and strains Life Support.',
        approach: 'detailed-report',
        deltas: {
          lifeSupport: -4,
          power: +4,
          radiationProtection: +4,
        },
        crewEnergyDelta: -9,
        crewStatusEffect: 'Active',
        whyExplanation:
          'Keeping full shifts finished hardware checks on schedule, yet left the crew noticeably more fatigued heading into the final Sols.',
        lessonTag:
          'Pushing tired crews through full shifts trades long-term crew readiness for short-term chores.',
      },
    ],
    earthAdvice: {
      headline: 'Flight Surgeon Crew Wellness Note',
      guidance:
        'Crew safety always comes first. Giving an astronaut time to rest and recover keeps decision-making sharp for the rest of the mission.',
      scienceFact:
        'NASA flight surgeons monitor astronaut sleep, nutrition, and workload closely because well-rested crews make far fewer operational mistakes.',
    },
  },
];
