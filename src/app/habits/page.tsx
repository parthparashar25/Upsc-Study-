"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Typography,
  Card,
  CardBody,
  Button,
} from "@material-tailwind/react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Modal";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  CheckIcon,
  PlusIcon,
  BookOpenIcon,
  ClockIcon,
  TrashIcon,
  SparklesIcon,
  XMarkIcon,
  DocumentTextIcon,
  TagIcon,
  BookmarkSquareIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { DailyTopicLog, DailyStats } from "@/types/database";
import {
  fetchHabitsForDate,
  toggleHabitCompletion,
  fetchDailyStats,
  saveDailyStats,
  fetchDailyTopicLogs,
  logTopicStudySession,
  deleteDailyTopicLog,
} from "@/lib/api";
import { MASTER_SYLLABUS, MasterSyllabusSubject } from "@/lib/syllabus-data";
import { formatDateToIso, formatDisplayDate } from "@/lib/constants";

// Core daily discipline habits for combined Prelims + Mains preparation
const CORE_DAILY_HABITS = [
  {
    id: "habit-newspaper",
    title: "Daily Newspaper & Current Affairs",
    description: "The Hindu / Indian Express editorial analysis & notes",
    icon: "📰",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "habit-answer-writing",
    title: "Mains Answer Writing Practice",
    description: "1-2 daily GS or Optional mains questions with evaluation",
    icon: "✍️",
    color: "from-amber-500 to-amber-600",
  },
  {
    id: "habit-csat",
    title: "CSAT Daily Practice",
    description: "Comprehension, Reasoning, or Numeracy problem sets",
    icon: "🧮",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    id: "habit-revision",
    title: "Daily High-Yield Revision",
    description: "Revising yesterday's notes, static topics, and formulas",
    icon: "🔄",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "habit-mcqs",
    title: "Prelims MCQ Practice",
    description: "15-25 topic-specific or full-length test MCQs",
    icon: "🎯",
    color: "from-emerald-500 to-emerald-600",
  },
];

