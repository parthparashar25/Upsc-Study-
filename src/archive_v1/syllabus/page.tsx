"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Typography,
  Card,
  CardBody,
  Button,
  Progress,
  Dialog,
  DialogHeader,
  DialogBody,
} from "@material-tailwind/react";
import {
  MagnifyingGlassIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BookOpenIcon,
  BookmarkIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { MASTER_SYLLABUS, getAllTopics, MasterSyllabusSubject } from "@/lib/syllabus-data";
import {
  fetchTopicProgress,
  updateTopicProgress,
  fetchSyllabusStatistics,
} from "@/lib/api";
import { SyllabusTopic, TopicProgress, TopicStatus, ExamCategory, PaperType } from "@/types/database";

function SyllabusContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get("subject") || "all";
  const initialTopicId = searchParams.get("topic") || "";

  const [topicProgressMap, setTopicProgressMap] = useState<Record<string, TopicProgress>>({});
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState<"All" | ExamCategory>("All");
  const [selectedPaper, setSelectedPaper] = useState<"All" | PaperType>("All");
  const [selectedStatus, setSelectedStatus] = useState<"All" | TopicStatus>("All");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubject);

  // Expanded sections state: record of section_id -> boolean
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Topic detail modal state
  const [activeModalTopic, setActiveModalTopic] = useState<SyllabusTopic | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Load progress and stats
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([
      fetchTopicProgress(user.id),
      fetchSyllabusStatistics(user.id),
    ]).then(([progMap, statsData]) => {
      setTopicProgressMap(progMap);
      setStats(statsData);
      setLoading(false);

      // Expand first 2 sections by default
      const initialExpanded: Record<string, boolean> = {};
      MASTER_SYLLABUS.slice(0, 2).forEach((s) => {
        s.sections.forEach((sec) => {
          initialExpanded[sec.id] = true;
        });
      });
      setExpandedSections(initialExpanded);

      if (initialTopicId) {
        const found = getAllTopics().find((t) => t.id === initialTopicId);
        if (found) {
          openTopicModal(found, progMap[found.id]);
        }
      }
    });
  }, [user, initialTopicId]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleToggleCheck = async (
    topicId: string,
    field: "study_completed" | "revision_completed" | "pyq_completed"
  ) => {
    if (!user) return;
    const current = topicProgressMap[topicId] || {
      user_id: user.id,
      topic_id: topicId,
      study_completed: false,
      revision_completed: false,
      pyq_completed: false,
      status: "Not Started",
    };

    const nextVal = !current[field];
    const optimistic: TopicProgress = {
      ...current,
      [field]: nextVal,
    };

    setTopicProgressMap((prev) => ({
      ...prev,
      [topicId]: optimistic,
    }));

    // Update in Supabase / Local
    const updated = await updateTopicProgress(user.id, topicId, {
      [field]: nextVal,
    });

    setTopicProgressMap((prev) => ({
      ...prev,
      [topicId]: updated,
    }));

    // Refresh overall stats in background
    fetchSyllabusStatistics(user.id).then(setStats);
  };

  const handleStatusChange = async (topicId: string, status: TopicStatus) => {
    if (!user) return;
    const updated = await updateTopicProgress(user.id, topicId, { status });
    setTopicProgressMap((prev) => ({
      ...prev,
      [topicId]: updated,
    }));
    fetchSyllabusStatistics(user.id).then(setStats);
  };

  const openTopicModal = (topic: SyllabusTopic, prog?: TopicProgress) => {
    setActiveModalTopic(topic);
    setModalNotes(prog?.notes || topicProgressMap[topic.id]?.notes || "");
  };

  const handleSaveNotes = async () => {
    if (!user || !activeModalTopic) return;
    setSavingNotes(true);
    const updated = await updateTopicProgress(user.id, activeModalTopic.id, {
      notes: modalNotes,
    });
    setTopicProgressMap((prev) => ({
      ...prev,
      [activeModalTopic.id]: updated,
    }));
    setSavingNotes(false);
  };

  // Filtered master syllabus
  const filteredSyllabus = useMemo(() => {
    const all = getAllTopics();
    const query = searchQuery.trim().toLowerCase();

    return MASTER_SYLLABUS.filter((subj) => {
      if (selectedSubjectId !== "all" && subj.id !== selectedSubjectId) return false;
      if (selectedExam !== "All" && subj.exam !== selectedExam) return false;
      if (selectedPaper !== "All" && subj.paper !== selectedPaper) return false;

      // Check if any topic in this subject matches
      const hasMatchingTopics = subj.sections.some((sec) =>
        sec.topics.some((top) => {
          if (query && !top.name.toLowerCase().includes(query) && !sec.name.toLowerCase().includes(query)) {
            return false;
          }
          if (selectedStatus !== "All") {
            const status = topicProgressMap[top.id]?.status || "Not Started";
            if (status !== selectedStatus) return false;
          }
          return true;
        })
      );

      return hasMatchingTopics;
    });
  }, [searchQuery, selectedSubjectId, selectedExam, selectedPaper, selectedStatus, topicProgressMap]);

  // Global search direct results list when searching
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return getAllTopics().filter((t) => {
      const matchesText =
        t.name.toLowerCase().includes(query) ||
        (t.section_name && t.section_name.toLowerCase().includes(query)) ||
        (t.subject_name && t.subject_name.toLowerCase().includes(query));

      if (!matchesText) return false;
      if (selectedExam !== "All" && t.exam !== selectedExam) return false;
      if (selectedPaper !== "All" && t.paper !== selectedPaper) return false;
      if (selectedStatus !== "All") {
        const status = topicProgressMap[t.id]?.status || "Not Started";
        if (status !== selectedStatus) return false;
      }
      return true;
    });
  }, [searchQuery, selectedExam, selectedPaper, selectedStatus, topicProgressMap]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Top Header & Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-gray-100 pb-4">
          <div>
            <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight">
              UPSC Syllabus & Chapter Tracker
            </Typography>
            <Typography variant="small" className="text-gray-500 font-medium mt-0.5">
              Track your preparation at the granular Chapter & Topic level across Prelims and Mains
            </Typography>
          </div>

          {/* Quick Aggregate Indicators */}
          {stats && (
            <div className="flex items-center gap-3">
              <div className="bg-white border border-blue-gray-100 rounded-lg p-2.5 px-3.5 text-center shadow-xs">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Prelims</span>
                <span className="text-xs font-bold text-blue-gray-900">
                  {stats.prelims.completed}/{stats.prelims.total} ({stats.prelims.percent}%)
                </span>
              </div>
              <div className="bg-white border border-blue-gray-100 rounded-lg p-2.5 px-3.5 text-center shadow-xs">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Mains</span>
                <span className="text-xs font-bold text-blue-gray-900">
                  {stats.mains.completed}/{stats.mains.total} ({stats.mains.percent}%)
                </span>
              </div>
              <div className="bg-gray-900 text-white rounded-lg p-2.5 px-3.5 text-center shadow-xs">
                <span className="text-[10px] text-gray-300 font-bold uppercase block">Overall</span>
                <span className="text-xs font-bold text-white">
                  {stats.overall.completed}/{stats.overall.total} ({stats.overall.percent}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Global Syllabus Search Bar */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardBody className="p-4 space-y-3">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-3 text-blue-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any UPSC topic, chapter or keyword (e.g. Fundamental Rights, Inflation, Monsoon, Ethics)..."
                className="w-full pl-11 pr-4 py-2.5 text-xs border border-blue-gray-200 rounded-lg bg-blue-gray-50/40 focus:bg-white focus:outline-none focus:border-gray-900 font-medium transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {/* Exam Filter */}
              <select
                value={selectedExam}
                onChange={(e: any) => setSelectedExam(e.target.value)}
                className="px-2.5 py-1.5 border border-blue-gray-200 rounded-lg bg-white font-medium text-blue-gray-800 focus:outline-none focus:border-gray-900"
              >
                <option value="All">Exam: All</option>
                <option value="Prelims">Prelims</option>
                <option value="Mains">Mains</option>
              </select>

              {/* Paper Filter */}
              <select
                value={selectedPaper}
                onChange={(e: any) => setSelectedPaper(e.target.value)}
                className="px-2.5 py-1.5 border border-blue-gray-200 rounded-lg bg-white font-medium text-blue-gray-800 focus:outline-none focus:border-gray-900"
              >
                <option value="All">Paper: All</option>
                <option value="General">General / CSAT</option>
                <option value="GS1">GS I</option>
                <option value="GS2">GS II</option>
                <option value="GS3">GS III</option>
                <option value="GS4">GS IV</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e: any) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 border border-blue-gray-200 rounded-lg bg-white font-medium text-blue-gray-800 focus:outline-none focus:border-gray-900"
              >
                <option value="All">Status: All</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Revision Due">Revision Due</option>
              </select>

              {/* Subject Filter */}
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-2.5 py-1.5 border border-blue-gray-200 rounded-lg bg-white font-medium text-blue-gray-800 focus:outline-none focus:border-gray-900"
              >
                <option value="all">All Subjects</option>
                {MASTER_SYLLABUS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {(selectedExam !== "All" || selectedPaper !== "All" || selectedStatus !== "All" || selectedSubjectId !== "all" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedExam("All");
                    setSelectedPaper("All");
                    setSelectedStatus("All");
                    setSelectedSubjectId("all");
                    setSearchQuery("");
                  }}
                  className="text-xs text-red-600 hover:underline font-semibold ml-auto"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* SEARCH RESULTS VIEW (When query is active) */}
        {searchQuery.trim() !== "" ? (
          <div className="space-y-3">
            <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
              Search Results ({searchResults.length})
            </Typography>

            {searchResults.length === 0 ? (
              <Card className="border border-blue-gray-100 shadow-sm p-8 text-center">
                <Typography variant="small" className="text-gray-400">
                  No topics match "{searchQuery}". Try different keywords.
                </Typography>
              </Card>
            ) : (
              <div className="space-y-2">
                {searchResults.map((topic) => {
                  const prog = topicProgressMap[topic.id] || {
                    study_completed: false,
                    revision_completed: false,
                    pyq_completed: false,
                    status: "Not Started",
                  };

                  return (
                    <Card key={topic.id} className="border border-blue-gray-100 shadow-xs hover:border-gray-900 transition-colors">
                      <CardBody className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-blue-gray-50 px-2 py-0.5 rounded">
                              {topic.exam} &bull; {topic.paper}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              {topic.subject_name} &rarr; {topic.section_name}
                            </span>
                          </div>
                          <Typography
                            variant="h6"
                            color="blue-gray"
                            onClick={() => openTopicModal(topic, prog)}
                            className="font-bold text-sm mt-1 cursor-pointer hover:underline"
                          >
                            {topic.name}
                          </Typography>
                        </div>

                        {/* Fast Checkboxes */}
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-blue-gray-700 select-none">
                            <input
                              type="checkbox"
                              checked={prog.study_completed}
                              onChange={() => handleToggleCheck(topic.id, "study_completed")}
                              className="rounded border-blue-gray-300 text-gray-900 focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                            <span>Study</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-blue-gray-700 select-none">
                            <input
                              type="checkbox"
                              checked={prog.revision_completed}
                              onChange={() => handleToggleCheck(topic.id, "revision_completed")}
                              className="rounded border-blue-gray-300 text-gray-900 focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                            <span>Revision</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-blue-gray-700 select-none">
                            <input
                              type="checkbox"
                              checked={prog.pyq_completed}
                              onChange={() => handleToggleCheck(topic.id, "pyq_completed")}
                              className="rounded border-blue-gray-300 text-gray-900 focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                            <span>PYQ</span>
                          </label>

                          <Button
                            variant="text"
                            size="sm"
                            color="blue-gray"
                            onClick={() => openTopicModal(topic, prog)}
                            className="normal-case text-[11px] font-semibold py-1 px-2 hover:bg-blue-gray-50"
                          >
                            Details &rarr;
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* REGULAR HIERARCHICAL VIEW (Subject -> Section -> Topic) */
          <div className="space-y-6">
            {filteredSyllabus.map((subj) => {
              const subjStat = stats?.subjectStats?.[subj.id] || {
                total: 0,
                completed: 0,
                inProgress: 0,
                notStarted: 0,
                percent: 0,
              };

              return (
                <Card key={subj.id} className="border border-blue-gray-100 shadow-sm overflow-hidden">
                  {/* Subject Header Banner */}
                  <div className="bg-blue-gray-50/70 p-5 border-b border-blue-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-900 text-white">
                            {subj.exam}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            {subj.paper}
                          </span>
                        </div>
                        <Typography variant="h5" color="blue-gray" className="font-bold text-base">
                          {subj.name}
                        </Typography>
                      </div>

                      {/* Subject Progress overview */}
                      <div className="sm:w-64">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-blue-gray-800">
                            {subjStat.completed} / {subjStat.total} topics
                          </span>
                          <span className="font-bold text-blue-gray-900">
                            {subjStat.percent}%
                          </span>
                        </div>
                        <div className="w-full bg-blue-gray-200/60 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gray-900 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, subjStat.percent)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1 font-medium">
                          <span>{subjStat.completed} Completed</span>
                          <span>{subjStat.inProgress} In Progress</span>
                          <span>{subjStat.notStarted} Not Started</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sections List */}
                  <CardBody className="p-4 space-y-3">
                    {subj.sections.map((sec) => {
                      const isExpanded = Boolean(expandedSections[sec.id]);

                      // Section topic counts
                      const secTopics = sec.topics;
                      const secDone = secTopics.filter((t) => topicProgressMap[t.id]?.study_completed).length;

                      return (
                        <div key={sec.id} className="border border-blue-gray-100 rounded-lg overflow-hidden bg-white">
                          {/* Section Header Accordion Trigger */}
                          <div
                            onClick={() => toggleSection(sec.id)}
                            className="flex items-center justify-between p-3.5 bg-blue-gray-50/30 hover:bg-blue-gray-50/70 transition-colors cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 text-gray-700" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                              )}
                              <Typography variant="h6" color="blue-gray" className="font-bold text-xs">
                                {sec.name}
                              </Typography>
                            </div>

                            <span className="text-[11px] font-semibold text-gray-500 bg-white border border-blue-gray-100 px-2 py-0.5 rounded">
                              {secDone} / {secTopics.length} done
                            </span>
                          </div>

                          {/* Topics List when expanded */}
                          {isExpanded && (
                            <div className="divide-y divide-blue-gray-50 p-2">
                              {secTopics.map((top) => {
                                const prog = topicProgressMap[top.id] || {
                                  study_completed: false,
                                  revision_completed: false,
                                  pyq_completed: false,
                                  status: "Not Started",
                                };

                                const statusColor =
                                  prog.status === "Completed"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : prog.status === "In Progress"
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : prog.status === "Revision Due"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200";

                                return (
                                  <div
                                    key={top.id}
                                    className="py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-blue-gray-50/40 rounded-md transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-2 h-2 rounded-full ${
                                          prog.study_completed ? "bg-gray-900" : "bg-blue-gray-300"
                                        }`}
                                      />
                                      <Typography
                                        variant="small"
                                        color="blue-gray"
                                        onClick={() =>
                                          openTopicModal(
                                            {
                                              ...top,
                                              section_id: sec.id,
                                              section_name: sec.name,
                                              subject_id: subj.id,
                                              subject_name: subj.name,
                                              exam: subj.exam,
                                              paper: subj.paper,
                                              active: true,
                                            },
                                            prog
                                          )
                                        }
                                        className={`font-semibold text-xs cursor-pointer hover:underline ${
                                          prog.study_completed ? "text-blue-gray-900" : "text-blue-gray-700"
                                        }`}
                                      >
                                        {top.name}
                                      </Typography>
                                    </div>

                                    {/* Fast Controls: Study, Revision, PYQ, Status */}
                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColor}`}
                                      >
                                        {prog.status}
                                      </span>

                                      {/* Study Checkbox */}
                                      <label className="flex items-center gap-1 cursor-pointer text-xs font-semibold text-blue-gray-700 select-none">
                                        <input
                                          type="checkbox"
                                          checked={prog.study_completed}
                                          onChange={() => handleToggleCheck(top.id, "study_completed")}
                                          className="rounded border-blue-gray-300 text-gray-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                                        />
                                        <span className="text-[11px]">Study</span>
                                      </label>

                                      {/* Revision Checkbox */}
                                      <label className="flex items-center gap-1 cursor-pointer text-xs font-semibold text-blue-gray-700 select-none">
                                        <input
                                          type="checkbox"
                                          checked={prog.revision_completed}
                                          onChange={() => handleToggleCheck(top.id, "revision_completed")}
                                          className="rounded border-blue-gray-300 text-gray-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                                        />
                                        <span className="text-[11px]">Rev</span>
                                      </label>

                                      {/* PYQ Checkbox */}
                                      <label className="flex items-center gap-1 cursor-pointer text-xs font-semibold text-blue-gray-700 select-none">
                                        <input
                                          type="checkbox"
                                          checked={prog.pyq_completed}
                                          onChange={() => handleToggleCheck(top.id, "pyq_completed")}
                                          className="rounded border-blue-gray-300 text-gray-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                                        />
                                        <span className="text-[11px]">PYQ</span>
                                      </label>

                                      <button
                                        onClick={() =>
                                          openTopicModal(
                                            {
                                              ...top,
                                              section_id: sec.id,
                                              section_name: sec.name,
                                              subject_id: subj.id,
                                              subject_name: subj.name,
                                              exam: subj.exam,
                                              paper: subj.paper,
                                              active: true,
                                            },
                                            prog
                                          )
                                        }
                                        title="Open Notes & Details"
                                        className="p-1 text-gray-400 hover:text-gray-900 rounded"
                                      >
                                        <DocumentTextIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* TOPIC DETAIL MODAL */}
        {activeModalTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
            <Card className="max-w-lg w-full border border-blue-gray-100 shadow-xl bg-white animate-in fade-in">
              <CardBody className="p-6 space-y-4">
                <div className="flex items-start justify-between border-b border-blue-gray-50 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {activeModalTopic.subject_name} &rarr; {activeModalTopic.section_name}
                    </span>
                    <Typography variant="h5" color="blue-gray" className="font-bold text-base mt-0.5">
                      {activeModalTopic.name}
                    </Typography>
                  </div>
                  <button
                    onClick={() => setActiveModalTopic(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Status Controls */}
                <div className="bg-blue-gray-50/50 p-3.5 rounded-lg border border-blue-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-gray-700">Topic Status:</span>
                    <select
                      value={topicProgressMap[activeModalTopic.id]?.status || "Not Started"}
                      onChange={(e: any) => handleStatusChange(activeModalTopic.id, e.target.value)}
                      className="text-xs font-bold px-2 py-1 border border-blue-gray-200 rounded-md bg-white text-blue-gray-800"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Revision Due">Revision Due</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-around pt-2 border-t border-blue-gray-100 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-blue-gray-800">
                      <input
                        type="checkbox"
                        checked={Boolean(topicProgressMap[activeModalTopic.id]?.study_completed)}
                        onChange={() => handleToggleCheck(activeModalTopic.id, "study_completed")}
                        className="rounded border-blue-gray-300 text-gray-900 w-4 h-4"
                      />
                      <span>Study Done</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-blue-gray-800">
                      <input
                        type="checkbox"
                        checked={Boolean(topicProgressMap[activeModalTopic.id]?.revision_completed)}
                        onChange={() => handleToggleCheck(activeModalTopic.id, "revision_completed")}
                        className="rounded border-blue-gray-300 text-gray-900 w-4 h-4"
                      />
                      <span>Revision Done</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-blue-gray-800">
                      <input
                        type="checkbox"
                        checked={Boolean(topicProgressMap[activeModalTopic.id]?.pyq_completed)}
                        onChange={() => handleToggleCheck(activeModalTopic.id, "pyq_completed")}
                        className="rounded border-blue-gray-300 text-gray-900 w-4 h-4"
                      />
                      <span>PYQs Solved</span>
                    </label>
                  </div>
                </div>

                {/* Personal Notes for this Chapter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-blue-gray-700">
                      Personal Chapter Notes
                    </label>
                    <span className="text-[11px] text-gray-400">Optional key points</span>
                  </div>
                  <textarea
                    rows={5}
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="Jot down key articles, case laws, data points or revision keywords for this topic..."
                    className="w-full p-2.5 text-xs font-mono border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900 resize-y"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-gray-50">
                  <Button
                    type="button"
                    variant="text"
                    size="sm"
                    color="blue-gray"
                    onClick={() => setActiveModalTopic(null)}
                    className="normal-case text-xs font-semibold py-1.5 px-3"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    color="gray"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="normal-case text-xs font-semibold py-1.5 px-4 bg-gray-900 hover:bg-gray-800"
                  >
                    {savingNotes ? "Saving..." : "Save Chapter Notes"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function SyllabusPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading syllabus...</div>}>
      <SyllabusContent />
    </Suspense>
  );
}
