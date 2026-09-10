"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Typography,
  Card,
  CardBody,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
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
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { MASTER_SYLLABUS, MasterSyllabusSubject, getAllTopics } from "@/lib/syllabus-data";
import { ExamCategory, PaperType, StudyFile, SyllabusTopic } from "@/types/database";
import {
  fetchStudyFiles,
  linkFileToTopic,
  uploadStudyFile,
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
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [selectedExistingFileId, setSelectedExistingFileId] = useState<string>("");
  const [linkingActionLoading, setLinkingActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Inline upload state in topic modal
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [newUploadFile, setNewUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Files available to link (not yet linked to active topic)
  const availableFilesToLink = useMemo(() => {
    if (!activeTopic) return [];
    return studyFiles.filter((f) => f.topic_id !== activeTopic.id);
  }, [activeTopic, studyFiles]);

  const openTopicDetail = (topic: SyllabusTopic) => {
    setActiveTopic(topic);
    setIsLinkingOpen(false);
    setIsUploadMode(false);
    setNewUploadFile(null);
    setActionSuccess("");
    setActionError("");
    if (availableFilesToLink.length > 0) {
      setSelectedExistingFileId(availableFilesToLink[0].id);
    }
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

  const handleLinkExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeTopic || !selectedExistingFileId) return;

    setLinkingActionLoading(true);
    setActionError("");
    setActionSuccess("");

    const targetFile = studyFiles.find((f) => f.id === selectedExistingFileId);
    const res = await linkFileToTopic(
      user.id,
      selectedExistingFileId,
      activeTopic.subject_id || null,
      activeTopic.subject_name || "",
      activeTopic.section_id || null,
      activeTopic.section_name || "",
      activeTopic.id,
      activeTopic.name
    );

    setLinkingActionLoading(false);
    if (res.success && res.file) {
      setStudyFiles((prev) =>
        prev.map((f) => (f.id === res.file!.id ? { ...f, ...res.file! } : f))
      );
      setActionSuccess(`Linked "${targetFile?.filename}" to this topic!`);
      setIsLinkingOpen(false);
      setTimeout(() => setActionSuccess(""), 3000);
    } else {
      setActionError(res.error || "Failed to link file.");
    }
  };

  const handleUnlinkFile = async (file: StudyFile) => {
    if (!user) return;
    setLinkingActionLoading(true);
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
    setLinkingActionLoading(false);

    if (res.success && res.file) {
      setStudyFiles((prev) =>
        prev.map((f) => (f.id === res.file!.id ? { ...f, topic_id: null, topic_name: "" } : f))
      );
      setActionSuccess(`Unlinked "${file.filename}" from topic.`);
      setTimeout(() => setActionSuccess(""), 2500);
    }
  };

  const handleUploadAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeTopic || !newUploadFile) return;

    if (newUploadFile.size > 50 * 1024 * 1024) {
      setActionError("File exceeds 50 MB limit.");
      return;
    }

    setLinkingActionLoading(true);
    setActionError("");
    setActionSuccess("");

    const res = await uploadStudyFile(
      user.id,
      newUploadFile,
      activeTopic.subject_id || null,
      activeTopic.subject_name || "",
      activeTopic.section_id || null,
      activeTopic.section_name || "",
      activeTopic.id,
      activeTopic.name
    );

    setLinkingActionLoading(false);
    if (res.success && res.file) {
      setStudyFiles((prev) => [res.file!, ...prev]);
      setActionSuccess(`Uploaded and linked "${newUploadFile.name}"!`);
      setNewUploadFile(null);
      setIsUploadMode(false);
      setIsLinkingOpen(false);
      setTimeout(() => setActionSuccess(""), 3000);
    } else {
      setActionError(res.error || "Failed to upload file.");
    }
  };

  return (
    <AppLayout
      title="UPSC Master Syllabus"
      subtitle="Complete chapter and topic-level syllabus architecture for Prelims &amp; Mains"
    >
      <div className="space-y-6 max-w-5xl">
        {/* TOP CONTROLS: EXAM SELECTOR + SEARCH */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Exam Segmented Control */}
          <div className="inline-flex bg-blue-gray-100/70 p-1 rounded-xl">
            <button
              onClick={() => {
                setSelectedExam("Prelims");
                setSearchQuery("");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedExam === "Prelims" && !searchQuery
                  ? "bg-gray-900 text-white shadow-xs"
                  : "text-blue-gray-700 hover:text-gray-900"
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
                  ? "bg-gray-900 text-white shadow-xs"
                  : "text-blue-gray-700 hover:text-gray-900"
              }`}
            >
              UPSC Mains ({totalMainsTopics} Topics)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <MagnifyingGlassIcon className="w-4 h-4 text-blue-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search syllabus..."
              className="w-full bg-white border border-blue-gray-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-blue-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SEARCH RESULTS VIEW */}
        {searchQuery.trim() !== "" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-gray-100">
              <Typography variant="small" color="blue-gray" className="font-bold text-xs">
                Search Results for &ldquo;{searchQuery}&rdquo;
              </Typography>
              <span className="text-xs font-medium text-gray-500">
                {searchResults.length} {searchResults.length === 1 ? "match" : "matches"} found
              </span>
            </div>

            {searchResults.length === 0 ? (
              <Card className="border border-blue-gray-100 shadow-sm">
                <CardBody className="p-8 text-center">
                  <Typography variant="small" className="text-gray-400">
                    No topics found matching &ldquo;{searchQuery}&rdquo;. Try another keyword.
                  </Typography>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {searchResults.map((res) => {
                  const linkedCount = (filesByTopic[res.id] || []).length;

                  return (
                    <div
                      key={res.id}
                      onClick={() => openTopicDetail(res)}
                      className="p-3.5 rounded-xl border border-blue-gray-100 bg-white hover:border-blue-gray-300 transition-all shadow-xs cursor-pointer select-none"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 mb-1.5 font-medium">
                        <span className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] bg-blue-gray-100 text-blue-gray-800">
                          {res.exam}
                        </span>
                        {res.paper !== "General" && (
                          <span className="px-1.5 py-0.5 rounded font-semibold text-[10px] bg-gray-100 text-gray-700">
                            {res.paper}
                          </span>
                        )}
                        <span>&rarr;</span>
                        <span className="text-blue-gray-700 font-semibold">{res.subject_name}</span>
                        <span>&rarr;</span>
                        <span className="text-gray-600">{res.section_name}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-blue-gray-900">
                          {res.name}
                        </div>
                        {linkedCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            📕 {linkedCount} {linkedCount === 1 ? "PDF" : "PDFs"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* HIERARCHICAL SYLLABUS ACCORDION VIEW */
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500 flex items-center justify-between pb-1">
              <span>
                Showing {examSubjects.length} subjects for <strong>UPSC {selectedExam}</strong>
              </span>
              <span>Click a topic to view or link personal study PDFs</span>
            </div>

            {examSubjects.map((subject) => {
              const isSubjOpen = Boolean(expandedSubjects[subject.id]);
              const subjectTotalTopics = subject.sections.reduce(
                (acc, sec) => acc + sec.topics.length,
                0
              );

              return (
                <Card
                  key={subject.id}
                  className="border border-blue-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Subject Header */}
                  <div
                    onClick={() => toggleSubject(subject.id)}
                    className="p-4 bg-white hover:bg-blue-gray-50/40 cursor-pointer select-none transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        <BookOpenIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Typography
                            variant="h6"
                            color="blue-gray"
                            className="font-bold text-sm"
                          >
                            {subject.name}
                          </Typography>
                          {subject.paper !== "General" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-gray-100 text-blue-gray-700">
                              {subject.paper}
                            </span>
                          )}
                        </div>
                        <Typography variant="small" className="text-gray-400 text-xs font-normal">
                          {subject.sections.length} Chapters &bull; {subjectTotalTopics} Topics
                        </Typography>
                      </div>
                    </div>

                    <div className="text-gray-400">
                      {isSubjOpen ? (
                        <ChevronDownIcon className="w-5 h-5 text-gray-700" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Sections List */}
                  {isSubjOpen && (
                    <div className="border-t border-blue-gray-100 bg-blue-gray-50/20 p-3 space-y-2.5">
                      {subject.sections.map((section) => {
                        const isSecOpen = Boolean(expandedSections[section.id]);

                        return (
                          <div
                            key={section.id}
                            className="rounded-lg border border-blue-gray-100 bg-white overflow-hidden"
                          >
                            {/* Section Header */}
                            <div
                              onClick={() => toggleSection(section.id)}
                              className="px-3.5 py-2.5 hover:bg-blue-gray-50/50 cursor-pointer select-none transition-colors flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <FolderIcon className="w-4 h-4 text-blue-gray-400" />
                                <span className="text-xs font-bold text-blue-gray-900">
                                  {section.name}
                                </span>
                                <span className="text-[11px] text-gray-400 font-normal">
                                  ({section.topics.length} topics)
                                </span>
                              </div>

                              <div className="text-gray-400">
                                {isSecOpen ? (
                                  <ChevronDownIcon className="w-4 h-4 text-gray-700" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4" />
                                )}
                              </div>
                            </div>

                            {/* Topics List */}
                            {isSecOpen && (
                              <div className="border-t border-blue-gray-50 px-3.5 py-2.5 bg-gray-50/40">
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
                                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-white hover:bg-blue-gray-50/80 border border-blue-gray-100/80 text-xs text-blue-gray-800 cursor-pointer transition-all hover:border-gray-900"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="w-5 h-5 rounded-full bg-blue-gray-50 text-blue-gray-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                            {idx + 1}
                                          </span>
                                          <span className="font-semibold truncate" title={topic.name}>
                                            {topic.name}
                                          </span>
                                        </div>

                                        {linkedPdfs.length > 0 && (
                                          <span
                                            className="shrink-0 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full"
                                            title={`${linkedPdfs.length} study PDF(s) linked`}
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
        <Dialog open={Boolean(activeTopic)} handler={() => setActiveTopic(null)} size="md">
          {activeTopic && (
            <div className="max-h-[85vh] flex flex-col">
              {/* Header */}
              <DialogHeader className="text-sm font-bold text-blue-gray-900 border-b border-blue-gray-100 pb-3 flex flex-col items-start gap-1">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-gray-100 text-blue-gray-800">
                      {activeTopic.exam}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {activeTopic.subject_name} &rarr; {activeTopic.section_name}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTopic(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <Typography variant="h5" color="blue-gray" className="font-bold text-base">
                  {activeTopic.name}
                </Typography>
              </DialogHeader>

              {/* Body */}
              <DialogBody className="space-y-4 py-4 overflow-y-auto flex-1">
                {/* Feedback */}
                {actionSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-700 animate-in fade-in">
                    <CheckCircleIcon className="w-4 h-4 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {actionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
                    {actionError}
                  </div>
                )}

                {/* STUDY MATERIAL SECTION */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <DocumentTextIcon className="w-4 h-4 text-gray-900" />
                      <Typography variant="h6" color="blue-gray" className="font-bold text-xs uppercase tracking-wider">
                        Study Material
                      </Typography>
                    </div>

                    {!isLinkingOpen && (
                      <Button
                        size="sm"
                        variant="outlined"
                        onClick={() => {
                          setIsLinkingOpen(true);
                          setIsUploadMode(false);
                          setActionError("");
                        }}
                        className="text-[11px] font-semibold normal-case px-2.5 py-1 border-blue-gray-200 hover:border-gray-900"
                      >
                        + Link Study Material
                      </Button>
                    )}
                  </div>

                  {/* CONNECTED FILES LIST */}
                  {activeTopicFiles.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border border-dashed border-blue-gray-200 bg-blue-gray-50/30">
                      <p className="text-xs text-gray-500 mb-3">
                        No study material linked to this topic yet.
                      </p>
                      {!isLinkingOpen && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsLinkingOpen(true);
                            setIsUploadMode(false);
                          }}
                          className="bg-gray-900 hover:bg-gray-800 normal-case font-semibold text-xs px-3 py-1.5"
                        >
                          + Link Study Material
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeTopicFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-blue-gray-100 bg-white hover:border-blue-gray-200 shadow-xs gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl">📕</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-blue-gray-900 truncate" title={file.filename}>
                                {file.filename}
                              </p>
                              <span className="text-[11px] text-gray-400 font-medium">
                                {formatFileSize(file.file_size)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenPdf(file)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-colors"
                            >
                              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              <span>Open</span>
                            </button>

                            <button
                              type="button"
                              disabled={linkingActionLoading}
                              onClick={() => handleUnlinkFile(file)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              title="Unlink from this topic"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* LINK / UPLOAD FORM PANEL */}
                  {isLinkingOpen && (
                    <div className="mt-4 p-4 rounded-xl border border-blue-gray-200 bg-blue-gray-50/50 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-blue-gray-100 pb-2">
                        <span className="text-xs font-bold text-blue-gray-900">
                          {isUploadMode ? "Upload New PDF to Topic" : "Link Existing File from Library"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsUploadMode(!isUploadMode)}
                            className="text-[11px] font-bold text-gray-700 hover:underline"
                          >
                            {isUploadMode ? "Choose from existing library" : "+ Upload new file"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsLinkingOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isUploadMode ? (
                        /* Direct Upload & Link Form */
                        <form onSubmit={handleUploadAndLink} className="space-y-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={ALLOWED_EXTENSIONS}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setNewUploadFile(e.target.files[0]);
                              }
                            }}
                            className="w-full text-xs text-blue-gray-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer border border-blue-gray-200 rounded-lg p-2 bg-white"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="text"
                              onClick={() => setIsLinkingOpen(false)}
                              className="text-xs font-semibold normal-case"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={!newUploadFile || linkingActionLoading}
                              className="bg-gray-900 hover:bg-gray-800 normal-case font-semibold text-xs px-3.5 py-1.5"
                            >
                              {linkingActionLoading ? "Uploading..." : "Upload & Link"}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        /* Choose Existing File Form */
                        <form onSubmit={handleLinkExisting} className="space-y-3">
                          {availableFilesToLink.length === 0 ? (
                            <p className="text-xs text-gray-500 py-1">
                              No unlinked files available in your library. Use the upload option above to add a new PDF.
                            </p>
                          ) : (
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                Select File from Your Library:
                              </label>
                              <select
                                value={selectedExistingFileId}
                                onChange={(e) => setSelectedExistingFileId(e.target.value)}
                                className="w-full bg-white border border-blue-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-gray-900 focus:outline-none focus:border-gray-900 shadow-xs"
                              >
                                {availableFilesToLink.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.filename} ({formatFileSize(f.file_size)})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="text"
                              onClick={() => setIsLinkingOpen(false)}
                              className="text-xs font-semibold normal-case"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={availableFilesToLink.length === 0 || linkingActionLoading}
                              className="bg-gray-900 hover:bg-gray-800 normal-case font-semibold text-xs px-3.5 py-1.5"
                            >
                              {linkingActionLoading ? "Linking..." : "Link File"}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </DialogBody>

              <DialogFooter className="border-t border-blue-gray-100 py-2.5 flex justify-end">
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => setActiveTopic(null)}
                  className="normal-case text-xs font-semibold"
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
