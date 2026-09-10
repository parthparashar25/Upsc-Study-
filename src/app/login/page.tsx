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
  AcademicCapIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgot, setIsForgot] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    if (isForgot) {
      if (!email.trim()) {
        setErrorMsg("Please enter your email address.");
        setSubmitting(false);
        return;
      }
      const { error } = await resetPassword(email.trim());
      setSubmitting(false);
      if (error) {
        setErrorMsg("Could not send password reset email.");
      } else {
        setSuccessMsg("Password reset email sent. Check your inbox.");
      }
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg("Please provide both email and password.");
      setSubmitting(false);
      return;
    }

    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (error) {
      setErrorMsg(
        error.message.includes("Invalid login")
          ? "Invalid email or password."
          : error.message || "Login failed. Please try again."
      );
    } else {
      router.push("/dashboard");
    }
  };

  const handleDemoSignIn = async () => {
    setSubmitting(true);
    setErrorMsg("");
    await signIn("aspirant@upsc.test", "demo123456");
    setSubmitting(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-blue-gray-100 shadow-sm bg-white">
        <CardBody className="p-8">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AcademicCapIcon className="w-6 h-6" />
            </div>
            <Typography variant="h5" color="blue-gray" className="font-bold tracking-tight">
              UPSC Study Tracker
            </Typography>
            <Typography variant="small" className="text-gray-500 text-xs font-normal mt-0.5">
              Private Personal Application &bull; Sign in to continue
            </Typography>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <ExclamationCircleIcon className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border border-blue-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 focus:outline-none focus:border-gray-900 shadow-xs"
              />
            </div>

            {!isForgot && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-blue-gray-800">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-[11px] text-gray-500 hover:text-gray-900 hover:underline"
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
                  className="w-full bg-white border border-blue-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 focus:outline-none focus:border-gray-900 shadow-xs"
                />
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              className="bg-gray-900 hover:bg-gray-800 normal-case font-semibold text-xs py-2.5 mt-2"
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
                className="normal-case text-xs font-semibold text-gray-600 py-1.5"
              >
                Back to Sign In
              </Button>
            )}
          </form>

          {/* Offline / Demo Fallback Button */}
          {!isSupabaseConfigured && (
            <div className="mt-4 pt-4 border-t border-blue-gray-100 text-center">
              <p className="text-[11px] text-gray-400 mb-2">
                Running in Local Demo Mode (no Supabase keys in .env.local)
              </p>
              <Button
                size="sm"
                variant="outlined"
                fullWidth
                onClick={handleDemoSignIn}
                disabled={submitting}
                className="border-blue-gray-200 hover:border-gray-900 normal-case text-xs font-semibold text-blue-gray-800 py-2"
              >
                Instant Sign In as Demo Aspirant &rarr;
              </Button>
            </div>
          )}

          {/* Links */}
          <div className="mt-5 text-center text-xs text-gray-500">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="text-gray-900 font-bold hover:underline">
              Create Account
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
