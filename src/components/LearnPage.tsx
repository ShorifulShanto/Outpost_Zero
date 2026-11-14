import { useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Globe,
  HeartPulse,
  HelpCircle,
  Home,
  Radio,
  RotateCcw,
  Shield,
  Sprout,
  Wind,
  Zap,
} from 'lucide-react';
import {
  generateQuizBatch,
  getModuleQuizVariants,
  LEARN_MODULES,
  LearningModule,
  QuizQuestion,
} from '../data/learnModules';
import { AppRoute } from '../types/mission';
import { recordQuizAnswered } from '../utils/explorerProgress';
import { CompactWatermarkFooter, CornerWatermark } from './DataWatermark';
import { PageBackButton } from './PageBackButton';

interface LearnPageProps {
  onNavigate: (route: AppRoute) => void;
  previousRoute?: AppRoute | null;
  onGoBack?: () => void;
}

function ModuleIcon({ name }: { name: LearningModule['iconName'] }) {
  const cls = 'w-5 h-5 text-[#29B6F6]';
  switch (name) {
    case 'globe':
      return <Globe className={cls} />;
    case 'clock':
      return <Clock className={cls} />;
    case 'heart':
      return <HeartPulse className={cls} />;
    case 'wind':
      return <Wind className={cls} />;
    case 'shield':
      return <Shield className={cls} />;
    case 'zap':
      return <Zap className={cls} />;
    case 'sprout':
      return <Sprout className={cls} />;
    case 'radio':
      return <Radio className={cls} />;
    case 'home':
      return <Home className={cls} />;
    case 'compass':
      return <Compass className={cls} />;
  }
}

