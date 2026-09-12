"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  ArrowUpTrayIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  FolderOpenIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PlusIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { StudyFile } from "@/types/database";
import {
  fetchStudyFiles,
  uploadStudyFile,
  deleteStudyFile,
  getFileDownloadUrl,
  linkFileToTopic,
} from "@/lib/api";
import { MASTER_SYLLABUS } from "@/lib/syllabus-data";
import {
  formatFileSize,
  formatShortDate,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from "@/lib/constants";

function FilesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialUpload = searchParams.get("upload") === "true";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<StudyFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [examFilter, setExamFilter] = useState<"All" | "Prelims" | "Mains">("All");
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");
  const [filterSectionId, setFilterSectionId] = useState<string>("all");
  const [filterTopicId, setFilterTopicId] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "categorized" | "uncategorized">("all");

  // Multi-File Upload dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadSubjectId, setUploadSubjectId] = useState<string>("");
  const [uploadSectionId, setUploadSectionId] = useState<string>("");
  const [uploadTopicId, setUploadTopicId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState("");

  // Categorize / Link existing file dialog state
  const [linkingFile, setLinkingFile] = useState<StudyFile | null>(null);
  const [linkSubjectId, setLinkSubjectId] = useState<string>(MASTER_SYLLABUS[0]?.id || "");
  const [linkSectionId, setLinkSectionId] = useState<string>("");
  const [linkTopicId, setLinkTopicId] = useState<string>("");
  const [savingLink, setSavingLink] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // Load files
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    fetchStudyFiles(user.id).then((data) => {
      setFiles(data);
      setLoading(false);

      if (initialUpload) {
        setIsUploadOpen(true);
      }
    });
  }, [user, initialUpload]);

  // Dynamic hierarchy for Upload Dialog
  const uploadCurrentSubj = useMemo(
    () => MASTER_SYLLABUS.find((s) => s.id === uploadSubjectId) || null,
    [uploadSubjectId]
  );

  const uploadCurrentSec = useMemo(
    () => uploadCurrentSubj?.sections.find((s) => s.id === uploadSectionId) || null,
    [uploadCurrentSubj, uploadSectionId]
  );

  const handleUploadSubjectChange = (newSubjId: string) => {
    setUploadSubjectId(newSubjId);
    setUploadSectionId("");
    setUploadTopicId("");
  };

  const handleUploadSectionChange = (newSecId: string) => {
    setUploadSectionId(newSecId);
    setUploadTopicId("");
  };

  // Dynamic hierarchy for Link Dialog
  const linkCurrentSubj = useMemo(
    () => MASTER_SYLLABUS.find((s) => s.id === linkSubjectId) || MASTER_SYLLABUS[0],
    [linkSubjectId]
  );

  const linkCurrentSec = useMemo(
    () => linkCurrentSubj?.sections.find((s) => s.id === linkSectionId),
    [linkCurrentSubj, linkSectionId]
  );

  const openLinkDialog = (file: StudyFile) => {
    setLinkingFile(file);
    setLinkSubjectId(file.subject_id || MASTER_SYLLABUS[0]?.id || "");
    setLinkSectionId(file.section_id || "");
    setLinkTopicId(file.topic_id || "");
    setLinkSuccess(false);
    setActionError("");
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !linkingFile) return;

    setSavingLink(true);
    const subj = MASTER_SYLLABUS.find((s) => s.id === linkSubjectId);
    const sec = subj?.sections.find((s) => s.id === linkSectionId);
    const top = sec?.topics.find((t) => t.id === linkTopicId);

    const res = await linkFileToTopic(
      user.id,
      linkingFile.id,
      linkSubjectId || null,
      subj?.name || linkSubjectId,
      linkSectionId || null,
      sec?.name || "",
      linkTopicId || null,
      top?.name || ""
    );

    setSavingLink(false);
    if (res.success && res.file) {
      setFiles((prev) =>
        prev.map((f) => (f.id === res.file!.id ? { ...f, ...res.file! } : f))
      );
      setLinkSuccess(true);
      setTimeout(() => {
        setLinkSuccess(false);
        setLinkingFile(null);
      }, 1200);
    } else {
      setActionError(res.error || "Failed to link file to topic.");
    }
  };

  const handleClearLink = async () => {
    if (!user || !linkingFile) return;
    setSavingLink(true);
    const res = await linkFileToTopic(
      user.id,
      linkingFile.id,
      null,
      "",
      null,
      "",
      null,
      ""
    );
    setSavingLink(false);
    if (res.success && res.file) {
      setFiles((prev) =>
        prev.map((f) => (f.id === res.file!.id ? { ...f, ...res.file! } : f))
      );
      setLinkSuccess(true);
      setTimeout(() => {
        setLinkSuccess(false);
        setLinkingFile(null);
      }, 1200);
    }
  };

  // MULTI-FILE SELECTION HANDLER
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      const valid: File[] = [];
      const tooLarge: string[] = [];

      incoming.forEach((f) => {
        if (f.size > MAX_FILE_SIZE_BYTES) {
          tooLarge.push(f.name);
        } else {
          valid.push(f);
        }
      });

      if (tooLarge.length > 0) {
        setUploadError(
          `${tooLarge.length} file(s) exceeded the ${MAX_FILE_SIZE_LABEL} limit: ${tooLarge.slice(0, 2).join(", ")}${
            tooLarge.length > 2 ? "..." : ""
          }`
        );
      } else {
        setUploadError("");
      }

      // Append new files without duplicating by name+size
      setSelectedFiles((prev) => {
        const existingKeys = new Set(prev.map((p) => `${p.name}_${p.size}`));
        const filteredNew = valid.filter((v) => !existingKeys.has(`${v.name}_${v.size}`));
        return [...prev, ...filteredNew];
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllSelectedFiles = () => {
    setSelectedFiles([]);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // BATCH MULTI-FILE UPLOAD
  const handleBatchUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccessMessage("");

    const subj = MASTER_SYLLABUS.find((s) => s.id === uploadSubjectId);
    const sec = subj?.sections.find((s) => s.id === uploadSectionId);
    const top = sec?.topics.find((t) => t.id === uploadTopicId);

    const uploadedResults: StudyFile[] = [];
    const failedNames: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const currentFile = selectedFiles[i];
      setUploadProgress({
        current: i + 1,
        total: selectedFiles.length,
        currentFileName: currentFile.name,
      });

      try {
        const res = await uploadStudyFile(
          user.id,
          currentFile,
          uploadSubjectId || null,
          subj?.name || uploadSubjectId || "",
          uploadSectionId || null,
          sec?.name || "",
          uploadTopicId || null,
          top?.name || ""
        );

        if (res.success && res.file) {
          uploadedResults.push(res.file);
        } else {
          failedNames.push(currentFile.name);
        }
      } catch (err: any) {
        failedNames.push(currentFile.name);
      }
    }

    setUploading(false);
    setUploadProgress(null);

    if (uploadedResults.length > 0) {
      setFiles((prev) => [...uploadedResults, ...prev]);
      setUploadSuccessMessage(
        `Successfully uploaded ${uploadedResults.length} file${
          uploadedResults.length > 1 ? "s" : ""
        } to your library!`
      );
      setSelectedFiles([]);

      if (failedNames.length === 0) {
        setTimeout(() => {
          setUploadSuccessMessage("");
          setIsUploadOpen(false);
        }, 1800);
      }
    }

    if (failedNames.length > 0) {
      setUploadError(
        `Failed to upload ${failedNames.length} file(s): ${failedNames.slice(0, 3).join(", ")}`
      );
    }
  };

  const handleDelete = async (file: StudyFile) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to delete "${file.filename}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(file.id);
    setActionError("");

    const res = await deleteStudyFile(user.id, file.id, file.storage_path);
    setDeletingId(null);

    if (res.success) {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } else {
      setActionError(res.error || "Failed to delete file. Storage record was preserved.");
    }
  };

  const handleOpenInBrowser = async (file: StudyFile) => {
    setActionError("");
    if (file.download_url) {
      window.open(file.download_url, "_blank");
      return;
    }

    const signedUrl = await getFileDownloadUrl(file.storage_path);
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    } else {
      setActionError("Could not generate secure link to open file.");
    }
  };

  const handleDownload = async (file: StudyFile) => {
    setActionError("");
    if (file.download_url) {
      const a = document.createElement("a");
      a.href = file.download_url;
      a.download = file.filename;
      a.click();
      return;
    }

    const signedUrl = await getFileDownloadUrl(file.storage_path);
    if (signedUrl) {
      const a = document.createElement("a");
      a.href = signedUrl;
      a.download = file.filename;
      a.target = "_blank";
      a.click();
    } else {
      setActionError("Could not generate secure link for download.");
    }
  };

  // Filter dynamic subjects based on exam filter
  const filterAvailableSubjects = useMemo(() => {
    if (examFilter === "All") return MASTER_SYLLABUS;
    return MASTER_SYLLABUS.filter((s) => s.exam === examFilter);
  }, [examFilter]);

  const filterSelectedSubject = useMemo(() => {
    if (filterSubjectId === "all") return null;
    return MASTER_SYLLABUS.find((s) => s.id === filterSubjectId) || null;
  }, [filterSubjectId]);

  const filterSelectedSection = useMemo(() => {
    if (!filterSelectedSubject || filterSectionId === "all") return null;
    return filterSelectedSubject.sections.find((s) => s.id === filterSectionId) || null;
  }, [filterSelectedSubject, filterSectionId]);

  // Filtered files list
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = file.filename.toLowerCase().includes(q);
        const matchSubj = (file.subject_name || file.subject_id || "").toLowerCase().includes(q);
        const matchSec = (file.section_name || "").toLowerCase().includes(q);
        const matchTop = (file.topic_name || "").toLowerCase().includes(q);
        if (!matchName && !matchSubj && !matchSec && !matchTop) return false;
      }

      // Categorization status filter
      if (categoryFilter === "categorized" && !file.topic_name && !file.section_name) {
        return false;
      }
      if (categoryFilter === "uncategorized" && (file.topic_name || file.section_name)) {
        return false;
      }

      // Exam Filter
      if (examFilter !== "All") {
        const matchedSubj = MASTER_SYLLABUS.find(
          (s) => s.id === file.subject_id || s.name.toLowerCase() === (file.subject_name || "").toLowerCase()
        );
        if (matchedSubj && matchedSubj.exam !== examFilter) return false;
      }

      // Subject Filter
      if (filterSubjectId !== "all") {
        if (file.subject_id !== filterSubjectId && file.subject_name !== filterSelectedSubject?.name) {
          return false;
        }
      }

      // Section Filter
      if (filterSectionId !== "all") {
        if (file.section_id !== filterSectionId) return false;
      }

      // Topic Filter
      if (filterTopicId !== "all") {
        if (file.topic_id !== filterTopicId) return false;
      }

      return true;
    });
  }, [files, searchQuery, categoryFilter, examFilter, filterSubjectId, filterSectionId, filterTopicId, filterSelectedSubject]);

  const getFileBadge = (filename: string, fileType: string) => {
    const ext = filename.split(".").pop()?.toUpperCase() || "FILE";
    const isPdf = ext === "PDF" || fileType.includes("pdf");

    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
          isPdf
            ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900"
            : "bg-blue-gray-50 dark:bg-gray-800 text-blue-gray-700 dark:text-gray-300 border-blue-gray-200 dark:border-gray-700"
        }`}
      >
        {ext}
      </span>
    );
  };

  const totalSelectedBytes = useMemo(() => {
    return selectedFiles.reduce((acc, f) => acc + f.size, 0);
  }, [selectedFiles]);

  return (
    <AppLayout
      title="Study Library"
      subtitle="Personal study-material library • Batch upload PDFs and organize them into UPSC subjects, chapters, and topics"
    >
      <div className="space-y-6 max-w-6xl">
        {/* TOP BAR: SEARCH & BATCH UPLOAD BUTTON */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 sm:max-w-md">
            <MagnifyingGlassIcon className="w-4 h-4 text-blue-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search study material by name, subject, topic..."
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

          <div className="flex items-center gap-2">
            {/* Quick Filter: All vs Categorized vs Uncategorized */}
            <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  categoryFilter === "all"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                All ({files.length})
              </button>
              <button
                onClick={() => setCategoryFilter("uncategorized")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  categoryFilter === "uncategorized"
                    ? "bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-400 shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Uncategorized ({files.filter((f) => !f.topic_name && !f.section_name).length})
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setIsUploadOpen(true);
                setUploadError("");
                setUploadSuccessMessage("");
              }}
              className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-gray-100 normal-case font-semibold text-xs py-2.5 px-4 shadow-xs shrink-0"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>+ Upload Files</span>
            </Button>
          </div>
        </div>

        {/* HIERARCHICAL FILTERS: Exam -> Subject -> Section -> Topic */}
        <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <CardBody className="p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* Exam */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Exam Filter
                </label>
                <select
                  value={examFilter}
                  onChange={(e) => {
                    setExamFilter(e.target.value as any);
                    setFilterSubjectId("all");
                    setFilterSectionId("all");
                    setFilterTopicId("all");
                  }}
                  className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400"
                >
                  <option value="All">All Exams</option>
                  <option value="Prelims">Prelims</option>
                  <option value="Mains">Mains</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <select
                  value={filterSubjectId}
                  onChange={(e) => {
                    setFilterSubjectId(e.target.value);
                    setFilterSectionId("all");
                    setFilterTopicId("all");
                  }}
                  className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400"
                >
                  <option value="all">All Subjects</option>
                  {filterAvailableSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.exam}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Section / Chapter
                </label>
                <select
                  value={filterSectionId}
                  disabled={filterSubjectId === "all" || !filterSelectedSubject}
                  onChange={(e) => {
                    setFilterSectionId(e.target.value);
                    setFilterTopicId("all");
                  }}
                  className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 disabled:bg-gray-50 dark:disabled:bg-gray-800/40 disabled:text-gray-400"
                >
                  <option value="all">All Sections</option>
                  {filterSelectedSubject?.sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Topic
                </label>
                <select
                  value={filterTopicId}
                  disabled={filterSectionId === "all" || !filterSelectedSection}
                  onChange={(e) => setFilterTopicId(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 disabled:bg-gray-50 dark:disabled:bg-gray-800/40 disabled:text-gray-400"
                >
                  <option value="all">All Topics</option>
                  {filterSelectedSection?.topics.map((top) => (
                    <option key={top.id} value={top.id}>
                      {top.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ERROR BANNER */}
        {actionError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
            <ExclamationTriangleIcon className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{actionError}</span>
          </div>
        )}

        {/* FILE LIST OR EMPTY STATE */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500 text-xs">
            Loading your study library...
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <CardBody className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-gray-50 dark:bg-gray-800 text-blue-gray-400 dark:text-gray-500 flex items-center justify-center mx-auto mb-3">
                <FolderOpenIcon className="w-6 h-6" />
              </div>
              <Typography variant="h6" color="blue-gray" className="font-bold mb-1 dark:text-gray-100">
                No study material yet
              </Typography>
              <Typography variant="small" className="text-gray-500 dark:text-gray-400 text-xs mb-4">
                {searchQuery || filterSubjectId !== "all" || categoryFilter !== "all"
                  ? "No files match your search and filter criteria."
                  : "Upload your PDFs and organize them by UPSC subject and topic."}
              </Typography>
              <Button
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                className="bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 normal-case font-semibold text-xs px-4 py-2"
              >
                + Upload Files
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredFiles.map((file) => {
              const isPdf =
                file.filename.toLowerCase().endsWith(".pdf") ||
                file.file_type.toLowerCase().includes("pdf");

              return (
                <div
                  key={file.id}
                  className="p-3.5 rounded-xl border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-gray-300 dark:hover:border-gray-700 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* File Info & Hierarchy */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 border border-blue-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 mt-0.5">
                      <DocumentTextIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-gray-900 dark:text-gray-100 truncate max-w-sm" title={file.filename}>
                          {file.filename}
                        </span>
                        {getFileBadge(file.filename, file.file_type)}
                      </div>

                      {/* Hierarchy Badges: Subject -> Section -> Topic */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">
                        {file.subject_name ? (
                          <span className="px-2 py-0.5 rounded bg-blue-gray-50 dark:bg-gray-800 text-blue-gray-800 dark:text-gray-300 font-semibold text-[10px]">
                            {file.subject_name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] italic">
                            Unassigned Subject
                          </span>
                        )}

                        {file.section_name && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">&rarr;</span>
                            <span className="text-gray-600 dark:text-gray-300 text-[10px]">
                              {file.section_name}
                            </span>
                          </>
                        )}

                        {file.topic_name ? (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">&rarr;</span>
                            <span className="font-bold text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                              {file.topic_name}
                            </span>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openLinkDialog(file)}
                            className="inline-flex items-center gap-1 ml-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <TagIcon className="w-3 h-3" />
                            <span>+ Assign Topic</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>&bull;</span>
                        <span>Uploaded {formatShortDate(file.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Categorize / Re-link */}
                    <button
                      type="button"
                      onClick={() => openLinkDialog(file)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-400 text-xs font-semibold text-blue-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      title="Categorize or attach to a specific UPSC topic"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{file.topic_name ? "Re-categorize" : "Categorize"}</span>
                    </button>

                    {/* Open in Browser */}
                    {isPdf && (
                      <button
                        type="button"
                        onClick={() => handleOpenInBrowser(file)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-900 dark:border-gray-600 bg-gray-900 dark:bg-gray-800 text-white hover:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold transition-colors shadow-xs"
                        title="Open PDF in new tab"
                      >
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </button>
                    )}

                    {/* Download */}
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-400 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      title="Download file"
                    >
                      <ArrowDownTrayIcon className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                      <span>Download</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      disabled={deletingId === file.id}
                      onClick={() => handleDelete(file)}
                      className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                      title="Delete file"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MULTI-FILE BATCH UPLOAD DIALOG MODAL */}
        <Dialog
          open={isUploadOpen}
          handler={() => !uploading && setIsUploadOpen(false)}
          size="md"
          className="dark:bg-gray-900 border dark:border-gray-800"
        >
          <form onSubmit={handleBatchUpload}>
            <DialogHeader className="text-sm font-bold text-blue-gray-900 dark:text-gray-100 border-b border-blue-gray-100 dark:border-gray-800 flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpTrayIcon className="w-5 h-5 text-gray-900 dark:text-white" />
                <span>Batch Upload Study Files (Multiple PDFs)</span>
              </div>
              {!uploading && (
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </DialogHeader>

            <DialogBody className="space-y-4 py-4 max-h-[75vh] overflow-y-auto">
              {uploadSuccessMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
                  <CheckCircleIcon className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccessMessage}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs font-medium text-red-700 dark:text-red-400">
                  {uploadError}
                </div>
              )}

              {/* Progress Indicator */}
              {uploading && uploadProgress && (
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-blue-gray-100 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-gray-800 dark:text-gray-200">
                    <span>
                      Uploading file {uploadProgress.current} of {uploadProgress.total}...
                    </span>
                    <span>
                      {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 dark:bg-white transition-all duration-300 rounded-full"
                      style={{
                        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    Currently uploading: {uploadProgress.currentFileName}
                  </p>
                </div>
              )}

              {/* 1. Choose Multiple Files */}
              <div>
                <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200 mb-1">
                  1. Select Files <span className="text-gray-400 font-normal">(Select multiple PDFs or documents, up to 1 GB each)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ALLOWED_EXTENSIONS}
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="w-full text-xs text-blue-gray-800 dark:text-gray-200 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-900 dark:file:bg-white file:text-white dark:file:text-gray-900 hover:file:bg-gray-800 dark:hover:file:bg-gray-100 cursor-pointer border border-blue-gray-200 dark:border-gray-700 rounded-xl p-2 bg-gray-50/50 dark:bg-gray-800/50"
                  />
                </div>

                {/* Selected Files Queue */}
                {selectedFiles.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 dark:text-gray-400 px-1">
                      <span>
                        {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected ({formatFileSize(totalSelectedBytes)} total)
                      </span>
                      {!uploading && (
                        <button
                          type="button"
                          onClick={clearAllSelectedFiles}
                          className="text-red-600 dark:text-red-400 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-blue-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={`${file.name}_${idx}`}
                          className="flex items-center justify-between gap-2 pt-1.5 first:pt-0 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <DocumentTextIcon className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-xs">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          {!uploading && (
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(idx)}
                              className="text-gray-400 hover:text-red-600 p-0.5"
                              title="Remove this file"
                            >
                              <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Optional Categorization during upload */}
              <div className="pt-2 border-t border-blue-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200">
                    2. Categorization <span className="text-gray-400 font-normal">(Optional — you can also categorize later)</span>
                  </label>
                </div>

                {/* Subject Dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    UPSC Subject
                  </label>
                  <select
                    value={uploadSubjectId}
                    onChange={(e) => handleUploadSubjectChange(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 focus:outline-none focus:border-gray-900 shadow-xs"
                  >
                    <option value="">-- Leave Uncategorized (Assign Subject Later) --</option>
                    {MASTER_SYLLABUS.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.exam}] {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Dropdown (Optional) */}
                {uploadSubjectId && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Section / Chapter <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={uploadSectionId}
                      onChange={(e) => handleUploadSectionChange(e.target.value)}
                      disabled={uploading}
                      className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 focus:outline-none focus:border-gray-900 shadow-xs"
                    >
                      <option value="">-- No specific section (Belongs to subject) --</option>
                      {uploadCurrentSubj?.sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Topic Dropdown (Optional) */}
                {uploadSectionId && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Topic <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={uploadTopicId}
                      onChange={(e) => setUploadTopicId(e.target.value)}
                      disabled={uploading}
                      className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 focus:outline-none focus:border-gray-900 shadow-xs"
                    >
                      <option value="">-- No specific topic (Belongs to section) --</option>
                      {uploadCurrentSec?.topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </DialogBody>

            <DialogFooter className="border-t border-blue-gray-100 dark:border-gray-800 flex items-center justify-end gap-2 pt-3">
              <Button
                variant="text"
                size="sm"
                disabled={uploading}
                onClick={() => setIsUploadOpen(false)}
                className="text-xs font-semibold normal-case text-gray-600 dark:text-gray-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={selectedFiles.length === 0 || uploading}
                className="bg-gray-900 dark:bg-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-gray-100 normal-case font-semibold text-xs px-4 py-2"
              >
                {uploading
                  ? `Uploading (${uploadProgress?.current || 1}/${uploadProgress?.total || selectedFiles.length})...`
                  : `Upload ${selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}` : "Files"}`}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* CATEGORIZE / LINK EXISTING FILE DIALOG MODAL */}
        <Dialog
          open={Boolean(linkingFile)}
          handler={() => !savingLink && setLinkingFile(null)}
          size="sm"
          className="dark:bg-gray-900 border dark:border-gray-800"
        >
          <form onSubmit={handleSaveLink}>
            <DialogHeader className="text-sm font-bold text-blue-gray-900 dark:text-gray-100 border-b border-blue-gray-100 dark:border-gray-800 flex items-center justify-between pb-3">
              <span>Categorize Study File</span>
              {!savingLink && (
                <button
                  type="button"
                  onClick={() => setLinkingFile(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </DialogHeader>

            <DialogBody className="space-y-4 py-4">
              {linkSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
                  <CheckCircleIcon className="w-4 h-4 shrink-0" />
                  <span>Category updated successfully!</span>
                </div>
              )}

              <div className="p-2.5 bg-blue-gray-50/70 dark:bg-gray-800 rounded-lg border border-blue-gray-100 dark:border-gray-700">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Selected File:</span>
                <p className="text-xs font-bold text-blue-gray-900 dark:text-gray-100 truncate">{linkingFile?.filename}</p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200 mb-1">
                  1. UPSC Subject
                </label>
                <select
                  value={linkSubjectId}
                  onChange={(e) => {
                    setLinkSubjectId(e.target.value);
                    setLinkSectionId("");
                    setLinkTopicId("");
                  }}
                  className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 focus:outline-none focus:border-gray-900 shadow-xs"
                >
                  {MASTER_SYLLABUS.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.exam}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200 mb-1">
                  2. Section / Chapter <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={linkSectionId}
                  onChange={(e) => {
                    setLinkSectionId(e.target.value);
                    setLinkTopicId("");
                  }}
                  className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 focus:outline-none focus:border-gray-900 shadow-xs"
                >
                  <option value="">-- No specific section --</option>
                  {linkCurrentSubj?.sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200 mb-1">
                  3. Topic <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={linkTopicId}
                  onChange={(e) => setLinkTopicId(e.target.value)}
                  disabled={!linkSectionId}
                  className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 dark:text-gray-200 focus:outline-none focus:border-gray-900 shadow-xs disabled:bg-gray-50 dark:disabled:bg-gray-800/40 disabled:text-gray-400"
                >
                  <option value="">-- No specific topic --</option>
                  {linkCurrentSec?.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </DialogBody>

            <DialogFooter className="border-t border-blue-gray-100 dark:border-gray-800 flex items-center justify-between pt-3">
              {linkingFile?.topic_id || linkingFile?.section_name ? (
                <button
                  type="button"
                  disabled={savingLink}
                  onClick={handleClearLink}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                >
                  Remove Category
                </button>
              ) : <span />}

              <div className="flex items-center gap-2">
                <Button
                  variant="text"
                  size="sm"
                  disabled={savingLink}
                  onClick={() => setLinkingFile(null)}
                  className="text-xs font-semibold normal-case text-gray-600 dark:text-gray-400"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingLink}
                  className="bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 normal-case font-semibold text-xs px-4 py-2"
                >
                  {savingLink ? "Saving..." : "Save Category"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}

export default function FilesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500">Loading study library...</div>}>
      <FilesContent />
    </Suspense>
  );
}
