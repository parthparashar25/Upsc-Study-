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
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading, signUp } = useAuth();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [optionalSubject, setOptionalSubject] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const chosenUsername = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (!chosenUsername) {
      setErrorMsg("Please choose a username.");
      return;
    }

    if (!fullName.trim() || !password) {
      setErrorMsg("Please fill out full name and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    // Use email if provided; otherwise use virtual username domain
    const identifier = email.trim() || chosenUsername;

    const { error } = await signUp(
      identifier,
      password,
      fullName.trim(),
      optionalSubject.trim(),
      chosenUsername
    );
    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message || "Failed to create account. Please try again.");
    } else {
      setSuccessMsg(`Welcome, ${fullName}! Account created successfully. Redirecting...`);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors">
      <Card className="w-full max-w-md border border-blue-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
        <CardBody className="p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AcademicCapIcon className="w-6 h-6" />
            </div>
            <Typography variant="h5" color="blue-gray" className="font-bold tracking-tight dark:text-white">
              Create Personal Account
            </Typography>
            <Typography variant="small" className="text-gray-500 dark:text-gray-400 text-xs font-normal mt-0.5">
              UPSC Study Tracker &bull; Single-user personal dashboard
            </Typography>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200 mb-1">
                Choose Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. parth or ias_parth"
                className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 shadow-xs"
              />
              <span className="text-[11px] text-gray-400">You can use this username to sign in anytime</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Parth Parashar"
                className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200 mb-1">
                Email Address <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com (optional)"
                className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200 mb-1">
                Optional Subject
              </label>
              <input
                type="text"
                value={optionalSubject}
                onChange={(e) => setOptionalSubject(e.target.value)}
                placeholder="e.g. Anthropology, PSIR, History, Geography"
                className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-gray-800 dark:text-gray-200 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-white dark:bg-gray-800 border border-blue-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 shadow-xs"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 normal-case font-semibold text-xs py-2.5 mt-2"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-900 dark:text-white font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