export function LearnPage({
  onNavigate,
  previousRoute = null,
  onGoBack,
}: LearnPageProps) {
  const [activeTab, setActiveTab] = useState<'modules' | 'quiz'>('modules');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    LEARN_MODULES[0].id
  );
  const [activeVocabTerm, setActiveVocabTerm] = useState<string | null>(null);
  const [moduleVariantIdx, setModuleVariantIdx] = useState<
    Record<string, number>
  >({});
  const [moduleAnswers, setModuleAnswers] = useState<Record<string, number>>({});

  // Knowledge Check Quiz state (fresh batch on every attempt/solve)
  const [quizBatch, setQuizBatch] = useState<QuizQuestion[]>(() =>
    generateQuizBatch(12)
  );
  const [batchNumber, setBatchNumber] = useState(1);
  const [recentQuestionIds, setRecentQuestionIds] = useState<string[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const activeModule =
    LEARN_MODULES.find((m) => m.id === selectedModuleId) ?? LEARN_MODULES[0];
  const activeVariantNumber = moduleVariantIdx[activeModule.id] ?? 0;
  const modulePool: QuizQuestion[] = [
    {
      id: `${activeModule.id}-primary`,
      moduleTitle: activeModule.title,
      question: activeModule.quickQuestion.prompt,
      options: activeModule.quickQuestion.options,
      correctIndex: activeModule.quickQuestion.correctIndex,
      explanation: activeModule.quickQuestion.feedbackCorrect,
    },
    ...getModuleQuizVariants(activeModule.title).filter(
      (q) => q.question !== activeModule.quickQuestion.prompt
    ),
  ];
  const currentQuickQ =
    modulePool[activeVariantNumber % modulePool.length] ?? modulePool[0];
  const moduleAnswerKey = `${activeModule.id}:${activeVariantNumber}`;
  const currentModuleAnswer = moduleAnswers[moduleAnswerKey];
  const moduleAnswered = typeof currentModuleAnswer === 'number';
  const moduleCorrect =
    moduleAnswered && currentModuleAnswer === currentQuickQ.correctIndex;

  const activeQuizQ = quizBatch[quizIndex] ?? quizBatch[0];
  const quizAnswered = selectedOption !== null;
  const quizProgressPct = Math.round(
    ((quizIndex + (quizAnswered || quizFinished ? 1 : 0)) /
      Math.max(1, quizBatch.length)) *
      100
  );

  const handleSelectModule = (id: string) => {
    setSelectedModuleId(id);
    setActiveVocabTerm(null);
  };

  const handleModuleQuestionSelect = (optionIdx: number) => {
    const alreadyAnswered = typeof moduleAnswers[moduleAnswerKey] === 'number';
    setModuleAnswers((prev) => ({ ...prev, [moduleAnswerKey]: optionIdx }));
    if (!alreadyAnswered) {
      recordQuizAnswered(optionIdx === currentQuickQ.correctIndex);
    }
  };

  const handleNextModuleQuestion = () => {
    setModuleVariantIdx((prev) => ({
      ...prev,
      [activeModule.id]: (prev[activeModule.id] ?? 0) + 1,
    }));
  };

  const handleQuizOptionSelect = (optionIdx: number) => {
    if (quizAnswered) return;
    setSelectedOption(optionIdx);
    const isCorrect = optionIdx === activeQuizQ.correctIndex;
    recordQuizAnswered(isCorrect);
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex + 1 >= quizBatch.length) {
      setQuizFinished(true);
    } else {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handleNewQuizBatch = () => {
    const updatedRecent = [
      ...quizBatch.map((q) => q.id),
      ...recentQuestionIds,
    ].slice(0, 24);
    setRecentQuestionIds(updatedRecent);
    setQuizBatch(generateQuizBatch(12, updatedRecent));
    setBatchNumber((prev) => prev + 1);
    setQuizIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex flex-col justify-between">
      <main className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <PageBackButton
          previousRoute={previousRoute}
          onBack={onGoBack ?? (() => onNavigate('home'))}
        />
      </div>
      {/* Page Header & Mode Switcher */}
      <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#29B6F6]">
            Space Learning Hub · Ages 7–12 &amp; Curious Explorers
          </p>
          <h1 className="mt-2 font-display text-2xl sm:text-4xl font-bold text-[#EAF2FF] [text-wrap:balance]">
            Explore the Science Behind Surviving on Mars
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#A8B6CC] leading-relaxed">
            Explore {LEARN_MODULES.length} short Mars lessons with vocabulary cards, then
            test your skills in the offline quiz.
          </p>
        </div>

        {/* Segmented Control: Modules vs Quiz */}
        <div
          className="inline-flex p-1 rounded-lg bg-[#080D1B] border border-[#293A54] self-start lg:self-center shrink-0"
          role="tablist"
          aria-label="Learn sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'modules'}
            onClick={() => setActiveTab('modules')}
            className={`min-h-[40px] px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-[#29B6F6] text-[#080D1B]'
                : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
            }`}
          >
            {LEARN_MODULES.length} Learning Modules
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'quiz'}
            onClick={() => setActiveTab('quiz')}
            className={`min-h-[40px] px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-[#E4774E] text-[#080D1B]'
                : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
            }`}
          >
            Knowledge Check Quiz
          </button>
        </div>
      </section>

      {/* INTERACTIVE LEARNING MODULES */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Module Index */}
          <aside className="lg:col-span-4 rounded-xl bg-[#111C32] border border-[#293A54] p-4">
            <h2 className="font-display text-sm font-semibold text-[#EAF2FF] px-2 pb-3 border-b border-[#293A54]">
              Choose a Module ({LEARN_MODULES.length} Lessons)
            </h2>
            <div className="mt-3 space-y-1.5">
              {LEARN_MODULES.map((mod) => {
                const isSelected = mod.id === activeModule.id;
                const done =
                  typeof moduleAnswers[`${mod.id}:0`] === 'number' ||
                  typeof moduleAnswers[`${mod.id}:${moduleVariantIdx[mod.id] ?? 0}`] ===
                    'number';
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleSelectModule(mod.id)}
                    className={`w-full text-left min-h-[44px] px-3 py-2.5 rounded-lg border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E3353] border-[#29B6F6] text-[#EAF2FF]'
                        : 'bg-[#080D1B]/60 border-transparent hover:border-[#293A54] text-[#A8B6CC] hover:text-[#EAF2FF]'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-medium truncate">
                      <span className="font-mono-tabular text-[#29B6F6] mr-2">
                        {String(mod.number).padStart(2, '0')}.
                      </span>
                      {mod.title}
                    </span>
                    {done && (
                      <CheckCircle2
                        aria-label="Question answered"
                        className="w-4 h-4 text-[#29B6F6] shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Active Module Content */}
          <article className="lg:col-span-8 rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-[#080D1B] border border-[#293A54] flex items-center justify-center shrink-0">
                  <ModuleIcon name={activeModule.iconName} />
                </div>
                <div>
                  <p className="text-xs font-mono-tabular text-[#29B6F6]">
                    Module {activeModule.number} of {LEARN_MODULES.length} ·{' '}
                    {activeModule.category}
                  </p>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[#EAF2FF]">
                    {activeModule.title}
                  </h2>
                </div>
              </div>
            </div>

            <p className="text-sm sm:text-base font-medium text-[#EAF2FF]">
              {activeModule.summary}
            </p>

            <p className="text-sm sm:text-base text-[#A8B6CC] leading-relaxed">
              {activeModule.explanation}
            </p>

            {/* Key Facts */}
            <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 sm:p-5">
              <h3 className="font-display text-sm font-semibold text-[#EAF2FF]">
                Key Facts to Remember
              </h3>
              <ul className="mt-3 space-y-2">
                {activeModule.keyFacts.map((fact) => (
                  <li
                    key={fact}
                    className="text-xs sm:text-sm text-[#A8B6CC] leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-[#E4774E] font-bold" aria-hidden="true">
                      •
                    </span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Real-World NASA Example */}
            <div className="rounded-lg bg-[#080D1B] border border-[#29B6F6]/40 p-4 sm:p-5">
              <h3 className="font-display text-sm font-semibold text-[#29B6F6]">
                Real-World NASA Example
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#EAF2FF]/90 leading-relaxed">
                {activeModule.nasaExample}
              </p>
            </div>

            {/* Space-Agency Research Benchmark with Subtle Corner Watermark */}
            {activeModule.researchBenchmark && (
              <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 sm:p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-sm sm:text-base font-semibold text-[#EAF2FF]">
                    {activeModule.researchBenchmark.title}
                  </h3>
                  <CornerWatermark label={activeModule.researchBenchmark.watermark} />
                </div>
                <p className="text-xs sm:text-sm text-[#A8B6CC] leading-relaxed">
                  {activeModule.researchBenchmark.summary}
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono-tabular text-[#EAF2FF]/85">
                    {activeModule.researchBenchmark.measurementContext}
                  </span>
                  <a
                    href={activeModule.researchBenchmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-[#29B6F6] hover:text-[#EAF2FF] transition-colors shrink-0"
                  >
                    <span>{activeModule.researchBenchmark.linkLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Interactive Vocabulary with Tooltips */}
            <div>
              <h3 className="font-display text-sm font-semibold text-[#EAF2FF]">
                Space Vocabulary (Click a word to reveal its meaning)
              </h3>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {activeModule.vocabulary.map((item) => {
                  const isOpen = activeVocabTerm === item.term;
                  return (
                    <button
                      key={item.term}
                      type="button"
                      onClick={() =>
                        setActiveVocabTerm(isOpen ? null : item.term)
                      }
                      aria-expanded={isOpen}
                      className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                        isOpen
                          ? 'bg-[#1E3353] border-[#29B6F6] text-[#EAF2FF]'
                          : 'bg-[#080D1B] border-[#293A54] hover:border-[#29B6F6] text-[#29B6F6]'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.term}</span>
                    </button>
                  );
                })}
              </div>

              {activeVocabTerm && (
                <div
                  role="status"
                  className="mt-3 rounded-lg bg-[#080D1B] border border-[#29B6F6] p-3.5 text-xs sm:text-sm text-[#EAF2FF]"
                >
                  <strong className="text-[#29B6F6]">{activeVocabTerm}:</strong>{' '}
                  {
                    activeModule.vocabulary.find(
                      (v) => v.term === activeVocabTerm
                    )?.definition
                  }
                </div>
              )}
            </div>

            {/* Short Inline Knowledge Question (rotates new questions on retry) */}
            <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-sm font-semibold text-[#FFB547]">
                  Quick Check: {currentQuickQ.question}
                </h3>
                {modulePool.length > 1 && (
                  <button
                    type="button"
                    onClick={handleNextModuleQuestion}
                    className="inline-flex items-center gap-1.5 min-h-[32px] px-2.5 py-1 rounded border border-[#293A54] hover:border-[#29B6F6] text-[11px] font-semibold text-[#29B6F6] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>New Question</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {currentQuickQ.options.map((opt, idx) => {
                  const isChosen = currentModuleAnswer === idx;
                  const isRightOption = idx === currentQuickQ.correctIndex;
                  return (
                    <button
                      key={`${moduleAnswerKey}-${opt}`}
                      type="button"
                      onClick={() => handleModuleQuestionSelect(idx)}
                      className={`w-full text-left min-h-[44px] px-4 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer ${
                        moduleAnswered && isRightOption
                          ? 'bg-[#1E3353] border-[#29B6F6] text-[#EAF2FF]'
                          : isChosen && !isRightOption
                            ? 'bg-[#1E3353]/50 border-[#E4774E] text-[#EAF2FF]'
                            : 'bg-[#111C32] border-[#293A54] hover:border-[#29B6F6] text-[#EAF2FF]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {moduleAnswered && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p
                    role="status"
                    className={`text-xs sm:text-sm font-medium ${
                      moduleCorrect ? 'text-[#29B6F6]' : 'text-[#FFB547]'
                    }`}
                  >
                    {activeVariantNumber === 0
                      ? moduleCorrect
                        ? activeModule.quickQuestion.feedbackCorrect
                        : activeModule.quickQuestion.feedbackIncorrect
                      : currentQuickQ.explanation}
                  </p>
                  {modulePool.length > 1 && (
                    <button
                      type="button"
                      onClick={handleNextModuleQuestion}
                      className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-md bg-[#1E3353] hover:border-[#29B6F6] border border-[#293A54] text-xs font-semibold text-[#EAF2FF] cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#29B6F6]" />
                      <span>Try Another Question</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Prev / Next Module Navigation */}
            <div className="pt-4 border-t border-[#293A54] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={activeModule.number === 1}
                onClick={() => {
                  const prev = LEARN_MODULES[activeModule.number - 2];
                  if (prev) handleSelectModule(prev.id);
                }}
                className="min-h-[42px] px-4 py-2 rounded-lg border border-[#293A54] bg-[#080D1B] disabled:opacity-40 text-xs sm:text-sm font-medium text-[#EAF2FF] cursor-pointer disabled:cursor-not-allowed"
              >
                Previous Module
              </button>

              {activeModule.number < LEARN_MODULES.length ? (
                <button
                  type="button"
                  onClick={() => {
                    const next = LEARN_MODULES[activeModule.number];
                    if (next) handleSelectModule(next.id);
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg bg-[#29B6F6] text-[#080D1B] text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <span>Next Module</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('quiz')}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-5 py-2 rounded-lg bg-[#E4774E] text-[#080D1B] text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <span>Take Knowledge Check Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </article>
        </div>
      )}

      {/* TAB 2: OFFLINE KNOWLEDGE CHECK QUIZ */}
      {activeTab === 'quiz' && (
        <section
          aria-label="Knowledge Check Quiz"
          className="max-w-[820px] mx-auto rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-8 space-y-6"
        >
          {/* Progress Bar, Batch Indicator & Score */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono-tabular font-semibold text-[#29B6F6]">
                  {quizFinished
                    ? `Batch #${batchNumber} Complete`
                    : `Batch #${batchNumber} · Question ${quizIndex + 1} of ${quizBatch.length}`}
                </span>
                <button
                  type="button"
                  onClick={handleNewQuizBatch}
                  className="inline-flex items-center gap-1 min-h-[30px] px-2.5 py-1 rounded border border-[#293A54] bg-[#080D1B] hover:border-[#29B6F6] text-[11px] font-semibold text-[#29B6F6] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>New Question Batch</span>
                </button>
              </div>
              <span className="font-mono-tabular font-semibold text-[#EAF2FF]">
                Score: {quizScore} / {quizBatch.length}
              </span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-[#080D1B] border border-[#293A54] overflow-hidden">
              <div
                className="h-full bg-[#29B6F6] transition-all duration-300"
                style={{ width: `${quizProgressPct}%` }}
              />
            </div>
          </div>

          {!quizFinished ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-[#A8B6CC]">
                  Topic: {activeQuizQ.moduleTitle}
                </p>
                <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-[#EAF2FF]">
                  {activeQuizQ.question}
                </h2>
              </div>

              <div className="space-y-2.5">
                {activeQuizQ.options.map((opt, idx) => {
                  const isChosen = selectedOption === idx;
                  const isCorrect = idx === activeQuizQ.correctIndex;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={quizAnswered}
                      onClick={() => handleQuizOptionSelect(idx)}
                      className={`w-full text-left min-h-[46px] px-4 py-3 rounded-lg border text-sm transition-colors cursor-pointer disabled:cursor-default ${
                        quizAnswered && isCorrect
                          ? 'bg-[#1E3353] border-[#29B6F6] text-[#EAF2FF]'
                          : isChosen && !isCorrect
                            ? 'bg-[#1E3353]/40 border-[#FFB547] text-[#EAF2FF]'
                            : 'bg-[#080D1B] border-[#293A54] hover:border-[#29B6F6] text-[#EAF2FF]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizAnswered && (
                <div
                  role="status"
                  className="rounded-lg bg-[#080D1B] border border-[#29B6F6]/60 p-4 space-y-2"
                >
                  <p
                    className={`text-sm font-semibold ${
                      selectedOption === activeQuizQ.correctIndex
                        ? 'text-[#29B6F6]'
                        : 'text-[#FFB547]'
                    }`}
                  >
                    {selectedOption === activeQuizQ.correctIndex
                      ? 'Great job! That is correct.'
                      : 'Nice effort! Here is why engineers look at it this way:'}
                  </p>
                  <p className="text-xs sm:text-sm text-[#EAF2FF]/90 leading-relaxed">
                    {activeQuizQ.explanation}
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNextQuizQuestion}
                      className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] text-[#080D1B] text-sm font-semibold cursor-pointer"
                    >
                      <span>
                        {quizIndex + 1 >= quizBatch.length
                          ? 'See Final Quiz Score'
                          : 'Next Question'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-6 text-center space-y-4">
              <Award className="w-10 h-10 text-[#29B6F6] mx-auto" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#EAF2FF]">
                You Scored {quizScore} out of {quizBatch.length}!
              </h2>
              <p className="text-sm sm:text-base text-[#A8B6CC] max-w-lg mx-auto leading-relaxed">
                {quizScore >= 8
                  ? 'Outstanding Mars Commander! You understand how oxygen, solar power, radiation shields, and greenhouses work together.'
                  : 'Well done exploring Mars science! Try a fresh question batch or review any module anytime to sharpen your survival skills.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleNewQuizBatch}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#29B6F6] hover:bg-[#4dc4f8] text-[#080D1B] text-sm font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>New Question Batch</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('simulator')}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#E4774E] text-[#080D1B] text-sm font-semibold cursor-pointer"
                >
                  <span>Apply Knowledge in Simulator</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      </main>

      <CompactWatermarkFooter onNavigate={onNavigate} />
    </div>
  );
}
