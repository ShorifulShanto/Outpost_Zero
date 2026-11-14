import { useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Compass,
  Download,
  Home,
  RotateCcw,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppRoute, MissionReport } from '../types/mission';
import { downloadMissionCertificate } from '../utils/certificateGenerator';
import {
  EXPLORER_BADGES,
  ExplorerProgressState,
  getExplorerRank,
} from '../utils/explorerProgress';
import { InfoHoverTip } from './InfoHoverTip';

interface MissionReportViewProps {
  report: MissionReport;
  explorerProgress?: ExplorerProgressState;
  onReplay: () => void;
  onNavigate: (route: AppRoute) => void;
}

export function MissionReportView({
  report,
  explorerProgress,
  onReplay,
  onNavigate,
}: MissionReportViewProps) {
  const [lostPointsOpen, setLostPointsOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<'decisions' | 'lessons'>('decisions');
  const [commanderName, setCommanderName] = useState('Mars Explorer');
  const [certStatus, setCertStatus] = useState<'idle' | 'downloading' | 'done'>('idle');
  const isSuccess = report.outcome === 'success';
  const { scoreBreakdown, advisorRecommendations } = report;

  const rubricBars = [
    {
      label: 'Life Support Management',
      score: scoreBreakdown.lifeSupportScore,
      max: 30,
      color: 'bg-[#29B6F6]',
    },
    {
      label: 'Power Management',
      score: scoreBreakdown.powerScore,
      max: 25,
      color: 'bg-[#FFB547]',
    },
    {
      label: 'Radiation Protection',
      score: scoreBreakdown.radiationScore,
      max: 25,
      color: 'bg-[#E4774E]',
    },
    {
      label: 'Decision Making & Event Response',
      score: scoreBreakdown.decisionMakingScore,
      max: 20,
      color: 'bg-[#29B6F6]',
    },
  ];

  const unlockedCount = explorerProgress?.unlockedBadges.length ?? 0;
  const explorerRank = getExplorerRank(unlockedCount);

  const handleDownloadCertificate = async () => {
    setCertStatus('downloading');
    const ok = await downloadMissionCertificate(report, {
      commanderName,
      explorerRank,
      unlockedMedalsCount: unlockedCount,
    });
    setCertStatus(ok ? 'done' : 'idle');
    if (ok) {
      window.setTimeout(() => setCertStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Outcome Header Card */}
      <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div
              className={`inline-flex flex-wrap items-center gap-2 text-xs font-semibold ${
                isSuccess ? 'text-[#29B6F6]' : 'text-[#FFB547]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>
                {isSuccess
                  ? 'Mission Complete · All 10 Sols Survived'
                  : report.failedSystem === 'Crew Health'
                    ? 'Mission Aborted · Crew Health Emergency'
                    : 'Early Mission Return · Crew Safely Evacuated'}
              </span>
              <span className="font-mono-tabular text-[#A8B6CC]">
                · {report.landingSiteName} · OZ-{report.missionSeed}
              </span>
            </div>

            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#EAF2FF] [text-wrap:balance]">
              {report.title}
            </h2>

            <p className="mt-3 text-sm sm:text-base text-[#A8B6CC] leading-relaxed">
              {report.summary}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono-tabular">
              <span
                className={
                  report.crewAlive < report.crewTotal
                    ? 'text-[#E4774E] font-semibold'
                    : 'text-[#29B6F6]'
                }
              >
                Crew Alive: {report.crewAlive} / {report.crewTotal}
              </span>
              <span className="text-[#FFB547]">
                Radiation Taken: {(report.cumulativeDoseMSv ?? 0.67).toFixed(2)} mSv
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5">
              <p className="text-xs text-[#A8B6CC]">Mission Score</p>
              <p className="mt-1 font-mono-tabular text-xl font-bold text-[#E4774E]">
                {scoreBreakdown.totalScore} / 100
              </p>
            </div>
            <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5">
              <p className="text-xs text-[#A8B6CC]">Sols Survived</p>
              <p className="mt-1 font-mono-tabular text-xl font-bold text-[#EAF2FF]">
                {report.solsSurvived} / {report.maxSols}
              </p>
            </div>
            <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5">
              <p className="text-xs text-[#A8B6CC]">System Average</p>
              <p className="mt-1 font-mono-tabular text-xl font-bold text-[#29B6F6]">
                {report.averageScore}%
              </p>
            </div>
          </div>
        </div>

        {/* Action Row + Certificate Download with Commander Name */}
        <div className="mt-6 pt-6 border-t border-[#293A54] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] text-[#080D1B] text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Mission</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1E3353] hover:border-[#29B6F6] border border-[#293A54] text-[#EAF2FF] text-sm font-medium transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor="certificate-commander-name" className="sr-only">
              Commander Name for Certificate
            </label>
            <input
              id="certificate-commander-name"
              type="text"
              maxLength={32}
              value={commanderName}
              onChange={(e) => setCommanderName(e.target.value)}
              placeholder="Your Name"
              className="min-h-[44px] w-44 sm:w-48 rounded-lg bg-[#080D1B] border border-[#293A54] focus:border-[#29B6F6] focus:outline-none px-3 text-xs sm:text-sm text-[#EAF2FF]"
            />
            <button
              type="button"
              disabled={certStatus === 'downloading'}
              onClick={() => void handleDownloadCertificate()}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#080D1B] hover:border-[#29B6F6] border border-[#29B6F6]/60 text-[#29B6F6] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {certStatus === 'done'
                  ? 'Certificate Saved!'
                  : certStatus === 'downloading'
                    ? 'Creating...'
                    : 'Download Certificate'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 100-Point Performance Rubric & Mission Control Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section
          aria-label="100-Point Performance Score Breakdown"
          className="lg:col-span-5 rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-[#29B6F6]">
            <ClipboardCheck className="w-4 h-4" />
            <h3 className="font-display text-lg font-semibold text-[#EAF2FF]">
              100-Point Performance Score
            </h3>
          </div>

          <div className="space-y-3">
            {rubricBars.map((item) => {
              const pct = Math.round((item.score / item.max) * 100);
              return (
                <div
                  key={item.label}
                  className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#EAF2FF]">{item.label}</span>
                    <span className="font-mono-tabular font-bold text-[#29B6F6]">
                      {item.score} / {item.max}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-[#111C32] overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
            <button
              type="button"
              onClick={() => setLostPointsOpen((prev) => !prev)}
              aria-expanded={lostPointsOpen}
              className="w-full flex items-center justify-between gap-2 text-xs font-semibold text-[#FFB547] cursor-pointer"
            >
              <span>
                Engineering Review ({scoreBreakdown.lostPointsNotes.length} notes)
              </span>
              {lostPointsOpen ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </button>
            {lostPointsOpen && (
              <div className="mt-2.5 pt-2.5 border-t border-[#293A54]">
                {scoreBreakdown.lostPointsNotes.length === 0 ? (
                  <p className="text-xs text-[#A8B6CC] leading-relaxed">
                    Outstanding balance! Every major system finished with strong safety
                    margins.
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-[#A8B6CC] leading-relaxed">
                    {scoreBreakdown.lostPointsNotes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>

        <section
          aria-label="Mission Control Advisor Recommendations"
          className="lg:col-span-7 rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-6 space-y-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#EAF2FF]">
                Mission Control Advisor
              </h3>
              <p className="text-xs text-[#A8B6CC]">
                Hover or tap NASA/CSA badges for real research context.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {advisorRecommendations.map((rec, idx) => {
              const isStrength = rec.status === 'Strength';
              return (
                <div
                  key={`${rec.domain}-${idx}`}
                  className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#EAF2FF]">
                      {rec.domain}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        isStrength ? 'text-[#29B6F6]' : 'text-[#FFB547]'
                      }`}
                    >
                      {isStrength ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{rec.status}</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#A8B6CC] leading-relaxed">
                    {rec.message}
                  </p>

                  {(rec.nasaContext || rec.researchNote) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {rec.nasaContext && (
                        <InfoHoverTip
                          label="NASA DONKI Data"
                          title={rec.nasaContext.observationTitle}
                          badge={rec.nasaContext.sourceLabel}
                          body={rec.nasaContext.detail}
                          note="Scientific context only — does not alter your 0–100% score."
                          accent="amber"
                        />
                      )}
                      {rec.researchNote && (
                        <InfoHoverTip
                          label={`${rec.researchNote.agency}`}
                          title={rec.researchNote.title}
                          badge={rec.researchNote.dataType}
                          body={rec.researchNote.detail}
                          sourceUrl={rec.researchNote.sourceUrl}
                          accent="blue"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Resource History Chart (Recharts) */}
      <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#EAF2FF]">
              10-Sol Outpost Resource History
            </h3>
            <p className="text-xs text-[#A8B6CC]">
              See how your engineering trade-offs changed Life Support, Power, and
              Radiation Protection over time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono-tabular text-[#A8B6CC]">
            <span>Life Support: {report.finalResources.lifeSupport}%</span>
            <span>Power: {report.finalResources.power}%</span>
            <span>Radiation: {report.finalResources.radiationProtection}%</span>
          </div>
        </div>

        <div className="h-[290px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={report.history}
              margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
            >
              <CartesianGrid stroke="#293A54" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                minTickGap={16}
                stroke="#A8B6CC"
                tick={{ fill: '#A8B6CC', fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#A8B6CC"
                tick={{ fill: '#A8B6CC', fontSize: 12 }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#080D1B',
                  borderColor: '#293A54',
                  borderRadius: '8px',
                  color: '#EAF2FF',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#EAF2FF' }} />
              <Line
                type="monotone"
                dataKey="lifeSupport"
                name="Life Support"
                stroke="#29B6F6"
                strokeWidth={2.5}
                dot={{ r: 3.5 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="power"
                name="Power"
                stroke="#FFB547"
                strokeWidth={2.5}
                dot={{ r: 3.5 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="radiationProtection"
                name="Radiation Protection"
                stroke="#E4774E"
                strokeWidth={2.5}
                dot={{ r: 3.5 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Compact Tabbed Decision Log & Engineering Lessons */}
      <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex p-1 rounded-lg bg-[#080D1B] border border-[#293A54] gap-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={bottomTab === 'decisions'}
              onClick={() => setBottomTab('decisions')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                bottomTab === 'decisions'
                  ? 'bg-[#1E3353] text-[#29B6F6]'
                  : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
              }`}
            >
              Mission Decision Log ({report.decisions.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bottomTab === 'lessons'}
              onClick={() => setBottomTab('lessons')}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                bottomTab === 'lessons'
                  ? 'bg-[#1E3353] text-[#29B6F6]'
                  : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Key Lessons ({report.lessonsLearned.length})</span>
            </button>
          </div>
        </div>

        {bottomTab === 'decisions' ? (
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {report.decisions.length === 0 ? (
              <p className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 text-xs sm:text-sm text-[#A8B6CC]">
                No Sol event decisions were logged before this mission ended.
              </p>
            ) : (
              report.decisions.map((decision) => (
                <div
                  key={`${decision.sol}-${decision.eventId}`}
                  className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-mono-tabular text-[#29B6F6]">
                      Sol {decision.sol} · {decision.eventTitle}
                    </p>
                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-[#EAF2FF] truncate">
                      {decision.optionLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular shrink-0">
                    <span className="text-[#A8B6CC]">
                      Life {decision.appliedDeltas.lifeSupport >= 0 ? '+' : ''}
                      {decision.appliedDeltas.lifeSupport}%
                    </span>
                    <span className="text-[#A8B6CC]">
                      Pwr {decision.appliedDeltas.power >= 0 ? '+' : ''}
                      {decision.appliedDeltas.power}%
                    </span>
                    <span className="text-[#A8B6CC]">
                      Rad {decision.appliedDeltas.radiationProtection >= 0 ? '+' : ''}
                      {decision.appliedDeltas.radiationProtection}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {report.lessonsLearned.map((lesson, idx) => (
              <li
                key={lesson}
                className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3 text-xs sm:text-sm text-[#EAF2FF] leading-relaxed"
              >
                <span className="font-mono-tabular text-xs font-semibold text-[#29B6F6] mr-2">
                  0{idx + 1}.
                </span>
                {lesson}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
