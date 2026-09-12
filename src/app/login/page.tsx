"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  AcademicCapIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  FingerPrintIcon,
  WrenchScrewdriverIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured, saveCustomSupabaseConfig } from "@/lib/supabase";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { getBiometricPlatformName } from "@/lib/biometrics";

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    loading,
    signIn,
    resetPassword,
    signInWithBiometrics,
    enableBiometrics,
    hasBiometrics,
    isBiometricsAvailable,
  } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgot, setIsForgot] = useState(false);
  const [enrollBiometricsOnLogin, setEnrollBiometricsOnLogin] = useState(true);
  const [autoPromptAttempted, setAutoPromptAttempted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Live Supabase setup dialog state
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customKey, setCustomKey] = useState("");

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Auto-prompt biometrics if already enrolled on this device
  useEffect(() => {
    if (hasBiometrics && !loading && !user && !autoPromptAttempted) {
      setAutoPromptAttempted(true);
      handleBiometricLogin(true);
    }
  }, [hasBiometrics, loading, user, autoPromptAttempted]);

  const handleBiometricLogin = async (isAutoPrompt = false) => {
    setBiometricLoading(true);
    if (!isAutoPrompt) setErrorMsg("");
    try {
      const res = await signInWithBiometrics();
      setBiometricLoading(false);
      if (res.success) {
        router.push("/dashboard");
      } else {
        if (!isAutoPrompt) {
          setErrorMsg(res.error || "Biometric authentication failed. Please try again or sign in with your password.");
        }
      }
    } catch {
      setBiometricLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    if (isForgot) {
      if (!usernameOrEmail.trim()) {
        setErrorMsg("Please enter your username or email address.");
        setSubmitting(false);
        return;
      }
      const { error } = await resetPassword(usernameOrEmail.trim());
      setSubmitting(false);
      if (error) {
        setErrorMsg("Could not send password reset email.");
      } else {
        setSuccessMsg("Password reset request submitted. Check your inbox.");
      }
      return;
    }

    if (!usernameOrEmail.trim() || !password) {
      setErrorMsg("Please provide your username/email and password.");
      setSubmitting(false);
      return;
    }

    const { error } = await signIn(usernameOrEmail.trim(), password);

    if (error) {
      setSubmitting(false);
      setErrorMsg(
        error.message.includes("Invalid login")
          ? "Invalid username/email or password."
          : error.message || "Login failed. Please try again."
      );
    } else {
      // If user chose to enroll biometrics on this device
      if (enrollBiometricsOnLogin && isBiometricsAvailable && !hasBiometrics) {
        try {
          await enableBiometrics(password);
        } catch (bioErr) {
          console.error("Auto biometric enrollment on login error:", bioErr);
        }
      }
      setSubmitting(false);
      router.push("/dashboard");
    }
  };

  const handleDemoSignIn = async () => {
    setSubmitting(true);
    setErrorMsg("");
    await signIn("aspirant", "demo123456");
    setSubmitting(false);
    router.push("/dashboard");
  };

  const handleSaveCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      setErrorMsg("Both Supabase URL and Anon Key are required.");
      return;
    }
    saveCustomSupabaseConfig(customUrl.trim(), customKey.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors">
      <Card className="w-full max-w-md border border-blue-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
        <CardBody className="p-8">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AcademicCapIcon className="w-6 h-6" />
            </div>
            <Typography variant="h5" color="blue-gray" className="font-bold tracking-tight dark:text-white">
              UPSC Study Tracker
            </Typography>
            <Typography variant="small" className="text-gray-500 dark:text-gray-400 text-xs font-normal mt-0.5">
              Private Personal Application &bull; Sign in to continue
            </Typography>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
              <ExclamationCircleIcon className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Biometric Quick Login (when enrolled) */}
          {hasBiometrics ? (
            <div className="mb-5 p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 text-center space-y-2.5 shadow-xs">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
                <FingerPrintIcon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <Typography variant="h6" className="text-xs font-bold text-gray-900 dark:text-white">
                  {getBiometricPlatformName()} Ready
                </Typography>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                  1-touch instant unlock enabled on this device
                </p>
              </div>
              <Button
                fullWidth
                onClick={() => handleBiometricLogin(false)}
                disabled={biometricLoading || submitting}
                className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs normal-case"
              >
                <FingerPrintIcon className="w-4 h-4" />
                <span>{biometricLoading ? "Waiting for sensor..." : `Unlock with ${getBiometricPlatformName().split(" ")[0]}`}</span>
              </Button>
              <div className="flex items-center my-1 pt-1">
                <div className="grow border-t border-emerald-200 dark:border-emerald-900" />
                <span className="px-2 text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-semibold">or sign in with password</span>
                <div className="grow border-t border-emerald-200 dark:border-emerald-900" />
              </div>
            </div>
          ) : isBiometricsAvailable ? (
            <div className="mb-4 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center gap-2.5 text-xs">
              <FingerPrintIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-[11px] text-gray-700 dark:text-gray-300 leading-snug">
                <strong>{getBiometricPlatformName()}</strong> is supported on this device. Sign in once below to enable 1-touch unlock.
              </div>
            </div>
          ) : null}

          {/* Google & iOS Apple Sign In */}
          <SocialAuthButtons mode="signin" onError={(err) => setErrorMsg(err)} />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. parth or user@example.com"
                className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 shadow-xs"
              />
            </div>

            {!isForgot && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 shadow-xs"
                />
              </div>
            )}

            {!isForgot && isBiometricsAvailable && !hasBiometrics && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="enableBioCheckbox"
                  checked={enrollBiometricsOnLogin}
                  onChange={(e) => setEnrollBiometricsOnLogin(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"
                />
                <label
                  htmlFor="enableBioCheckbox"
                  className="text-[11px] text-gray-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <FingerPrintIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Enable {getBiometricPlatformName()} for future logins</span>
                </label>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 normal-case font-semibold text-xs py-2.5 mt-2"
            >
              {submitting
                ? "Processing..."
                : isForgot
                ? "Send Reset Link"
                : "Sign In"}
            </Button>

            {isForgot && (
              <Button
                type="button"
                variant="text"
                fullWidth
                onClick={() => setIsForgot(false)}
                className="normal-case text-xs font-semibold text-gray-600 dark:text-gray-400 py-1.5"
              >
                Back to Sign In
              </Button>
            )}
          </form>

          {/* Quick Connect Supabase or Demo Notice */}
          <div className="mt-4 pt-4 border-t border-blue-gray-100 dark:border-gray-800 text-center space-y-2">
            {!isSupabaseConfigured && (
              <>
                <p className="text-[11px] text-gray-400">
                  Running in Demo Mode (no Supabase keys loaded yet)
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outlined"
                    fullWidth
                    onClick={handleDemoSignIn}
                    disabled={submitting}
                    className="border-blue-gray-200 dark:border-gray-700 hover:border-gray-900 normal-case text-xs font-semibold text-blue-gray-800 dark:text-gray-200 py-2"
                  >
                    Instant Sign In as Demo Aspirant &rarr;
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    fullWidth
                    onClick={() => setShowConfigDialog(true)}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 py-1.5 normal-case"
                  >
                    <WrenchScrewdriverIcon className="w-4 h-4" />
                    <span>Connect Live Supabase Keys (In-Browser)</span>
                  </Button>
                </div>
              </>
            )}

            {isSupabaseConfigured && (
              <button
                onClick={() => setShowConfigDialog(true)}
                className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
              >
                Change Connected Supabase Credentials
              </button>
            )}
          </div>

          {/* Links */}
          <div className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="text-gray-900 dark:text-white font-bold hover:underline">
              Create Account
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Supabase In-Browser Setup Modal */}
      <Dialog
        open={showConfigDialog}
        handler={() => setShowConfigDialog(false)}
        size="sm"
        className="dark:bg-gray-900 border border-blue-gray-100 dark:border-gray-800"
      >
        <DialogHeader className="text-sm font-bold text-gray-900 dark:text-white border-b border-blue-gray-100 dark:border-gray-800">
          Connect Your Supabase Project
        </DialogHeader>
        <form onSubmit={handleSaveCustomConfig}>
          <DialogBody className="space-y-4">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Paste your Supabase credentials here. They will be saved securely to your browser so the live database is instantly connected!
            </p>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
              </label>
              <input
                type="text"
                required
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://xxxxxxxx.supabase.co"
                className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Anon Public Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
              </label>
              <input
                type="text"
                required
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </DialogBody>
          <DialogFooter className="border-t border-blue-gray-100 dark:border-gray-800 flex justify-end gap-2">
            <Button
              size="sm"
              variant="text"
              onClick={() => setShowConfigDialog(false)}
              className="normal-case text-xs text-gray-600 dark:text-gray-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              className="normal-case text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900"
            >
              Save &amp; Connect Live
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
