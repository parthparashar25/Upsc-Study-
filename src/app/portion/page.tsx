"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Typography,
  Card,
  CardBody,
  Button,
} from "@material-tailwind/react";
import {
  ChartBarSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  BoltIcon,
  DocumentCheckIcon,
  FolderIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  SyllabusCategoryStats,
  fetchSyllabusStatistics,
  fetchTopicProgress,
  updateTopicProgress,
} from "@/lib/api";
import {
  MASTER_SYLLABUS,
  getAllTopics,
  computeTopicStatus,
  MasterSyllabusSubject,
} from "@/lib/syllabus-data";
import {
  TARGET_EXAM_DATE,
  TARGET_EXAM_DISPLAY,
  TARGET_EXAM_NAME,
  PREPARATION_PHASES,
} from "@/lib/constants";
import { ExamCountdownTimer } from "@/components/ExamCountdownTimer";
import { TopicProgress, TopicStatus } from "@/types/database";

export default function PortionPage() {
  const { user } = useAuth();
  const userId = user?.id || "demo-user";

  const [loading, setLoading] = useState(true);
  const [syllabusStats, setSyllabusStats] = useState<{
    overall: SyllabusCategoryStats;
    prelims: SyllabusCategoryStats;
    mains: SyllabusCategoryStats;
    subjectStats: Record<string, SyllabusCategoryStats>;
    totalRevisionsCount?: number;
    totalPyqsCount?: number;
    totalStudySessionsCount?: number;
  } | null>(null);

  const [topicProgressMap, setTopicProgressMap] = useState<Record<string, TopicProgress>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamTab, setSelectedExamTab] = useState<"All" | "Prelims" | "Mains" | "Optional">("All");
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    [MASTER_SYLLABUS[0]?.id || ""]: true,
    [MASTER_SYLLABUS[1]?.id || ""]: true,
  });

  const [updatingTopicId, setUpdatingTopicId] = useState<string | null>(null);

  // Load syllabus statistics and all topic progresses
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, progMap] = await Promise.all([
        fetchSyllabusStatistics(userId),
        fetchTopicProgress(userId),
      ]);
      setSyllabusStats(stats);
      setTopicProgressMap(progMap);
    } catch (err) {
      console.error("Error loading portion data:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle subject accordion
  const toggleSubject = (subjId: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subjId]: !prev[subjId] }));
  };

  // Expand all / collapse all
  const expandAll = () => {
    const all: Record<string, boolean> = {};
    MASTER_SYLLABUS.forEach((s) => (all[s.id] = true));
    setExpandedSubjects(all);
  };

  const collapseAll = () => {
    setExpandedSubjects({});
  };

  // Toggle Study, Revision, Rapid Revision, or PYQ on a topic
  const handleToggleAction = async (
    topicId: string,
    action: "study" | "rev" | "rapid" | "pyq"
  ) => {
    if (!user) return;
    setUpdatingTopicId(topicId);

    const current = topicProgressMap[topicId] || {
      user_id: userId,
      topic_id: topicId,
      study_completed: false,
      revision_completed: false,
      pyq_completed: false,
      status: "Not Started" as TopicStatus,
    };

    let nextStudy = current.study_completed;
    let nextRev = current.revision_completed;
    let nextPyq = current.pyq_completed;

    if (action === "study") {
      nextStudy = !nextStudy;
    } else if (action === "rev") {
      nextRev = !nextRev;
      if (nextRev) nextStudy = true; // revising implies study done
    } else if (action === "rapid") {
      nextRev = true;
      nextStudy = true;
    } else if (action === "pyq") {
      nextPyq = !nextPyq;
    }

    const nextStatus = computeTopicStatus(nextStudy, nextRev, nextPyq);

    // Optimistic UI update
    setTopicProgressMap((prev) => ({
      ...prev,
      [topicId]: {
        ...current,
        study_completed: nextStudy,
        revision_completed: nextRev,
        pyq_completed: nextPyq,
        status: nextStatus,
        last_studied: new Date().toISOString(),
      },
    }));

    await updateTopicProgress(userId, topicId, {
      study_completed: nextStudy,
      revision_completed: nextRev,
      pyq_completed: nextPyq,
      status: nextStatus,
    });

    setUpdatingTopicId(null);

    // Refresh overall stats
    fetchSyllabusStatistics(userId).then(setSyllabusStats);
  };

  // Metrics calculation
  const totalTopics = syllabusStats?.overall?.total || 168;
  const completedTopics = syllabusStats?.overall?.completed || 0;
  const portionCompletedPercent = syllabusStats?.overall?.percent || 0;
  const portionLeftPercent = Math.max(0, 100 - portionCompletedPercent);
  const remainingTopics = Math.max(0, totalTopics - completedTopics);

  const totalRevisions = syllabusStats?.totalRevisionsCount || 0;
  const totalPyqs = syllabusStats?.totalPyqsCount || 0;

  // Filter subjects based on selected tab and search
  const filteredSubjects = useMemo(() => {
    return MASTER_SYLLABUS.filter((subj) => {
      // Tab filter
      if (selectedExamTab === "Prelims" && subj.exam !== "Prelims") return false;
      if (selectedExamTab === "Mains" && (subj.exam !== "Mains" || subj.paper === "Optional")) return false;
      if (selectedExamTab === "Optional" && subj.paper !== "Optional") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubj = subj.name.toLowerCase().includes(q);
        const matchSec = subj.sections.some((sec) => sec.name.toLowerCase().includes(q));
        const matchTop = subj.sections.some((sec) =>
          sec.topics.some((top) => top.name.toLowerCase().includes(q))
        );
        return matchSubj || matchSec || matchTop;
      }

      return true;
    });
  }, [selectedExamTab, searchQuery]);

  return (
    <AppLayout
      title="Portion &amp; Rapid Revision Tracker"
      subtitle={`Target: ${TARGET_EXAM_DISPLAY} • Master portion coverage, revision cycles &amp; PYQs`}
    >
      <div className="space-y-6 max-w-6xl">
        {/* 1. HERO COUNTDOWN TIMER IN DECENT PLEASANT COLORS */}
        <ExamCountdownTimer variant="hero" showDateBadge={true} />

        {/* 2. TOP 4 PORTION KPI METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Portion Completed */}
          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <CardBody className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                <span>Portion Completed</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                  {portionCompletedPercent}%
                </span>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight my-1">
                {completedTopics}{" "}
                <span className="text-xs font-semibold text-gray-400">/ {totalTopics} Topics</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${portionCompletedPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Syllabus chapters thoroughly studied
              </p>
            </CardBody>
          </Card>

          {/* Card 2: Portion Left */}
          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <CardBody className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                <span>Portion Left</span>
                <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                  {portionLeftPercent}%
                </span>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight my-1">
                {remainingTopics}{" "}
                <span className="text-xs font-semibold text-gray-400">Topics Remaining</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${portionLeftPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Chapters pending initial coverage
              </p>
            </CardBody>
          </Card>

          {/* Card 3: Revised Times */}
          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <CardBody className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                <span>Revised Times</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-extrabold text-xs">
                  Target: 3x Cycles
                </span>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight my-1">
                {totalRevisions}{" "}
                <span className="text-xs font-semibold text-gray-400">Revisions Logged</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  1st Rev
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  2nd Rev
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ⚡ Rapid Rev
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Memory retention &amp; quick recall
              </p>
            </CardBody>
          </Card>

          {/* Card 4: PYQs Practice Exam */}
          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <CardBody className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                <span>PYQs Practiced</span>
                <span className="text-purple-600 dark:text-purple-400 font-extrabold text-xs">
                  10-Year Target
                </span>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight my-1">
                {totalPyqs}{" "}
                <span className="text-xs font-semibold text-gray-400">Topics with PYQs</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((totalPyqs / Math.max(1, totalTopics)) * 100))}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Previous year questions solved
              </p>
            </CardBody>
          </Card>
        </div>

        {/* 3. PREPARATION PHASES & RAPID REVISION ROADMAP */}
        <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <CardBody className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Preparation Roadmap to 23 May 2027 (Sunday)
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                Phase-wise milestone strategy
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {PREPARATION_PHASES.map((phase) => (
                <div
                  key={phase.phase}
                  className={`p-3.5 rounded-xl border transition-all ${
                    phase.phase === 1
                      ? "bg-slate-900 text-white dark:bg-slate-800 border-slate-700 shadow-xs"
                      : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        phase.phase === 1
                          ? "bg-emerald-500 text-slate-950 font-black"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {phase.badge}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        phase.phase === 1 ? "text-emerald-400" : "text-gray-400"
                      }`}
                    >
                      {phase.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold leading-tight mt-1 mb-1">
                    {phase.name}
                  </h4>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      phase.phase === 1 ? "text-slate-300" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {phase.target}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* 4. SYLLABUS PORTION DRILLDOWN WITH INTERACTIVE ACTION BUTTONS */}
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Exam Filter Tabs */}
            <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold">
              {(["All", "Prelims", "Mains", "Optional"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedExamTab(tab)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    selectedExamTab === tab
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {tab === "All" ? "All Papers" : tab === "Optional" ? "Optional Subject" : `${tab} Papers`}
                </button>
              ))}
            </div>

            {/* Search + Expand / Collapse */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter subjects, chapters..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400"
                />
              </div>

              <button
                type="button"
                onClick={expandAll}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1"
              >
                Expand All
              </button>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* Subjects List */}
          <div className="space-y-3.5">
            {filteredSubjects.map((subj) => {
              const stat = syllabusStats?.subjectStats[subj.id];
              const subjPercent = stat?.percent || 0;
              const isExpanded = Boolean(expandedSubjects[subj.id]);

              return (
                <Card
                  key={subj.id}
                  className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden"
                >
                  {/* Subject Header */}
                  <div
                    onClick={() => toggleSubject(subj.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center font-bold text-xs shrink-0">
                        {subjPercent}%
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {subj.exam}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                            {subj.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {stat?.completed || 0} of {stat?.total || 0} topics completed •{" "}
                          {Math.max(0, (stat?.total || 0) - (stat?.completed || 0))} portion left
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Accordion Chevron */}
                    <div className="flex items-center gap-4">
                      <div className="w-32 sm:w-44 bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${subjPercent}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Sections & Topics */}
                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-4 bg-gray-50/40 dark:bg-gray-900/40">
                      {subj.sections.map((section) => (
                        <div
                          key={section.id}
                          className="bg-white dark:bg-gray-850 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700/80 space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-200 pb-1.5 border-b border-gray-100 dark:border-gray-800">
                            <span>{section.name}</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              {section.topics.length} topics
                            </span>
                          </div>

                          {/* Topics List with 4 Interactive Action Buttons */}
                          <div className="space-y-1.5">
                            {section.topics.map((topic) => {
                              const prog = topicProgressMap[topic.id];
                              const isStudyDone = Boolean(prog?.study_completed);
                              const isRevDone = Boolean(prog?.revision_completed);
                              const isPyqDone = Boolean(prog?.pyq_completed);
                              const isUpdating = updatingTopicId === topic.id;

                              return (
                                <div
                                  key={topic.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        isStudyDone && isRevDone && isPyqDone
                                          ? "bg-emerald-500"
                                          : isStudyDone
                                          ? "bg-blue-500"
                                          : "bg-gray-300 dark:bg-gray-600"
                                      }`}
                                    />
                                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                                      {topic.name}
                                    </span>
                                  </div>

                                  {/* 4-Button Action Strip */}
                                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                                    {/* 1. Study / Concept */}
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleToggleAction(topic.id, "study")}
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                                        isStudyDone
                                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                          : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                                      }`}
                                      title="Mark portion / study completed"
                                    >
                                      {isStudyDone && <CheckCircleIcon className="w-3 h-3" />}
                                      <span>Portion {isStudyDone ? "Done" : "+"}</span>
                                    </button>

                                    {/* 2. 1st Revision */}
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleToggleAction(topic.id, "rev")}
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                                        isRevDone
                                          ? "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800"
                                          : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                                      }`}
                                      title="Mark 1st revision completed"
                                    >
                                      {isRevDone && <CheckCircleIcon className="w-3 h-3" />}
                                      <span>Rev 1</span>
                                    </button>

                                    {/* 3. Rapid Revision */}
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleToggleAction(topic.id, "rapid")}
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                                        isRevDone && isStudyDone
                                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                          : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                                      }`}
                                      title="Trigger rapid revision"
                                    >
                                      <BoltIcon className="w-3 h-3 text-amber-600" />
                                      <span>Rapid</span>
                                    </button>

                                    {/* 4. PYQ Practice */}
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleToggleAction(topic.id, "pyq")}
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                                        isPyqDone
                                          ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                                          : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                                      }`}
                                      title="Mark PYQs practiced"
                                    >
                                      {isPyqDone && <CheckCircleIcon className="w-3 h-3" />}
                                      <span>PYQ</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
