"use client";

import React, { useState, useMemo, useEffect } from "react";
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
} from "@/components/ui/Modal";
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BookOpenIcon,
  XMarkIcon,
  FolderIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  FolderOpenIcon,
  AcademicCapIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { MASTER_SYLLABUS, getAllTopics } from "@/lib/syllabus-data";
import { StudyFile, SyllabusTopic } from "@/types/database";
import {
  fetchStudyFiles,
  linkFileToTopic,
  getFileDownloadUrl,
} from "@/lib/api";
import {
  formatFileSize,
  UPSC_OPTIONAL_CORE_SUBJECTS,
  UPSC_OPTIONAL_LITERATURE_SUBJECTS,
} from "@/lib/constants";

type SyllabusTab = "prelims" | "mains" | "optional";

export default function SyllabusPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SyllabusTab>("prelims");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFocus, setSelectedFocus] = useState<"all" | "prelims" | "mains">("all");

  // Accordion state
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Study files state
  const [studyFiles, setStudyFiles] = useState<StudyFile[]>([]);

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
    fetchStudyFiles(user.id).then((files) => {
      setStudyFiles(files);
    });
  }, [user]);

  // Filter subjects by selected Tab
  const tabSubjects = useMemo(() => {
    if (activeTab === "prelims") {
      return MASTER_SYLLABUS.filter((s) => s.exam === "Prelims");
    }
    if (activeTab === "mains") {
      return MASTER_SYLLABUS.filter((s) => s.exam === "Mains" && s.paper !== "Optional");
    }
    return [];
  }, [activeTab]);

  // Set first subject expanded when tab changes
  useEffect(() => {
    if (tabSubjects.length > 0) {
      const firstSubj = tabSubjects[0];
      setExpandedSubjects({ [firstSubj.id]: true });
      if (firstSubj.sections.length > 0) {
        setExpandedSections({ [firstSubj.sections[0].id]: true });
      }
    }
  }, [activeTab, tabSubjects]);

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
    return MASTER_SYLLABUS.filter((s) => s.exam === "Mains" && s.paper !== "Optional").reduce(
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
      if (file.topic_id === activeTopic.id) return false;
      if (libraryFilter === "unlinked" && (file.topic_id || file.section_id)) {
        return false;
      }
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
    if (res.success) {
      setStudyFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, topic_id: null, topic_name: "" } : f))
      );
      setActionSuccess(`Unlinked "${file.filename}"`);
      setTimeout(() => setActionSuccess(""), 3000);
    }
  };

  return (
    <AppLayout
      title="UPSC Master Syllabus & Interlinked Topics"
      subtitle="Canonical UPSC Prelims, Mains & Optional subject architecture • Integrated sub-subjects, chapters & cloud files"
    >
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* TOP CONTROLS: TABS + SEARCH */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800">
          {/* Primary Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => {
                setActiveTab("prelims");
                setSearchQuery("");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "prelims" && !searchQuery
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Prelims Papers ({totalPrelimsTopics} Topics)
            </button>
            <button
              onClick={() => {
                setActiveTab("mains");
                setSearchQuery("");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "mains" && !searchQuery
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Mains General Studies & Compulsory ({totalMainsTopics} Topics)
            </button>
            <button
              onClick={() => {
                setActiveTab("optional");
                setSearchQuery("");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "optional" && !searchQuery
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Optional Subjects (25 Core + 23 Literature)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:max-w-xs">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapters or topics..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
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
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
              <Typography variant="small" className="font-bold text-xs text-gray-900 dark:text-white">
                Search Results for &ldquo;{searchQuery}&rdquo;
              </Typography>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                {searchResults.length} topic{searchResults.length === 1 ? "" : "s"} found
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-400 dark:text-gray-500">
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
                      className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-900 dark:hover:border-gray-500 cursor-pointer transition-all shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {topic.exam}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate">{topic.subject_name}</span>
                        </div>
                        <Typography
                          variant="small"
                          className="font-bold text-xs truncate text-gray-900 dark:text-white"
                        >
                          {topic.name}
                        </Typography>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate block mt-0.5">
                          Sub-subject: {topic.section_name}
                        </span>
                      </div>

                      {linkedPdfs.length > 0 && (
                        <span className="shrink-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-full">
                          📕 {linkedPdfs.length} PDF{linkedPdfs.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "optional" ? (
          /* OPTIONAL SUBJECTS CATALOG VIEW */
          <div className="space-y-6">
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
              <CardBody className="p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <AcademicCapIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <Typography variant="h6" className="font-bold text-gray-900 dark:text-white text-sm">
                      25 Core UPSC Optional Subjects (Mains Papers VI & VII)
                    </Typography>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Candidates may choose any one optional subject (2 papers of 250 marks each = 500 marks total)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {UPSC_OPTIONAL_CORE_SUBJECTS.map((opt, idx) => (
                    <div
                      key={opt}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex items-center gap-2.5 text-xs font-semibold text-gray-900 dark:text-white"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
              <CardBody className="p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <Typography variant="h6" className="font-bold text-gray-900 dark:text-white text-sm">
                      23 UPSC Literature Optional Subjects
                    </Typography>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Literature of Eighth Schedule languages + English
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {UPSC_OPTIONAL_LITERATURE_SUBJECTS.map((lit, idx) => (
                    <div
                      key={lit}
                      className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 text-xs font-medium text-gray-800 dark:text-gray-200"
                    >
                      <span className="text-gray-400 dark:text-gray-500 mr-1.5">{idx + 1}.</span>
                      <span>{lit}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          /* HIERARCHICAL ACCORDION VIEW: Subject -> Sub-Subjects (Sections) -> Topics */
          <div className="space-y-4">
            {tabSubjects.map((subject) => {
              const isSubjOpen = Boolean(expandedSubjects[subject.id]);
              const subjectTotalTopics = subject.sections.reduce(
                (sum, sec) => sum + sec.topics.length,
                0
              );

              return (
                <Card
                  key={subject.id}
                  className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none overflow-hidden"
                >
                  {/* Subject Header */}
                  <div
                    onClick={() => toggleSubject(subject.id)}
                    className="p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center justify-center shrink-0 font-bold">
                        <BookOpenIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Typography variant="h6" className="font-bold text-sm text-gray-900 dark:text-white">
                            {subject.name}
                          </Typography>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            {subject.exam}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {subject.sections.length} Sub-divisions &bull; {subjectTotalTopics} Topics & Chapters
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

                  {/* Subject Sub-divisions (Sections) */}
                  {isSubjOpen && (
                    <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 bg-gray-50/30 dark:bg-gray-900/50">
                      {subject.sections.map((section) => {
                        const isSecOpen = Boolean(expandedSections[section.id]);

                        return (
                          <div key={section.id} className="transition-colors">
                            {/* Section Header */}
                            <div
                              onClick={() => toggleSection(section.id)}
                              className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-800/60"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FolderIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                  {section.name}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                  ({section.topics.length} topics)
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

                            {/* Topics Grid */}
                            {isSecOpen && (
                              <div className="border-t border-gray-100 dark:border-gray-800 px-3.5 py-2.5 bg-white dark:bg-gray-900">
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
                                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-400 text-xs text-gray-900 dark:text-gray-100 cursor-pointer transition-all"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                            {idx + 1}
                                          </span>
                                          <span className="font-semibold truncate" title={topic.name}>
                                            {topic.name}
                                          </span>
                                        </div>

                                        {linkedPdfs.length > 0 && (
                                          <span
                                            className="shrink-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full"
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

        {/* TOPIC DETAIL & ATTACH STUDY MATERIAL DIALOG */}
        <Dialog
          open={Boolean(activeTopic)}
          handler={() => setActiveTopic(null)}
          size="md"
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl"
        >
          {activeTopic && (
            <div className="max-h-[85vh] flex flex-col space-y-4">
              {/* Header */}
              <DialogHeader className="p-0 pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-col items-start gap-1">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
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
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <Typography variant="h5" className="font-bold text-base text-gray-900 dark:text-white">
                  {activeTopic.name}
                </Typography>
              </DialogHeader>

              {/* Body */}
              <DialogBody className="p-0 space-y-4 overflow-y-auto flex-1">
                {actionSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircleIcon className="w-4 h-4 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {actionError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs font-medium text-red-700 dark:text-red-400">
                    {actionError}
                  </div>
                )}

                {/* Attached Study Material Section */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <DocumentTextIcon className="w-4 h-4 text-gray-900 dark:text-white" />
                      <Typography variant="h6" className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                        Attached Study Material ({activeTopicFiles.length})
                      </Typography>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setIsLibraryPickerOpen(!isLibraryPickerOpen)}
                      className="text-[11px] font-semibold px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 shadow-none flex items-center gap-1.5"
                    >
                      <FolderOpenIcon className="w-3.5 h-3.5" />
                      <span>{isLibraryPickerOpen ? "Hide Library" : "+ Attach from Library"}</span>
                    </Button>
                  </div>

                  {activeTopicFiles.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        No study material linked to this chapter topic yet.
                      </p>
                      {!isLibraryPickerOpen && (
                        <Button
                          size="sm"
                          onClick={() => setIsLibraryPickerOpen(true)}
                          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-xs px-3.5 py-1.5 shadow-none"
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
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/70 gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl">📕</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={file.filename}>
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
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold shadow-xs transition-colors"
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

                  {/* Direct Library Picker Panel */}
                  {isLibraryPickerOpen && (
                    <div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <div className="flex items-center gap-2">
                          <FolderOpenIcon className="w-4 h-4 text-gray-900 dark:text-white" />
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            Select File from Your Cloud Library
                          </span>
                        </div>
                        <button
                          onClick={() => setIsLibraryPickerOpen(false)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={librarySearchQuery}
                        onChange={(e) => setLibrarySearchQuery(e.target.value)}
                        placeholder="Search files..."
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                      />

                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                        {filteredLibraryFiles.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4 italic">
                            No files matching your search in library.
                          </p>
                        ) : (
                          filteredLibraryFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs gap-2"
                            >
                              <div className="truncate pr-2">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">
                                  {file.filename}
                                </p>
                                <span className="text-[10px] text-gray-400">
                                  {formatFileSize(file.file_size)}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                disabled={linkingActionLoadingId === file.id}
                                onClick={() => handleAttachFromLibrary(file)}
                                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] py-1 px-2.5 font-semibold shrink-0"
                              >
                                {linkingActionLoadingId === file.id ? "Attaching..." : "Link"}
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogBody>
            </div>
          )}
        </Dialog>
      </div>
    </AppLayout>
  );
}
