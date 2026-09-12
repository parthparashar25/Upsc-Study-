"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  BookOpenIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClockIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  XMarkIcon,
  SparklesIcon,
  FunnelIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { ReferenceBook, BookReadingStatus, BookImportance, StudyFile } from "@/types/database";
import {
  fetchReferenceBooks,
  updateBookStatus,
  attachFileToBook,
  uploadBookPdf,
  createCustomBook,
  deleteCustomBook,
  fetchStudyFiles,
  getFileDownloadUrl,
} from "@/lib/api";
import { BOOK_SUBJECT_FILTERS } from "@/lib/books-data";

export default function BooksPage() {
  const { user } = useAuth();
  const userId = user?.id || "demo-user";

  const [books, setBooks] = useState<ReferenceBook[]>([]);
  const [libraryFiles, setLibraryFiles] = useState<StudyFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"All" | BookReadingStatus>("All");
  const [selectedImportance, setSelectedImportance] = useState<"All" | BookImportance>("All");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [activeBookForAttach, setActiveBookForAttach] = useState<ReferenceBook | null>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [activeBookForNotes, setActiveBookForNotes] = useState<ReferenceBook | null>(null);
  const [bookNotesDraft, setBookNotesDraft] = useState("");

  // PDF In-App Preview Modal
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>("");

  // Attach Modal Form State
  const [attachMode, setAttachMode] = useState<"upload" | "library">("upload");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedLibraryFile, setSelectedLibraryFile] = useState<StudyFile | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const attachFileInputRef = useRef<HTMLInputElement>(null);

  // Add Custom Book Form State
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [customSubjectId, setCustomSubjectId] = useState("polity");
  const [customCategory, setCustomCategory] = useState("Standard Reference");
  const [customImportance, setCustomImportance] = useState<BookImportance>("Recommended");
  const [customEdition, setCustomEdition] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [isCreatingBook, setIsCreatingBook] = useState(false);

  // Load Reference Books & User Library Files
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedBooks, loadedFiles] = await Promise.all([
        fetchReferenceBooks(userId),
        fetchStudyFiles(userId),
      ]);
      setBooks(loadedBooks);
      setLibraryFiles(loadedFiles);
    } catch (err) {
      console.error("Error loading reference books:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Reading Status Change
  const handleStatusChange = async (book: ReferenceBook, newStatus: BookReadingStatus) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, status: newStatus } : b))
    );
    await updateBookStatus(userId, book.id, newStatus);
  };

  // Open Notes Modal
  const handleOpenNotes = (book: ReferenceBook) => {
    setActiveBookForNotes(book);
    setBookNotesDraft(book.notes || "");
    setNotesModalOpen(true);
  };

  // Save Book Notes
  const handleSaveNotes = async () => {
    if (!activeBookForNotes) return;
    const updatedNotes = bookNotesDraft.trim();
    setBooks((prev) =>
      prev.map((b) => (b.id === activeBookForNotes.id ? { ...b, notes: updatedNotes } : b))
    );
    setNotesModalOpen(false);
    await updateBookStatus(userId, activeBookForNotes.id, activeBookForNotes.status, updatedNotes);
  };

  // Open Attach PDF Modal
  const handleOpenAttachModal = (book: ReferenceBook) => {
    setActiveBookForAttach(book);
    setUploadFile(null);
    setSelectedLibraryFile(null);
    setAttachMode("upload");
    setAttachModalOpen(true);
  };

  // Handle Attach Submission (Upload or Library link)
  const handleConfirmAttach = async () => {
    if (!activeBookForAttach) return;
    setIsAttaching(true);

    try {
      if (attachMode === "upload" && uploadFile) {
        const res = await uploadBookPdf(
          userId,
          activeBookForAttach.id,
          uploadFile,
          activeBookForAttach.title,
          activeBookForAttach.subject_name
        );
        if (res.success && res.book) {
          setBooks((prev) =>
            prev.map((b) => (b.id === activeBookForAttach.id ? res.book! : b))
          );
        }
      } else if (attachMode === "library" && selectedLibraryFile) {
        let downloadUrl = selectedLibraryFile.download_url;
        if (!downloadUrl && selectedLibraryFile.storage_path) {
          downloadUrl = (await getFileDownloadUrl(selectedLibraryFile.storage_path)) || undefined;
        }

        await attachFileToBook(
          userId,
          activeBookForAttach.id,
          selectedLibraryFile.storage_path,
          downloadUrl
        );

        setBooks((prev) =>
          prev.map((b) =>
            b.id === activeBookForAttach.id
              ? {
                  ...b,
                  storage_path: selectedLibraryFile.storage_path,
                  download_url: downloadUrl,
                }
              : b
          )
        );
      }
      setAttachModalOpen(false);
    } catch (err) {
      console.error("Error attaching PDF:", err);
    } finally {
      setIsAttaching(false);
    }
  };

  // Open In-App PDF Preview
  const handleOpenPdfPreview = (book: ReferenceBook) => {
    if (!book.download_url) return;
    setPreviewPdfUrl(book.download_url);
    setPreviewPdfTitle(book.title);
    setPdfPreviewModalOpen(true);
  };

  // Handle Create Custom Book
  const handleCreateCustomBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    setIsCreatingBook(true);
    try {
      const subjectObj = BOOK_SUBJECT_FILTERS.find((s) => s.id === customSubjectId);
      const subjectName = subjectObj ? subjectObj.name : "General Studies";

      const newBook = await createCustomBook(userId, {
        title: customTitle.trim(),
        author: customAuthor.trim() || "Independent / Coaching",
        subject_id: customSubjectId,
        subject_name: subjectName,
        category: customCategory,
        importance: customImportance,
        edition: customEdition.trim() || "Latest Edition",
        description: customDescription.trim() || "Custom reference resource for UPSC preparation.",
        status: "To Read",
        notes: "",
        storage_path: null,
        download_url: null,
      });

      setBooks((prev) => [newBook, ...prev]);
      setAddModalOpen(false);

      // Reset form
      setCustomTitle("");
      setCustomAuthor("");
      setCustomEdition("");
      setCustomDescription("");
    } catch (err) {
      console.error("Error creating custom book:", err);
    } finally {
      setIsCreatingBook(false);
    }
  };

  // Handle Delete Custom Book
  const handleDeleteCustomBook = async (bookId: string) => {
    if (!confirm("Are you sure you want to remove this custom book?")) return;
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    await deleteCustomBook(userId, bookId);
  };

  // Filtered Books Memo
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(query);
        const matchAuthor = b.author.toLowerCase().includes(query);
        const matchDesc = (b.description || "").toLowerCase().includes(query);
        const matchNotes = (b.notes || "").toLowerCase().includes(query);
        if (!matchTitle && !matchAuthor && !matchDesc && !matchNotes) {
          return false;
        }
      }

      // Subject filter
      if (selectedSubject !== "all") {
        if (selectedSubject === "custom") {
          if (!b.id.startsWith("custom-book-")) return false;
        } else if (b.subject_id !== selectedSubject) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== "All" && b.status !== selectedStatus) {
        return false;
      }

      // Importance filter
      if (selectedImportance !== "All" && b.importance !== selectedImportance) {
        return false;
      }

      return true;
    });
  }, [books, searchQuery, selectedSubject, selectedStatus, selectedImportance]);

  // Stats calculation
  const totalCount = books.length;
  const toReadCount = books.filter((b) => b.status === "To Read").length;
  const readingCount = books.filter((b) => b.status === "Reading").length;
  const completedCount = books.filter((b) => b.status === "Completed").length;
  const attachedPdfCount = books.filter((b) => Boolean(b.storage_path || b.download_url)).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <AppLayout
      title="Textbooks & Reference Books"
      subtitle="Standard UPSC reference books catalog, reading status tracker, and cross-device PDF library"
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* 1. Top Overview & Progress Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total Catalog
                </Typography>
                <Typography variant="h5" color="blue-gray" className="font-bold dark:text-white mt-0.5">
                  {totalCount}
                </Typography>
                <span className="text-[11px] text-gray-400">Standard + Custom</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BuildingLibraryIcon className="w-5 h-5" />
              </div>
            </CardBody>
          </Card>

          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  In Progress
                </Typography>
                <Typography variant="h5" color="blue-gray" className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {readingCount}
                </Typography>
                <span className="text-[11px] text-gray-400">Actively Reading</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ClockIcon className="w-5 h-5" />
              </div>
            </CardBody>
          </Card>

          <Card className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Completed
                </Typography>
                <Typography variant="h5" color="blue-gray" className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {completedCount}
                </Typography>
                <span className="text-[11px] text-gray-400">{completionRate}% finished</span>
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
                  To Read
                </Typography>
                <Typography variant="h5" color="blue-gray" className="font-bold dark:text-white mt-0.5">
                  {toReadCount}
                </Typography>
                <span className="text-[11px] text-gray-400">In reading queue</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                <BookmarkIcon className="w-5 h-5" />
              </div>
            </CardBody>
          </Card>

          <Card className="col-span-2 sm:col-span-2 lg:col-span-1 border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none">
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  PDFs Attached
                </Typography>
                <Typography variant="h5" color="blue-gray" className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {attachedPdfCount}
                </Typography>
                <span className="text-[11px] text-gray-400">Cloud Synced across devices</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FolderIcon className="w-5 h-5" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 2. Action Bar: Search, Filters & Add Custom Book */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-blue-gray-100 dark:border-gray-800">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by book title, author, edition, or notes..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Reading Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="All">All Reading Status</option>
              <option value="To Read">To Read</option>
              <option value="Reading">Currently Reading</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Importance Filter */}
            <select
              value={selectedImportance}
              onChange={(e) => setSelectedImportance(e.target.value as any)}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="All">All Importance</option>
              <option value="Essential">Essential (Core Books)</option>
              <option value="Recommended">Recommended</option>
              <option value="Reference">Reference</option>
            </select>
          </div>

          {/* Add Custom Book Button */}
          <Button
            onClick={() => setAddModalOpen(true)}
            size="sm"
            className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-none hover:shadow-xs py-2.5 px-4 font-semibold text-xs"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Custom Book</span>
          </Button>
        </div>

        {/* 3. Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {BOOK_SUBJECT_FILTERS.map((s) => {
            const isSelected = selectedSubject === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {s.name}
              </button>
            );
          })}
          <button
            onClick={() => setSelectedSubject("custom")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedSubject === "custom"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            }`}
          >
            My Custom Books
          </button>
        </div>

        {/* 4. Books Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400">
              Loading UPSC Reference Books & Cloud Library...
            </Typography>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-8">
            <BuildingLibraryIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <Typography variant="h6" color="blue-gray" className="font-bold dark:text-white">
              No books found
            </Typography>
            <Typography variant="small" className="text-gray-500 dark:text-gray-400 text-xs mt-1 max-w-sm mx-auto">
              No reference books match your search or filter criteria. Try resetting your filters or add a new custom book.
            </Typography>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedSubject("all");
                setSelectedStatus("All");
                setSelectedImportance("All");
              }}
              size="sm"
              variant="text"
              className="mt-4 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => {
              const isCustom = book.id.startsWith("custom-book-");
              const hasPdf = Boolean(book.storage_path || book.download_url);

              return (
                <Card
                  key={book.id}
                  className="border border-blue-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl overflow-hidden hover:border-gray-400 dark:hover:border-gray-700 transition-all flex flex-col justify-between"
                >
                  <CardBody className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Badge Ribbon */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Importance Pill */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              book.importance === "Essential"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                : book.importance === "Recommended"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                : "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            }`}
                          >
                            {book.importance}
                          </span>

                          {/* Category Pill */}
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {book.category}
                          </span>
                        </div>

                        {/* Custom Book Delete */}
                        {isCustom && (
                          <button
                            onClick={() => handleDeleteCustomBook(book.id)}
                            title="Delete custom book"
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Title & Author */}
                      <Typography
                        variant="h6"
                        color="blue-gray"
                        className="font-bold text-base leading-snug dark:text-white line-clamp-2"
                      >
                        {book.title}
                      </Typography>

                      <div className="flex items-center gap-2 mt-1">
                        <Typography variant="small" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {book.author}
                        </Typography>
                        {book.edition && (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal">
                            • {book.edition}
                          </span>
                        )}
                      </div>

                      {/* Subject Name */}
                      <Typography variant="small" className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                        {book.subject_name}
                      </Typography>

                      {/* Description */}
                      {book.description && (
                        <Typography
                          variant="small"
                          className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed"
                        >
                          {book.description}
                        </Typography>
                      )}

                      {/* Personal Study Notes Preview */}
                      {book.notes && (
                        <div
                          onClick={() => handleOpenNotes(book)}
                          className="mt-2.5 p-2 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-lg cursor-pointer hover:bg-amber-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-0.5">
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                            <span>My Notes:</span>
                          </div>
                          <p className="text-[11px] text-amber-900 dark:text-amber-200 line-clamp-2 italic">
                            &ldquo;{book.notes}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: PDF Actions & Reading Status */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 space-y-3">
                      {/* Attached PDF Bar */}
                      <div className="flex items-center justify-between gap-2">
                        {hasPdf ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <DocumentTextIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                              PDF Attached
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                            No PDF attached
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {hasPdf ? (
                            <>
                              <button
                                onClick={() => handleOpenPdfPreview(book)}
                                title="Read PDF"
                                className="px-2 py-1 rounded bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-[11px] font-semibold flex items-center gap-1 hover:bg-gray-800 dark:hover:bg-gray-100"
                              >
                                <BookOpenIcon className="w-3.5 h-3.5" />
                                <span>Read</span>
                              </button>

                              {book.download_url && (
                                <a
                                  href={book.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open in new window / Download"
                                  className="p-1 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                onClick={() => handleOpenAttachModal(book)}
                                title="Change attached file"
                                className="p-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenAttachModal(book)}
                              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-medium flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                              <span>Attach PDF</span>
                            </button>
                          )}

                          {/* Notes Button */}
                          <button
                            onClick={() => handleOpenNotes(book)}
                            title="Edit notes"
                            className="p-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Status Selector Segmented Controls */}
                      <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-lg">
                        {(["To Read", "Reading", "Completed"] as BookReadingStatus[]).map((st) => {
                          const isActive = book.status === st;
                          return (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(book, st)}
                              className={`py-1 text-[11px] font-semibold rounded-md transition-all ${
                                isActive
                                  ? st === "Completed"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : st === "Reading"
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* 5. In-App PDF Preview Dialog */}
        <Dialog
          open={pdfPreviewModalOpen}
          handler={() => setPdfPreviewModalOpen(false)}
          size="xxl"
          className="bg-white dark:bg-gray-950 max-h-[95vh] flex flex-col p-0 overflow-hidden"
        >
          <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <Typography variant="h6" className="text-sm font-bold dark:text-white truncate max-w-lg">
                {previewPdfTitle}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              {previewPdfUrl && (
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
                >
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  <span>Open in Full Tab</span>
                </a>
              )}
              <button
                onClick={() => setPdfPreviewModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          <DialogBody className="p-0 flex-1 h-[80vh] bg-gray-100 dark:bg-gray-900">
            {previewPdfUrl ? (
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-none"
                title={previewPdfTitle}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Loading PDF...
              </div>
            )}
          </DialogBody>
        </Dialog>

        {/* 6. Attach PDF File Modal */}
        <Dialog
          open={attachModalOpen}
          handler={() => setAttachModalOpen(false)}
          size="md"
          className="bg-white dark:bg-gray-900 p-6 rounded-2xl"
        >
          <DialogHeader className="p-0 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <Typography variant="h6" className="font-bold dark:text-white text-base">
                Attach PDF to Reference Book
              </Typography>
              <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {activeBookForAttach?.title}
              </Typography>
            </div>
            <button
              onClick={() => setAttachModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </DialogHeader>

          <DialogBody className="p-0 py-4 space-y-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setAttachMode("upload")}
                className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  attachMode === "upload"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                <span>Upload New PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setAttachMode("library")}
                className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  attachMode === "library"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <FolderIcon className="w-4 h-4" />
                <span>Choose From Files ({libraryFiles.length})</span>
              </button>
            </div>

            {attachMode === "upload" ? (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={attachFileInputRef}
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div
                  onClick={() => attachFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-gray-500 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-800/50"
                >
                  <ArrowUpTrayIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  {uploadFile ? (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                        {uploadFile.name}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Click to select PDF file from device
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Accessible across all your devices once uploaded
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400">
                  Select an existing uploaded file from your cloud library:
                </Typography>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {libraryFiles.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4 text-center">
                      No files found in your library. Use &apos;Upload New PDF&apos; above.
                    </p>
                  ) : (
                    libraryFiles.map((file) => {
                      const isSelected = selectedLibraryFile?.id === file.id;
                      return (
                        <div
                          key={file.id}
                          onClick={() => setSelectedLibraryFile(file)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="font-semibold truncate">{file.filename}</p>
                            <p className={`text-[10px] ${isSelected ? "text-gray-300 dark:text-gray-600" : "text-gray-400"}`}>
                              {file.subject_name || "General"}
                            </p>
                          </div>
                          {isSelected && <CheckIcon className="w-4 h-4 shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="p-0 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
            <Button
              variant="text"
              size="sm"
              onClick={() => setAttachModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAttach}
              disabled={isAttaching || (attachMode === "upload" && !uploadFile) || (attachMode === "library" && !selectedLibraryFile)}
              size="sm"
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold"
            >
              {isAttaching ? "Attaching..." : "Save PDF Attachment"}
            </Button>
          </DialogFooter>
        </Dialog>

        {/* 7. Book Study Notes Modal */}
        <Dialog
          open={notesModalOpen}
          handler={() => setNotesModalOpen(false)}
          size="md"
          className="bg-white dark:bg-gray-900 p-6 rounded-2xl"
        >
          <DialogHeader className="p-0 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <Typography variant="h6" className="font-bold dark:text-white text-base">
                Book Study Notes & Revision Targets
              </Typography>
              <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {activeBookForNotes?.title}
              </Typography>
            </div>
            <button
              onClick={() => setNotesModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </DialogHeader>

          <DialogBody className="p-0 py-4">
            <textarea
              value={bookNotesDraft}
              onChange={(e) => setBookNotesDraft(e.target.value)}
              rows={6}
              placeholder="e.g. Read Chapters 1-15 for Prelims. High-yield topics: Preamble, Fundamental Rights, Emergency Provisions. Second revision pending before Mock Test 4."
              className="w-full p-3 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
            />
          </DialogBody>

          <DialogFooter className="p-0 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
            <Button
              variant="text"
              size="sm"
              onClick={() => setNotesModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotes}
              size="sm"
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </Dialog>

        {/* 8. Add Custom Book Modal */}
        <Dialog
          open={addModalOpen}
          handler={() => setAddModalOpen(false)}
          size="md"
          className="bg-white dark:bg-gray-900 p-6 rounded-2xl"
        >
          <DialogHeader className="p-0 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <Typography variant="h6" className="font-bold dark:text-white text-base">
                Add Custom Reference Book
              </Typography>
              <Typography variant="small" className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Add coaching modules, optional subject books, or state PCS materials
              </Typography>
            </div>
            <button
              onClick={() => setAddModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </DialogHeader>

          <form onSubmit={handleCreateCustomBook}>
            <DialogBody className="p-0 py-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. India Since Independence"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Author / Publication
                  </label>
                  <input
                    type="text"
                    value={customAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    placeholder="e.g. Bipin Chandra"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Edition / Volume
                  </label>
                  <input
                    type="text"
                    value={customEdition}
                    onChange={(e) => setCustomEdition(e.target.value)}
                    placeholder="e.g. Revised Edition"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Subject
                  </label>
                  <select
                    value={customSubjectId}
                    onChange={(e) => setCustomSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  >
                    {BOOK_SUBJECT_FILTERS.filter((s) => s.id !== "all").map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Importance
                  </label>
                  <select
                    value={customImportance}
                    onChange={(e) => setCustomImportance(e.target.value as BookImportance)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  >
                    <option value="Essential">Essential (Core)</option>
                    <option value="Recommended">Recommended</option>
                    <option value="Reference">Reference</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Description / Study Plan
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={3}
                  placeholder="Key topics, chapters or notes on this book..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
                />
              </div>
            </DialogBody>

            <DialogFooter className="p-0 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
              <Button
                variant="text"
                size="sm"
                onClick={() => setAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingBook || !customTitle.trim()}
                size="sm"
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold"
              >
                {isCreatingBook ? "Adding..." : "Add to Library"}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
