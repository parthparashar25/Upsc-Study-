"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Typography,
  Card,
  CardBody,
  Button,
} from "@material-tailwind/react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Note, Subject } from "@/types/database";
import { fetchNotes, saveNote, deleteNote, fetchSubjects } from "@/lib/api";
import { formatShortDate } from "@/lib/constants";

function NotesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialNew = searchParams.get("new") === "true";

  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [loading, setLoading] = useState(true);

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({
    title: "",
    subject_id: "",
    topic: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load notes and subjects
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([fetchNotes(user.id), fetchSubjects()]).then(([notesData, subjectsData]) => {
      setNotes(notesData);
      setSubjects(subjectsData);
      setLoading(false);

      if (initialNew) {
        handleNewNote();
      }
    });
  }, [user, initialNew]);

  const handleNewNote = () => {
    setCurrentNote({
      title: "",
      subject_id: subjects[0]?.id || "",
      topic: "",
      content: "",
    });
    setErrorMsg("");
    setIsEditing(true);
  };

  const handleOpenNote = (note: Note) => {
    setCurrentNote({ ...note });
    setErrorMsg("");
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!currentNote.title?.trim()) {
      setErrorMsg("Please enter a note title.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const subj = subjects.find((s) => s.id === currentNote.subject_id);
    const res = await saveNote(user.id, {
      ...currentNote,
      subject_name: subj?.name || "",
    });

    setSaving(false);
    if (res.success) {
      const updatedNotes = await fetchNotes(user.id);
      setNotes(updatedNotes);
      setIsEditing(false);
    } else {
      setErrorMsg("Could not save note. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!user || !currentNote.id) return;
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    setSaving(true);
    const ok = await deleteNote(user.id, currentNote.id);
    setSaving(false);

    if (ok) {
      setNotes((prev) => prev.filter((n) => n.id !== currentNote.id));
      setIsEditing(false);
    } else {
      setErrorMsg("Could not delete note.");
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesSearch =
        searchQuery === "" ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubj = selectedSubjectId === "all" || n.subject_id === selectedSubjectId;
      return matchesSearch && matchesSubj;
    });
  }, [notes, searchQuery, selectedSubjectId]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-gray-100 pb-4">
          <div>
            <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight">
              Personal Notes
            </Typography>
            <Typography variant="small" className="text-gray-500 font-medium mt-0.5">
              Personal study notes, constitutional articles, and topic summaries
            </Typography>
          </div>

          {!isEditing && (
            <Button
              size="sm"
              color="gray"
              onClick={handleNewNote}
              className="flex items-center gap-1.5 normal-case font-semibold text-xs py-2 px-3.5 bg-gray-900 hover:bg-gray-800"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Note</span>
            </Button>
          )}
        </div>

        {isEditing ? (
          /* NOTE EDITOR */
          <Card className="border border-blue-gray-100 shadow-sm animate-in fade-in">
            <CardBody className="p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-blue-gray-50">
                <Button
                  variant="text"
                  size="sm"
                  color="blue-gray"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1 normal-case text-xs font-semibold p-1"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back to Notes</span>
                </Button>

                {currentNote.id && (
                  <Button
                    variant="text"
                    size="sm"
                    color="red"
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex items-center gap-1 normal-case text-xs font-semibold py-1 px-2.5 text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Delete</span>
                  </Button>
                )}
              </div>

              {errorMsg && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={currentNote.title || ""}
                    onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                    placeholder="e.g. Fundamental Rights"
                    className="w-full px-3 py-2 text-sm font-semibold border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
                  />
                </div>

                {/* Subject & Topic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={currentNote.subject_id || ""}
                      onChange={(e) => setCurrentNote({ ...currentNote, subject_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-900 font-medium text-blue-gray-800"
                    >
                      <option value="">Select Subject...</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={currentNote.topic || ""}
                      onChange={(e) => setCurrentNote({ ...currentNote, topic: e.target.value })}
                      placeholder="e.g. Article 14"
                      className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900 font-medium"
                    />
                  </div>
                </div>

                {/* Content Textarea */}
                <div>
                  <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    rows={10}
                    value={currentNote.content || ""}
                    onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                    placeholder="Write your study notes here..."
                    className="w-full px-3 py-2.5 text-xs font-mono leading-relaxed border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900 resize-y"
                  />
                </div>

                {/* Save button */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-gray-50">
                  <Button
                    type="button"
                    variant="text"
                    size="sm"
                    color="blue-gray"
                    onClick={() => setIsEditing(false)}
                    className="normal-case text-xs font-semibold py-2 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    color="gray"
                    disabled={saving}
                    className="normal-case font-semibold text-xs py-2 px-4 bg-gray-900 hover:bg-gray-800"
                  >
                    {saving ? "Saving..." : "Save Note"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        ) : (
          /* NOTES LIST */
          <div className="space-y-4">
            {/* Search & Subject filter */}
            <Card className="border border-blue-gray-100 shadow-sm">
              <CardBody className="p-3.5 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-blue-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="w-full pl-9 pr-4 py-2 text-xs border border-blue-gray-200 rounded-lg bg-blue-gray-50/40 focus:bg-white focus:outline-none focus:border-gray-900"
                  />
                </div>

                <div className="w-full sm:w-56">
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg bg-blue-gray-50/40 focus:bg-white focus:outline-none focus:border-gray-900 font-medium"
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardBody>
            </Card>

            {/* Note Cards */}
            {loading ? (
              <Typography variant="small" className="text-center py-12 text-gray-400">
                Loading notes...
              </Typography>
            ) : filteredNotes.length === 0 ? (
              <Card className="border border-blue-gray-100 shadow-sm text-center p-12">
                <DocumentTextIcon className="w-10 h-10 mx-auto text-blue-gray-200 mb-2" />
                <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                  No notes found
                </Typography>
                <Typography variant="small" className="text-gray-400 text-xs mt-1">
                  Click "+ New Note" to start writing your personal study notes.
                </Typography>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredNotes.map((note) => {
                  const dateStr = formatShortDate(
                    note.updated_at ? note.updated_at.split("T")[0] : ""
                  );
                  return (
                    <Card
                      key={note.id}
                      onClick={() => handleOpenNote(note)}
                      className="border border-blue-gray-100 shadow-sm hover:border-gray-900 cursor-pointer transition-all hover:shadow-xs"
                    >
                      <CardBody className="p-4 flex flex-col justify-between h-full">
                        <div>
                          <Typography variant="h6" color="blue-gray" className="font-bold text-sm line-clamp-1">
                            {note.title}
                          </Typography>
                          <Typography variant="small" className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-blue-gray-700">
                              {note.subject_name || "General"}
                            </span>
                            {note.topic && (
                              <>
                                <span>&bull;</span>
                                <span className="text-gray-500">{note.topic}</span>
                              </>
                            )}
                          </Typography>
                          {note.content && (
                            <Typography variant="small" className="text-xs text-gray-600 mt-2.5 line-clamp-3 leading-relaxed font-normal">
                              {note.content}
                            </Typography>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-blue-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                          <span>Updated: {dateStr || "Recently"}</span>
                          <span className="text-gray-900 font-bold hover:underline">Edit &rarr;</span>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading notes...</div>}>
      <NotesContent />
    </Suspense>
  );
}
