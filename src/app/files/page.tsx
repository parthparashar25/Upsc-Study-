"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

  // Upload dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSubjectId, setUploadSubjectId] = useState<string>(MASTER_SYLLABUS[0]?.id || "");
  const [uploadSectionId, setUploadSectionId] = useState<string>("");
  const [uploadTopicId, setUploadTopicId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Link existing file dialog state
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
    () => MASTER_SYLLABUS.find((s) => s.id === uploadSubjectId) || MASTER_SYLLABUS[0],
    [uploadSubjectId]
  );

  const uploadCurrentSec = useMemo(
    () => uploadCurrentSubj?.sections.find((s) => s.id === uploadSectionId),
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        setUploadError("File exceeds 50 MB maximum size limit.");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      setUploadError("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      setUploadError("File exceeds 50 MB maximum size limit.");
      return;
    }

    setUploading(true);
    setUploadError("");

    const subj = MASTER_SYLLABUS.find((s) => s.id === uploadSubjectId);
    const sec = subj?.sections.find((s) => s.id === uploadSectionId);
    const top = sec?.topics.find((t) => t.id === uploadTopicId);

    const res = await uploadStudyFile(
      user.id,
      selectedFile,
      uploadSubjectId,
      subj?.name || uploadSubjectId,
      uploadSectionId || null,
      sec?.name || "",
      uploadTopicId || null,
      top?.name || ""
    );

    setUploading(false);
    if (res.success && res.file) {
      setFiles((prev) => [res.file!, ...prev]);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setIsUploadOpen(false);
      }, 1500);

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setUploadError(res.error || "Failed to upload file. Please try again.");
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
  }, [files, searchQuery, examFilter, filterSubjectId, filterSectionId, filterTopicId, filterSelectedSubject]);

  const getFileBadge = (filename: string, fileType: string) => {
    const ext = filename.split(".").pop()?.toUpperCase() || "FILE";
    const isPdf = ext === "PDF" || fileType.includes("pdf");

    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
          isPdf
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-blue-gray-50 text-blue-gray-700 border-blue-gray-200"
        }`}
      >
        {ext}
      </span>
    );
  };

  return (
    <AppLayout
      title="Study Library"
      subtitle="Personal study-material library &bull; Upload and attach your PDFs to UPSC subjects, chapters, and topics"
    >
      <div className="space-y-6 max-w-6xl">
        {/* TOP BAR: SEARCH & UPLOAD BUTTON */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 sm:max-w-md">
            <MagnifyingGlassIcon className="w-4 h-4 text-blue-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search study material..."
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

          <Button
            size="sm"
            onClick={() => {
              setIsUploadOpen(true);
              setUploadError("");
              setUploadSuccess(false);
            }}
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 normal-case font-semibold text-xs py-2.5 px-4 shadow-xs shrink-0"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>+ Upload File</span>
          </Button>
        </div>

        {/* HIERARCHICAL FILTERS: Exam -> Subject -> Section -> Topic */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardBody className="p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* Exam */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
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
                  className="w-full bg-white border border-blue-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-gray-800 focus:outline-none focus:border-gray-900"
                >
                  <option value="All">All Exams</option>
                  <option value="Prelims">Prelims</option>
                  <option value="Mains">Mains</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <select
                  value={filterSubjectId}
                  onChange={(e) => {
                    setFilterSubjectId(e.target.value);
                    setFilterSectionId("all");
                    setFilterTopicId("all");
                  }}
                  className="w-full bg-white border border-blue-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-gray-800 focus:outline-none focus:border-gray-900"
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
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Section / Chapter
                </label>
                <select
                  value={filterSectionId}
                  disabled={filterSubjectId === "all" || !filterSelectedSubject}
                  onChange={(e) => {
                    setFilterSectionId(e.target.value);
                    setFilterTopicId("all");
                  }}
                  className="w-full bg-white border border-blue-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-gray-800 focus:outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
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
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Topic
                </label>
                <select
                  value={filterTopicId}
                  disabled={filterSectionId === "all" || !filterSelectedSection}
                  onChange={(e) => setFilterTopicId(e.target.value)}
                  className="w-full bg-white border border-blue-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-gray-800 focus:outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <ExclamationTriangleIcon className="w-4 h-4 shrink-0 text-red-600" />
            <span>{actionError}</span>
          </div>
        )}

        {/* FILE LIST OR EMPTY STATE */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            Loading your study library...
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardBody className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-gray-50 text-blue-gray-400 flex items-center justify-center mx-auto mb-3">
                <FolderOpenIcon className="w-6 h-6" />
              </div>
              <Typography variant="h6" color="blue-gray" className="font-bold mb-1">
                No study material yet
              </Typography>
              <Typography variant="small" className="text-gray-500 text-xs mb-4">
                {searchQuery || filterSubjectId !== "all"
                  ? "No files match your search and filter criteria."
                  : "Upload your first PDF or study file."}
              </Typography>
              <Button
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 normal-case font-semibold text-xs px-4 py-2"
              >
                Upload File
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
                  className="p-3.5 rounded-xl border border-blue-gray-100 bg-white hover:border-blue-gray-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* File Info & Hierarchy */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gray-50 border border-blue-gray-100 flex items-center justify-center text-gray-700 shrink-0 mt-0.5">
                      <DocumentTextIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-gray-900 truncate max-w-sm" title={file.filename}>
                          {file.filename}
                        </span>
                        {getFileBadge(file.filename, file.file_type)}
                      </div>

                      {/* Hierarchy Badges: Subject -> Section -> Topic */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 font-medium mb-1">
                        {file.subject_name && (
                          <span className="px-2 py-0.5 rounded bg-blue-gray-50 text-blue-gray-800 font-semibold text-[10px]">
                            {file.subject_name}
                          </span>
                        )}
                        {file.section_name && (
                          <>
                            <span className="text-gray-300">&rarr;</span>
                            <span className="text-gray-600 text-[10px]">
                              {file.section_name}
                            </span>
                          </>
                        )}
                        {file.topic_name && (
                          <>
                            <span className="text-gray-300">&rarr;</span>
                            <span className="text-gray-900 font-bold text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                              {file.topic_name}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>&bull;</span>
                        <span>Uploaded {formatShortDate(file.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Link to Topic */}
                    <button
                      type="button"
                      onClick={() => openLinkDialog(file)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-gray-200 hover:border-gray-900 text-xs font-semibold text-blue-gray-700 hover:bg-gray-50 transition-colors"
                      title="Attach or re-link file to a syllabus topic"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{file.topic_name ? "Re-link" : "Link Topic"}</span>
                    </button>

                    {/* Open in Browser */}
                    {isPdf && (
                      <button
                        type="button"
                        onClick={() => handleOpenInBrowser(file)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-900 bg-gray-900 text-white hover:bg-gray-800 text-xs font-semibold transition-colors shadow-xs"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-gray-200 hover:border-gray-900 text-xs font-semibold text-blue-gray-800 hover:bg-gray-50 transition-colors"
                      title="Download file"
                    >
                      <ArrowDownTrayIcon className="w-3.5 h-3.5 text-gray-700" />
                      <span>Download</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      disabled={deletingId === file.id}
                      onClick={() => handleDelete(file)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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

        {/* UPLOAD DIALOG MODAL */}
        <Dialog open={isUploadOpen} handler={() => !uploading && setIsUploadOpen(false)} size="sm">
          <form onSubmit={handleUpload}>
            <DialogHeader className="text-sm font-bold text-blue-gray-900 border-b border-blue-gray-100 flex items-center justify-between pb-3">
              <span>Upload Study Material (PDF &bull; Max 50 MB)</span>
              {!uploading && (
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </DialogHeader>

            <DialogBody className="space-y-4 py-4 max-h-[75vh] overflow-y-auto">
              {uploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-700 animate-in fade-in">
                  <CheckCircleIcon className="w-4 h-4 shrink-0" />
                  <span>File uploaded successfully to your library!</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
                  {uploadError}
                </div>
              )}

              {/* 1. Choose File */}
              <div>
                <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                  1. Choose File <span className="text-gray-400 font-normal">(PDF, DOC, PPT, XLS, PNG, JPG)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_EXTENSIONS}
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="w-full text-xs text-blue-gray-800 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer border border-blue-gray-200 rounded-xl p-2 bg-gray-50/50"
                />
                {selectedFile && (
                  <p className="mt-1.5 text-[11px] text-gray-500 font-medium">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              {/* 2. Subject Dropdown */}
              <div>
                <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                  2. UPSC Subject
                </label>
                <select
                  value={uploadSubjectId}
                  onChange={(e) => handleUploadSubjectChange(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-white border border-blue-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 focus:outline-none focus:border-gray-900 shadow-xs"
                >
                  {MASTER_SYLLABUS.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.exam}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Section Dropdown (Optional) */}
              <div>
                <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                  3. Section / Chapter <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={uploadSectionId}
                  onChange={(e) => handleUploadSectionChange(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-white border border-blue-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 focus:outline-none focus:border-gray-900 shadow-xs"
                >
                  <option value="">-- No specific section (Belongs to subject) --</option>
                  {uploadCurrentSubj?.sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Topic Dropdown (Optional) */}
              <div>
                <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                  4. Topic <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={uploadTopicId}
                  onChange={(e) => setUploadTopicId(e.target.value)}
                  disabled={uploading || !uploadSectionId}
                  className="w-full bg-white border border-blue-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 focus:outline-none focus:border-gray-900 shadow-xs disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">-- No specific topic (Belongs to section) --</option>
                  {uploadCurrentSec?.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </DialogBody>

            <DialogFooter className="border-t border-blue-gray-100 flex items-center justify-end gap-2 pt-3">
              <Button
                variant="text"
                size="sm"
                disabled={uploading}
                onClick={() => setIsUploadOpen(false)}
                className="text-xs font-semibold normal-case text-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!selectedFile || uploading}
                className="bg-gray-900 hover:bg-gray-800 normal-case font-semibold text-xs px-4 py-2"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* LINK EXISTING FILE DIALOG MODAL */}
        <Dialog open={Boolean(linkingFile)} handler={() => !savingLink && setLinkingFile(null)} size="sm">
          <form onSubmit={handleSaveLink}>
            <DialogHeader className="text-sm font-bold text-blue-gray-900 border-b border-blue-gray-100 flex items-center justify-between pb-3">
              <span>Connect File to Syllabus</span>
              {!savingLink && (
                <button
                  type="button"
                  onClick={() => setLinkingFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </DialogHeader>

            <DialogBody className="space-y-4 py-4">
              {linkSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-700 animate-in fade-in">
                  <CheckCircleIcon className="w-4 h-4 shrink-0" />
                  <span>Topic linked successfully!</span>
                </div>
              )}

              <div className="p-2.5 bg-blue-gray-50/70 rounded-lg border border-blue-gray-100">
                <span className="text-[11px] text-gray-500 font-medium">Selected File:</span>
                <p className="text-xs font-bold text-blue-gray-900 truncate">{linkingFile?.filename}</p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                  Subject
                </label>
                <select
                  value={linkSubjectId}
                  onChange={(e) => {
                    setLinkSubjectId(e.target.value);
                    setLinkSectionId("");
                    setLinkTopicId("");
                  }}
                  className="w-full bg-white border border-blue-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 focus:outline-none focus:border-gray-900 shadow-xs"
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
                <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                  Section / Chapter <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={linkSectionId}
                  onChange={(e) => {
                    setLinkSectionId(e.target.value);
                    setLinkTopicId("");
                  }}
                  className="w-full bg-white border border-blue-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 focus:outline-none focus:border-gray-900 shadow-xs"
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
                <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                  Topic <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={linkTopicId}
                  onChange={(e) => setLinkTopicId(e.target.value)}
                  disabled={!linkSectionId}
                  className="w-full bg-white border border-blue-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-blue-gray-800 focus:outline-none focus:border-gray-900 shadow-xs disabled:bg-gray-50 disabled:text-gray-400"
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

            <DialogFooter className="border-t border-blue-gray-100 flex items-center justify-end gap-2 pt-3">
              <Button
                variant="text"
                size="sm"
                disabled={savingLink}
                onClick={() => setLinkingFile(null)}
                className="text-xs font-semibold normal-case text-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingLink}
                className="bg-gray-900 hover:bg-gray-800 normal-case font-semibold text-xs px-4 py-2"
              >
                {savingLink ? "Saving..." : "Save Link"}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}

export default function FilesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading study library...</div>}>
      <FilesContent />
    </Suspense>
  );
}
