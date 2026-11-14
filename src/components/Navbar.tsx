import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppRoute } from '../types/mission';
import { OutpostBrandLogo } from './OutpostLogo';

interface NavbarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  hasActiveMission: boolean;
  unlockedMedalsCount: number;
  totalMedalsCount: number;
  onOpenMedalsGuide: () => void;
}

const NAV_ITEMS: { id: AppRoute; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'simulator', label: 'Mission Simulator' },
  { id: 'learn', label: 'Learn' },
  { id: 'observatory', label: 'NASA Observatory' },
  { id: 'about', label: 'About' },
];

export function Navbar({
  activeRoute,
  onNavigate,
  hasActiveMission,
  unlockedMedalsCount,
  totalMedalsCount,
  onOpenMedalsGuide,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (route: AppRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  const handleOpenGuide = () => {
    setMobileMenuOpen(false);
    onOpenMedalsGuide();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080D1B]/95 backdrop-blur-sm border-b border-[#293A54]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-8">
        {/* Zone 1: Header Brand Logo */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          aria-label="Outpost Zero — Home"
          className="inline-flex items-center rounded-md transition-opacity hover:opacity-90 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#29B6F6] cursor-pointer"
        >
          <OutpostBrandLogo showSubtitle={false} />
        </button>

        {/* Zone 2: Single-line Navigation Links (Desktop / Tablet) */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#29B6F6] ${
                  isActive
                    ? 'text-[#29B6F6]'
                    : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[#29B6F6] rounded-full"
                  />
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleOpenGuide}
            className="relative py-2 text-sm font-medium text-[#FFB547] hover:text-[#EAF2FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#29B6F6]"
          >
            Medals &amp; Guide ({unlockedMedalsCount}/{totalMedalsCount})
          </button>
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('simulator')}
            className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] text-[#080D1B] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#29B6F6]"
          >
            {hasActiveMission ? 'Resume Mission' : 'Start Mission'}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#293A54] bg-[#111C32] text-[#EAF2FF] hover:border-[#29B6F6] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#29B6F6]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile/Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#293A54] bg-[#111C32] px-4 py-4">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full text-left min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#1E3353] text-[#29B6F6]'
                      : 'text-[#EAF2FF] hover:bg-[#1E3353]/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleOpenGuide}
              className="w-full text-left min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium text-[#FFB547] hover:bg-[#1E3353]/60 transition-colors whitespace-nowrap cursor-pointer"
            >
              Medals &amp; Guide ({unlockedMedalsCount}/{totalMedalsCount})
            </button>
            <button
              type="button"
              onClick={() => handleNav('simulator')}
              className="mt-2 sm:hidden w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#E4774E] text-[#080D1B] text-sm font-semibold text-center cursor-pointer"
            >
              {hasActiveMission ? 'Resume Mission' : 'Start Mission'}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
