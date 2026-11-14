import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Radio,
  Send,
} from 'lucide-react';
import {
  CommunicationAdvice,
  CommunicationSystemState,
  CrewState,
  DetailedEarthReport,
  MissionEvent,
  ResourceState,
} from '../types/mission';

interface CommunicationDelayPanelProps {
  currentSol: number;
  activeEvent: MissionEvent | null;
  advice: CommunicationAdvice | null;
  commSystem: CommunicationSystemState;
  resources: ResourceState;
  crew: CrewState;
  canRequest: boolean;
  isPaused: boolean;
  alreadyReceived: boolean;
  onAdviceReceived: () => void;
  onSendDetailedReport: (report: Omit<DetailedEarthReport, 'sol'>) => void;
  onTransmissionStateChange?: (transmitting: boolean) => void;
}

const DELAY_SECONDS = 6;

export function CommunicationDelayPanel({
  currentSol,
  activeEvent,
  advice,
  commSystem,
  resources,
  crew,
  canRequest,
  isPaused,
  alreadyReceived,
  onAdviceReceived,
  onSendDetailedReport,
  onTransmissionStateChange,
}: CommunicationDelayPanelProps) {
  const [status, setStatus] = useState<'idle' | 'transmitting' | 'received'>('idle');
  const [secondsLeft, setSecondsLeft] = useState<number>(DELAY_SECONDS);
  const [reportOpen, setReportOpen] = useState(false);

  const [problemDetected, setProblemDetected] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [assistanceRequired, setAssistanceRequired] = useState(
    'Confirm autonomous checklist steps and space-weather outlook.'
  );

  const eventId = activeEvent?.id ?? null;
  const reportSentThisSol = commSystem.reportsSent.some(
    (r) => r.sol === currentSol
  );

  // Reset panel state whenever the active event changes
  useEffect(() => {
    setStatus(alreadyReceived ? 'received' : 'idle');
    setSecondsLeft(DELAY_SECONDS);
    onTransmissionStateChange?.(false);
    setProblemDetected(
      activeEvent ? activeEvent.title : 'Routine Sol Telemetry Check'
    );
    setActionsTaken(
      'Monitoring Life Support, Power batteries, and Radiation shelter readiness.'
    );
    setReportOpen(false);
  }, [eventId, activeEvent, alreadyReceived, onTransmissionStateChange]);

  // Countdown effect respecting Pause state (non-blocking: player can manage outpost while waiting)
  useEffect(() => {
    if (status !== 'transmitting' || isPaused) {
      return;
    }

    if (secondsLeft <= 0) {
      setStatus('received');
      onTransmissionStateChange?.(false);
      onAdviceReceived();
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, Number((prev - 0.5).toFixed(1))));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [status, secondsLeft, isPaused, onAdviceReceived, onTransmissionStateChange]);

  const handleRequestAdvice = () => {
    if (
      !canRequest ||
      isPaused ||
      status === 'transmitting' ||
      status === 'received'
    ) {
      return;
    }
    setSecondsLeft(DELAY_SECONDS);
    setStatus('transmitting');
    onTransmissionStateChange?.(true);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRequest || isPaused || reportSentThisSol) return;

    onSendDetailedReport({
      problemDetected:
        problemDetected.trim() || activeEvent?.title || 'Outpost telemetry alert',
      actionsTaken:
        actionsTaken.trim() || 'Initial diagnostics and safety checks running.',
      remainingResources: `Life Support ${resources.lifeSupport}%, Power ${resources.power}%, Radiation ${resources.radiationProtection}%`,
      crewCondition: `Avg Crew Energy ${crew.overallReadiness}% (${crew.members[0]?.status ?? 'Active'})`,
      assistanceRequired:
        assistanceRequired.trim() || 'Requesting engineering confirmation.',
    });
    setReportOpen(false);
  };

  const progressPercent = Math.round(
    ((DELAY_SECONDS - secondsLeft) / DELAY_SECONDS) * 100
  );
  const roundTripMinutes = commSystem.oneWayDelayMinutes * 2;

  return (
    <section
      aria-label="Earth Mission Control Communication Delay System"
      className="rounded-xl bg-[#111C32] border border-[#293A54] p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#080D1B] border border-[#293A54] flex items-center justify-center shrink-0">
          <Radio className="w-4 h-4 text-[#29B6F6]" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm sm:text-base font-semibold text-[#EAF2FF]">
              Earth Mission Control Link
            </h3>
            <span className="font-mono-tabular text-xs font-semibold text-[#29B6F6]">
              {commSystem.oneWayDelayMinutes} min one-way (~{roundTripMinutes} min Q&amp;A)
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A8B6CC] leading-relaxed">
            Radio waves travel at light speed, yet changing Earth–Mars distance causes{' '}
            <strong className="text-[#EAF2FF]">~3–22 min one-way</strong> delays (
            <strong className="text-[#EAF2FF]">~6–44 min round-trip</strong>). Keep
            managing Outpost Zero while signals travel!
          </p>
        </div>
      </div>

      {/* Solar Conjunction Warning Banner (non-hue-only icon + text) */}
      {commSystem.conjunctionActive && (
        <div
          role="status"
          className="rounded-lg bg-[#080D1B] border border-[#FFB547]/70 p-3 flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-[#FFB547] shrink-0 mt-0.5" />
          <p className="text-xs text-[#EAF2FF]/95 leading-relaxed">
            <strong className="text-[#FFB547]">Solar Conjunction Active:</strong> The Sun
            is near Earth–Mars line of sight, degrading or blocking live signals. Follow
            approved autonomous crew checklists first.
          </p>
        </div>
      )}

      {/* Request Advice / Countdown / Received Advice */}
      {status === 'idle' && (
        <div>
          <button
            type="button"
            disabled={!canRequest || isPaused}
            onClick={handleRequestAdvice}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#1E3353] hover:bg-[#264168] disabled:opacity-50 disabled:cursor-not-allowed border border-[#29B6F6]/60 text-[#EAF2FF] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            {commSystem.conjunctionActive
              ? 'Check Buffered Conjunction Guidance'
              : 'Request Earth Mission Control Advice'}
          </button>
          {!canRequest && (
            <p className="mt-2 text-xs text-[#A8B6CC]">
              Available during active Sol emergencies.
            </p>
          )}
        </div>
      )}

      {status === 'transmitting' && (
        <div className="rounded-lg bg-[#080D1B] border border-[#FFB547]/60 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFB547]">
              <Clock className="w-3.5 h-3.5" />
              {isPaused
                ? 'Transmission Paused'
                : 'Signal Traveling — Continue Managing Outpost'}
            </span>
            <span className="font-mono-tabular text-sm font-bold text-[#EAF2FF]">
              {secondsLeft.toFixed(1)}s
            </span>
          </div>

          <div className="mt-2.5 h-2 w-full rounded-full bg-[#111C32] overflow-hidden">
            <div
              className="h-full bg-[#FFB547] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-[#A8B6CC]">
            Simulated communication delay — shortened for gameplay (you do not have to
            freeze operations while waiting).
          </p>
        </div>
      )}

      {status === 'received' && advice && (
        <div className="rounded-lg bg-[#080D1B] border border-[#29B6F6]/60 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#29B6F6]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Mission Control Guidance Received</span>
          </div>
          <p className="mt-2 text-xs sm:text-sm font-semibold text-[#EAF2FF]">
            {advice.headline}
          </p>
          <p className="mt-1.5 text-xs text-[#EAF2FF]/90 leading-relaxed">
            {advice.guidance}
          </p>
          <p className="mt-2 pt-2 border-t border-[#293A54] text-xs text-[#A8B6CC] leading-relaxed">
            <strong className="text-[#29B6F6]">Mars Science:</strong> {advice.scienceFact}
          </p>
        </div>
      )}

      {/* Detailed Situation Report to Earth */}
      <div className="pt-3 border-t border-[#293A54]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A8B6CC]">
            <FileText className="w-3.5 h-3.5 text-[#29B6F6]" />
            <span>Detailed Report to Earth (Sol {currentSol})</span>
          </span>

          {reportSentThisSol ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#29B6F6]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Report Logged
            </span>
          ) : (
            <button
              type="button"
              disabled={!canRequest || isPaused}
              onClick={() => setReportOpen((prev) => !prev)}
              aria-expanded={reportOpen}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] disabled:opacity-50 text-xs font-semibold text-[#EAF2FF] transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {reportOpen ? 'Close Report Form' : 'Send Detailed Report'}
            </button>
          )}
        </div>

        {reportOpen && !reportSentThisSol && (
          <form
            onSubmit={handleSubmitReport}
            className="mt-3 rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 space-y-3 text-xs"
          >
            <div>
              <label
                htmlFor="earth-report-problem"
                className="block text-[#A8B6CC] font-medium mb-1"
              >
                1. Problem Detected
              </label>
              <input
                id="earth-report-problem"
                type="text"
                value={problemDetected}
                onChange={(e) => setProblemDetected(e.target.value)}
                className="w-full rounded-md bg-[#111C32] border border-[#293A54] px-3 py-2 text-xs text-[#EAF2FF]"
              />
            </div>

            <div>
              <label
                htmlFor="earth-report-actions"
                className="block text-[#A8B6CC] font-medium mb-1"
              >
                2. Actions Already Taken
              </label>
              <input
                id="earth-report-actions"
                type="text"
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                className="w-full rounded-md bg-[#111C32] border border-[#293A54] px-3 py-2 text-xs text-[#EAF2FF]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-[#111C32] border border-[#293A54] p-2">
                <p className="text-[#A8B6CC]">3. Remaining Resources</p>
                <p className="mt-0.5 font-mono-tabular text-[#EAF2FF]">
                  Life {resources.lifeSupport}% · Pwr {resources.power}% · Rad{' '}
                  {resources.radiationProtection}%
                </p>
              </div>
              <div className="rounded-md bg-[#111C32] border border-[#293A54] p-2">
                <p className="text-[#A8B6CC]">4. Crew Condition</p>
                <p className="mt-0.5 font-mono-tabular text-[#EAF2FF]">
                  Energy {crew.overallReadiness}% ·{' '}
                  {crew.members[0]?.status ?? 'Active'}
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="earth-report-assistance"
                className="block text-[#A8B6CC] font-medium mb-1"
              >
                5. Assistance Required
              </label>
              <input
                id="earth-report-assistance"
                type="text"
                value={assistanceRequired}
                onChange={(e) => setAssistanceRequired(e.target.value)}
                className="w-full rounded-md bg-[#111C32] border border-[#293A54] px-3 py-2 text-xs text-[#EAF2FF]"
              />
            </div>

            <button
              type="submit"
              disabled={!canRequest || isPaused}
              className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] text-[#080D1B] text-xs font-semibold cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmit Situation Report to Earth</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
