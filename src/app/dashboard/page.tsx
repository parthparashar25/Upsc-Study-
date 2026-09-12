"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Typography,
  Card,
  CardBody,
  Button,
  Progress,
} from "@material-tailwind/react";
import {
  CalendarDaysIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  CheckIcon,
  BookmarkIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BookmarkSquareIcon,
  SparklesIcon,
  ChartBarSquareIcon,
  BoltIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Subject, DailyStats, SyllabusTopic, TopicProgress, TopicStatus } from "@/types/database";
import {
  fetchSubjects,
  fetchHabitsForDate,
  toggleHabitCompletion,
  fetchDailyStats,
  saveDailyStats,
  fetchRecentlyStudiedTopics,
  fetchSyllabusStatistics,
  updateTopicProgress,
  SyllabusCategoryStats,
} from "@/lib/api";
import { MASTER_SYLLABUS, computeTopicStatus } from "@/lib/syllabus-data";
import {
  formatDateToIso,
  formatDisplayDate,
  PRELIMS_CORE_SUBJECTS,
  TARGET_EXAM_DATE,
  TARGET_EXAM_DISPLAY,
  TARGET_EXAM_NAME,
  PREPARATION_PHASES,
} from "@/lib/constants";
import { ExamCountdownTimer } from "@/components/ExamCountdownTimer";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const todayIso = useMemo(() => formatDateToIso(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  // Syllabus tracking states
  const [syllabusStats, setSyllabusStats] = useState<{
    overall: SyllabusCategoryStats;
    prelims: SyllabusCategoryStats;
    mains: SyllabusCategoryStats;
    subjectStats: Record<string, SyllabusCategoryStats>;
    totalRevisionsCount?: number;
    totalPyqsCount?: number;
    totalStudySessionsCount?: number;
  } | null>(null);
  const [recentTopics, setRecentTopics] = useState<(SyllabusTopic & { progress: TopicProgress })[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Quick Topic Logger form states
  const [showQuickLogger, setShowQuickLogger] = useState(false);
  const [quickSubjId, setQuickSubjId] = useState<string>(MASTER_SYLLABUS[0]?.id || "");
  const [quickSecId, setQuickSecId] = useState<string>(MASTER_SYLLABUS[0]?.sections[0]?.id || "");
  const [quickTopicId, setQuickTopicId] = useState<string>(MASTER_SYLLABUS[0]?.sections[0]?.topics[0]?.id || "");
  const [quickStudy, setQuickStudy] = useState(true);
  const [quickRev, setQuickRev] = useState(false);
  const [quickPyq, setQuickPyq] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickSaved, setQuickSaved] = useState(false);

  // Form states for study stats
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [revisions, setRevisions] = useState<number>(0);
  const [pyqs, setPyqs] = useState<number>(0);

  const [savingStats, setSavingStats] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);

  // Load subjects
  useEffect(() => {
    fetchSubjects().then(setSubjects);
  }, []);

  const coreSubjects = useMemo(() => {
    const prelims = subjects.filter((s) => s.category === "Prelims");
    return prelims.length > 0 ? prelims.slice(0, 8) : PRELIMS_CORE_SUBJECTS;
  }, [subjects]);

  // Load habit completions and daily stats for selected date
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let isMounted = true;

    async function loadData() {
      const [habitsData, statsData] = await Promise.all([
        fetchHabitsForDate(userId, selectedDate),
        fetchDailyStats(userId, selectedDate),
      ]);

      if (isMounted) {
        setCompletions(habitsData);
        setDailyStats(statsData);
        setHours(statsData?.study_hours || 0);
        setMinutes(statsData?.study_minutes || 0);
        setRevisions(statsData?.revision_count || 0);
        setPyqs(statsData?.pyq_count || 0);
        setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user, selectedDate]);

  // Load syllabus statistics and recently studied topics
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setLoadingTopics(true);

    Promise.all([
      fetchSyllabusStatistics(user.id, profile?.optional_subject),
      fetchRecentlyStudiedTopics(user.id, 4),
    ]).then(([stats, recents]) => {
      if (isMounted) {
        setSyllabusStats(stats);
        setRecentTopics(recents);
        setLoadingTopics(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user, profile?.optional_subject]);

  // Handle instant habit toggle
  const handleToggleHabit = async (subjectId: string) => {
    if (!user) return;
    const nextCompleted = !completions[subjectId];

    // Optimistic UI update
    setCompletions((prev) => ({ ...prev, [subjectId]: nextCompleted }));

    // Save immediately to Supabase
    const ok = await toggleHabitCompletion(user.id, subjectId, selectedDate, nextCompleted);
    if (!ok) {
      setCompletions((prev) => ({ ...prev, [subjectId]: !nextCompleted }));
    }
  };

  // Handle saving daily stats
  const handleSaveDailyStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingStats(true);
    setSaveStatus("idle");

    const ok = await saveDailyStats(user.id, {
      study_date: selectedDate,
      study_hours: Math.max(0, Number(hours) || 0),
      study_minutes: Math.max(0, Math.min(59, Number(minutes) || 0)),
      revision_count: Math.max(0, Number(revisions) || 0),
      pyq_count: Math.max(0, Number(pyqs) || 0),
    });

    setSavingStats(false);
    if (ok) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("error");
    }
  };

  // Handle fast topic checkbox toggle from the "Continue Studying" list
  const handleToggleTopicAction = async (
    topicId: string,
    field: "study" | "revision" | "pyq"
  ) => {
    if (!user) return;
    const target = recentTopics.find((t) => t.id === topicId);
    if (!target) return;

    const nextStudy = field === "study" ? !target.progress.study_completed : target.progress.study_completed;
    const nextRev = field === "revision" ? !target.progress.revision_completed : target.progress.revision_completed;
    const nextPyq = field === "pyq" ? !target.progress.pyq_completed : target.progress.pyq_completed;
    const nextStatus = computeTopicStatus(nextStudy, nextRev, nextPyq, target.progress.status);

    // Optimistic UI update
    setRecentTopics((prev) =>
      prev.map((t) => {
        if (t.id === topicId) {
          return {
            ...t,
            progress: {
              ...t.progress,
              study_completed: nextStudy,
              revision_completed: nextRev,
              pyq_completed: nextPyq,
              status: nextStatus,
              last_studied: new Date().toISOString(),
            },
          };
        }
        return t;
      })
    );

    await updateTopicProgress(user.id, topicId, {
      study_completed: nextStudy,
      revision_completed: nextRev,
      pyq_completed: nextPyq,
      status: nextStatus,
    });

    // Refresh overall stats
    fetchSyllabusStatistics(user.id, profile?.optional_subject).then(setSyllabusStats);
  };

  // Quick Topic Logger helpers
  const selectedQuickSubject = useMemo(
    () => MASTER_SYLLABUS.find((s) => s.id === quickSubjId) || MASTER_SYLLABUS[0],
    [quickSubjId]
  );

  const selectedQuickSection = useMemo(() => {
    const sec = selectedQuickSubject?.sections.find((s) => s.id === quickSecId);
    return sec || selectedQuickSubject?.sections[0];
  }, [selectedQuickSubject, quickSecId]);

  const handleQuickSubjectChange = (newSubjId: string) => {
    setQuickSubjId(newSubjId);
    const subj = MASTER_SYLLABUS.find((s) => s.id === newSubjId);
    if (subj && subj.sections.length > 0) {
      setQuickSecId(subj.sections[0].id);
      if (subj.sections[0].topics.length > 0) {
        setQuickTopicId(subj.sections[0].topics[0].id);
      }
    }
  };

  const handleQuickSectionChange = (newSecId: string) => {
    setQuickSecId(newSecId);
    const sec = selectedQuickSubject?.sections.find((s) => s.id === newSecId);
    if (sec && sec.topics.length > 0) {
      setQuickTopicId(sec.topics[0].id);
    }
  };

  const handleQuickTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quickTopicId) return;
    setQuickSaving(true);

    await updateTopicProgress(user.id, quickTopicId, {
      study_completed: quickStudy,
      revision_completed: quickRev,
      pyq_completed: quickPyq,
    });

    setQuickSaving(false);
    setQuickSaved(true);
    setTimeout(() => setQuickSaved(false), 3000);

    // Refresh recents and stats
    const [stats, recents] = await Promise.all([
      fetchSyllabusStatistics(user.id, profile?.optional_subject),
      fetchRecentlyStudiedTopics(user.id, 4),
    ]);
    setSyllabusStats(stats);
    setRecentTopics(recents);
  };

  const completedHabitsCount = coreSubjects.filter((s) => completions[s.id]).length;
  const habitsProgressPercent =
    coreSubjects.length > 0 ? Math.round((completedHabitsCount / coreSubjects.length) * 100) : 0;

  const totalTopics = syllabusStats?.overall?.total || 168;
  const completedTopics = syllabusStats?.overall?.completed || 0;
  const portionPercent = syllabusStats?.overall?.percent || 0;
  const portionLeftPercent = Math.max(0, 100 - portionPercent);
  const remainingTopics = Math.max(0, totalTopics - completedTopics);
  const totalRevisions = syllabusStats?.totalRevisionsCount || dailyStats?.revision_count || 0;
  const totalPyqs = syllabusStats?.totalPyqsCount || dailyStats?.pyq_count || 0;

  const renderStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircleIcon className="w-3 h-3 stroke-[2.5]" />
            Completed
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            In Progress
          </span>
        );
      case "Revision Due":
        return (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Revision Due
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-medium uppercase tracking-wider text-gray-500 bg-blue-gray-50 px-2 py-0.5 rounded border border-blue-gray-100">
            Not Started
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-gray-100 dark:border-gray-800 pb-4">
          <div>
            <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight dark:text-white">
              UPSC Study Tracker
            </Typography>
            <Typography variant="small" className="text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Today&apos;s Study &bull; {formatDisplayDate(selectedDate)}
            </Typography>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-blue-gray-700 dark:text-gray-200 shadow-xs">
              <CalendarDaysIcon className="w-4 h-4 text-blue-gray-400 dark:text-gray-400 mr-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-semibold text-blue-gray-800 dark:text-gray-100 focus:outline-none"
              />
            </div>
            {selectedDate !== todayIso && (
              <Button
                size="sm"
                variant="text"
                color="blue-gray"
                onClick={() => setSelectedDate(todayIso)}
                className="text-xs font-semibold normal-case px-2.5 py-1.5 dark:text-gray-300"
              >
                Reset to Today
              </Button>
            )}
          </div>
        </div>

        {/* TARGETED UPSC ATTEMPT BANNER (23-05-2027 SUNDAY) */}
        <div
          style={{
            background: "linear-gradient(135deg, #0b1120 0%, #0f172a 50%, #1e293b 100%)",
            borderColor: "#334155",
            color: "#ffffff",
          }}
          className="rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white border border-slate-700/80 shadow-sm relative overflow-hidden"
        >
          {/* Ambient blur accents */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Header + Live Timer */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    borderColor: "rgba(16, 185, 129, 0.4)",
                    color: "#34d399",
                  }}
                  className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold tracking-wide mb-1.5"
                >
                  <CalendarDaysIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{TARGET_EXAM_DISPLAY}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Targeted Attempt: UPSC CSE 2027</span>
                </h2>
                <p className="text-xs text-slate-300/90 mt-0.5">
                  Portion completion, scheduled revisions, and systematic PYQ practice.
                </p>
              </div>

              {/* Live Pleasant Countdown Timer */}
              <div
                style={{ backgroundColor: "#020617", borderColor: "#334155" }}
                className="bg-slate-950/70 border border-slate-700/60 rounded-xl p-2.5 shadow-inner"
              >
                <ExamCountdownTimer variant="compact" showDateBadge={false} />
              </div>
            </div>

            {/* Portion Completed vs Left & Key Preparation Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-700/60">
              {/* 1. Portion Completed */}
              <div
                style={{ backgroundColor: "rgba(2, 6, 23, 0.6)", borderColor: "rgba(51, 65, 85, 0.6)" }}
                className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-700/50"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>Portion Completed</span>
                  <span className="text-emerald-400 font-bold">{portionPercent}%</span>
                </div>
                <div className="text-base font-black text-white mt-1">
                  {completedTopics} <span className="text-xs font-normal text-slate-400">/ {totalTopics}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all duration-300" style={{ width: `${portionPercent}%` }} />
                </div>
              </div>

              {/* 2. Portion Left */}
              <div
                style={{ backgroundColor: "rgba(2, 6, 23, 0.6)", borderColor: "rgba(51, 65, 85, 0.6)" }}
                className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-700/50"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>Portion Left</span>
                  <span className="text-amber-400 font-bold">{portionLeftPercent}%</span>
                </div>
                <div className="text-base font-black text-white mt-1">
                  {remainingTopics} <span className="text-xs font-normal text-slate-400">topics left</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${portionLeftPercent}%` }} />
                </div>
              </div>

              {/* 3. Revised Time / Revisions Logged */}
              <div
                style={{ backgroundColor: "rgba(2, 6, 23, 0.6)", borderColor: "rgba(51, 65, 85, 0.6)" }}
                className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-700/50"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>Revised Times</span>
                  <span className="text-cyan-400 font-bold">3x Target</span>
                </div>
                <div className="text-base font-black text-white mt-1">
                  {totalRevisions} <span className="text-xs font-normal text-slate-400">revisions</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 truncate">
                  Rapid revision sprint pending
                </p>
              </div>

              {/* 4. PYQs Practiced */}
              <div
                style={{ backgroundColor: "rgba(2, 6, 23, 0.6)", borderColor: "rgba(51, 65, 85, 0.6)" }}
                className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-700/50"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>PYQs Practiced</span>
                  <span className="text-purple-400 font-bold">10-Yr Target</span>
                </div>
                <div className="text-base font-black text-white mt-1">
                  {totalPyqs} <span className="text-xs font-normal text-slate-400">topics with PYQs</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 truncate">
                  Exam practice momentum
                </p>
              </div>
            </div>

            {/* Footer: Rapid Revision Roadmap Pill & Link to /portion */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs">
              <div className="inline-flex items-center gap-1.5 text-slate-300">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                  Phase 1 Active
                </span>
                <span className="text-[11px]">Foundation &amp; 100% Portion Mastery &bull; Rapid Revision Marathon to follow</span>
              </div>

              <Link
                href="/portion"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors shrink-0"
              >
                <ChartBarSquareIcon className="w-4 h-4 text-emerald-400" />
                <span>Portion Tracker &amp; Rapid Revision &rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* TOP METRICS: TODAY'S HABITS + SYLLABUS TOPICS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Today's Habits Progress */}
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardBody className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Typography variant="small" color="blue-gray" className="font-bold uppercase tracking-wider text-xs">
                    Today&apos;s Habits
                  </Typography>
                  <Typography variant="h6" color="blue-gray" className="font-bold">
                    {habitsProgressPercent}%
                  </Typography>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <Typography variant="h3" color="blue-gray" className="font-bold tracking-tight">
                    {completedHabitsCount}
                  </Typography>
                  <Typography variant="small" className="text-gray-500 font-normal">
                    / {coreSubjects.length} subjects done today
                  </Typography>
                </div>

                <div className="w-full bg-blue-gray-50 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className="bg-gray-900 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, habitsProgressPercent)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-blue-gray-50 text-xs">
                <span className="text-gray-500 font-medium">
                  {coreSubjects.length - completedHabitsCount} remaining
                </span>
                <Link href="/habits" className="text-gray-900 font-bold hover:underline flex items-center gap-1">
                  View All Habits &rarr;
                </Link>
              </div>
            </CardBody>
          </Card>

          {/* Master Syllabus Progress */}
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardBody className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Typography variant="small" color="blue-gray" className="font-bold uppercase tracking-wider text-xs">
                    Syllabus Coverage
                  </Typography>
                  <Typography variant="h6" color="blue-gray" className="font-bold">
                    {syllabusStats?.overall?.percent || 0}%
                  </Typography>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <Typography variant="h3" color="blue-gray" className="font-bold tracking-tight">
                    {syllabusStats?.overall?.completed || 0}
                  </Typography>
                  <Typography variant="small" className="text-gray-500 font-normal">
                    / {syllabusStats?.overall?.total || 168} topics completed
                  </Typography>
                </div>

                {/* Prelims & Mains sub-bars */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-blue-gray-50/70 p-2 rounded-md">
                    <div className="flex justify-between text-[11px] font-semibold text-blue-gray-700 mb-1">
                      <span>Prelims</span>
                      <span>
                        {syllabusStats?.prelims?.completed || 0}/{syllabusStats?.prelims?.total || 94} ({syllabusStats?.prelims?.percent || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-blue-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gray-800 h-full rounded-full"
                        style={{ width: `${syllabusStats?.prelims?.percent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-gray-50/70 p-2 rounded-md">
                    <div className="flex justify-between text-[11px] font-semibold text-blue-gray-700 mb-1">
                      <span>Mains</span>
                      <span>
                        {syllabusStats?.mains?.completed || 0}/{syllabusStats?.mains?.total || 74} ({syllabusStats?.mains?.percent || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-blue-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gray-800 h-full rounded-full"
                        style={{ width: `${syllabusStats?.mains?.percent || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-blue-gray-50 text-xs">
                <span className="text-gray-500 font-medium">
                  {syllabusStats?.overall?.inProgress || 0} in progress &bull; {syllabusStats?.overall?.revisionDue || 0} revision due
                </span>
                <Link href="/syllabus" className="text-gray-900 font-bold hover:underline flex items-center gap-1">
                  Full Syllabus &rarr;
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* CONTINUE STUDYING / RECENT TOPICS */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardBody className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-blue-gray-50">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-4 h-4 text-gray-900" />
                  <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                    Continue Studying (Chapters &amp; Topics)
                  </Typography>
                </div>
                <Typography variant="small" className="text-gray-500 text-xs font-normal mt-0.5">
                  Check off Study, Revision, or PYQ directly from your dashboard.
                </Typography>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowQuickLogger((prev) => !prev)}
                  className="text-xs font-bold text-gray-900 hover:text-gray-700 flex items-center gap-1 bg-blue-gray-50 hover:bg-blue-gray-100 px-2.5 py-1.5 rounded-md transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Log Any Topic</span>
                  {showQuickLogger ? (
                    <ChevronUpIcon className="w-3.5 h-3.5 ml-0.5" />
                  ) : (
                    <ChevronDownIcon className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </button>
                <Link
                  href="/syllabus"
                  className="text-xs font-bold text-gray-900 hover:text-gray-700 underline hidden sm:inline"
                >
                  Explore All Topics &rarr;
                </Link>
              </div>
            </div>

            {/* QUICK TOPIC LOGGER ACCORDION / DRAWER */}
            {showQuickLogger && (
              <div className="mb-5 p-4 bg-blue-gray-50/50 rounded-xl border border-blue-gray-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-gray-100">
                  <div className="flex items-center gap-1.5">
                    <SparklesIcon className="w-4 h-4 text-gray-900" />
                    <Typography variant="small" color="blue-gray" className="font-bold text-xs">
                      Quick Log: Select Any Topic in 10 Seconds
                    </Typography>
                  </div>
                  {quickSaved && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Topic Progress Saved!
                    </span>
                  )}
                </div>

                <form onSubmit={handleQuickTopicSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    {/* Subject Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-gray-600 mb-1">
                        1. Subject
                      </label>
                      <select
                        value={quickSubjId}
                        onChange={(e) => handleQuickSubjectChange(e.target.value)}
                        className="w-full bg-white border border-blue-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-gray-800 focus:outline-none focus:border-gray-900"
                      >
                        {MASTER_SYLLABUS.map((s) => (
                          <option key={s.id} value={s.id}>
                            [{s.exam}] {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Section Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-gray-600 mb-1">
                        2. Chapter / Section
                      </label>
                      <select
                        value={quickSecId}
                        onChange={(e) => handleQuickSectionChange(e.target.value)}
                        className="w-full bg-white border border-blue-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-gray-800 focus:outline-none focus:border-gray-900"
                      >
                        {selectedQuickSubject?.sections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Topic Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-gray-600 mb-1">
                        3. Topic
                      </label>
                      <select
                        value={quickTopicId}
                        onChange={(e) => setQuickTopicId(e.target.value)}
                        className="w-full bg-white border border-blue-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-gray-800 focus:outline-none focus:border-gray-900"
                      >
                        {selectedQuickSection?.topics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions & Submit */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quickStudy}
                          onChange={(e) => setQuickStudy(e.target.checked)}
                          className="w-4 h-4 rounded text-gray-900 focus:ring-0 cursor-pointer"
                        />
                        <span>Studied</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quickRev}
                          onChange={(e) => setQuickRev(e.target.checked)}
                          className="w-4 h-4 rounded text-gray-900 focus:ring-0 cursor-pointer"
                        />
                        <span>Revised</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quickPyq}
                          onChange={(e) => setQuickPyq(e.target.checked)}
                          className="w-4 h-4 rounded text-gray-900 focus:ring-0 cursor-pointer"
                        />
                        <span>PYQs Solved</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/syllabus?subject=${quickSubjId}&topic=${quickTopicId}`}
                        className="text-xs font-semibold text-gray-600 hover:text-gray-900 underline px-2"
                      >
                        Open in Syllabus
                      </Link>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={quickSaving}
                        className="bg-gray-900 hover:bg-gray-800 normal-case font-semibold text-xs px-3.5 py-1.5"
                      >
                        {quickSaving ? "Saving..." : "Save Topic Progress"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* ACTIVE TOPICS LIST */}
            {loadingTopics ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                Loading syllabus progress...
              </div>
            ) : recentTopics.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-xs">
                No active topics yet. Open Syllabus to start tracking chapters!
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentTopics.map((topic) => {
                  const isStudied = Boolean(topic.progress?.study_completed);
                  const isRevised = Boolean(topic.progress?.revision_completed);
                  const isPyq = Boolean(topic.progress?.pyq_completed);
                  const status = topic.progress?.status || "Not Started";

                  return (
                    <div
                      key={topic.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-blue-gray-100 hover:border-blue-gray-200 bg-white hover:bg-blue-gray-50/30 transition-all gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-gray-700 bg-blue-gray-100/70 px-1.5 py-0.5 rounded">
                            {topic.subject_name || "General"}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium truncate max-w-[200px]">
                            {topic.section_name}
                          </span>
                          {renderStatusBadge(status)}
                        </div>

                        {/* Title */}
                        <Link
                          href={`/syllabus?subject=${topic.subject_id}&topic=${topic.id}`}
                          className="text-xs font-bold text-blue-gray-900 hover:text-gray-600 block truncate"
                          title={topic.name}
                        >
                          {topic.name}
                        </Link>
                      </div>

                      {/* Fast Checkboxes: Study, Revision, PYQ */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleTopicAction(topic.id, "study")}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-all ${
                            isStudied
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-700 border-blue-gray-200 hover:border-blue-gray-300"
                          }`}
                          title="Mark Study Done"
                        >
                          <CheckIcon className={`w-3 h-3 stroke-[2.5] ${isStudied ? "text-white" : "text-gray-400"}`} />
                          <span>Study</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleTopicAction(topic.id, "revision")}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-all ${
                            isRevised
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-700 border-blue-gray-200 hover:border-blue-gray-300"
                          }`}
                          title="Mark Revision Done"
                        >
                          <CheckIcon className={`w-3 h-3 stroke-[2.5] ${isRevised ? "text-white" : "text-gray-400"}`} />
                          <span>Rev</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleTopicAction(topic.id, "pyq")}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-all ${
                            isPyq
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-700 border-blue-gray-200 hover:border-blue-gray-300"
                          }`}
                          title="Mark PYQs Done"
                        >
                          <CheckIcon className={`w-3 h-3 stroke-[2.5] ${isPyq ? "text-white" : "text-gray-400"}`} />
                          <span>PYQ</span>
                        </button>

                        <Link
                          href={`/syllabus?subject=${topic.subject_id}&topic=${topic.id}`}
                          className="p-1 text-gray-400 hover:text-gray-900"
                          title="Open Details"
                        >
                          <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* TODAY'S HABITS CHECKLIST */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-gray-50">
              <div>
                <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                  Today&apos;s Subject Habits
                </Typography>
                <Typography variant="small" className="text-gray-500 text-xs font-normal">
                  Check subjects studied today. Updates immediately.
                </Typography>
              </div>
              <Link href="/habits">
                <Typography
                  variant="small"
                  className="text-xs font-bold text-gray-900 hover:text-gray-700 underline"
                >
                  All Subjects &rarr;
                </Typography>
              </Link>
            </div>

            {loading ? (
              <Typography variant="small" className="text-center py-6 text-gray-400">
                Loading habits...
              </Typography>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {coreSubjects.map((subject) => {
                  const isDone = Boolean(completions[subject.id]);
                  return (
                    <div
                      key={subject.id}
                      onClick={() => handleToggleHabit(subject.id)}
                      role="checkbox"
                      aria-checked={isDone}
                      tabIndex={0}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${
                        isDone
                          ? "bg-gray-900 text-white border-gray-900 shadow-xs"
                          : "bg-white border-blue-gray-200 hover:border-blue-gray-300 hover:bg-blue-gray-50/50 text-blue-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isDone
                              ? "bg-white text-gray-900 border-white"
                              : "border-blue-gray-300 bg-white"
                          }`}
                        >
                          {isDone && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-sm font-semibold ${isDone ? "line-through text-gray-200" : "text-blue-gray-900"}`}>
                          {subject.name}
                        </span>
                      </div>

                      <span className={`text-[11px] ${isDone ? "text-gray-300 font-medium" : "text-gray-400"}`}>
                        {isDone ? "Done" : "Mark done"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* DAILY STUDY STATS */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-gray-50">
              <div>
                <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                  Daily Study Stats
                </Typography>
                <Typography variant="small" className="text-gray-500 text-xs font-normal">
                  Log your study duration, revisions, and practice questions
                </Typography>
              </div>

              {saveStatus === "saved" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-in fade-in">
                  <CheckCircleIcon className="w-4 h-4" />
                  Saved
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                  Could not save. Try again.
                </span>
              )}
            </div>

            <form onSubmit={handleSaveDailyStats}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Study Time */}
                <div className="bg-blue-gray-50/50 p-3 rounded-lg border border-blue-gray-100">
                  <Typography variant="small" color="blue-gray" className="font-bold text-xs mb-2">
                    Study Time
                  </Typography>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-blue-gray-200 rounded px-2.5 py-1.5 flex items-center">
                      <span className="text-xs text-gray-500 mr-1.5 font-medium">Hours:</span>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={hours === 0 ? "" : hours}
                        onChange={(e) => setHours(e.target.value === "" ? 0 : parseInt(e.target.value, 10))}
                        placeholder="0"
                        className="w-full text-xs font-bold text-blue-gray-900 bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="flex-1 bg-white border border-blue-gray-200 rounded px-2.5 py-1.5 flex items-center">
                      <span className="text-xs text-gray-500 mr-1.5 font-medium">Minutes:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={minutes === 0 ? "" : minutes}
                        onChange={(e) => setMinutes(e.target.value === "" ? 0 : parseInt(e.target.value, 10))}
                        placeholder="0"
                        className="w-full text-xs font-bold text-blue-gray-900 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Revision */}
                <div className="bg-blue-gray-50/50 p-3 rounded-lg border border-blue-gray-100">
                  <Typography variant="small" color="blue-gray" className="font-bold text-xs mb-2">
                    Revision
                  </Typography>
                  <div className="bg-white border border-blue-gray-200 rounded px-2.5 py-1.5 flex items-center">
                    <span className="text-xs text-gray-500 mr-2 font-medium">Revisions:</span>
                    <input
                      type="number"
                      min="0"
                      value={revisions === 0 ? "" : revisions}
                      onChange={(e) => setRevisions(e.target.value === "" ? 0 : parseInt(e.target.value, 10))}
                      placeholder="0"
                      className="w-full text-xs font-bold text-blue-gray-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                {/* PYQs Solved */}
                <div className="bg-blue-gray-50/50 p-3 rounded-lg border border-blue-gray-100">
                  <Typography variant="small" color="blue-gray" className="font-bold text-xs mb-2">
                    PYQs Solved
                  </Typography>
                  <div className="bg-white border border-blue-gray-200 rounded px-2.5 py-1.5 flex items-center">
                    <span className="text-xs text-gray-500 mr-2 font-medium">Solved:</span>
                    <input
                      type="number"
                      min="0"
                      value={pyqs === 0 ? "" : pyqs}
                      onChange={(e) => setPyqs(e.target.value === "" ? 0 : parseInt(e.target.value, 10))}
                      placeholder="0"
                      className="w-full text-xs font-bold text-blue-gray-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  color="gray"
                  disabled={savingStats}
                  className="normal-case font-semibold text-xs px-4 py-2 bg-gray-900 hover:bg-gray-800"
                >
                  {savingStats ? "Saving..." : "Save Today's Progress"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* QUICK ACTIONS */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardBody className="p-4">
            <Typography variant="small" color="blue-gray" className="font-bold uppercase tracking-wider text-[11px] mb-3">
              Quick Actions
            </Typography>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Link href="/syllabus" className="w-full">
                <Button
                  variant="outlined"
                  color="blue-gray"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 normal-case text-xs font-semibold py-2.5 border-blue-gray-200 hover:border-gray-900"
                >
                  <BookOpenIcon className="w-4 h-4 text-gray-900" />
                  <span>Syllabus</span>
                </Button>
              </Link>

              <Link href="/notes?new=true" className="w-full">
                <Button
                  variant="outlined"
                  color="blue-gray"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 normal-case text-xs font-semibold py-2.5 border-blue-gray-200 hover:border-gray-900"
                >
                  <PlusIcon className="w-4 h-4 text-gray-900" />
                  <span>Add Note</span>
                </Button>
              </Link>

              <Link href="/files?upload=true" className="w-full">
                <Button
                  variant="outlined"
                  color="blue-gray"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 normal-case text-xs font-semibold py-2.5 border-blue-gray-200 hover:border-gray-900"
                >
                  <ArrowUpTrayIcon className="w-4 h-4 text-gray-900" />
                  <span>Upload File</span>
                </Button>
              </Link>

              <Link href="/calendar" className="w-full">
                <Button
                  variant="outlined"
                  color="blue-gray"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 normal-case text-xs font-semibold py-2.5 border-blue-gray-200 hover:border-gray-900"
                >
                  <CalendarDaysIcon className="w-4 h-4 text-gray-900" />
                  <span>Calendar</span>
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
