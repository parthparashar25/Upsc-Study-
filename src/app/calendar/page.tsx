"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Typography,
  Card,
  CardBody,
  Button,
  IconButton,
} from "@material-tailwind/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  fetchMonthSummary,
  fetchHabitsForDate,
  fetchDailyStats,
  fetchNotes,
  fetchSubjects,
} from "@/lib/api";
import { DailyStats, Note, Subject } from "@/types/database";
import { formatDisplayDate, formatDateToIso } from "@/lib/constants";

export default function CalendarPage() {
  const { user, profile } = useAuth();
  const todayIso = formatDateToIso(new Date());

  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1; // 1-12

  const [monthSummary, setMonthSummary] = useState<Record<string, any>>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dayCompletions, setDayCompletions] = useState<Record<string, boolean>>({});
  const [dayStats, setDayStats] = useState<DailyStats | null>(null);
  const [dayNotes, setDayNotes] = useState<Note[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Load subjects once
  useEffect(() => {
    fetchSubjects().then(setSubjects);
  }, []);

  // Fetch month summary
  useEffect(() => {
    if (!user) return;
    setLoadingSummary(true);
    fetchMonthSummary(user.id, year, month).then((data) => {
      setMonthSummary(data);
      setLoadingSummary(false);
    });
  }, [user, year, month]);

  // Fetch details for the selected date
  useEffect(() => {
    if (!user || !selectedDate) return;

    Promise.all([
      fetchHabitsForDate(user.id, selectedDate),
      fetchDailyStats(user.id, selectedDate),
      fetchNotes(user.id),
    ]).then(([habits, stats, notes]) => {
      setDayCompletions(habits);
      setDayStats(stats);
      const matchingNotes = notes.filter(
        (n) => n.created_at && n.created_at.startsWith(selectedDate)
      );
      setDayNotes(matchingNotes);
    });
  }, [user, selectedDate]);

  const prevMonth = () => {
    setDateObj(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setDateObj(new Date(year, month, 1));
  };

  const monthName = dateObj.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate days for the calendar grid
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon=0..Sun=6
  const daysInMonth = new Date(year, month, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < startOffset; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    daysArray.push(dStr);
  }

  const completedSubjects = subjects.filter((s) => dayCompletions[s.id]);
  const targetHours = profile?.daily_study_target || 4;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-gray-100 pb-4">
          <div>
            <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight">
              Study Calendar
            </Typography>
            <Typography variant="small" className="text-gray-500 font-medium mt-0.5">
              Review your monthly consistency, study duration, and revisions
            </Typography>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="sm"
              color="blue-gray"
              onClick={prevMonth}
              className="flex items-center gap-1 normal-case text-xs font-semibold py-1.5 px-3 border-blue-gray-200"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
              <span>&lt; Previous Month</span>
            </Button>

            <Typography variant="small" color="blue-gray" className="font-bold text-xs min-w-[120px] text-center">
              {monthName}
            </Typography>

            <Button
              variant="outlined"
              size="sm"
              color="blue-gray"
              onClick={nextMonth}
              className="flex items-center gap-1 normal-case text-xs font-semibold py-1.5 px-3 border-blue-gray-200"
            >
              <span>Next Month &gt;</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Main Grid + Date Detail Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Calendar Grid (2 cols) */}
          <Card className="lg:col-span-2 border border-blue-gray-100 shadow-sm">
            <CardBody className="p-5">
              {/* Legend */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-gray-50 text-xs text-gray-500">
                <span className="font-medium">Monthly Status</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm border border-blue-gray-200 bg-white" />
                    <span className="text-[11px]">No study</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-blue-gray-100 border border-blue-gray-300" />
                    <span className="text-[11px]">Partial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-gray-900" />
                    <span className="text-[11px]">Complete</span>
                  </div>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <Typography key={day} variant="small" className="text-[11px] font-bold text-blue-gray-400 py-1">
                    {day}
                  </Typography>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {daysArray.map((dateStr, idx) => {
                  if (!dateStr) {
                    return <div key={`empty-${idx}`} className="h-16 rounded" />;
                  }

                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === todayIso;
                  const dayNum = parseInt(dateStr.split("-")[2], 10);
                  const summary = monthSummary[dateStr];

                  const count = summary?.completedCount || 0;
                  const hours = summary?.studyHours || 0;
                  const hasActivity = count > 0 || hours > 0 || (summary?.pyqCount || 0) > 0;
                  const isComplete = count >= 4 || hours >= targetHours;

                  let cellStyle = "bg-white hover:bg-blue-gray-50/50 border-blue-gray-200 text-blue-gray-800";
                  if (isComplete) {
                    cellStyle = "bg-gray-900 text-white border-gray-900 hover:bg-gray-800";
                  } else if (hasActivity) {
                    cellStyle = "bg-blue-gray-100/70 border-blue-gray-300 text-blue-gray-900 hover:bg-blue-gray-200/60";
                  }

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-16 p-2 rounded-lg border flex flex-col justify-between text-left transition-all ${cellStyle} ${
                        isSelected ? "ring-2 ring-gray-900 ring-offset-1" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold ${isComplete ? "text-white" : isToday ? "underline font-extrabold text-blue-gray-900" : ""}`}>
                          {dayNum}
                        </span>
                        {isToday && (
                          <span className={`text-[9px] px-1 rounded font-semibold ${isComplete ? "bg-gray-800 text-gray-200" : "bg-blue-gray-200 text-blue-gray-800"}`}>
                            Today
                          </span>
                        )}
                      </div>

                      {hasActivity && (
                        <div className="text-[10px] font-medium truncate w-full">
                          {hours > 0 ? `${hours}h ` : ""}
                          {count > 0 ? `✓${count}` : ""}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Selected Date Information Pane (1 col) */}
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardBody className="p-5 space-y-4">
              <div className="border-b border-blue-gray-50 pb-3">
                <Typography variant="small" className="text-[10px] font-bold uppercase tracking-wider text-blue-gray-400">
                  Day Summary
                </Typography>
                <Typography variant="h6" color="blue-gray" className="font-bold text-sm mt-0.5">
                  {formatDisplayDate(selectedDate)}
                </Typography>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-gray-50/50 p-2.5 rounded-lg border border-blue-gray-100">
                  <span className="text-[10px] text-gray-400 font-semibold block">Study Time</span>
                  <span className="text-xs font-bold text-blue-gray-900">
                    {dayStats?.study_hours || 0}h {dayStats?.study_minutes ? `${dayStats.study_minutes}m` : ""}
                  </span>
                </div>
                <div className="bg-blue-gray-50/50 p-2.5 rounded-lg border border-blue-gray-100">
                  <span className="text-[10px] text-gray-400 font-semibold block">Revision</span>
                  <span className="text-xs font-bold text-blue-gray-900">
                    {dayStats?.revision_count || 0}
                  </span>
                </div>
                <div className="bg-blue-gray-50/50 p-2.5 rounded-lg border border-blue-gray-100">
                  <span className="text-[10px] text-gray-400 font-semibold block">PYQs</span>
                  <span className="text-xs font-bold text-blue-gray-900">
                    {dayStats?.pyq_count || 0}
                  </span>
                </div>
              </div>

              {/* Subjects Studied */}
              <div>
                <Typography variant="small" color="blue-gray" className="font-bold text-xs mb-2">
                  Subjects Studied ({completedSubjects.length})
                </Typography>

                {completedSubjects.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-blue-gray-50/50 p-3 rounded-lg text-center font-normal">
                    No subjects marked for this date.
                  </p>
                ) : (
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {completedSubjects.map((s) => (
                      <li
                        key={s.id}
                        className="text-xs text-blue-gray-800 flex items-center gap-2 bg-blue-gray-50/70 border border-blue-gray-100 px-2.5 py-1.5 rounded-md"
                      >
                        <CheckCircleIcon className="w-4 h-4 text-gray-900 flex-shrink-0" />
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{s.category}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Notes Created */}
              <div>
                <Typography variant="small" color="blue-gray" className="font-bold text-xs mb-2">
                  Notes ({dayNotes.length})
                </Typography>

                {dayNotes.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-blue-gray-50/50 p-3 rounded-lg text-center font-normal">
                    No notes created on this date.
                  </p>
                ) : (
                  <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {dayNotes.map((n) => (
                      <Link key={n.id} href="/notes">
                        <li className="p-2 rounded-md border border-blue-gray-100 hover:border-gray-900 bg-white text-xs cursor-pointer mb-1.5">
                          <p className="font-semibold text-blue-gray-900 truncate">{n.title}</p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {n.subject_name || "General"} {n.topic ? `• ${n.topic}` : ""}
                          </p>
                        </li>
                      </Link>
                    ))}
                  </ul>
                )}
              </div>

              {/* Quick Jump */}
              <div className="pt-2">
                <Link href="/dashboard" className="w-full">
                  <Button
                    size="sm"
                    variant="outlined"
                    color="blue-gray"
                    className="w-full flex items-center justify-center gap-1 normal-case text-xs font-semibold py-2 border-blue-gray-200"
                  >
                    <span>Track / Edit on Dashboard</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
