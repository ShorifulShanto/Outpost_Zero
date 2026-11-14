import { ArrowLeft } from 'lucide-react';
import { AppRoute } from '../types/mission';

const ROUTE_LABELS: Record<AppRoute, string> = {
  home: 'Home',
  simulator: 'Simulator',
  learn: 'Learn',
  observatory: 'NASA Observatory',
  about: 'About',
};

interface PageBackButtonProps {
  previousRoute: AppRoute | null;
  onBack: () => void;
  fallbackLabel?: string;
}

export function PageBackButton({
  previousRoute,
  onBack,
  fallbackLabel = 'Back to Home',
}: PageBackButtonProps) {
  const label = previousRoute
    ? `Back to ${ROUTE_LABELS[previousRoute]}`
    : fallbackLabel;

  return (
    <button
      type="button"
      onClick={onBack}
      aria-label={label}
      className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg bg-[#111C32]/90 border border-[#293A54] hover:border-[#29B6F6] hover:bg-[#1E3353] text-xs sm:text-sm font-medium text-[#EAF2FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#29B6F6]"
    >
      <ArrowLeft className="w-4 h-4 text-[#29B6F6]" />
      <span>{label}</span>
    </button>
  );
}
