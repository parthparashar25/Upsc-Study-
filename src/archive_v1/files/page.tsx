"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  DocumentIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  FolderOpenIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { StudyFile, Subject } from "@/types/database";
import {
  fetchStudyFiles,
  uploadStudyFile,
  deleteStudyFile,
  getFileDownloadUrl,
  fetchSubjects,
} from "@/lib/api";
import { formatFileSize, formatShortDate, ALLOWED_EXTENSIONS } from "@/lib/constants";

function FilesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialUpload = searchParams.get("upload") === "true";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<StudyFile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Load files and subjects
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([fetchStudyFiles(user.id), fetchSubjects()]).then(([filesData, subjectsData]) => {
      setFiles(filesData);
      setSubjects(subjectsData);
      setLoading(false);

      if (initialUpload) {
        setIsUploadOpen(true);
      }
    });
  }, [user, initialUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      setUploadError("File exceeds 50 MB limit.");
      return;
    }

    setUploading(true);
    setUploadError("");

    const subj = subjects.find((s) => s.id === selectedSubjectId);
    const res = await uploadStudyFile(
      user.id,
      selectedFile,
      selectedSubjectId || null,
      subj?.name
    );

    setUploading(false);
    if (res.success && res.file) {
      setFiles((prev) => [res.file!, ...prev]);
      setIsUploadOpen(false);
      setSelectedFile(null);
      setSelectedSubjectId("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      setUploadError(res.error || "Failed to upload file.");
    }
  };

  const handleDelete = async (file: StudyFile) => {
    if (!user) return;
    if (!window.confirm(`Delete file "${file.filename}"?`)) return;

    const ok = await deleteStudyFile(user.id, file.id, file.storage_path);
    if (ok) {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    }
  };

  const handleOpenOrDownload = async (file: StudyFile, download = false) => {
    if (file.download_url) {
      const a = document.createElement("a");
      a.href = file.download_url;
      a.download = file.filename;
      if (download) {
        a.click();
      } else {
        window.open(file.download_url, "_blank");
      }
      return;
    }

    const signedUrl = await getFileDownloadUrl(file.storage_path);
    if (signedUrl) {
      if (download) {
        const a = document.createElement("a");
        a.href = signedUrl;
        a.download = file.filename;
        a.click();
      } else {
        window.open(signedUrl, "_blank");
      }
    } else {
      alert("Could not generate file link.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-gray-100 pb-4">
          <div>
            <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight">
              Personal Files
            </Typography>
            <Typography variant="small" className="text-gray-500 font-medium mt-0.5">
              Personal study materials, syllabus PDFs, and previous year papers
            </Typography>
          </div>

          <Button
            size="sm"
            color="gray"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 normal-case font-semibold text-xs py-2 px-3.5 bg-gray-900 hover:bg-gray-800"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>Upload File</span>
          </Button>
        </div>

        {/* Upload Modal */}
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
            <Card className="max-w-md w-full border border-blue-gray-100 shadow-xl bg-white">
              <CardBody className="p-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-blue-gray-50">
                  <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                    Upload Study Material
                  </Typography>
                  <button
                    onClick={() => setIsUploadOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {uploadError && (
                  <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    {uploadError}
                  </div>
                )}

                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                      Choose File
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      required
                      accept={ALLOWED_EXTENSIONS}
                      onChange={handleFileChange}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer border border-blue-gray-200 rounded-lg p-1.5"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG (Max 50MB)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                      Subject (Optional)
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-900 font-medium"
                    >
                      <option value="">None / General Material</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-blue-gray-50">
                    <Button
                      type="button"
                      variant="text"
                      size="sm"
                      color="blue-gray"
                      onClick={() => setIsUploadOpen(false)}
                      className="normal-case text-xs font-semibold py-2 px-3"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      color="gray"
                      disabled={uploading || !selectedFile}
                      className="normal-case font-semibold text-xs py-2 px-4 bg-gray-900 hover:bg-gray-800"
                    >
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Files Table */}
        <Card className="border border-blue-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <Typography variant="small" className="text-center py-12 text-gray-400">
              Loading files...
            </Typography>
          ) : files.length === 0 ? (
            <div className="py-16 text-center">
              <FolderOpenIcon className="w-12 h-12 mx-auto text-blue-gray-200 mb-2" />
              <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                No study files uploaded yet
              </Typography>
              <Typography variant="small" className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                Keep your UPSC study materials, previous papers, and revision notes stored securely for personal reference.
              </Typography>
              <Button
                size="sm"
                variant="outlined"
                color="blue-gray"
                onClick={() => setIsUploadOpen(true)}
                className="mt-4 normal-case text-xs font-semibold py-2 px-3.5 border-blue-gray-200"
              >
                Upload First File
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-blue-gray-50/50 border-b border-blue-gray-100 text-blue-gray-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Filename</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">File Size</th>
                    <th className="py-3 px-4">Upload Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-gray-50 text-blue-gray-800 font-medium">
                  {files.map((f) => {
                    const dateStr = formatShortDate(
                      f.created_at ? f.created_at.split("T")[0] : ""
                    );
                    return (
                      <tr key={f.id} className="hover:bg-blue-gray-50/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-blue-gray-900">
                          <div className="flex items-center gap-2">
                            <DocumentIcon className="w-4 h-4 text-blue-gray-500" />
                            <span className="truncate max-w-xs">{f.filename}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {f.subject_name ? (
                            <span className="bg-blue-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold text-blue-gray-800">
                              {f.subject_name}
                            </span>
                          ) : (
                            <span className="text-gray-400">&mdash;</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500">
                          {formatFileSize(f.file_size)}
                        </td>
                        <td className="py-3 px-4 text-gray-500">{dateStr || "Recently"}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenOrDownload(f, false)}
                              title="Open File"
                              className="p-1.5 text-blue-gray-600 hover:text-gray-900 hover:bg-blue-gray-100 rounded"
                            >
                              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenOrDownload(f, true)}
                              title="Download File"
                              className="p-1.5 text-blue-gray-600 hover:text-gray-900 hover:bg-blue-gray-100 rounded"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(f)}
                              title="Delete File"
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

export default function FilesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading files...</div>}>
      <FilesContent />
    </Suspense>
  );
}
