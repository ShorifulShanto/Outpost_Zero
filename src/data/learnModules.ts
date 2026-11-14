export interface VocabItem {
  term: string;
  definition: string;
}

export interface LearningModule {
  id: string;
  number: number;
  title: string;
  category: string;
  iconName:
    | 'globe'
    | 'clock'
    | 'heart'
    | 'wind'
    | 'shield'
    | 'zap'
    | 'sprout'
    | 'radio'
    | 'home'
    | 'compass';
  summary: string;
  explanation: string;
  keyFacts: string[];
  nasaExample: string;
  researchBenchmark?: {
    agency: string;
    watermark: string;
    dataType: 'Historical Research' | 'Terrain Information' | 'Educational Material';
    title: string;
    summary: string;
    measurementContext: string;
    linkLabel: string;
    url: string;
  };
  vocabulary: VocabItem[];
  quickQuestion: {
    prompt: string;
    options: string[];
    correctIndex: number;
    feedbackCorrect: string;
    feedbackIncorrect: string;
  };
}

export interface QuizQuestion {
  id: string;
  moduleTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const LEARN_MODULES: LearningModule[] = [
  {
    id: 'intro-mars',
    number: 1,
    title: 'Introduction to Mars',
    category: 'Planetary Basics',
    iconName: 'globe',
    summary: 'Meet our cold, dusty, red neighbor planet.',
    explanation:
      'Mars is covered in rusty iron-oxide dust and giant craters. Its air is ~95% carbon dioxide and averages -53°C, so astronauts need sealed habitats to survive.',
    keyFacts: [
      'Mars air is ~95% CO2 and less than 1% as thick as Earth’s air.',
      'Average surface temperature is about -53°C.',
      'Fast winds can lift fine dust into big storms.',
    ],
    nasaExample:
      'NASA’s Perseverance and Curiosity rovers explore craters and dry riverbeds on Mars.',
    researchBenchmark: {
      agency: 'NASA Mars Trek',
      watermark: 'Data: Mars Trek',
      dataType: 'Terrain Information',
      title: 'Jezero Crater Terrain (18.38°N, 77.58°E)',
      summary:
        'Jezero is a 45-km-wide ancient lake crater mapped by Mars orbiters.',
      measurementContext:
        'Crater floor sits ~2,700 m below datum with 500–800+ m rim hills.',
      linkLabel: 'Open NASA Mars Trek',
      url: 'https://trek.nasa.gov/mars/',
    },
    vocabulary: [
      {
        term: 'Iron Oxide',
        definition: 'Reddish rust dust covering rocks and soil across Mars.',
      },
      {
        term: 'Atmospheric Pressure',
        definition: 'How hard air pushes around you—under 1% of Earth’s pressure on Mars.',
      },
    ],
    quickQuestion: {
      prompt: 'Why can’t astronauts breathe outdoor Martian air?',
      options: [
        'It is mostly hot steam',
        'It is ~95% carbon dioxide and very thin',
        'It only blows at the South Pole',
      ],
      correctIndex: 1,
      feedbackCorrect: 'Spot on! Thin CO2 air makes sealed habitats essential.',
      feedbackIncorrect:
        'Good try! Mars air is very thin (<1% Earth pressure) and ~95% carbon dioxide.',
    },
  },
  {
    id: 'what-is-sol',
    number: 2,
    title: 'What Is a Sol?',
    category: 'Time on Mars',
    iconName: 'clock',
    summary: 'How astronauts tell time on the Red Planet.',
    explanation:
      'Mars spins slightly slower than Earth, so one Martian day—a Sol—lasts 24 hours and 39 minutes. Earth rover teams even shift their sleep clocks by 39 minutes a day!',
    keyFacts: [
      'One Sol is 24 hours and 39 minutes long.',
      'A Martian year lasts 668.6 Sols (about 687 Earth days).',
      'Seasons last nearly twice as long as on Earth.',
    ],
    nasaExample:
      'NASA rover teams count every workday in Sols—like Sol 1, Sol 100, and Sol 1,000.',
    vocabulary: [
      {
        term: 'Sol',
        definition: 'One day on Mars. It lasts about 24 hours and 39 minutes.',
      },
      {
        term: 'Orbit',
        definition: 'The curved path a planet travels around the Sun.',
      },
    ],
    quickQuestion: {
      prompt: 'How long is one Martian Sol?',
      options: [
        'Only 6 hours',
        'About 24 hours and 39 minutes',
        'Over 10 Earth days',
      ],
      correctIndex: 1,
      feedbackCorrect: 'Right! A Sol is just 39 minutes longer than an Earth day.',
      feedbackIncorrect:
        'Nice guess! A Sol is about 24 hours and 39 minutes long.',
    },
  },
  {
    id: 'life-support',
    number: 3,
    title: 'Life Support in Space',
    category: 'Crew Survival',
    iconName: 'heart',
    summary: 'Recycling air and water while sharing electrical power.',
    explanation:
      'Inside a sealed Mars base, Life Support machines clean the air, purify water, and keep cabins warm. All of those machines share the same battery power.',
    keyFacts: [
      'Oxygen makers and water pumps both run on electricity.',
      'Spaceships recycle almost every drop of sweat and breath moisture.',
      'Checking systems early stops small leaks from growing.',
    ],
    nasaExample:
      'On the Space Station, NASA’s Water Recovery System recycles ~98% of crew water.',
    researchBenchmark: {
      agency: 'NASA OSDR',
      watermark: 'Data: NASA OSDR',
      dataType: 'Historical Research',
      title: 'Space Biology: Bone, Muscle, Immune & Sleep',
      summary:
        'ISS studies track bone loss (OSD-352), muscle changes (OSD-47), immune shifts (OSD-738), and sleep clocks (OSD-253).',
      measurementContext:
        'Orbital microgravity rodent studies compared with Earth ground controls.',
      linkLabel: 'Open NASA OSDR',
      url: 'https://osdr.nasa.gov/',
    },
    vocabulary: [
      {
        term: 'Closed-Loop System',
        definition: 'A system that cleans and reuses air and water over and over.',
      },
      {
        term: 'Pressurized',
        definition: 'Filled with safe breathable air pushed outward like a firm soccer ball.',
      },
    ],
    quickQuestion: {
      prompt: 'Why do space habitats recycle water and air?',
      options: [
        'Launching fresh water from Earth is super heavy and costly',
        'Recycled water tastes sweeter',
        'Mars rain fills outdoor lakes',
      ],
      correctIndex: 0,
      feedbackCorrect: 'Exactly! Recycling saves huge amounts of rocket cargo.',
      feedbackIncorrect:
        'Mars has no rain—recycling keeps crews alive without endless supply rockets.',
    },
  },
  {
    id: 'oxygen-recycling',
    number: 4,
    title: 'Oxygen Recycling',
    category: 'Breathable Air',
    iconName: 'wind',
    summary: 'Turning exhaled CO2 and water into fresh oxygen.',
    explanation:
      'Astronauts breathe in oxygen and breathe out carbon dioxide (CO2). Scrubbers pull CO2 out of cabin air while machines split water or CO2 to make fresh oxygen.',
    keyFacts: [
      'Mars outdoor air is ~95% CO2—unbreathable, yet useful for oxygen reactors.',
      'Too much indoor CO2 makes crews dizzy and tired.',
      'Electricity can split water (H2O) into breathable oxygen.',
    ],
    nasaExample:
      'NASA’s MOXIE box on Perseverance turned thin Martian CO2 into small test amounts of oxygen.',
    vocabulary: [
      {
        term: 'CO2 Scrubber',
        definition: 'A filter machine that pulls exhaled carbon dioxide out of cabin air.',
      },
      {
        term: 'Electrolysis',
        definition: 'Using electricity to split water molecules to release fresh oxygen.',
      },
    ],
    quickQuestion: {
      prompt: 'What gas makes up ~95% of Mars’s atmosphere?',
      options: ['Oxygen', 'Carbon dioxide', 'Helium'],
      correctIndex: 1,
      feedbackCorrect: 'Correct! Mars air is mostly CO2.',
      feedbackIncorrect:
        'Close! Mars’s thin atmosphere is ~95% carbon dioxide.',
    },
  },
  {
    id: 'radiation-storms',
    number: 5,
    title: 'Radiation & Storm Shelters',
    category: 'Space Weather',
    iconName: 'shield',
    summary: 'How shelters block solar storms and cosmic rays.',
    explanation:
      'Mars has no strong magnetic shield, so steady cosmic rays (GCR) and sudden solar bursts (SPE) hit the ground. Water walls and packed soil cut radiation sharply, though never to 0%.',
    keyFacts: [
      'GCRs arrive steadily every day; SPEs are sudden solar storm bursts.',
      'Water walls, plastic lining, and Martian dirt absorb particles best.',
      'NASA also studies translucent "Mars Ice Home" concepts for future bases.',
    ],
    nasaExample:
      'Space-weather alerts warn crews when fast solar flares or CMEs erupt from the Sun.',
    researchBenchmark: {
      agency: 'NASA RadLab & MSL RAD',
      watermark: 'Data: NASA RadLab',
      dataType: 'Historical Research',
      title: 'Radiation Units: mGy vs. mSv',
      summary:
        'Absorbed dose (mGy) tracks raw energy; dose equivalent (mSv) estimates tissue risk.',
      measurementContext:
        'ISS (LEO): ~0.27–0.37 mGy/day · Mars surface (Curiosity RAD): ~0.64–0.67 mSv/day.',
      linkLabel: 'Open NASA RadLab',
      url: 'https://visualization.osdr.nasa.gov/radlab/',
    },
    vocabulary: [
      {
        term: 'Galactic Cosmic Rays (GCR)',
        definition: 'High-energy space particles arriving steadily from distant stars.',
      },
      {
        term: 'Solar Particle Event (SPE)',
        definition: 'A sudden burst of fast protons launched by a solar storm.',
      },
    ],
    quickQuestion: {
      prompt: 'Which materials shield a Mars storm shelter best?',
      options: [
        'Water walls, polyethylene plastic, and packed Martian soil',
        'Thin glass windows',
        'Paper panels',
      ],
      correctIndex: 0,
      feedbackCorrect: 'Yes! Hydrogen-rich water/plastic and thick soil block particles best.',
      feedbackIncorrect:
        'Thin glass lets radiation right through—water, plastic, and soil shield crews best.',
    },
  },
  {
    id: 'power-mars',
    number: 6,
    title: 'Solar Power & Dust Storms',
    category: 'Energy Systems',
    iconName: 'zap',
    summary: 'How sunlight, dust buildup, and batteries keep bases warm.',
    explanation:
      'Mars gets at most ~45% as much sunlight as Earth. Fine dust slowly coats panels (~0.2%/Sol), and dust storms dim daylight—so batteries and Power-Saving Mode keep heaters alive.',
    keyFacts: [
      'Top Martian sunlight is about 45% of Earth’s sunlight.',
      'Crews brush dust off solar wings when the sky is calm.',
      'Power-Saving Mode saves battery charge for air and heating.',
    ],
    nasaExample:
      'NASA’s Spirit, Opportunity, and InSight landers showed how dust lowers solar power over time.',
    vocabulary: [
      {
        term: 'Solar Flux',
        definition: 'The amount of sunlight energy reaching a solar panel.',
      },
      {
        term: 'Battery Reserve',
        definition: 'Stored power saved for freezing nights or dusty storms.',
      },
    ],
    quickQuestion: {
      prompt: 'What happens to solar power during most Martian dust storms?',
      options: [
        'Solar panels always hit 0% permanently',
        'Sunlight dims, so batteries and power-saving mode protect key systems',
        'Panels make double power',
      ],
      correctIndex: 1,
      feedbackCorrect: 'You got it! Dimmed skies make saving battery charge vital.',
      feedbackIncorrect:
        'Storms dim sunlight sharply (without always hitting zero), so crews conserve batteries.',
    },
  },
  {
    id: 'food-production',
    number: 7,
    title: 'Greenhouses & Space Food',
    category: 'Space Botany',
    iconName: 'sprout',
    summary: 'Growing fresh greens indoors while keeping stored meals.',
    explanation:
      'Martian dirt holds toxic perchlorate salts, so crews grow lettuce and herbs indoors using nutrient water (hydroponics). Grow lights use electricity, so packaged meals stay essential.',
    keyFacts: [
      'Hydroponics grows plant roots in clean water instead of Martian dirt.',
      'LED grow lights share electricity with cabin heaters.',
      'Stored Earth rations feed crews when power is tight.',
    ],
    nasaExample:
      'ISS astronauts grow fresh leafy greens in NASA’s Veggie plant chamber.',
    researchBenchmark: {
      agency: 'Canadian Space Agency (CSA)',
      watermark: 'Resource: CSA',
      dataType: 'Educational Material',
      title: 'Arctic Greenhouses & Crew Calories',
      summary:
        'CSA tests low-water indoor farms (like Naurvik) and plans 1,900–3,200 kcal/day astronaut menus.',
      measurementContext:
        'Earth Arctic & ISS food studies pair fresh vegetables with stored rations.',
      linkLabel: 'Read CSA Food Guide',
      url: 'https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/eating-in-space.asp',
    },
    vocabulary: [
      {
        term: 'Hydroponics',
        definition: 'Growing plants without soil by feeding roots mineral water.',
      },
      {
        term: 'Perchlorates',
        definition: 'Salty chemicals in Martian dirt that can harm plants and people.',
      },
    ],
    quickQuestion: {
      prompt: 'Why is hydroponics useful on Mars?',
      options: [
        'It grows plants in water without toxic Martian dirt',
        'It lets plants grow outside in freezing air',
        'Plants need zero light',
      ],
      correctIndex: 0,
      feedbackCorrect: 'Awesome! Hydroponics avoids salty Martian perchlorates.',
      feedbackIncorrect:
        'Plants still need indoor warmth and light, and hydroponics skips Martian dirt.',
    },
  },
  {
    id: 'comm-delays',
    number: 8,
    title: 'Radio Delays & Solar Conjunction',
    category: 'Deep Space Links',
    iconName: 'radio',
    summary: 'Why Earth replies take 6–44 minutes or pause behind the Sun.',
    explanation:
      'Radio waves travel at light speed, taking 3–22 minutes one way between Earth and Mars (6–44 minutes round-trip). During solar conjunction, the Sun blocks radio links for days.',
    keyFacts: [
      'One-way radio signals take 3 to 22 minutes.',
      'Asking Earth a question and waiting takes 6 to 44 minutes.',
      'During solar conjunction, crews follow checklists on their own.',
    ],
    nasaExample:
      'NASA pauses most rover driving for about two weeks every 26 months during solar conjunction.',
    vocabulary: [
      {
        term: 'Solar Conjunction',
        definition: 'When the Sun passes between Earth and Mars and scrambles radio waves.',
      },
      {
        term: 'One-Way Light Time',
        definition: 'How long a radio message takes to travel one way (3–22 minutes).',
      },
    ],
    quickQuestion: {
      prompt: 'How long is a round-trip message between Mars and Earth?',
      options: [
        '6 to 44 minutes',
        'Under 1 second',
        'Exactly 24 hours',
      ],
      correctIndex: 0,
      feedbackCorrect: 'Great math! 3–22 minutes each way equals 6–44 minutes total.',
      feedbackIncorrect:
        'Signals go there and back: 3–22 minutes each way means 6–44 minutes round-trip!',
    },
  },
  {
    id: 'space-habitats',
    number: 9,
    title: 'Habitats & Airlocks',
    category: 'Architecture',
    iconName: 'home',
    summary: 'Sturdy domes and two-door airlocks that hold breathable air.',
    explanation:
      'A Mars base holds breathable air inside like an upside-down submarine. Two-door airlocks and bulkhead hatches let astronauts go outside or seal a leak safely.',
    keyFacts: [
      'Airlocks trap indoor air safely between two sealed doors.',
      'Bulkhead hatches isolate one room if an air leak starts.',
      'Dusty Martian airlock seals need regular cleaning.',
    ],
    nasaExample:
      'NASA tests dust-resistant airlocks and 3D-printed Martian soil habitat concepts.',
    researchBenchmark: {
      agency: 'NASA Mars Trek',
      watermark: 'Data: Mars Trek',
      dataType: 'Terrain Information',
      title: 'Choosing Safe Ground in Jezero Crater',
      summary:
        'Planners use elevation maps to place bases on flat terraces away from steep cliffs and soft sand traps.',
      measurementContext:
        '45-km Jezero basin (~2,700 m below datum) with 500–800+ m crater walls.',
      linkLabel: 'Open NASA Mars Trek',
      url: 'https://trek.nasa.gov/mars/',
    },
    vocabulary: [
      {
        term: 'Airlock',
        definition: 'A sealed two-door hallway between the indoor base and outside Mars.',
      },
      {
        term: 'Bulkhead',
        definition: 'A strong wall and hatch that seals off one room during a leak.',
      },
    ],
    quickQuestion: {
      prompt: 'What does an airlock do on Mars?',
      options: [
        'Lets astronauts step outside without losing indoor cabin air',
        'Opens windows for fresh wind',
        'Stores solar panels underground',
      ],
      correctIndex: 0,
      feedbackCorrect: 'Right! Two doors trap breathable air safely inside.',
      feedbackIncorrect:
        'Outdoor Mars air is unbreathable—airlocks keep cabin oxygen safely inside.',
    },
  },
  {
    id: 'astronaut-prep',
    number: 10,
    title: 'Balancing Crew Trade-Offs',
    category: 'Mission Training',
    iconName: 'compass',
    summary: 'Why every Mars engineering choice spends one resource to save another.',
    explanation:
      'Inside a closed outpost, nothing is free. Heating crops uses battery power, spacewalks spend oxygen, and resting protects your crew from mistakes.',
    keyFacts: [
      'Astronauts train on Earth inside practice Mars habitats.',
      'Every repair trades power, water, shielding, or crew energy.',
      'Good sleep and nutrition keep decision-making sharp.',
    ],
    nasaExample:
      'NASA’s CHAPEA crews live in a simulated Mars base on Earth with 20-minute radio delays.',
    researchBenchmark: {
      agency: 'CSA & NASA OSDR',
      watermark: 'Resource: CSA · OSDR',
      dataType: 'Educational Material',
      title: 'Sleep, Food & Team Readiness',
      summary:
        'OSDR sleep studies (OSD-253) and CSA 1,900–3,200 kcal/day nutrition guides show why rest and balanced meals matter.',
      measurementContext:
        '24h 39m Martian Sols require steady indoor lighting and crew rest.',
      linkLabel: 'Explore CSA Youth STEM',
      url: 'https://www.asc-csa.gc.ca/eng/youth-educators/',
    },
    vocabulary: [
      {
        term: 'Analog Mission',
        definition: 'A practice space mission inside a realistic habitat on Earth.',
      },
      {
        term: 'Trade-Off',
        definition: 'Spending a bit of one resource (like power) to protect another (like air).',
      },
    ],
    quickQuestion: {
      prompt: 'Why does almost every Mars choice involve a trade-off?',
      options: [
        'Air, water, power, shelter, and crew energy all share one closed base',
        'Rockets only launch at midnight',
        'Mars has free electricity everywhere',
      ],
      correctIndex: 0,
      feedbackCorrect: 'Spot on! Every subsystem is connected inside a closed outpost.',
      feedbackIncorrect:
        'In a closed Mars base, electricity, water, oxygen, and crew energy are all linked.',
    },
  },
  {
    id: 'crew-autonomy',
    number: 11,
    title: 'Crew Autonomy & Checklists',
    category: 'Mission Operations',
    iconName: 'compass',
    summary: 'Acting fast with safety checklists when Earth is minutes away.',
    explanation:
      'Waiting 6–44 minutes for Earth during an air leak or solar storm can put lives at risk. Crews follow practiced checklists right away, then send Earth a clear status report.',
    keyFacts: [
      'Safety checklists give clear steps for sudden emergencies.',
      'Good reports tell Earth the problem, actions taken, and supplies left.',
      'Crew autonomy keeps astronauts safe during radio blackouts.',
    ],
    nasaExample:
      'NASA trains crews to stabilize critical spacecraft faults before Earth hears the alarm.',
    vocabulary: [
      {
        term: 'Crew Autonomy',
        definition: 'Making safe engineering decisions fast when Earth is far away.',
      },
      {
        term: 'Emergency Checklist',
        definition: 'Step-by-step safety rules practiced before launch.',
      },
    ],
    quickQuestion: {
      prompt: 'What should a Mars crew do first during an urgent air leak?',
      options: [
        'Follow their safety checklist right away, then report to Earth',
        'Wait 40 minutes before touching any valve',
        'Turn off all sensors',
      ],
      correctIndex: 0,
      feedbackCorrect: 'Correct! Fast checklist action protects the crew immediately.',
      feedbackIncorrect:
        'Waiting 40 minutes wastes vital air—crews act on checklists right away.',
    },
  },
  {
    id: 'future-mars-power',
    number: 12,
    title: 'Future Mars Power Systems',
    category: 'Future Energy Concepts',
    iconName: 'zap',
    summary: 'How nuclear fission and rover batteries help when dust dims the Sun.',
    explanation:
      'Dust storms can dim sunlight for weeks, so engineers study compact nuclear fission reactors for steady day-and-night power. Rovers like Perseverance use small nuclear heat batteries (MMRTGs).',
    keyFacts: [
      'Compact nuclear fission is studied for storm-proof future base power.',
      'MMRTG heat batteries power Curiosity and Perseverance through cold nights.',
      'Mars air is too thin (<1% Earth) for strong wind turbines.',
    ],
    nasaExample:
      'NASA’s Kilopower project tested compact fission reactor designs for Moon and Mars bases.',
    vocabulary: [
      {
        term: 'Nuclear Fission',
        definition: 'Splitting atoms inside a compact reactor for steady power without sunlight.',
      },
      {
        term: 'MMRTG',
        definition: 'A long-lasting nuclear heat battery that powers Mars rovers day and night.',
      },
    ],
    quickQuestion: {
      prompt: 'Why is wind power weak on Mars?',
      options: [
        'Mars air is under 1% as dense as Earth’s, so wind barely pushes blades',
        'Mars has zero air at all',
        'Turbines melt at 10°C',
      ],
      correctIndex: 0,
      feedbackCorrect: 'Exactly! Ultra-thin air gives Martian wind very little push.',
      feedbackIncorrect:
        'Mars has winds, yet its air is under 1% as thick as Earth’s, so wind carries little force.',
    },
  },
];

export const KNOWLEDGE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    moduleTitle: 'What Is a Sol?',
    question: 'About how long is one Sol (one day) on Mars?',
    options: ['12 hours', '24 hours and 39 minutes', '72 hours', '7 Earth days'],
    correctIndex: 1,
    explanation: 'A Martian Sol lasts about 24 hours and 39 minutes!',
  },
  {
    id: 'q2',
    moduleTitle: 'Oxygen Recycling',
    question: 'Which gas makes up ~95% of Mars’s thin atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Neon'],
    correctIndex: 2,
    explanation:
      'Mars air is ~95% carbon dioxide, so crews recycle cabin oxygen indoors.',
  },
  {
    id: 'q3',
    moduleTitle: 'Radiation & Storm Shelters',
    question: 'How are GCR and SPE radiation different on Mars?',
    options: [
      'GCRs arrive steadily every Sol, while SPEs are sudden solar storm bursts',
      'GCR comes from plants and SPE comes from oceans',
      'Every solar flare sends identical radiation to Mars',
      'Metal foil blocks 100% of all radiation',
    ],
    correctIndex: 0,
    explanation:
      'GCRs are steady deep-space particles, while SPEs are sudden bursts from solar storms.',
  },
  {
    id: 'q4',
    moduleTitle: 'Solar Power & Dust Storms',
    question: 'About how much maximum sunlight reaches Mars compared to Earth?',
    options: [
      'Twice as much sunlight',
      'Roughly 45% of Earth’s sunlight',
      '100% identical sunlight',
      'Zero sunlight',
    ],
    correctIndex: 1,
    explanation:
      'Mars is farther from the Sun, getting ~45% of Earth’s sunlight at best.',
  },
  {
    id: 'q5',
    moduleTitle: 'Greenhouses & Space Food',
    question: 'Why shouldn’t crews plant Earth seeds straight into Martian dirt?',
    options: [
      'Martian soil has toxic perchlorate salts and lacks Earth microbes',
      'Seeds float off Mars',
      'Martian dirt turns plants to metal',
      'Plants do not need water',
    ],
    correctIndex: 0,
    explanation:
      'Untreated Martian regolith contains salty perchlorates, so hydroponic water farms work best.',
  },
  {
    id: 'q6',
    moduleTitle: 'Radio Delays & Solar Conjunction',
    question: 'How long does a one-way radio message take between Earth and Mars?',
    options: [
      'Under 1 second',
      'About 3 to 22 minutes (6–44 minutes round-trip)',
      'Exactly 3 hours',
      '1 whole year',
    ],
    correctIndex: 1,
    explanation:
      'Radio waves travel at light speed—3 to 22 minutes each way depending on planet distance.',
  },
  {
    id: 'q7',
    moduleTitle: 'Life Support in Space',
    question: 'Why do Mars bases recycle nearly all crew water?',
    options: [
      'Sending heavy water tanks from Earth uses huge rocket fuel',
      'Water cannot freeze in space',
      'Mars rivers overflow daily',
      'Recycling water spins solar wings',
    ],
    correctIndex: 0,
    explanation:
      'Water is super heavy to launch, so closed-loop recycling keeps crews supplied.',
  },
  {
    id: 'q8',
    moduleTitle: 'Habitats & Airlocks',
    question: 'How do airlocks and sealed bulkheads protect a Mars base?',
    options: [
      'They trap breathable air inside when crews exit or seal leaks',
      'They let -53°C CO2 wind blow through bedrooms',
      'They turn dust into rocket fuel',
      'They turn off gravity',
    ],
    correctIndex: 0,
    explanation:
      'Two-door airlocks and bulkheads keep precious breathable air safely inside.',
  },
  {
    id: 'q9',
    moduleTitle: 'Crew Autonomy & Checklists',
    question: 'Why is solar conjunction important for Mars crew training?',
    options: [
      'When the Sun blocks radio links, crews must follow checklists on their own',
      'It turns Mars nights into daylight',
      'It doubles solar power',
      'It removes all radio delay',
    ],
    correctIndex: 0,
    explanation:
      'During solar conjunction, solar plasma scrambles signals, making crew autonomy essential.',
  },
  {
    id: 'q10',
    moduleTitle: 'Balancing Crew Trade-Offs',
    question: 'Why does every major choice on Mars involve a trade-off?',
    options: [
      'Life support, power, water, shelter, and crew energy share one closed outpost',
      'Astronauts flip coins for fun',
      'Mars rules ban two repairs',
      'Solar panels only work indoors',
    ],
    correctIndex: 0,
    explanation:
      'Every subsystem is linked—heating plants spends power and airlock exits spend oxygen.',
  },
  {
    id: 'q11',
    moduleTitle: 'Radiation & Storm Shelters',
    question: 'Which mix shields astronauts best inside a Mars storm shelter?',
    options: [
      'Water walls, polyethylene plastic, and packed Martian soil',
      'Open wire screens',
      'Clear glass roofs',
      'Thin aluminum foil alone',
    ],
    correctIndex: 0,
    explanation:
      'Water, polyethylene, and packed soil absorb energetic particles far better than thin metal.',
  },
  {
    id: 'q12',
    moduleTitle: 'Future Mars Power Systems',
    question: 'Why do engineers study compact nuclear fission alongside solar panels?',
    options: [
      'Fission could supply steady power day and night even during dust storms',
      'Mars wind turbines already power cities',
      'Solar panels make 10x more energy on Mars',
      'Batteries never lose charge at -53°C',
    ],
    correctIndex: 0,
    explanation:
      'Because Mars gets less sunlight and dusty skies, compact fission is studied for reliable backup power.',
  },
];
