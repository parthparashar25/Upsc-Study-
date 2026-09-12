"use client";

import React, { useState, useEffect } from "react";
import {
  getTimeRemainingToTargetExam,
  TARGET_EXAM_DATE,
  TARGET_EXAM_DISPLAY,
  ExamCountdown,
} from "@/lib/constants";
import { ClockIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

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
      <div
        style={{
          backgroundColor: "#0f172a",
          borderColor: "#334155",
          color: "#ffffff",
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-800 text-xs font-semibold shadow-xs border border-slate-700"
      >
        <ClockIcon
          style={{ color: "#34d399" }}
          className="w-3.5 h-3.5 text-emerald-400 shrink-0"
        />
        <span>
          <strong
            style={{ color: "#34d399" }}
            className="text-emerald-400 font-bold"
          >
            {countdown.days}
          </strong>{" "}
          days to UPSC 2027
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Days */}
        <div
          style={{
            backgroundColor: "#030712",
            borderColor: "rgba(16, 185, 129, 0.45)",
          }}
          className="flex flex-col items-center justify-center bg-slate-950 text-white rounded-xl px-3 py-2 min-w-[58px] border border-emerald-500/40 shadow-xs"
        >
          <span
            style={{ color: "#34d399" }}
            className="text-lg font-black tracking-tight text-emerald-400 font-mono"
          >
            {countdown.days}
          </span>
          <span
            style={{ color: "#94a3b8" }}
            className="text-[9px] font-bold uppercase tracking-wider text-slate-400"
          >
            Days
          </span>
        </div>

        <span
          style={{ color: "#64748b" }}
          className="text-slate-400 font-bold text-sm"
        >
          :
        </span>

        {/* Hours */}
        <div
          style={{
            backgroundColor: "#030712",
            borderColor: "rgba(56, 189, 248, 0.45)",
          }}
          className="flex flex-col items-center justify-center bg-slate-950 text-white rounded-xl px-2.5 py-2 min-w-[50px] border border-sky-500/40 shadow-xs"
        >
          <span
            style={{ color: "#38bdf8" }}
            className="text-lg font-black tracking-tight text-sky-400 font-mono"
          >
            {String(countdown.hours).padStart(2, "0")}
          </span>
          <span
            style={{ color: "#94a3b8" }}
            className="text-[9px] font-bold uppercase tracking-wider text-slate-400"
          >
            Hours
          </span>
        </div>

        <span
          style={{ color: "#64748b" }}
          className="text-slate-400 font-bold text-sm"
        >
          :
        </span>

        {/* Mins */}
        <div
          style={{
            backgroundColor: "#030712",
            borderColor: "rgba(129, 140, 248, 0.45)",
          }}
          className="flex flex-col items-center justify-center bg-slate-950 text-white rounded-xl px-2.5 py-2 min-w-[50px] border border-indigo-500/40 shadow-xs"
        >
          <span
            style={{ color: "#a5b4fc" }}
            className="text-lg font-black tracking-tight text-indigo-300 font-mono"
          >
            {String(countdown.minutes).padStart(2, "0")}
          </span>
          <span
            style={{ color: "#94a3b8" }}
            className="text-[9px] font-bold uppercase tracking-wider text-slate-400"
          >
            Mins
          </span>
        </div>

        <span
          style={{ color: "#64748b" }}
          className="text-slate-400 font-bold text-sm"
        >
          :
        </span>

        {/* Secs */}
        <div
          style={{
            backgroundColor: "#030712",
            borderColor: "rgba(251, 191, 36, 0.45)",
          }}
          className="flex flex-col items-center justify-center bg-slate-950 text-white rounded-xl px-2.5 py-2 min-w-[50px] border border-amber-500/40 shadow-xs"
        >
          <span
            style={{ color: "#fbbf24" }}
            className="text-lg font-black tracking-tight text-amber-400 font-mono"
          >
            {String(countdown.seconds).padStart(2, "0")}
          </span>
          <span
            style={{ color: "#94a3b8" }}
            className="text-[9px] font-bold uppercase tracking-wider text-slate-400"
          >
            Secs
          </span>
        </div>
      </div>
    );
  }

  // Hero Variant (default)
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0b1120 0%, #0f172a 50%, #1e293b 100%)",
        borderColor: "#334155",
        color: "#ffffff",
      }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-950 text-white p-5 sm:p-6 border-2 border-slate-700/80 shadow-xl"
    >
      {/* Background ambient accents */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          {showDateBadge && (
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                borderColor: "rgba(16, 185, 129, 0.4)",
                color: "#34d399",
              }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-3 tracking-wide"
            >
              <CalendarDaysIcon
                style={{ color: "#34d399" }}
                className="w-3.5 h-3.5 text-emerald-400 shrink-0"
              />
              <span>{TARGET_EXAM_DISPLAY}</span>
            </div>
          )}
          <h2
            style={{ color: "#ffffff" }}
            className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 flex-wrap"
          >
            <span>UPSC CSE Prelims 2027 Countdown</span>
            <span
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                borderColor: "rgba(16, 185, 129, 0.35)",
                color: "#6ee7b7",
              }}
              className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
            >
              Target Attempt
            </span>
          </h2>
          <p
            style={{ color: "#94a3b8" }}
            className="text-xs text-slate-300 mt-1.5 max-w-lg leading-relaxed"
          >
            Consistent daily discipline. 100% portion mastery, 3x rapid revision, and disciplined PYQ practice.
          </p>
        </div>

        {/* Pleasant Timer Digits with distinct vivid colors */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Days */}
          <div
            style={{
              backgroundColor: "#030712",
              borderColor: "rgba(16, 185, 129, 0.5)",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
            }}
            className="flex flex-col items-center justify-center bg-slate-950 border border-emerald-500/50 rounded-xl px-3.5 py-2.5 min-w-[70px] shadow-md"
          >
            <span
              style={{ color: "#34d399" }}
              className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight"
            >
              {countdown.days}
            </span>
            <span
              style={{ color: "#94a3b8" }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5"
            >
              Days Left
            </span>
          </div>

          <span
            style={{ color: "#475569" }}
            className="text-slate-500 font-extrabold text-lg pb-4"
          >
            :
          </span>

          {/* Hours */}
          <div
            style={{
              backgroundColor: "#030712",
              borderColor: "rgba(56, 189, 248, 0.5)",
              boxShadow: "0 4px 12px rgba(56, 189, 248, 0.1)",
            }}
            className="flex flex-col items-center justify-center bg-slate-950 border border-sky-500/50 rounded-xl px-3 py-2.5 min-w-[62px] shadow-md"
          >
            <span
              style={{ color: "#38bdf8" }}
              className="text-2xl sm:text-3xl font-black text-sky-400 font-mono tracking-tight"
            >
              {String(countdown.hours).padStart(2, "0")}
            </span>
            <span
              style={{ color: "#94a3b8" }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5"
            >
              Hours
            </span>
          </div>

          <span
            style={{ color: "#475569" }}
            className="text-slate-500 font-extrabold text-lg pb-4"
          >
            :
          </span>

          {/* Minutes */}
          <div
            style={{
              backgroundColor: "#030712",
              borderColor: "rgba(129, 140, 248, 0.5)",
              boxShadow: "0 4px 12px rgba(129, 140, 248, 0.1)",
            }}
            className="flex flex-col items-center justify-center bg-slate-950 border border-indigo-500/50 rounded-xl px-3 py-2.5 min-w-[62px] shadow-md"
          >
            <span
              style={{ color: "#a5b4fc" }}
              className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono tracking-tight"
            >
              {String(countdown.minutes).padStart(2, "0")}
            </span>
            <span
              style={{ color: "#94a3b8" }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5"
            >
              Mins
            </span>
          </div>

          <span
            style={{ color: "#475569" }}
            className="text-slate-500 font-extrabold text-lg pb-4"
          >
            :
          </span>

          {/* Seconds */}
          <div
            style={{
              backgroundColor: "#030712",
              borderColor: "rgba(251, 191, 36, 0.5)",
              boxShadow: "0 4px 12px rgba(251, 191, 36, 0.1)",
            }}
            className="flex flex-col items-center justify-center bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2.5 min-w-[62px] shadow-md"
          >
            <span
              style={{ color: "#fbbf24" }}
              className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight"
            >
              {String(countdown.seconds).padStart(2, "0")}
            </span>
            <span
              style={{ color: "#94a3b8" }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5"
            >
              Secs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
