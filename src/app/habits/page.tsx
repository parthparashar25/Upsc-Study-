"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Card,
  CardBody,
  Button,
} from "@material-tailwind/react";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Subject } from "@/types/database";
import { fetchSubjects, fetchHabitsForDate, toggleHabitCompletion } from "@/lib/api";
import { formatDateToIso, formatDisplayDate } from "@/lib/constants";

type SectionTab = "all" | "prelims" | "gs1" | "gs2" | "gs3" | "gs4" | "other";

export default function HabitsPage() {
  const { user } = useAuth();
  const todayIso = useMemo(() => formatDateToIso(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<SectionTab>("all");
  const [loading, setLoading] = useState(true);

  // Load all subjects
  useEffect(() => {
    fetchSubjects().then(setSubjects);
  }, []);

  // Load completions for the selected date
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let isMounted = true;
    setLoading(true);

    fetchHabitsForDate(userId, selectedDate).then((data) => {
      if (isMounted) {
        setCompletions(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user, selectedDate]);

  // Handle instant toggle
  const handleToggle = async (subjectId: string) => {
    if (!user) return;
    const nextVal = !completions[subjectId];
    setCompletions((prev) => ({ ...prev, [subjectId]: nextVal }));

    const ok = await toggleHabitCompletion(user.id, subjectId, selectedDate, nextVal);
    if (!ok) {
      setCompletions((prev) => ({ ...prev, [subjectId]: !nextVal }));
    }
  };

  // Group subjects by category
  const prelimsSubjects = subjects.filter((s) => s.category === "Prelims");
  const gs1Subjects = subjects.filter((s) => s.category === "Mains" && s.paper === "GS1");
  const gs2Subjects = subjects.filter((s) => s.category === "Mains" && s.paper === "GS2");
  const gs3Subjects = subjects.filter((s) => s.category === "Mains" && s.paper === "GS3");
  const gs4Subjects = subjects.filter((s) => s.category === "Mains" && s.paper === "GS4");
  const otherSubjects = subjects.filter((s) => s.category === "Mains" && (s.paper === "Essay" || s.paper === "Optional"));

  const completedCount = Object.values(completions).filter(Boolean).length;

  const tabs: { id: SectionTab; label: string; count: number }[] = [
    { id: "all", label: "All Subjects", count: subjects.length },
    { id: "prelims", label: "Prelims", count: prelimsSubjects.length },
    { id: "gs1", label: "GS I", count: gs1Subjects.length },
    { id: "gs2", label: "GS II", count: gs2Subjects.length },
    { id: "gs3", label: "GS III", count: gs3Subjects.length },
    { id: "gs4", label: "GS IV", count: gs4Subjects.length },
    { id: "other", label: "Other (Essay/Optional)", count: otherSubjects.length },
  ];

  const renderSubjectGrid = (title: string, list: Subject[], badgeColor: string) => {
    if (list.length === 0) return null;
    const countDone = list.filter((s) => completions[s.id]).length;

    return (
      <Card className="border border-blue-gray-100 shadow-sm mb-6">
        <CardBody className="p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-gray-50">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${badgeColor}`} />
              <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                {title}
              </Typography>
            </div>
            <Typography variant="small" className="text-xs text-gray-500 font-medium">
              {countDone} / {list.length} completed
            </Typography>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {list.map((subject) => {
              const isDone = Boolean(completions[subject.id]);
              return (
                <div
                  key={subject.id}
                  onClick={() => handleToggle(subject.id)}
                  role="checkbox"
                  aria-checked={isDone}
                  tabIndex={0}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${
                    isDone
                      ? "bg-gray-900 text-white border-gray-900 shadow-xs"
                      : "bg-white border-blue-gray-200 hover:border-blue-gray-300 hover:bg-blue-gray-50/50 text-blue-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isDone
                          ? "bg-white text-gray-900 border-white"
                          : "border-blue-gray-300 bg-white"
                      }`}
                    >
                      {isDone && <CheckIcon className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={`text-xs font-semibold ${isDone ? "line-through text-gray-200" : "text-blue-gray-900"}`}>
                      {subject.name}
                    </span>
                  </div>

                  <span className={`text-[10px] ${isDone ? "text-gray-300 font-medium" : "text-gray-400"}`}>
                    {isDone ? "Done" : "Mark done"}
                  </span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-gray-100 pb-4">
          <div>
            <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight">
              UPSC Habits
            </Typography>
            <Typography variant="small" className="text-gray-500 font-medium mt-0.5">
              Mark what you studied on {formatDisplayDate(selectedDate)}. No need to complete every subject daily.
            </Typography>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-blue-gray-200 rounded-lg px-3 py-1.5 text-xs text-blue-gray-700 shadow-xs">
              <CalendarDaysIcon className="w-4 h-4 text-blue-gray-400 mr-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-semibold text-blue-gray-800 focus:outline-none"
              />
            </div>
            {selectedDate !== todayIso && (
              <Button
                size="sm"
                variant="text"
                color="blue-gray"
                onClick={() => setSelectedDate(todayIso)}
                className="text-xs font-semibold normal-case px-2.5 py-1.5"
              >
                Today
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-blue-gray-100 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-gray-900 text-white shadow-xs"
                  : "text-blue-gray-600 hover:bg-blue-gray-50 hover:text-blue-gray-900"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? "bg-gray-700 text-white" : "bg-blue-gray-100 text-blue-gray-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <Typography variant="small" className="text-center py-12 text-gray-400">
            Loading subjects...
          </Typography>
        ) : (
          <div>
            {(activeTab === "all" || activeTab === "prelims") &&
              renderSubjectGrid("PRELIMS CORE", prelimsSubjects, "bg-emerald-600")}

            {(activeTab === "all" || activeTab === "gs1") &&
              renderSubjectGrid("MAINS — GS I (Heritage, History, Geography, Society)", gs1Subjects, "bg-blue-600")}

            {(activeTab === "all" || activeTab === "gs2") &&
              renderSubjectGrid("MAINS — GS II (Constitution, Polity, Social Justice, IR)", gs2Subjects, "bg-indigo-600")}

            {(activeTab === "all" || activeTab === "gs3") &&
              renderSubjectGrid("MAINS — GS III (Economy, Agri, Sci-Tech, Environment, Security)", gs3Subjects, "bg-amber-600")}

            {(activeTab === "all" || activeTab === "gs4") &&
              renderSubjectGrid("MAINS — GS IV (Ethics, Integrity & Aptitude)", gs4Subjects, "bg-purple-600")}

            {(activeTab === "all" || activeTab === "other") &&
              renderSubjectGrid("OTHER (Essay & Optional Subject)", otherSubjects, "bg-rose-600")}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
