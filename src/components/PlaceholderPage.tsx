import { ArrowRight, BookOpen, Compass, Telescope } from 'lucide-react';
import { AppRoute } from '../types/mission';

interface PlaceholderPageProps {
  route: 'learn' | 'observatory' | 'about';
  onNavigate: (route: AppRoute) => void;
}

const PAGE_CONTENT = {
  learn: {
    kicker: 'Part 2 Module · Coming Soon',
    title: 'Learn: Space & Mars Engineering Library',
    description:
      'Interactive science guides designed for explorers aged 7–12 to discover how astronauts breathe, grow food, generate solar energy, and stay safe from cosmic radiation on Mars.',
    icon: BookOpen,
    upcomingTopics: [
      {
        title: 'Making Breathable Air from Martian CO2',
        detail: 'Explore how oxygen electrolysis splits carbon dioxide molecules inside sealed habitats.',
      },
      {
        title: 'Why Mars Sunlight Is Half as Bright',
        detail: 'Compare solar panel efficiency between Earth orbit and the dusty red plains of Mars.',
      },
      {
        title: 'How Water & Regolith Stop Space Radiation',
        detail: 'Test why hydrogen-rich materials outperform thin aluminum walls against solar flares.',
      },
    ],
  },
  observatory: {
    kicker: 'Part 2 Module · Coming Soon',
    title: 'Observatory: Planetary & Solar Weather Monitor',
    description:
      'A dedicated observation deck exploring real-world planetary distances, Mars dust seasons, solar flare activity, and how deep space radio dishes track missions across the solar system.',
    icon: Telescope,
    upcomingTopics: [
      {
        title: 'Earth–Mars Orbital Distance Tracker',
        detail: 'See why one-way radio light travel time shifts between 4 minutes and 24 minutes.',
      },
      {
        title: 'Martian Weather & Dust Storm Seasons',
        detail: 'Learn how seasonal sunlight changes drive planet-wide dust storms.',
      },
      {
        title: 'Solar Activity & Space Weather Watch',
        detail: 'Understand how coronal mass ejections travel from the Sun to Mars.',
      },
    ],
  },
  about: {
    kicker: 'Educational Platform Overview',
    title: 'About Outpost Zero',
    description:
      'Outpost Zero (Explore. Build. Survive. Discover.) is an interactive STEM learning platform created to help young learners, families, and classrooms explore the real engineering trade-offs of living on Mars.',
    icon: Compass,
    upcomingTopics: [
      {
        title: 'Built for Young Explorers (Ages 7–12)',
        detail: 'Plain-language science explanations paired with authentic systems thinking for teens, teachers, and parents.',
      },
      {
        title: 'No Free Choices — Real Trade-Offs',
        detail: 'Every decision demonstrates how oxygen, food, electricity, and shielding depend on each other.',
      },
      {
        title: 'Expanding in Part 2',
        detail: 'Interactive Learn modules and Observatory telemetry tools will expand the curriculum alongside the 10-Sol Mission Simulator.',
      },
    ],
  },
};

export function PlaceholderPage({ route, onNavigate }: PlaceholderPageProps) {
  const content = PAGE_CONTENT[route];
  const IconComponent = content.icon;

  return (
    <main className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-10">
        <div className="flex items-center gap-3 text-xs font-medium text-[#29B6F6]">
          <IconComponent className="w-4 h-4 shrink-0" />
          <span>{content.kicker}</span>
        </div>

        <h1 className="mt-3 font-display text-2xl sm:text-4xl font-bold text-[#EAF2FF] max-w-2xl [text-wrap:balance]">
          {content.title}
        </h1>

        <p className="mt-4 text-base text-[#A8B6CC] max-w-2xl leading-relaxed">
          {content.description}
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {content.upcomingTopics.map((topic) => (
            <div
              key={topic.title}
              className="rounded-lg bg-[#080D1B] border border-[#293A54] p-5"
            >
              <h2 className="font-display text-base font-semibold text-[#EAF2FF]">
                {topic.title}
              </h2>
              <p className="mt-2 text-sm text-[#A8B6CC] leading-relaxed">
                {topic.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-[#293A54] flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('simulator')}
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] text-[#080D1B] text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>Play 10-Sol Mission Simulator</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg border border-[#293A54] bg-[#1E3353] hover:border-[#29B6F6] text-[#EAF2FF] text-sm font-medium transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
