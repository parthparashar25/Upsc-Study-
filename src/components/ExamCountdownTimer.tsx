"use client";

import React, { useState, useEffect } from "react";
import {
  getTimeRemainingToTargetExam,
  TARGET_EXAM_DATE,
  TARGET_EXAM_DISPLAY,
  ExamCountdown,
} from "@/lib/constants";
import { ClockIcon, CalendarDaysIcon, SparklesIcon } from "@heroicons/react/24/outline";

interface ExamCountdownTimerProps {
  variant?: "hero" | "compact" | "badge";
  showDateBadge?: boolean;
}

export function ExamCountdownTimer({
  variant = "hero",
  showDateBadge = true,
}: ExamCountdownTimerProps) {
  const [countdown, setCountdown] = useState<ExamCountdown>(() =>
    getTimeRemainingToTargetExam()
  );

  useEffect(() => {
    // Ticking interval every second
    const timer = setInterval(() => {
      setCountdown(getTimeRemainingToTargetExam());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (variant === "badge") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-800 text-xs font-semibold shadow-xs">
        <ClockIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-emerald-300 font-bold">{countdown.days}</strong> days to UPSC 2027
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Days */}
        <div className="flex flex-col items-center justify-center bg-slate-900/90 dark:bg-gray-800/90 text-white rounded-xl px-3 py-2 min-w-[58px] border border-slate-700/60 dark:border-gray-700 shadow-xs">
          <span className="text-lg font-black tracking-tight text-emerald-400 font-mono">
            {countdown.days}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Days
          </span>
        </div>

        <span className="text-slate-400 font-bold text-sm">:</span>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center bg-slate-900/90 dark:bg-gray-800/90 text-white rounded-xl px-2.5 py-2 min-w-[50px] border border-slate-700/60 dark:border-gray-700 shadow-xs">
          <span className="text-lg font-black tracking-tight text-white font-mono">
            {String(countdown.hours).padStart(2, "0")}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Hours
          </span>
        </div>

        <span className="text-slate-400 font-bold text-sm">:</span>

        {/* Mins */}
        <div className="flex flex-col items-center justify-center bg-slate-900/90 dark:bg-gray-800/90 text-white rounded-xl px-2.5 py-2 min-w-[50px] border border-slate-700/60 dark:border-gray-700 shadow-xs">
          <span className="text-lg font-black tracking-tight text-white font-mono">
            {String(countdown.minutes).padStart(2, "0")}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Mins
          </span>
        </div>

        <span className="text-slate-400 font-bold text-sm">:</span>

        {/* Secs */}
        <div className="flex flex-col items-center justify-center bg-slate-900/90 dark:bg-gray-800/90 text-white rounded-xl px-2.5 py-2 min-w-[50px] border border-slate-700/60 dark:border-gray-700 shadow-xs">
          <span className="text-lg font-black tracking-tight text-amber-400 font-mono">
            {String(countdown.seconds).padStart(2, "0")}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Secs
          </span>
        </div>
      </div>
    );
  }

  // Hero Variant (default)
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white p-5 sm:p-6 border border-slate-700/80 shadow-md">
      {/* Background ambient accents */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          {showDateBadge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-3 tracking-wide">
              <CalendarDaysIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{TARGET_EXAM_DISPLAY}</span>
            </div>
          )}
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>UPSC CSE Prelims 2027 Countdown</span>
            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-medium">
              Target Attempt
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Consistent daily discipline. 100% portion mastery, 3x rapid revision, and disciplined PYQ practice.
          </p>
        </div>

        {/* Pleasant Timer Digits */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Days */}
          <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 min-w-[70px] shadow-inner">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {countdown.days}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              Days Left
            </span>
          </div>

          <span className="text-slate-500 font-extrabold text-lg pb-4">:</span>

          {/* Hours */}
          <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 min-w-[62px] shadow-inner">
            <span className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight">
              {String(countdown.hours).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              Hours
            </span>
          </div>

          <span className="text-slate-500 font-extrabold text-lg pb-4">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 min-w-[62px] shadow-inner">
            <span className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight">
              {String(countdown.minutes).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              Mins
            </span>
          </div>

          <span className="text-slate-500 font-extrabold text-lg pb-4">:</span>

          {/* Seconds */}
          <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 min-w-[62px] shadow-inner">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
              {String(countdown.seconds).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              Secs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
