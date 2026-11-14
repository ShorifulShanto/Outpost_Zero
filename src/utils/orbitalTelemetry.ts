const AU_TO_KM = 149_597_870.7;
const SPEED_OF_LIGHT_KM_PER_SEC = 299_792.458;
const DEG_TO_RAD = Math.PI / 180;

interface OrbitalElements {
  a: number;
  e: number;
  iDeg: number;
  lDeg0: number;
  lRateDeg: number;
  wBarDeg0: number;
  wBarRateDeg: number;
  nodeDeg0: number;
  nodeRateDeg: number;
}

// JPL approximate Keplerian elements (J2000, valid 1800-2050 AD)
const EARTH_ELEMENTS: OrbitalElements = {
  a: 1.00000261,
  e: 0.01671123,
  iDeg: -0.00001531,
  lDeg0: 100.46457166,
  lRateDeg: 35999.37244981,
  wBarDeg0: 102.93768193,
  wBarRateDeg: 0.32327364,
  nodeDeg0: 0.0,
  nodeRateDeg: 0.0,
};

const MARS_ELEMENTS: OrbitalElements = {
  a: 1.52371034,
  e: 0.0933941,
  iDeg: 1.84969142,
  lDeg0: -4.55343205,
  lRateDeg: 19140.30268499,
  wBarDeg0: -23.94362959,
  wBarRateDeg: 0.44441088,
  nodeDeg0: 49.55953891,
  nodeRateDeg: -0.2925734,
};

function julianCenturiesFromJ2000(date: Date): number {
  const jd = date.getTime() / 86_400_000 + 2_440_587.5;
  return (jd - 2_451_545.0) / 36_525.0;
}

function normalizeRadians(rad: number): number {
  const twoPi = Math.PI * 2;
  let r = rad % twoPi;
  if (r > Math.PI) r -= twoPi;
  if (r < -Math.PI) r += twoPi;
  return r;
}

function heliocentricCoordsAu(
  el: OrbitalElements,
  T: number
): [number, number, number] {
  const wBar = (el.wBarDeg0 + el.wBarRateDeg * T) * DEG_TO_RAD;
  const L = (el.lDeg0 + el.lRateDeg * T) * DEG_TO_RAD;
  const node = (el.nodeDeg0 + el.nodeRateDeg * T) * DEG_TO_RAD;
  const inc = el.iDeg * DEG_TO_RAD;
  const argPeri = wBar - node;

  const M = normalizeRadians(L - wBar);
  let E = M + el.e * Math.sin(M);
  for (let iter = 0; iter < 6; iter++) {
    const dE = (M - (E - el.e * Math.sin(E))) / (1 - el.e * Math.cos(E));
    E += dE;
  }

  const xOrb = el.a * (Math.cos(E) - el.e);
  const yOrb = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);

  const cosO = Math.cos(node);
  const sinO = Math.sin(node);
  const cosW = Math.cos(argPeri);
  const sinW = Math.sin(argPeri);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  const x =
    (cosO * cosW - sinO * sinW * cosI) * xOrb +
    (-cosO * sinW - sinO * cosW * cosI) * yOrb;
  const y =
    (sinO * cosW + cosO * sinW * cosI) * xOrb +
    (-sinO * sinW + cosO * cosW * cosI) * yOrb;
  const z = sinW * sinI * xOrb + cosW * sinI * yOrb;

  return [x, y, z];
}

export interface EarthMarsTelemetry {
  distanceMillionKm: number;
  distanceAu: number;
  oneWayLightMinutes: number;
  roundTripLightMinutes: number;
  conjunctionRisk: 'Nominal' | 'Moderate' | 'Near Conjunction';
}

export function getEarthMarsTelemetry(date: Date = new Date()): EarthMarsTelemetry {
  const T = julianCenturiesFromJ2000(date);
  const [ex, ey, ez] = heliocentricCoordsAu(EARTH_ELEMENTS, T);
  const [mx, my, mz] = heliocentricCoordsAu(MARS_ELEMENTS, T);

  const dx = mx - ex;
  const dy = my - ey;
  const dz = mz - ez;

  const distanceAu = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const distanceKm = distanceAu * AU_TO_KM;
  const distanceMillionKm = Number((distanceKm / 1_000_000).toFixed(1));
  const oneWaySeconds = distanceKm / SPEED_OF_LIGHT_KM_PER_SEC;
  const oneWayLightMinutes = Number((oneWaySeconds / 60).toFixed(1));
  const roundTripLightMinutes = Number((oneWayLightMinutes * 2).toFixed(1));

  // Sun-Earth-Mars elongation angle check for conjunction proximity
  const rEarth = Math.sqrt(ex * ex + ey * ey + ez * ez);
  const dotEarthToSunAndMars = -ex * dx - ey * dy - ez * dz;
  const cosElongation = Math.max(
    -1,
    Math.min(1, dotEarthToSunAndMars / (rEarth * distanceAu))
  );
  const elongationDeg = (Math.acos(cosElongation) * 180) / Math.PI;

  const conjunctionRisk: EarthMarsTelemetry['conjunctionRisk'] =
    elongationDeg < 12
      ? 'Near Conjunction'
      : elongationDeg < 30
        ? 'Moderate'
        : 'Nominal';

  return {
    distanceMillionKm,
    distanceAu: Number(distanceAu.toFixed(3)),
    oneWayLightMinutes,
    roundTripLightMinutes,
    conjunctionRisk,
  };
}

let sharedAudioCtx: AudioContext | null = null;

export function playRadioChirp(kind: 'send' | 'receive'): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }

    const now = sharedAudioCtx.currentTime;
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();

    osc.type = 'sine';
    // Subtle NASA Quindar-inspired tones (gentle volume)
    osc.frequency.setValueAtTime(kind === 'send' ? 2524 : 2475, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  } catch {
    // Ignore audio errors safely when blocked by browser autoplay policy
  }
}
