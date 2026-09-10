"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Card,
  CardBody,
  Button,
} from "@material-tailwind/react";
import {
  CheckCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, user, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [optionalSubject, setOptionalSubject] = useState(profile?.optional_subject || "");
  const [dailyTarget, setDailyTarget] = useState<number>(profile?.daily_study_target || 4);
  const [theme, setTheme] = useState("light");

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setOptionalSubject(profile.optional_subject || "");
      setDailyTarget(profile.daily_study_target || 4);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const ok = await updateProfile({
      full_name: fullName.trim(),
      optional_subject: optionalSubject.trim(),
      daily_study_target: Math.max(1, Math.min(24, Number(dailyTarget) || 4)),
    });

    setSaving(false);
    if (ok) {
      setStatusMsg({ type: "success", text: "Settings saved successfully." });
      setTimeout(() => setStatusMsg(null), 3000);
    } else {
      setStatusMsg({ type: "error", text: "Could not save settings. Please try again." });
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Top Header */}
        <div className="border-b border-blue-gray-100 pb-4">
          <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight">
            Settings
          </Typography>
          <Typography variant="small" className="text-gray-500 font-medium mt-0.5">
            Manage your personal profile and study targets
          </Typography>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {statusMsg.type === "success" && <CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Profile Settings Form */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Parth"
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || profile?.email || ""}
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg bg-blue-gray-50/50 text-gray-500 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                  Optional Subject
                </label>
                <input
                  type="text"
                  value={optionalSubject}
                  onChange={(e) => setOptionalSubject(e.target.value)}
                  placeholder="e.g. Anthropology, PSIR, Geography, History"
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                  Daily Study Target
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(Number(e.target.value))}
                    className="w-24 px-3 py-2 text-xs border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900 font-bold"
                  />
                  <span className="text-xs text-gray-600 font-medium">hours</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Used to highlight completion on the study calendar
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-900 font-medium"
                >
                  <option value="light">Light (Default)</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="pt-3 border-t border-blue-gray-50 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  color="gray"
                  disabled={saving}
                  className="normal-case font-semibold text-xs py-2 px-4 bg-gray-900 hover:bg-gray-800"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Logout Section */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <Typography variant="h6" color="blue-gray" className="font-bold text-xs">
                Logout Session
              </Typography>
              <Typography variant="small" className="text-gray-500 text-[11px] font-normal">
                Sign out of your personal UPSC tracker
              </Typography>
            </div>

            <Button
              variant="outlined"
              size="sm"
              color="red"
              onClick={handleLogout}
              className="flex items-center gap-1.5 normal-case text-xs font-semibold py-1.5 px-3 border-red-200 text-red-600 hover:bg-red-50"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
