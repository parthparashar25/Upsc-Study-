"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BookOpenIcon,
  XMarkIcon,
  FolderIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon,
  LinkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { MASTER_SYLLABUS, MasterSyllabusSubject, getAllTopics } from "@/lib/syllabus-data";
import { ExamCategory, PaperType, StudyFile, SyllabusTopic } from "@/types/database";
import {
  fetchStudyFiles,
  linkFileToTopic,
  getFileDownloadUrl,
} from "@/lib/api";
import { formatFileSize, ALLOWED_EXTENSIONS } from "@/lib/constants";

export default function SyllabusPage() {
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<ExamCategory>("Prelims");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Accordion state
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Study files state
  const [studyFiles, setStudyFiles] = useState<StudyFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Active topic detail modal state
  const [activeTopic, setActiveTopic] = useState<SyllabusTopic | null>(null);
  const [isLibraryPickerOpen, setIsLibraryPickerOpen] = useState(false);
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<"all" | "unlinked">("all");
  const [linkingActionLoadingId, setLinkingActionLoadingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Load user's study files
  useEffect(() => {
    if (!user) return;
    setLoadingFiles(true);
    fetchStudyFiles(user.id).then((files) => {
      setStudyFiles(files);
      setLoadingFiles(false);
    });
  }, [user]);

  // Filter subjects by selected Exam
  const examSubjects = useMemo(() => {
    return MASTER_SYLLABUS.filter((s) => s.exam === selectedExam);
  }, [selectedExam]);

  // Set first subject expanded when exam changes
  useEffect(() => {
    if (examSubjects.length > 0) {
      const firstSubj = examSubjects[0];
      setExpandedSubjects({ [firstSubj.id]: true });
      if (firstSubj.sections.length > 0) {
        setExpandedSections({ [firstSubj.sections[0].id]: true });
      }
    }
  }, [selectedExam, examSubjects]);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Search results logic
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const allTopics = getAllTopics();
    const results: SyllabusTopic[] = [];

    allTopics.forEach((t) => {
      const matchTopic = t.name.toLowerCase().includes(q);
      const matchSection = (t.section_name || "").toLowerCase().includes(q);
      const matchSubject = (t.subject_name || "").toLowerCase().includes(q);

      if (matchTopic || matchSection || matchSubject) {
        results.push(t);
      }
    });

    return results;
  }, [searchQuery]);

  // Stats calculation
  const totalPrelimsTopics = useMemo(() => {
    return MASTER_SYLLABUS.filter((s) => s.exam === "Prelims").reduce(
      (sum, s) => sum + s.sections.reduce((secSum, sec) => secSum + sec.topics.length, 0),
      0
    );
  }, []);

  const totalMainsTopics = useMemo(() => {
    return MASTER_SYLLABUS.filter((s) => s.exam === "Mains").reduce(
      (sum, s) => sum + s.sections.reduce((secSum, sec) => secSum + sec.topics.length, 0),
      0
    );
  }, []);

  // Files mapped by topicId for quick lookup
  const filesByTopic = useMemo(() => {
    const map: Record<string, StudyFile[]> = {};
    studyFiles.forEach((file) => {
      if (file.topic_id) {
        if (!map[file.topic_id]) map[file.topic_id] = [];
        map[file.topic_id].push(file);
      }
    });
    return map;
  }, [studyFiles]);

  // Files connected to the currently active modal topic
  const activeTopicFiles = useMemo(() => {
    if (!activeTopic) return [];
    return studyFiles.filter((f) => f.topic_id === activeTopic.id);
  }, [activeTopic, studyFiles]);

  // Filtered library files for the library picker modal
  const filteredLibraryFiles = useMemo(() => {
    if (!activeTopic) return [];
    return studyFiles.filter((file) => {
      // Don't show files already linked to THIS topic in the available pool
      if (file.topic_id === activeTopic.id) return false;

      // Filter by unlinked only if selected
      if (libraryFilter === "unlinked" && (file.topic_id || file.section_id)) {
        return false;
      }

      // Search query filter
      if (librarySearchQuery) {
        const q = librarySearchQuery.toLowerCase();
        const matchName = file.filename.toLowerCase().includes(q);
        const matchSubj = (file.subject_name || "").toLowerCase().includes(q);
        const matchSec = (file.section_name || "").toLowerCase().includes(q);
        const matchTop = (file.topic_name || "").toLowerCase().includes(q);
        if (!matchName && !matchSubj && !matchSec && !matchTop) return false;
      }

      return true;
    });
  }, [studyFiles, activeTopic, libraryFilter, librarySearchQuery]);

  const openTopicDetail = (topic: SyllabusTopic) => {
    setActiveTopic(topic);
    setIsLibraryPickerOpen(false);
    setLibrarySearchQuery("");
    setLibraryFilter("all");
    setActionSuccess("");
    setActionError("");
  };

  const handleOpenPdf = async (file: StudyFile) => {
    if (file.download_url) {
      window.open(file.download_url, "_blank");
      return;
    }
    const signedUrl = await getFileDownloadUrl(file.storage_path);
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    } else {
      alert("Could not generate secure file URL.");
    }
  };

  // Attach a library file directly to this topic
  const handleAttachFromLibrary = async (file: StudyFile) => {
    if (!user || !activeTopic) return;

    setLinkingActionLoadingId(file.id);
    setActionError("");
    setActionSuccess("");

    const res = await linkFileToTopic(
      user.id,
      file.id,
      activeTopic.subject_id || null,
      activeTopic.subject_name || "",
      activeTopic.section_id || null,
      activeTopic.section_name || "",
      activeTopic.id,
      activeTopic.name
    );

    setLinkingActionLoadingId(null);
    if (res.success && res.file) {
      setStudyFiles((prev) =>
        prev.map((f) => (f.id === res.file!.id ? { ...f, ...res.file! } : f))
      );
      setActionSuccess(`Attached "${file.filename}" to this topic!`);
      setTimeout(() => setActionSuccess(""), 3000);
    } else {
      setActionError(res.error || "Failed to attach file.");
    }
  };

  const handleUnlinkFile = async (file: StudyFile) => {
    if (!user) return;
    setLinkingActionLoadingId(file.id);
    const res = await linkFileToTopic(
      user.id,
      file.id,
      file.subject_id,
      file.subject_name,
      file.section_id,
      file.section_name,
      null,
      ""
    );
    setLinkingActionLoadingId(null);

    if (res.success && res.file) {
      setStudyFiles((prev) =>
        prev.map((f) => (f.id === res.file!.id ? { ...f, topic_id: null, topic_name: "" } : f))
      );
      setActionSuccess(`Removed "${file.filename}" from this topic.`);
      setTimeout(() => setActionSuccess(""), 2500);
    }
  };

  return (
    <AppLayout
      title="UPSC Master Syllabus"
      subtitle="Complete chapter and topic-level syllabus architecture for Prelims & Mains • Directly attach your library files"
    >
      <div className="space-y-6 max-w-5xl">
        {/* TOP CONTROLS: EXAM SELECTOR + SEARCH */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Exam Segmented Control */}
          <div className="inline-flex bg-blue-gray-100/70 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setSelectedExam("Prelims");
                setSearchQuery("");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedExam === "Prelims" && !searchQuery
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-xs"
                  : "text-blue-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              UPSC Prelims ({totalPrelimsTopics} Topics)
            </button>
            <button
              onClick={() => {
                setSelectedExam("Mains");
                setSearchQuery("");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedExam === "Mains" && !searchQuery
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-xs"
                  : "text-blue-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              UPSC Mains ({totalMainsTopics} Topics)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <MagnifyingGlassIcon className="w-4 h-4 text-blue-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search syllabus..."
              className="w-full bg-white dark:bg-gray-900 border border-blue-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-blue-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SEARCH RESULTS VIEW */}
        {searchQuery.trim() !== "" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-gray-100 dark:border-gray-800">
              <Typography variant="small" color="blue-gray" className="font-bold text-xs dark:text-gray-200">
                Search Results for &ldquo;{searchQuery}&rdquo;
              </Typography>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                {searchResults.length} topic{searchResults.length === 1 ? "" : "s"} found
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-gray-900 border border-blue-gray-100 dark:border-gray-800 rounded-xl text-xs text-gray-400 dark:text-gray-500">
                No syllabus topics matching &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {searchResults.map((topic) => {
                  const linkedPdfs = filesByTopic[topic.id] || [];

                  return (
                    <div
                      key={topic.id}
                      onClick={() => openTopicDetail(topic)}
                      className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-blue-gray-100 dark:border-gray-800 hover:border-gray-900 dark:hover:border-gray-500 cursor-pointer transition-all shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">
                          <span className="px-1.5 py-0.5 rounded bg-blue-gray-50 dark:bg-gray-800 text-blue-gray-700 dark:text-gray-300">
                            {topic.exam}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate">{topic.subject_name}</span>
                        </div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-bold text-xs truncate dark:text-gray-100"
                        >
                          {topic.name}
                        </Typography>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate block">
                          Chapter: {topic.section_name}
                        </span>
                      </div>

                      {linkedPdfs.length > 0 && (
                        <span className="shrink-0 text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded-full">
                          📕 {linkedPdfs.length} PDF{linkedPdfs.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* HIERARCHICAL ACCORDION VIEW: Subject -> Section -> Topic */
          <div className="space-y-4">
            {examSubjects.map((subject) => {
              const isSubjOpen = Boolean(expandedSubjects[subject.id]);
              const subjectTotalTopics = subject.sections.reduce(
                (sum, sec) => sum + sec.topics.length,
                0
              );

              return (
                <Card
                  key={subject.id}
                  className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden"
                >
                  {/* Subject Header */}
                  <div
                    onClick={() => toggleSubject(subject.id)}
                    className="p-4 bg-white dark:bg-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                        <BookOpenIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Typography variant="h6" color="blue-gray" className="font-bold text-sm dark:text-gray-100">
                            {subject.name}
                          </Typography>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-gray-50 dark:bg-gray-800 text-blue-gray-700 dark:text-gray-300 border border-blue-gray-200 dark:border-gray-700">
                            {subject.paper}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {subject.sections.length} Chapters &bull; {subjectTotalTopics} Topics
                        </p>
                      </div>
                    </div>

                    <div className="text-gray-400 dark:text-gray-500 p-1">
                      {isSubjOpen ? (
                        <ChevronDownIcon className="w-5 h-5" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Subject Sections (Chapters) */}
                  {isSubjOpen && (
                    <div className="border-t border-blue-gray-100 dark:border-gray-800 divide-y divide-blue-gray-50 dark:divide-gray-800 bg-blue-gray-50/20 dark:bg-gray-900/50">
                      {subject.sections.map((section) => {
                        const isSecOpen = Boolean(expandedSections[section.id]);

                        return (
                          <div key={section.id} className="transition-colors">
                            {/* Section Header */}
                            <div
                              onClick={() => toggleSection(section.id)}
                              className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-blue-gray-50/60 dark:hover:bg-gray-800/60"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FolderIcon className="w-4 h-4 text-blue-gray-400 dark:text-gray-500 shrink-0" />
                                <span className="text-xs font-bold text-blue-gray-800 dark:text-gray-200 truncate">
                                  {section.name}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                  ({section.topics.length})
                                </span>
                              </div>

                              <div className="text-gray-400 dark:text-gray-500">
                                {isSecOpen ? (
                                  <ChevronDownIcon className="w-4 h-4" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4" />
                                )}
                              </div>
                            </div>

                            {/* Topics List */}
                            {isSecOpen && (
                              <div className="border-t border-blue-gray-50 dark:border-gray-800 px-3.5 py-2.5 bg-gray-50/40 dark:bg-gray-900/80">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {section.topics.map((topic, idx) => {
                                    const linkedPdfs = filesByTopic[topic.id] || [];

                                    return (
                                      <div
                                        key={topic.id}
                                        onClick={() =>
                                          openTopicDetail({
                                            ...topic,
                                            section_id: section.id,
                                            section_name: section.name,
                                            subject_id: subject.id,
                                            subject_name: subject.name,
                                            exam: subject.exam,
                                            paper: subject.paper,
                                            active: true,
                                            display_order: topic.display_order,
                                          })
                                        }
                                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-white dark:bg-gray-850 border border-blue-gray-100/80 dark:border-gray-800 hover:border-gray-900 dark:hover:border-gray-500 text-xs text-blue-gray-800 dark:text-gray-200 cursor-pointer transition-all"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="w-5 h-5 rounded-full bg-blue-gray-50 dark:bg-gray-800 text-blue-gray-600 dark:text-gray-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                                            {idx + 1}
                                          </span>
                                          <span className="font-semibold truncate" title={topic.name}>
                                            {topic.name}
                                          </span>
                                        </div>

                                        {linkedPdfs.length > 0 && (
                                          <span
                                            className="shrink-0 text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-1.5 py-0.5 rounded-full"
                                            title={`${linkedPdfs.length} study PDF(s) attached`}
                                          >
                                            📕 {linkedPdfs.length}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* TOPIC DETAIL & STUDY MATERIAL MODAL */}
        <Dialog
          open={Boolean(activeTopic)}
          handler={() => setActiveTopic(null)}
          size="md"
          className="dark:bg-gray-900 border dark:border-gray-800"
        >
          {activeTopic && (
            <div className="max-h-[85vh] flex flex-col">
              {/* Header */}
              <DialogHeader className="text-sm font-bold text-blue-gray-900 dark:text-gray-100 border-b border-blue-gray-100 dark:border-gray-800 pb-3 flex flex-col items-start gap-1">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-gray-100 dark:bg-gray-800 text-blue-gray-800 dark:text-gray-200">
                      {activeTopic.exam}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                      {activeTopic.subject_name} &rarr; {activeTopic.section_name}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTopic(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <Typography variant="h5" color="blue-gray" className="font-bold text-base dark:text-gray-100">
                  {activeTopic.name}
                </Typography>
              </DialogHeader>

              {/* Body */}
              <DialogBody className="space-y-4 py-4 overflow-y-auto flex-1">
                {/* Feedback */}
                {actionSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
                    <CheckCircleIcon className="w-4 h-4 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {actionError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs font-medium text-red-700 dark:text-red-400">
                    {actionError}
                  </div>
                )}

                {/* STUDY MATERIAL SECTION */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <DocumentTextIcon className="w-4 h-4 text-gray-900 dark:text-white" />
                      <Typography variant="h6" color="blue-gray" className="font-bold text-xs uppercase tracking-wider dark:text-gray-200">
                        Attached Study Material ({activeTopicFiles.length})
                      </Typography>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setIsLibraryPickerOpen(!isLibraryPickerOpen)}
                      className="text-[11px] font-semibold normal-case px-3 py-1.5 bg-gray-900 dark:bg-white dark:text-gray-950 hover:bg-gray-800 shadow-xs flex items-center gap-1.5"
                    >
                      <FolderOpenIcon className="w-3.5 h-3.5" />
                      <span>{isLibraryPickerOpen ? "Hide Library" : "+ Add from Library"}</span>
                    </Button>
                  </div>

                  {/* CONNECTED FILES LIST */}
                  {activeTopicFiles.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border border-dashed border-blue-gray-200 dark:border-gray-700 bg-blue-gray-50/30 dark:bg-gray-800/30">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        No study material linked to this chapter topic yet.
                      </p>
                      {!isLibraryPickerOpen && (
                        <Button
                          size="sm"
                          onClick={() => setIsLibraryPickerOpen(true)}
                          className="bg-gray-900 dark:bg-white dark:text-gray-950 hover:bg-gray-800 normal-case font-semibold text-xs px-3.5 py-1.5"
                        >
                          + Pick PDF from Library
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeTopicFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 hover:border-blue-gray-200 dark:hover:border-gray-700 shadow-xs gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl">📕</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-blue-gray-900 dark:text-gray-100 truncate" title={file.filename}>
                                {file.filename}
                              </p>
                              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                {formatFileSize(file.file_size)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenPdf(file)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white dark:text-gray-950 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-colors"
                            >
                              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              <span>Open</span>
                            </button>

                            <button
                              type="button"
                              disabled={linkingActionLoadingId === file.id}
                              onClick={() => handleUnlinkFile(file)}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Unlink from this topic"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* DIRECT LIBRARY PICKER PANEL */}
                  {isLibraryPickerOpen && (
                    <div className="mt-4 p-4 rounded-xl border border-blue-gray-200 dark:border-gray-700 bg-blue-gray-50/50 dark:bg-gray-850 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-blue-gray-100 dark:border-gray-700 pb-2">
                        <div className="flex items-center gap-2">
                          <FolderOpenIcon className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                          <span className="text-xs font-bold text-blue-gray-900 dark:text-gray-100">
                            Pick from Your Uploaded Library
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Filter unlinked only */}
                          <button
                            type="button"
                            onClick={() =>
                              setLibraryFilter(libraryFilter === "all" ? "unlinked" : "all")
                            }
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                              libraryFilter === "unlinked"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300"
                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {libraryFilter === "unlinked" ? "Showing Unassigned" : "Show All"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsLibraryPickerOpen(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Search box for library */}
                      <div className="relative">
                        <MagnifyingGlassIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={librarySearchQuery}
                          onChange={(e) => setLibrarySearchQuery(e.target.value)}
                          placeholder="Search your library PDFs..."
                          className="w-full bg-white dark:bg-gray-900 border border-blue-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-gray-900"
                        />
                      </div>

                      {/* Library Items List */}
                      {filteredLibraryFiles.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                          {librarySearchQuery
                            ? "No library files match your search."
                            : "No other files available in your library. Upload new files in the Study Library section."}
                        </div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                          {filteredLibraryFiles.map((file) => {
                            const isCurrentlyProcessing = linkingActionLoadingId === file.id;

                            return (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-blue-gray-100 dark:border-gray-700 gap-2 hover:border-gray-400 transition-colors"
                              >
                                <div className="min-w-0 flex items-center gap-2">
                                  <DocumentTextIcon className="w-4 h-4 text-gray-500 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs" title={file.filename}>
                                      {file.filename}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                      <span>{formatFileSize(file.file_size)}</span>
                                      {file.topic_name ? (
                                        <>
                                          <span>&bull;</span>
                                          <span className="text-amber-700 dark:text-amber-400 truncate">
                                            Currently on: {file.topic_name}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span>&bull;</span>
                                          <span className="text-emerald-600 dark:text-emerald-400">
                                            Unassigned
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  disabled={isCurrentlyProcessing}
                                  onClick={() => handleAttachFromLibrary(file)}
                                  className="shrink-0 bg-gray-900 dark:bg-white dark:text-gray-950 hover:bg-gray-800 normal-case font-bold text-[11px] px-2.5 py-1.5 flex items-center gap-1"
                                >
                                  <PlusIcon className="w-3 h-3" />
                                  <span>{isCurrentlyProcessing ? "Attaching..." : "Attach"}</span>
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogBody>

              <DialogFooter className="border-t border-blue-gray-100 dark:border-gray-800 py-2.5 flex justify-end">
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => setActiveTopic(null)}
                  className="normal-case text-xs font-semibold text-gray-600 dark:text-gray-400"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </Dialog>
      </div>
    </AppLayout>
  );
}
