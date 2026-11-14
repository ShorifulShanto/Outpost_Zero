export const OUTPOST_LOGO_IMAGE_SRC = '/assets/outpost-zero-logo.png';

interface OutpostLogoProps {
  size?: number;
  className?: string;
}

/**
 * Compact ringed-planet icon matching the Outpost Zero wordmark style.
 */
export function OutpostLogo({ size = 32, className = '' }: OutpostLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <circle cx="20" cy="20" r="18.5" fill="#080D1B" stroke="#293A54" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="7.2" fill="#F4ECE0" />
      <ellipse
        cx="20"
        cy="20"
        rx="14.5"
        ry="4.8"
        transform="rotate(-24 20 20)"
        stroke="#F4ECE0"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 28.5C12.5 27.2 27.5 27.2 31.5 28.5"
        stroke="#D88B72"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
    </svg>
  );
}

interface OutpostBrandLogoProps {
  showSubtitle?: boolean;
  className?: string;
}

/**
 * Lightweight pre-cropped Outpost Zero transparent PNG wordmark for the header.
 */
export function OutpostBrandLogo({
  showSubtitle = false,
  className = '',
}: OutpostBrandLogoProps) {
  return (
    <span className={`inline-flex flex-col items-start shrink-0 select-none ${className}`}>
      <img
        src={OUTPOST_LOGO_IMAGE_SRC}
        alt="Outpost Zero"
        width={196}
        height={27}
        decoding="async"
        className="h-[23px] sm:h-[27px] w-auto object-contain pointer-events-none"
      />
      {showSubtitle && (
        <span className="mt-1 text-[9px] sm:text-[9.5px] font-mono-tabular uppercase tracking-[0.17em] text-[#E4774E] leading-none whitespace-nowrap">
          Blast Off to Something New
        </span>
      )}
    </span>
  );
}
