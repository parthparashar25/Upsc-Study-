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
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Modal";
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
  ExclamationTriangleIcon,
  AcademicCapIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTopicProgress,
  updateTopicProgress,
} from "@/lib/api";
import {
  computeTopicStatus,
  buildHierarchicalPortionTree,
  PortionHierarchyTree,
  SyllabusProgressNode,
} from "@/lib/syllabus-data";
import {
  TARGET_EXAM_DATE,
  TARGET_EXAM_DISPLAY,
  TARGET_EXAM_NAME,
  PREPARATION_PHASES,
  UPSC_OPTIONAL_CORE_SUBJECTS,
  UPSC_OPTIONAL_LITERATURE_SUBJECTS,
  isValidOptionalSubject,
} from "@/lib/constants";
import { ExamCountdownTimer } from "@/components/ExamCountdownTimer";
import { TopicProgress, TopicStatus } from "@/types/database";

export default function PortionPage() {
  const { user, profile, updateProfile } = useAuth();
  const userId = user?.id || "demo-user";

  const [loading, setLoading] = useState(true);
  const [topicProgressMap, setTopicProgressMap] = useState<Record<string, TopicProgress>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamTab, setSelectedExamTab] = useState<"All" | "Prelims" | "Mains" | "Optional">("All");

  // Expanded nodes map
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    "exam-prelims": true,
    "paper-pre-gs": true,
    "subj-pre-hist": true,
    "exam-mains": true,
    "exam-optional": true,
  });

  const [updatingTopicId, setUpdatingTopicId] = useState<string | null>(null);

  // Optional Subject Modal state
  const [showOptionalModal, setShowOptionalModal] = useState(false);
  const [pendingOptional, setPendingOptional] = useState<string>("");
  const [optionalSaving, setOptionalSaving] = useState(false);

  const activeOptionalSubject = profile?.optional_subject || "";
  const hasOptionalSelected = isValidOptionalSubject(activeOptionalSubject);

  // Load all topic progress records
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const progMap = await fetchTopicProgress(userId);
      setTopicProgressMap(progMap);
    } catch (err) {
      console.error("Error loading topic progress:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dynamically build canonical hierarchy tree derived from leaf topic completion
  const tree: PortionHierarchyTree = useMemo(() => {
    return buildHierarchicalPortionTree(topicProgressMap, hasOptionalSelected ? activeOptionalSubject : null);
  }, [topicProgressMap, hasOptionalSelected, activeOptionalSubject]);

  // Aggregate high-yield revision & PYQ counts
  const { totalRevisions, totalPyqs } = useMemo(() => {
    let revs = 0;
    let pyqs = 0;
    Object.values(topicProgressMap).forEach((p) => {
      if (p.revision_completed) revs++;
      if (p.pyq_completed) pyqs++;
    });
    return { totalRevisions: revs, totalPyqs: pyqs };
  }, [topicProgressMap]);

  // Toggle node expand/collapse
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Expand all nodes recursively
  const expandAll = () => {
    const all: Record<string, boolean> = {};
    const traverse = (n: SyllabusProgressNode) => {
      all[n.id] = true;
      if (n.children) {
        n.children.forEach(traverse);
      }
    };
    traverse(tree.overall);
    setExpandedNodes(all);
  };

  // Collapse all except top exam headers
  const collapseAll = () => {
    setExpandedNodes({
      "exam-prelims": true,
      "exam-mains": true,
      "exam-optional": true,
    });
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

    // Optimistic UI update across tree immediately
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
  };

  // Optional Subject Selection handler
  const handleOpenOptionalModal = () => {
    setPendingOptional(hasOptionalSelected ? activeOptionalSubject : (UPSC_OPTIONAL_CORE_SUBJECTS[0] || "Anthropology"));
    setShowOptionalModal(true);
  };

  const handleSaveOptionalSubject = async () => {
    if (!pendingOptional) return;
    setOptionalSaving(true);
    await updateProfile({
      optional_subject: pendingOptional.trim(),
    });
    setOptionalSaving(false);
    setShowOptionalModal(false);
  };

  // Helper status color badges
  const getStatusBadge = (percent: number, total: number) => {
    if (total === 0) return { label: "Empty", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400" };
    if (percent === 100) return { label: "100% Completed", bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-800 dark:text-emerald-300" };
    if (percent >= 75) return { label: "Strong Progress", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300" };
    if (percent >= 40) return { label: "On Track", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300" };
    if (percent > 0) return { label: "Needs Attention", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300" };
    return { label: "Not Started", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400" };
  };

  const getProgressBarColor = (percent: number) => {
    if (percent >= 75) return "bg-emerald-500";
    if (percent >= 40) return "bg-blue-500";
    if (percent > 0) return "bg-amber-500";
    return "bg-gray-300 dark:bg-gray-700";
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: SyllabusProgressNode, depth = 0): React.ReactNode => {
    // If search query is entered, check if this node or any child matches
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nodeMatches = node.name.toLowerCase().includes(q);
      const childMatches = (n: SyllabusProgressNode): boolean => {
        if (n.name.toLowerCase().includes(q)) return true;
        if (n.children) return n.children.some(childMatches);
        return false;
      };
      if (!nodeMatches && !childMatches(node)) {
        return null;
      }
    }

    const isExpanded = searchQuery.trim() ? true : Boolean(expandedNodes[node.id]);
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const badge = getStatusBadge(node.percent, node.total);
    const barColor = getProgressBarColor(node.percent);

    // Render Leaf Topic Node
    if (node.level === "topic" && node.topicData) {
      const t = node.topicData;
      const isStudyDone = Boolean(t.study_completed);
      const isRevDone = Boolean(t.revision_completed);
      const isPyqDone = Boolean(t.pyq_completed);
      const isUpdating = updatingTopicId === t.id;

      return (
        <div
          key={node.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-750 hover:border-gray-300 dark:hover:border-gray-600 transition-colors ml-2 sm:ml-4"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isStudyDone && isRevDone && isPyqDone
                  ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                  : isStudyDone
                  ? "bg-blue-500"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                {node.name}
              </p>
              {t.description && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                  {t.description}
                </p>
              )}
            </div>
          </div>

          {/* 4-Button Interactive Action Strip */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            {/* 1. Portion Done */}
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleToggleAction(t.id, "study")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                isStudyDone
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-650"
              }`}
              title="Mark syllabus portion / concept completed"
            >
              {isStudyDone && <CheckCircleIcon className="w-3.5 h-3.5" />}
              <span>Portion {isStudyDone ? "Done" : "+"}</span>
            </button>

            {/* 2. Rev 1 */}
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleToggleAction(t.id, "rev")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                isRevDone
                  ? "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 shadow-xs"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-650"
              }`}
              title="Mark 1st revision completed"
            >
              {isRevDone && <CheckCircleIcon className="w-3.5 h-3.5" />}
              <span>Rev 1</span>
            </button>

            {/* 3. Rapid */}
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleToggleAction(t.id, "rapid")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                isRevDone && isStudyDone
                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-xs"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-650"
              }`}
              title="Trigger rapid memory revision sprint"
            >
              <BoltIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Rapid</span>
            </button>

            {/* 4. PYQ */}
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleToggleAction(t.id, "pyq")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                isPyqDone
                  ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shadow-xs"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-650"
              }`}
              title="Mark 10-Year PYQs practiced"
            >
              {isPyqDone && <CheckCircleIcon className="w-3.5 h-3.5" />}
              <span>PYQ</span>
            </button>
          </div>
        </div>
      );
    }

    // Level-specific styling
    let containerClass = "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs";
    let titleClass = "text-sm sm:text-base font-bold text-gray-900 dark:text-white";
    let badgeLabel = "Subject";

    if (node.level === "exam") {
      containerClass = "bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-850 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-xs";
      titleClass = "text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white";
      badgeLabel = "Exam Division";
    } else if (node.level === "paper") {
      containerClass = "bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 rounded-2xl p-4 shadow-xs";
      titleClass = "text-sm sm:text-base font-bold text-gray-900 dark:text-white";
      badgeLabel = "Paper";
    } else if (node.level === "subject") {
      containerClass = "bg-gray-50/50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5";
      titleClass = "text-xs sm:text-sm font-bold text-gray-900 dark:text-white";
      badgeLabel = "Subject";
    } else if (node.level === "subsubject" || node.level === "chapter") {
      containerClass = "bg-white dark:bg-gray-800/70 border border-gray-150 dark:border-gray-700 rounded-xl p-3";
      titleClass = "text-xs font-bold text-gray-800 dark:text-gray-200";
      badgeLabel = node.level === "chapter" ? "Chapter" : "Section";
    }

    return (
      <div key={node.id} className={`${containerClass} space-y-3 transition-all`}>
        {/* Node Header Row */}
        <div
          onClick={() => toggleNode(node.id)}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Percentage Badge */}
            <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex flex-col items-center justify-center font-black text-xs shrink-0 shadow-xs">
              <span>{node.percent}%</span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {badgeLabel}
                </span>
                <h4 className={`${titleClass} truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
                  {node.name}
                </h4>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                <span>
                  <strong className="text-gray-700 dark:text-gray-300 font-semibold">{node.completed}</strong> / {node.total} topics completed
                </span>
                <span>•</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </p>
            </div>
          </div>

          {/* Progress Bar & Expand/Collapse Chevron */}
          <div className="flex items-center gap-4 shrink-0 self-end sm:self-auto">
            {/* Progress Bar Display: ████████████░░░░░░ 62% */}
            <div className="w-36 sm:w-48 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400">
                <span>Coverage</span>
                <span>{node.percent}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`${barColor} h-full rounded-full transition-all duration-300`}
                  style={{ width: `${node.percent}%` }}
                />
              </div>
            </div>

            {hasChildren && (
              <button
                type="button"
                className="p-1 rounded-lg text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Child Nodes Expansion */}
        {hasChildren && isExpanded && (
          <div className="pt-2 pl-1 sm:pl-3 space-y-2.5 border-t border-gray-100 dark:border-gray-800">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout
      title="UPSC Portion &amp; Syllabus Tracker"
      subtitle={`Target: ${TARGET_EXAM_DISPLAY} • Hierarchical subject-wise syllabus completion`}
    >
      <div className="space-y-6 max-w-6xl">
        {/* 1. HERO COUNTDOWN TIMER */}
        <ExamCountdownTimer variant="hero" showDateBadge={true} />

        {/* 2. OVERALL UPSC PORTION COMPLETION HERO CARD */}
        <Card
          style={{
            background: "linear-gradient(135deg, #0b1120 0%, #0f172a 50%, #1e293b 100%)",
            borderColor: "#334155",
            color: "#ffffff",
          }}
          className="border-2 border-slate-700 bg-slate-900 text-white rounded-3xl p-6 shadow-md overflow-hidden relative"
        >
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div
                style={{
                  backgroundColor: "rgba(30, 41, 59, 0.8)",
                  borderColor: "rgba(51, 65, 85, 0.8)",
                  color: "#34d399",
                }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400"
              >
                <SparklesIcon className="w-4 h-4 text-emerald-400" />
                <span>UPSC Civil Services Syllabus Master Metric</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Overall UPSC Portion Completion
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Calculated strictly from the completion status of the lowest meaningful trackable topics across{" "}
                <span className="text-white font-bold underline decoration-slate-600 underline-offset-4">
                  {hasOptionalSelected ? "Prelims + Mains + Optional" : "Prelims + Mains"}
                </span>
                . Parent progress is derived dynamically from children.
              </p>
            </div>

            {/* Right Metric Box */}
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-black tracking-tight text-emerald-400">
                  {tree.overall.percent}%
                </span>
                <span className="text-sm font-bold text-slate-400">
                  Completed
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-300">
                {tree.overall.completed} / {tree.overall.total} Total Syllabus Topics
              </p>
              <div
                style={{ backgroundColor: "#1e293b", borderColor: "#334155" }}
                className="w-full md:w-64 bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700 mt-1"
              >
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ backgroundColor: "#34d399", width: `${tree.overall.percent}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 3. HIGH-LEVEL EXAM DIVISION SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Prelims Summary Card */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs">
            <CardBody className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    PRELIMS
                  </span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    GS-I &amp; CSAT
                  </span>
                </div>
                <span className="text-xl font-black text-gray-900 dark:text-white">
                  {tree.prelims.percent}%
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  <span>Completed Topics</span>
                  <span className="text-gray-900 dark:text-white font-bold">
                    {tree.prelims.completed} / {tree.prelims.total}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${tree.prelims.percent}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[10px] text-gray-400">
                <span>Paper I: {tree.prelims.children?.[0]?.percent || 0}%</span>
                <span>Paper II CSAT: {tree.prelims.children?.[1]?.percent || 0}%</span>
              </div>
            </CardBody>
          </Card>

          {/* Mains Summary Card */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs">
            <CardBody className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    MAINS
                  </span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    Qualifying, Essay &amp; GS I-IV
                  </span>
                </div>
                <span className="text-xl font-black text-gray-900 dark:text-white">
                  {tree.mains.percent}%
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  <span>Completed Topics</span>
                  <span className="text-gray-900 dark:text-white font-bold">
                    {tree.mains.completed} / {tree.mains.total}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${tree.mains.percent}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[10px] text-gray-400">
                <span>Essay: {tree.mains.children?.[1]?.percent || 0}%</span>
                <span>GS I-IV: 4 Papers Active</span>
              </div>
            </CardBody>
          </Card>

          {/* Optional Subject Summary Card */}
          <Card className={`border rounded-2xl shadow-xs transition-all ${
            hasOptionalSelected
              ? "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
              : "border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20"
          }`}>
            <CardBody className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2 py-0.5 rounded border ${
                    hasOptionalSelected
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                  }`}>
                    OPTIONAL
                  </span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                    {hasOptionalSelected ? activeOptionalSubject : "Not Selected"}
                  </span>
                </div>

                {hasOptionalSelected ? (
                  <span className="text-xl font-black text-gray-900 dark:text-white">
                    {tree.optional?.percent || 0}%
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Inactive
                  </span>
                )}
              </div>

              {hasOptionalSelected ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      <span>Completed Topics</span>
                      <span className="text-gray-900 dark:text-white font-bold">
                        {tree.optional?.completed || 0} / {tree.optional?.total || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${tree.optional?.percent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400">
                    <span>Paper I &amp; Paper II</span>
                    <button
                      type="button"
                      onClick={handleOpenOptionalModal}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Change Optional
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    Choose your Mains Optional Subject to track individual percentage and include in Overall UPSC calculation.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleOpenOptionalModal}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white normal-case text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Choose Mains Optional Subject</span>
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* 4. PREPARATION ROADMAP SPRINT */}
        <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
          <CardBody className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Sprint Roadmap to 23 May 2027 (Sunday)
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                {totalRevisions} Revisions • {totalPyqs} PYQs Solved
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {PREPARATION_PHASES.map((phase) => (
                <div
                  key={phase.phase}
                  style={
                    phase.phase === 1
                      ? { backgroundColor: "#0f172a", borderColor: "#334155", color: "#ffffff" }
                      : undefined
                  }
                  className={`p-3.5 rounded-xl border transition-all ${
                    phase.phase === 1
                      ? "bg-slate-900 text-white dark:bg-slate-800 border-slate-700 shadow-xs"
                      : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      style={
                        phase.phase === 1
                          ? { backgroundColor: "#10b981", color: "#020617" }
                          : undefined
                      }
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        phase.phase === 1
                          ? "bg-emerald-500 text-slate-950 font-black"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {phase.badge}
                    </span>
                    <span
                      style={
                        phase.phase === 1 ? { color: "#34d399" } : undefined
                      }
                      className={`text-[10px] font-bold ${
                        phase.phase === 1 ? "text-emerald-400" : "text-gray-400"
                      }`}
                    >
                      {phase.status}
                    </span>
                  </div>

                  <h4
                    style={phase.phase === 1 ? { color: "#ffffff" } : undefined}
                    className="text-xs font-bold leading-tight mt-1 mb-1"
                  >
                    {phase.name}
                  </h4>
                  <p
                    style={phase.phase === 1 ? { color: "#cbd5e1" } : undefined}
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

        {/* 5. HIERARCHICAL DRILL-DOWN ACCORDION */}
        <div className="space-y-4">
          {/* Header Controls, Tabs & Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Exam Division Tabs */}
            <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold self-start">
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
                  {tab === "All"
                    ? "Full UPSC Hierarchy"
                    : tab === "Optional"
                    ? "Optional Subject"
                    : `${tab} Papers`}
                </button>
              ))}
            </div>

            {/* Search Input & Expand / Collapse Buttons */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-72">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter subjects, chapters, topics..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400"
                />
              </div>

              <button
                type="button"
                onClick={expandAll}
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 transition-colors"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 transition-colors"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* Hierarchical Tree Container */}
          <div className="space-y-4">
            {/* PRELIMS SECTION */}
            {(selectedExamTab === "All" || selectedExamTab === "Prelims") && (
              <div className="space-y-3">
                {renderTreeNode(tree.prelims)}
              </div>
            )}

            {/* MAINS SECTION */}
            {(selectedExamTab === "All" || selectedExamTab === "Mains") && (
              <div className="space-y-3">
                {renderTreeNode(tree.mains)}
              </div>
            )}

            {/* OPTIONAL SECTION */}
            {(selectedExamTab === "All" || selectedExamTab === "Optional") && (
              <div className="space-y-3">
                {tree.optional ? (
                  renderTreeNode(tree.optional)
                ) : (
                  <Card className="border-2 border-dashed border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 rounded-2xl p-6 text-center">
                    <AcademicCapIcon className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Optional Subject — Not Selected
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                      Please select your Mains Optional Subject from the 25 core or 23 literature subjects to view its paper-wise syllabus breakdown and include it in your overall portion score.
                    </p>
                    <Button
                      onClick={handleOpenOptionalModal}
                      className="bg-amber-600 hover:bg-amber-700 text-white normal-case text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-1.5"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Choose Mains Optional Subject</span>
                    </Button>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optional Subject Selection / Change Modal */}
      <Dialog
        open={showOptionalModal}
        handler={() => setShowOptionalModal(false)}
        size="sm"
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800"
      >
        <DialogHeader className="p-0 pb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
          <AcademicCapIcon className="w-5 h-5 text-amber-500 shrink-0" />
          <Typography variant="h6" className="font-bold text-sm text-gray-900 dark:text-white">
            {hasOptionalSelected ? "Change Mains Optional Subject" : "Choose Mains Optional Subject"}
          </Typography>
        </DialogHeader>

        <DialogBody className="p-0 py-4 text-xs text-gray-600 dark:text-gray-300 space-y-3.5">
          {hasOptionalSelected && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed flex items-start gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Progress Safety Guarantee:</strong> All past topic records and study hours logged for{" "}
                <strong>{activeOptionalSubject}</strong> will remain safely saved in the database. If you switch back in the future, all progress is restored.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
              Select from Official UPSC Optional Subjects
            </label>
            <select
              value={pendingOptional}
              onChange={(e) => setPendingOptional(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 font-medium bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="">-- Choose an Optional Subject --</option>
              <optgroup label="25 Core UPSC Optional Subjects">
                {UPSC_OPTIONAL_CORE_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
              <optgroup label="23 Literature Optional Subjects">
                {UPSC_OPTIONAL_LITERATURE_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Selecting an optional subject activates Paper I &amp; Paper II in the Portion Tracker and includes it in your Overall UPSC Portion Completion calculation.
          </p>
        </DialogBody>

        <DialogFooter className="p-0 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="text"
            onClick={() => setShowOptionalModal(false)}
            className="normal-case text-xs text-gray-600 dark:text-gray-300"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!pendingOptional || optionalSaving}
            onClick={handleSaveOptionalSubject}
            className="normal-case bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold"
          >
            {optionalSaving ? "Saving..." : hasOptionalSelected ? "Confirm & Switch" : "Select Optional"}
          </Button>
        </DialogFooter>
      </Dialog>
    </AppLayout>
  );
}