export default function HabitsPage() {
  const { user } = useAuth();
  const userId = user?.id || "demo-user";

  const todayIso = useMemo(() => formatDateToIso(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  // Daily Habits completions state
  const [habitCompletions, setHabitCompletions] = useState<Record<string, boolean>>({});
  // Granular Topic Logs state
  const [topicLogs, setTopicLogs] = useState<DailyTopicLog[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Log Topic Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubjId, setSelectedSubjId] = useState<string>(MASTER_SYLLABUS[0]?.id || "");
  const [selectedSecId, setSelectedSecId] = useState<string>(MASTER_SYLLABUS[0]?.sections[0]?.id || "");
  const [selectedTopicId, setSelectedTopicId] = useState<string>(MASTER_SYLLABUS[0]?.sections[0]?.topics[0]?.id || "");
  const [customTopicName, setCustomTopicName] = useState("");
  const [studyCompleted, setStudyCompleted] = useState(true);
  const [revisionCompleted, setRevisionCompleted] = useState(false);
  const [pyqCompleted, setPyqCompleted] = useState(false);
  const [studyMinutes, setStudyMinutes] = useState<number>(60);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Available sections for chosen subject
  const currentSubjectObj = useMemo(() => {
    return MASTER_SYLLABUS.find((s) => s.id === selectedSubjId) || MASTER_SYLLABUS[0];
  }, [selectedSubjId]);

  const currentSectionObj = useMemo(() => {
    return (
      currentSubjectObj?.sections.find((sec) => sec.id === selectedSecId) ||
      currentSubjectObj?.sections[0]
    );
  }, [currentSubjectObj, selectedSecId]);

  // Handle subject change in modal
  const handleSubjectChange = (newSubjId: string) => {
    setSelectedSubjId(newSubjId);
    const sub = MASTER_SYLLABUS.find((s) => s.id === newSubjId);
    if (sub && sub.sections.length > 0) {
      setSelectedSecId(sub.sections[0].id);
      if (sub.sections[0].topics.length > 0) {
        setSelectedTopicId(sub.sections[0].topics[0].id);
      }
    }
  };

  // Handle section change in modal
  const handleSectionChange = (newSecId: string) => {
    setSelectedSecId(newSecId);
    const sec = currentSubjectObj?.sections.find((s) => s.id === newSecId);
    if (sec && sec.topics.length > 0) {
      setSelectedTopicId(sec.topics[0].id);
    }
  };

  // Load habits, daily stats, and granular topic logs for selected date
  const loadDayData = useCallback(async () => {
    setLoading(true);
    try {
      const [habitsData, logsData, statsData] = await Promise.all([
        fetchHabitsForDate(userId, selectedDate),
        fetchDailyTopicLogs(userId, selectedDate),
        fetchDailyStats(userId, selectedDate),
      ]);
      setHabitCompletions(habitsData);
      setTopicLogs(logsData);
      setDailyStats(statsData);
    } catch (err) {
      console.error("Error loading day data:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedDate]);

  useEffect(() => {
    loadDayData();
  }, [loadDayData]);

  // Handle core habit toggle
  const handleToggleHabit = async (habitId: string) => {
    const nextVal = !habitCompletions[habitId];
    setHabitCompletions((prev) => ({ ...prev, [habitId]: nextVal }));
    await toggleHabitCompletion(userId, habitId, selectedDate, nextVal);
  };

  // Handle Save Granular Topic Log
  const handleSaveTopicLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubjectObj || !currentSectionObj) return;

    setIsSavingLog(true);
    try {
      const topicObj = currentSectionObj.topics.find((t) => t.id === selectedTopicId);
      const finalTopicName = customTopicName.trim() || topicObj?.name || "Chapter Study Session";
      const finalTopicId = customTopicName.trim()
        ? `custom-topic-${Date.now()}`
        : (topicObj?.id || `topic-${Date.now()}`);

      const newLog = await logTopicStudySession(userId, {
        user_id: userId,
        date: selectedDate,
        subject_id: currentSubjectObj.id,
        subject_name: currentSubjectObj.name,
        section_name: currentSectionObj.name,
        topic_id: finalTopicId,
        topic_name: finalTopicName,
        study_completed: studyCompleted,
        revision_completed: revisionCompleted,
        pyq_completed: pyqCompleted,
        minutes_spent: Number(studyMinutes) || 0,
        notes: sessionNotes.trim() || undefined,
      });

      // Update daily stats hours & minutes
      const existingHours = dailyStats?.study_hours || 0;
      const existingMinutes = dailyStats?.study_minutes || 0;
      const totalMinutes = existingHours * 60 + existingMinutes + (Number(studyMinutes) || 0);
      const updatedHours = Math.floor(totalMinutes / 60);
      const updatedMinutes = totalMinutes % 60;
      const updatedRevisions = (dailyStats?.revision_count || 0) + (revisionCompleted ? 1 : 0);
      const updatedPyqs = (dailyStats?.pyq_count || 0) + (pyqCompleted ? 1 : 0);

      await saveDailyStats(userId, {
        study_date: selectedDate,
        study_hours: updatedHours,
        study_minutes: updatedMinutes,
        revision_count: updatedRevisions,
        pyq_count: updatedPyqs,
      });

      setDailyStats((prev) => ({
        id: prev?.id || `stat-${selectedDate}`,
        user_id: userId,
        study_date: selectedDate,
        study_hours: updatedHours,
        study_minutes: updatedMinutes,
        revision_count: updatedRevisions,
        pyq_count: updatedPyqs,
        created_at: prev?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      setTopicLogs((prev) => [newLog, ...prev]);
      setModalOpen(false);

      // Reset modal fields
      setCustomTopicName("");
      setSessionNotes("");
      setStudyMinutes(60);
      setStudyCompleted(true);
      setRevisionCompleted(false);
      setPyqCompleted(false);
    } catch (err) {
      console.error("Error logging topic study session:", err);
    } finally {
      setIsSavingLog(false);
    }
  };

  // Handle Delete Topic Log
  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to remove this logged study entry?")) return;
    setTopicLogs((prev) => prev.filter((l) => l.id !== logId));
    await deleteDailyTopicLog(userId, logId, selectedDate);
  };

  // Stats calculation
  const completedHabitsCount = CORE_DAILY_HABITS.filter((h) => habitCompletions[h.id]).length;
  const totalLoggedMinutes = topicLogs.reduce((sum, l) => sum + (l.minutes_spent || 0), 0);
  const loggedHoursDisplay = Math.floor(totalLoggedMinutes / 60);
  const loggedMinutesDisplay = totalLoggedMinutes % 60;

  return (
    <AppLayout
      title="Daily Habits & Combined Study Tracker"
      subtitle="Combined Prelims & Mains daily study discipline with granular Subject → Sub-subject → Chapter tracking"
    >
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* 1. Date Navigation & Overview Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-blue-gray-100 dark:border-gray-800 shadow-xs transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 flex items-center justify-center font-bold shadow-xs">
              <CalendarDaysIcon className="w-6 h-6" />
            </div>
            <div>
              <Typography variant="h6" className="font-bold text-gray-900 dark:text-white leading-snug">
                {formatDisplayDate(selectedDate)}
              </Typography>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Integrated Preparation Log
                </span>
                {selectedDate === todayIso && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                    Today
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(todayIso)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedDate === todayIso
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Today
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
        </div>

        {/* 2. Top Progress Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Topics Studied Today
                </Typography>
                <Typography variant="h4" className="font-bold text-gray-900 dark:text-white mt-0.5">
                  {topicLogs.length}
                </Typography>
                <span className="text-[11px] text-gray-400">Chapters / Topics completed</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpenIcon className="w-5 h-5" />
              </div>
            </CardBody>
          </Card>

          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Daily Core Discipline
                </Typography>
                <Typography variant="h4" className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {completedHabitsCount} / {CORE_DAILY_HABITS.length}
                </Typography>
                <span className="text-[11px] text-gray-400">Essential preparation habits</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
            </CardBody>
          </Card>

          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Study Time Logged
                </Typography>
                <Typography variant="h4" className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {dailyStats ? `${dailyStats.study_hours}h ${dailyStats.study_minutes}m` : `${loggedHoursDisplay}h ${loggedMinutesDisplay}m`}
                </Typography>
                <span className="text-[11px] text-gray-400">Active study session duration</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ClockIcon className="w-5 h-5" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 3. Daily Core Discipline Habits */}
        <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-amber-500" />
                <Typography variant="h6" className="font-bold text-gray-900 dark:text-white text-sm">
                  Daily Discipline Habits (Combined Prep Non-Negotiables)
                </Typography>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {completedHabitsCount} of {CORE_DAILY_HABITS.length} done
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {CORE_DAILY_HABITS.map((habit) => {
                const isDone = Boolean(habitCompletions[habit.id]);
                return (
                  <div
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit.id)}
                    role="checkbox"
                    aria-checked={isDone}
                    tabIndex={0}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                      isDone
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                        : "bg-gray-50/70 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg">{habit.icon}</span>
                      <div>
                        <Typography
                          variant="small"
                          className={`font-bold text-xs leading-snug ${
                            isDone
                              ? "text-emerald-900 dark:text-emerald-200 line-through"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {habit.title}
                        </Typography>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                          {habit.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center border transition-colors mt-0.5 ${
                        isDone
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      }`}
                    >
                      {isDone && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* 4. Granular Topics Studied Today */}
        <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
          <CardBody className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <div className="flex items-center gap-2">
                  <BookmarkSquareIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <Typography variant="h6" className="font-bold text-gray-900 dark:text-white text-sm">
                    Topics & Chapters Studied on This Date
                  </Typography>
                </div>
                <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Log the specific chapter, sub-subject, and topics you covered today
                </Typography>
              </div>

              {/* Log Topic Button */}
              <Button
                onClick={() => setModalOpen(true)}
                size="sm"
                className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold py-2.5 px-4 shadow-none hover:shadow-xs"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Log Topic Studied</span>
              </Button>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <div className="w-7 h-7 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Loading study records...</p>
              </div>
            ) : topicLogs.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6">
                <BookOpenIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <Typography variant="h6" className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                  No chapters or topics logged for this date
                </Typography>
                <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Rather than marking an entire subject done, click below to log the exact chapter or topic you studied today.
                </Typography>
                <Button
                  onClick={() => setModalOpen(true)}
                  size="sm"
                  variant="outlined"
                  className="mt-3 text-xs border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                >
                  + Log Topic Studied Today
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {topicLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-gray-300 dark:hover:border-gray-700"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Subject Tag */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                          {log.subject_name}
                        </span>
                        {/* Sub-Subject / Section Tag */}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {log.section_name}
                        </span>
                        {/* Study Time Badge */}
                        {log.minutes_spent > 0 && (
                          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            <span>{Math.floor(log.minutes_spent / 60)}h {log.minutes_spent % 60}m</span>
                          </span>
                        )}
                      </div>

                      {/* Topic Title */}
                      <Typography variant="h6" className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {log.topic_name}
                      </Typography>

                      {/* Notes snippet if present */}
                      {log.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-1">
                          &ldquo;{log.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5">
                        {log.study_completed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Study ✓
                          </span>
                        )}
                        {log.revision_completed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Revision ✓
                          </span>
                        )}
                        {log.pyq_completed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            PYQ ✓
                          </span>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        title="Delete log entry"
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 5. Granular Topic Study Logger Modal */}
        <Dialog
          open={modalOpen}
          handler={() => setModalOpen(false)}
          size="md"
          className="bg-white dark:bg-gray-900 p-6 rounded-2xl"
        >
          <DialogHeader className="p-0 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <Typography variant="h6" className="font-bold dark:text-white text-base">
                Log Topic / Chapter Studied
              </Typography>
              <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Select the exact subject, chapter, and topic you completed on {selectedDate}
              </Typography>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </DialogHeader>

          <form onSubmit={handleSaveTopicLog}>
            <DialogBody className="p-0 py-4 space-y-3.5">
              {/* Step 1: Select Subject */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  1. Select Subject *
                </label>
                <select
                  value={selectedSubjId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white font-medium"
                >
                  {MASTER_SYLLABUS.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Sub-Subject / Section */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  2. Select Sub-Subject / Chapter *
                </label>
                <select
                  value={selectedSecId}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                >
                  {currentSubjectObj?.sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Select Specific Topic or Enter Custom */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  3. Select Topic
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white mb-2"
                >
                  {currentSectionObj?.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={customTopicName}
                  onChange={(e) => setCustomTopicName(e.target.value)}
                  placeholder="Or enter a specific sub-topic / chapter title..."
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                />
              </div>

              {/* Step 4: What did you complete? */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  4. What did you complete for this topic?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-gray-50 dark:bg-gray-800 text-xs">
                    <input
                      type="checkbox"
                      checked={studyCompleted}
                      onChange={(e) => setStudyCompleted(e.target.checked)}
                      className="rounded text-gray-900 focus:ring-0"
                    />
                    <span className="font-semibold text-gray-900 dark:text-white">Study / Read</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-gray-50 dark:bg-gray-800 text-xs">
                    <input
                      type="checkbox"
                      checked={revisionCompleted}
                      onChange={(e) => setRevisionCompleted(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    <span className="font-semibold text-gray-900 dark:text-white">Revision</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-gray-50 dark:bg-gray-800 text-xs">
                    <input
                      type="checkbox"
                      checked={pyqCompleted}
                      onChange={(e) => setPyqCompleted(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span className="font-semibold text-gray-900 dark:text-white">PYQ Practice</span>
                  </label>
                </div>
              </div>

              {/* Step 5: Study Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Study Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    step="5"
                    value={studyMinutes}
                    onChange={(e) => setStudyMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Duration Summary
                  </label>
                  <div className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800/60 rounded-lg text-gray-600 dark:text-gray-300 font-semibold">
                    {Math.floor(studyMinutes / 60)}h {studyMinutes % 60}m
                  </div>
                </div>
              </div>

              {/* Session Notes */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Key Notes / Findings (Optional)
                </label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g. Read Articles 19-22, revised landmark Supreme Court cases on privacy..."
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
                />
              </div>
            </DialogBody>

            <DialogFooter className="p-0 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
              <Button
                variant="text"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingLog}
                size="sm"
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold"
              >
                {isSavingLog ? "Saving..." : "Log Study Session"}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
