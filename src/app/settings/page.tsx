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
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getBiometricPlatformName } from "@/lib/biometrics";
import { getDisplayUsername } from "@/lib/supabase";
import {
  UPSC_OPTIONAL_CORE_SUBJECTS,
  UPSC_OPTIONAL_LITERATURE_SUBJECTS,
  isValidOptionalSubject,
} from "@/lib/constants";

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
  const [username, setUsername] = useState(
    profile?.username || user?.user_metadata?.username || (profile?.email ? getDisplayUsername(profile.email) : "")
  );
  const [optionalSubject, setOptionalSubject] = useState(profile?.optional_subject || "");
  const [dailyTarget, setDailyTarget] = useState<number>(profile?.daily_study_target || 4);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Biometric dialog state
  const [showBioModal, setShowBioModal] = useState(false);
  const [bioPassword, setBioPassword] = useState("");
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState("");

  // Optional Subject Confirmation Dialog state
  const [showOptionalModal, setShowOptionalModal] = useState(false);
  const [pendingOptional, setPendingOptional] = useState<string | null>(null);

  const handleSelectOptional = (newVal: string) => {
    const currentSaved = profile?.optional_subject || "";
    if (isValidOptionalSubject(currentSaved) && newVal !== currentSaved) {
      setPendingOptional(newVal);
      setShowOptionalModal(true);
      return;
    }
    setOptionalSubject(newVal);
  };

  const handleConfirmOptionalChange = () => {
    if (pendingOptional !== null) {
      setOptionalSubject(pendingOptional);
    }
    setShowOptionalModal(false);
    setPendingOptional(null);
  };

  const handleCancelOptionalChange = () => {
    setShowOptionalModal(false);
    setPendingOptional(null);
  };

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      if (profile.username) {
        setUsername(profile.username);
      } else if (user?.user_metadata?.username) {
        setUsername(user.user_metadata.username);
      } else if (profile.email) {
        setUsername(getDisplayUsername(profile.email));
      }
      setOptionalSubject(profile.optional_subject || "");
      setDailyTarget(profile.daily_study_target || 4);
    }
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (username.trim() && cleanUsername.length < 3) {
      setSaving(false);
      setStatusMsg({
        type: "error",
        text: "Username must be at least 3 characters (letters, numbers, '.', '_', '-').",
      });
      return;
    }

    const ok = await updateProfile({
      full_name: fullName.trim(),
      username: cleanUsername,
      optional_subject: optionalSubject.trim(),
      daily_study_target: Math.max(1, Math.min(24, Number(dailyTarget) || 4)),
    });

    setSaving(false);
    if (ok) {
      setStatusMsg({
        type: "success",
        text: cleanUsername
          ? `Settings saved! Your username is @${cleanUsername}.`
          : "Settings saved successfully.",
      });
      setTimeout(() => setStatusMsg(null), 3500);
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-blue-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <span className="text-[10px] text-gray-400">
                    Sign in handle without email
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs select-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    placeholder="e.g. parth or ias_parth"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-blue-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 font-semibold bg-white dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Set or change your personal handle. You can sign in using either this username (@{username || "username"}) or your email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 dark:text-gray-300 mb-1">
                  Account Identifier (Email)
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || profile?.email || ""}
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 dark:border-gray-700 rounded-lg bg-blue-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-blue-gray-700 dark:text-gray-300">
                    Mains Optional Subject
                  </label>
                  {isValidOptionalSubject(optionalSubject) ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Active: {optionalSubject}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Not Selected
                    </span>
                  )}
                </div>
                <select
                  value={optionalSubject}
                  onChange={(e) => handleSelectOptional(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 font-medium bg-white dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Optional Subject — Not Selected</option>
                  <optgroup label="25 Core UPSC Optional Subjects">
                    {UPSC_OPTIONAL_CORE_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="23 Literature Optional Subjects">
                    {UPSC_OPTIONAL_LITERATURE_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Select ONE optional subject. Before selection, Optional portion progress is not tracked and excluded from Overall UPSC percentage.
                </p>
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
                  <span>{getBiometricPlatformName()}</span>
                </Typography>
                <Typography variant="small" className="text-gray-500 dark:text-gray-400 text-xs mt-1 max-w-md">
                  Enable fast, 1-touch sign in using your device&apos;s Apple Touch ID / Face ID, Windows Hello, or Fingerprint sensor.
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
                    <span>Set Up {getBiometricPlatformName().split(" ")[0]}</span>
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
              Please confirm your account password. Your browser will prompt {getBiometricPlatformName()} to register this device securely.
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

      {/* Optional Subject Change Confirmation Dialog */}
      <Dialog
        open={showOptionalModal}
        handler={handleCancelOptionalChange}
        size="sm"
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800"
      >
        <DialogHeader className="p-0 pb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0" />
          <Typography variant="h6" className="font-bold text-sm text-gray-900 dark:text-white">
            Confirm Change of Mains Optional Subject
          </Typography>
        </DialogHeader>
        <DialogBody className="p-0 py-4 text-xs text-gray-600 dark:text-gray-300 space-y-3">
          <p>
            You are currently preparing for <span className="font-bold text-gray-900 dark:text-white">{profile?.optional_subject || "your current optional"}</span> and are switching to{" "}
            <span className="font-bold text-gray-900 dark:text-white">{pendingOptional || "Not Selected"}</span>.
          </p>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
            <strong>Progress Safety Guarantee:</strong> All your past study records, topic completions, and revisions for{" "}
            <strong>{profile?.optional_subject}</strong> will be preserved safely in the database. If you switch back later, all your progress will be restored.
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Only {pendingOptional || "the active optional"} will contribute to your active Optional syllabus progress and Overall UPSC Portion percentage.
          </p>
        </DialogBody>
        <DialogFooter className="p-0 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="text"
            onClick={handleCancelOptionalChange}
            className="normal-case text-xs text-gray-600 dark:text-gray-300"
          >
            Keep {profile?.optional_subject}
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmOptionalChange}
            className="normal-case bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold"
          >
            Confirm Switch
          </Button>
        </DialogFooter>
      </Dialog>
    </AppLayout>
  );
}
