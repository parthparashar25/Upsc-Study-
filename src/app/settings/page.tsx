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
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Modal";
import {
  CheckCircleIcon,
  ArrowRightOnRectangleIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsPage() {
  const router = useRouter();
  const {
    profile,
    user,
    updateProfile,
    signOut,
    hasBiometrics,
    isBiometricsAvailable,
    enableBiometrics,
    disableBiometrics,
  } = useAuth();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [optionalSubject, setOptionalSubject] = useState(profile?.optional_subject || "");
  const [dailyTarget, setDailyTarget] = useState<number>(profile?.daily_study_target || 4);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Biometric dialog state
  const [showBioModal, setShowBioModal] = useState(false);
  const [bioPassword, setBioPassword] = useState("");
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState("");

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

  const handleEnrollBiometrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bioPassword) {
      setBioError("Please enter your current password to link biometrics.");
      return;
    }

    setBioLoading(true);
    setBioError("");
    const res = await enableBiometrics(bioPassword);
    setBioLoading(false);

    if (res.success) {
      setShowBioModal(false);
      setBioPassword("");
      setStatusMsg({ type: "success", text: "Fingerprint / Biometric login enabled on this device!" });
      setTimeout(() => setStatusMsg(null), 3000);
    } else {
      setBioError(res.error || "Could not register biometric credentials.");
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
        <div className="border-b border-blue-gray-100 dark:border-gray-800 pb-4">
          <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight dark:text-white">
            Settings
          </Typography>
          <Typography variant="small" className="text-gray-500 dark:text-gray-400 font-medium mt-0.5">
            Manage your personal profile, security, and preferences
          </Typography>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            {statusMsg.type === "success" && <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Profile Settings Form */}
        <Card className="border border-blue-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
          <CardBody className="p-6">
            <Typography variant="h6" color="blue-gray" className="font-bold text-sm mb-4 dark:text-white">
              Profile &amp; Study Targets
            </Typography>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-blue-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Parth"
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 font-medium bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 dark:text-gray-300 mb-1">
                  Account Identifier
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || profile?.email || ""}
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 dark:border-gray-700 rounded-lg bg-blue-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 dark:text-gray-300 mb-1">
                  Optional Subject
                </label>
                <input
                  type="text"
                  value={optionalSubject}
                  onChange={(e) => setOptionalSubject(e.target.value)}
                  placeholder="e.g. Anthropology, PSIR, Geography, History"
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 font-medium bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 dark:text-gray-300 mb-1">
                  Daily Study Target
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(Number(e.target.value))}
                    className="w-24 px-3 py-2 text-xs border border-blue-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 font-bold bg-white dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">hours / day</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 dark:text-gray-300 mb-1">
                  Theme Appearance
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-gray-900 font-medium"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

              <div className="pt-3 border-t border-blue-gray-50 dark:border-gray-800 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="normal-case font-semibold text-xs py-2 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800"
                >
                  {saving ? "Saving..." : "Save Profile Settings"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Biometrics & Security Section */}
        <Card className="border border-blue-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
          <CardBody className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <Typography variant="h6" color="blue-gray" className="font-bold text-sm flex items-center gap-2 dark:text-white">
                  <FingerPrintIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span>Fingerprint &amp; Biometric Login</span>
                </Typography>
                <Typography variant="small" className="text-gray-500 dark:text-gray-400 text-xs mt-1 max-w-md">
                  Enable fast, 1-touch sign in using your device&apos;s fingerprint reader, Touch ID, or Windows Hello.
                </Typography>
              </div>

              <div>
                {hasBiometrics ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                      <ShieldCheckIcon className="w-4 h-4" /> Active
                    </span>
                    <Button
                      size="sm"
                      variant="text"
                      color="red"
                      onClick={disableBiometrics}
                      className="text-xs normal-case font-semibold text-red-600 py-1 px-2.5"
                    >
                      Disable
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setBioError("");
                      setShowBioModal(true);
                    }}
                    className="flex items-center gap-1.5 normal-case font-bold text-xs py-2 px-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  >
                    <FingerPrintIcon className="w-4 h-4" />
                    <span>Set Up Fingerprint</span>
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Logout Section */}
        <Card className="border border-blue-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <Typography variant="h6" color="blue-gray" className="font-bold text-xs dark:text-white">
                Logout Session
              </Typography>
              <Typography variant="small" className="text-gray-500 dark:text-gray-400 text-[11px] font-normal">
                Sign out of your personal UPSC tracker
              </Typography>
            </div>

            <Button
              variant="outlined"
              size="sm"
              color="red"
              onClick={handleLogout}
              className="flex items-center gap-1.5 normal-case text-xs font-semibold py-1.5 px-3 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Biometric Password Confirmation Dialog */}
      <Dialog
        open={showBioModal}
        handler={() => setShowBioModal(false)}
        size="sm"
        className="dark:bg-gray-900 border border-blue-gray-100 dark:border-gray-800"
      >
        <DialogHeader className="text-sm font-bold text-gray-900 dark:text-white border-b border-blue-gray-100 dark:border-gray-800">
          Enable Fingerprint / Windows Hello
        </DialogHeader>
        <form onSubmit={handleEnrollBiometrics}>
          <DialogBody className="space-y-4">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Please confirm your account password. Your browser will then prompt your fingerprint scanner or Windows Hello to register this device.
            </p>
            {bioError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-400">
                {bioError}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Account Password
              </label>
              <input
                type="password"
                required
                value={bioPassword}
                onChange={(e) => setBioPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </DialogBody>
          <DialogFooter className="border-t border-blue-gray-100 dark:border-gray-800 flex justify-end gap-2">
            <Button
              size="sm"
              variant="text"
              onClick={() => setShowBioModal(false)}
              className="normal-case text-xs text-gray-600 dark:text-gray-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              disabled={bioLoading}
              className="normal-case text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900"
            >
              {bioLoading ? "Verifying Sensor..." : "Touch Sensor & Register"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </AppLayout>
  );
}
