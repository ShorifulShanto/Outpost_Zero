import {
  AlertCircle,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  ExternalLink,
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
import { CornerWatermark } from './DataWatermark';

interface MissionReportViewProps {
  report: MissionReport;
  onReplay: () => void;
  onNavigate: (route: AppRoute) => void;
}

export function MissionReportView({
  report,
  onReplay,
  onNavigate,
}: MissionReportViewProps) {
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

  return (
    <div className="space-y-6">
      {/* Outcome Header Card */}
      <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div
              className={`inline-flex items-center gap-2 text-xs font-semibold ${
                isSuccess ? 'text-[#29B6F6]' : 'text-[#FFB547]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>
                {isSuccess
                  ? 'Mission Complete · All 10 Sols Survived'
                  : 'Early Mission Return · Crew Safely Evacuated'}
              </span>
            </div>

            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#EAF2FF] [text-wrap:balance]">
              {report.title}
            </h2>

            <p className="mt-3 text-sm sm:text-base text-[#A8B6CC] leading-relaxed">
              {report.summary}
            </p>
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

        {/* Action Row */}
        <div className="mt-6 pt-6 border-t border-[#293A54] flex flex-wrap items-center gap-3">
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

          <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 space-y-2">
            <p className="text-xs font-semibold text-[#FFB547]">
              Where Points Were Lost (Engineering Review)
            </p>
            {scoreBreakdown.lostPointsNotes.length === 0 ? (
              <p className="text-xs text-[#A8B6CC] leading-relaxed">
                Outstanding balance! Every major system finished with strong safety
                margins and responsive checklist execution.
              </p>
            ) : (
              <ul className="space-y-1.5 text-xs text-[#A8B6CC] leading-relaxed">
                {scoreBreakdown.lostPointsNotes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          aria-label="Mission Control Advisor Recommendations"
          className="lg:col-span-7 rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-6 space-y-4"
        >
          <div>
            <h3 className="font-display text-lg font-semibold text-[#EAF2FF]">
              Mission Control Advisor Feedback
            </h3>
            <p className="mt-1 text-xs text-[#A8B6CC]">
              Short feedback based directly on your recorded Sol decisions and base
              systems.
            </p>
          </div>

          <div className="space-y-3">
            {advisorRecommendations.map((rec, idx) => {
              const isStrength = rec.status === 'Strength';
              const agencyLabel = rec.researchNote
                ? rec.researchNote.agency.startsWith('CSA')
                  ? 'Resource: CSA'
                  : `Data: ${rec.researchNote.agency}`
                : null;
              return (
                <div
                  key={`${rec.domain}-${idx}`}
                  className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4"
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
                  <p className="mt-2 text-xs sm:text-sm text-[#A8B6CC] leading-relaxed">
                    {rec.message}
                  </p>
                  {rec.nasaContext && (
                    <div className="mt-3 rounded-md bg-[#111C32] border border-[#293A54] p-3 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[#29B6F6]">
                          {rec.nasaContext.observationTitle}
                        </span>
                        <CornerWatermark label="Data: NASA DONKI" />
                      </div>
                      <p className="text-[#A8B6CC] leading-relaxed">
                        {rec.nasaContext.detail}
                      </p>
                    </div>
                  )}
                  {rec.researchNote && (
                    <div className="mt-3 rounded-md bg-[#111C32] border border-[#293A54] p-3 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[#EAF2FF]">
                          {rec.researchNote.title}
                        </span>
                        {agencyLabel && <CornerWatermark label={agencyLabel} />}
                      </div>
                      <p className="text-[#A8B6CC] leading-relaxed">
                        {rec.researchNote.detail}
                      </p>
                      {rec.researchNote.sourceUrl && (
                        <a
                          href={rec.researchNote.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
                        >
                          <span>Inspect Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="pt-2 border-t border-[#293A54] text-xs text-[#A8B6CC]">
            NASA and CSA benchmarks give real-world context and never change your
            0–100% mission score.
          </p>
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

      {/* Key Lessons Learned + Decision Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[#29B6F6]">
            <Compass className="w-4 h-4" />
            <h3 className="font-display text-lg font-semibold text-[#EAF2FF]">
              Key Engineering Lessons Learned
            </h3>
          </div>
          <ul className="mt-4 space-y-3">
            {report.lessonsLearned.map((lesson, idx) => (
              <li
                key={lesson}
                className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 text-sm text-[#EAF2FF] leading-relaxed"
              >
                <span className="font-mono-tabular text-xs font-semibold text-[#29B6F6] mr-2">
                  0{idx + 1}.
                </span>
                {lesson}
              </li>
            ))}
          </ul>
        </section>

        <section className="lg:col-span-7 rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-6">
          <h3 className="font-display text-lg font-semibold text-[#EAF2FF]">
            Mission Decision Log
          </h3>
          <p className="mt-1 text-xs text-[#A8B6CC]">
            Review how each Sol choice affected Outpost Zero.
          </p>

          <div className="mt-4 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {report.decisions.length === 0 ? (
              <p className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 text-xs sm:text-sm text-[#A8B6CC]">
                No Sol event decisions were logged before this mission ended. Replay to
                explore different engineering strategies.
              </p>
            ) : (
              report.decisions.map((decision) => (
                <div
                  key={`${decision.sol}-${decision.eventId}`}
                  className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono-tabular text-[#29B6F6]">
                      Sol {decision.sol} · {decision.eventTitle}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular">
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
                  <p className="mt-1 text-sm font-medium text-[#EAF2FF]">
                    {decision.optionLabel}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
