import { MissionReport } from '../types/mission';
import { EXPLORER_BADGES } from './explorerProgress';

export interface CertificateOptions {
  commanderName: string;
  explorerRank: string;
  unlockedMedalsCount: number;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
      lineCount += 1;
      if (lineCount >= maxLines - 1) {
        // Append remaining words truncated cleanly on last line
        const rest = [line, ...words.slice(i + 1)].join(' ');
        let finalLine = rest;
        while (ctx.measureText(`${finalLine}…`).width > maxWidth && finalLine.length > 0) {
          finalLine = finalLine.slice(0, -1).trimEnd();
        }
        ctx.fillText(rest.length > finalLine.length ? `${finalLine}…` : finalLine, x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

const CERTIFICATE_LOGO_SRC = '/assets/outpost-zero-logo.png';

function loadCertificateLogo(): Promise<HTMLImageElement | null> {
  if (typeof Image === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(null), 1500);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = CERTIFICATE_LOGO_SRC;
  });
}

export function generateCertificateCanvas(
  report: MissionReport,
  options: CertificateOptions,
  logoImage: HTMLImageElement | null = null
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 980;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create certificate canvas context.');
  }

  const commander = options.commanderName.trim() || 'Mars Explorer';
  const dateLabel = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Deep Space Command Background
  const bg = ctx.createLinearGradient(0, 0, 1400, 980);
  bg.addColorStop(0, '#080D1B');
  bg.addColorStop(1, '#111C32');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1400, 980);

  // Subtle decorative star dots
  ctx.fillStyle = 'rgba(234, 242, 255, 0.28)';
  for (let i = 0; i < 65; i++) {
    const sx = ((i * 223) % 1340) + 30;
    const sy = ((i * 157) % 920) + 30;
    const r = i % 5 === 0 ? 1.8 : 1.0;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer & Inner Certificate Borders
  ctx.strokeStyle = '#29B6F6';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, 1328, 908);

  ctx.strokeStyle = '#293A54';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(52, 52, 1296, 876);

  // Top-Left Outpost Zero Brand Logo
  if (logoImage && logoImage.naturalWidth > 0) {
    ctx.drawImage(logoImage, 92, 76, 248, 34);

    ctx.fillStyle = '#E4774E';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('BLAST OFF TO SOMETHING NEW', 94, 130);

    ctx.fillStyle = '#29B6F6';
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillText('· MARS HABITAT ENGINEERING', 356, 100);
  } else {
    ctx.save();
    ctx.translate(92, 82);
    ctx.fillStyle = '#0B1428';
    ctx.strokeStyle = '#293A54';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0, 0, 48, 48, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F4ECE0';
    ctx.beginPath();
    ctx.arc(24, 23, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(24, 23);
    ctx.rotate((-24 * Math.PI) / 180);
    ctx.strokeStyle = '#F4ECE0';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 5.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = '#D88B72';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(11, 37);
    ctx.lineTo(37, 37);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#29B6F6';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText('OUTPOST ZERO · MARS HABITAT ENGINEERING', 154, 114);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFB547';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText(`MISSION CODE: OZ-${report.missionSeed}`, 1308, 114);
  ctx.fillStyle = '#A8B6CC';
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.fillText(dateLabel, 1308, 144);
  ctx.textAlign = 'left';

  // Certificate Main Title
  ctx.fillStyle = '#EAF2FF';
  ctx.font = 'bold 54px "Outfit", sans-serif';
  ctx.fillText('Mission Flight Certificate', 92, 188);

  // Outcome Pill Badge
  const isSuccess = report.outcome === 'success';
  ctx.fillStyle = isSuccess ? 'rgba(41, 182, 246, 0.16)' : 'rgba(255, 181, 71, 0.16)';
  ctx.strokeStyle = isSuccess ? '#29B6F6' : '#FFB547';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(92, 212, 430, 38, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isSuccess ? '#29B6F6' : '#FFB547';
  ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    isSuccess
      ? 'MISSION ACCOMPLISHED · 10 SOLS SURVIVED'
      : report.failedSystem === 'Crew Health'
        ? 'MISSION ABORTED · CREW HEALTH EMERGENCY'
        : 'EARLY EVACUATION · CREW RETURNED SAFELY',
    112,
    237
  );

  // Awarded To Block
  ctx.fillStyle = '#A8B6CC';
  ctx.font = '20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('AWARDED TO COMMANDER', 92, 305);

  ctx.fillStyle = '#E4774E';
  ctx.font = 'bold 48px "Outfit", sans-serif';
  ctx.fillText(commander, 92, 360);

  ctx.strokeStyle = '#293A54';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(92, 382);
  ctx.lineTo(1308, 382);
  ctx.stroke();

  // Mission Summary Sentence
  ctx.fillStyle = '#EAF2FF';
  ctx.font = '22px "Plus Jakarta Sans", sans-serif';
  const modeText =
    report.spaceWeatherMode === 'live-nasa'
      ? 'Space Weather Scenario'
      : 'Standard 10-Sol Simulation';
  const doseLabel = (report.cumulativeDoseMSv ?? 0.67).toFixed(2);
  wrapText(
    ctx,
    `For leading Outpost Zero's crew (${report.crewAlive}/${report.crewTotal} survived · ${doseLabel} mSv dose) at ${report.landingSiteName} (${modeText}) across ${report.solsSurvived} of ${report.maxSols} Martian Sols.`,
    92,
    430,
    1216,
    34,
    2
  );

  // 4 Telemetry Score Boxes
  const cards = [
    {
      label: 'MISSION SCORE',
      value: `${report.scoreBreakdown.totalScore} / 100`,
      color: '#E4774E',
    },
    {
      label: 'LIFE SUPPORT',
      value: `${report.finalResources.lifeSupport}%`,
      color: '#29B6F6',
    },
    {
      label: 'POWER RESERVE',
      value: `${report.finalResources.power}%`,
      color: '#FFB547',
    },
    {
      label: 'RADIATION SHIELD',
      value: `${report.finalResources.radiationProtection}%`,
      color: '#29B6F6',
    },
  ];

  cards.forEach((card, idx) => {
    const cx = 92 + idx * 310;
    const cy = 516;
    ctx.fillStyle = '#080D1B';
    ctx.strokeStyle = '#293A54';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx, cy, 286, 132, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#A8B6CC';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(card.label, cx + 22, cy + 42);

    ctx.fillStyle = card.color;
    ctx.font = 'bold 40px "JetBrains Mono", monospace';
    ctx.fillText(card.value, cx + 22, cy + 98);
  });

  // Bottom Details Panels (Rank + Key Takeaway)
  ctx.fillStyle = '#080D1B';
  ctx.strokeStyle = '#293A54';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(92, 682, 420, 150, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#29B6F6';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText('EXPLORER RANK & MEDALS', 116, 720);
  ctx.fillStyle = '#EAF2FF';
  ctx.font = 'bold 26px "Outfit", sans-serif';
  ctx.fillText(options.explorerRank, 116, 764);
  ctx.fillStyle = '#FFB547';
  ctx.font = '20px "JetBrains Mono", monospace';
  ctx.fillText(
    `${options.unlockedMedalsCount} / ${EXPLORER_BADGES.length} Medals Earned`,
    116,
    802
  );

  ctx.fillStyle = '#080D1B';
  ctx.strokeStyle = '#293A54';
  ctx.beginPath();
  ctx.roundRect(536, 682, 772, 150, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#29B6F6';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText('KEY ENGINEERING TAKEAWAY', 562, 720);
  ctx.fillStyle = '#EAF2FF';
  ctx.font = '20px "Plus Jakarta Sans", sans-serif';
  wrapText(
    ctx,
    report.lessonsLearned[0] ??
      'Every engineering choice on Mars balances life support, power, and radiation safety.',
    562,
    758,
    720,
    30,
    2
  );

  // Footer Signature Line
  ctx.fillStyle = '#A8B6CC';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'Outpost Zero Educational Mars Simulator · Independent STEM Project (Not officially endorsed by NASA/CSA)',
    92,
    888
  );

  return canvas;
}

export async function downloadMissionCertificate(
  report: MissionReport,
  options: CertificateOptions
): Promise<boolean> {
  try {
    const logoImage = await loadCertificateLogo();
    const canvas = generateCertificateCanvas(report, options, logoImage);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );

    const safeCommander = (options.commanderName.trim() || 'explorer')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24);
    const fileName = `outpost-zero-${safeCommander || 'explorer'}-OZ-${report.missionSeed}.png`;

    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  }
}
