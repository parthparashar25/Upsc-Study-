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

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const { error } = await signUp(
      email.trim(),
      password,
      fullName.trim(),
      optionalSubject.trim()
    );
    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message || "Failed to create account. Please try again.");
    } else {
      setSuccessMsg("Account created successfully! Redirecting to your dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-blue-gray-100 shadow-sm bg-white">
        <CardBody className="p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AcademicCapIcon className="w-6 h-6" />
            </div>
            <Typography variant="h5" color="blue-gray" className="font-bold tracking-tight">
              Create Personal Account
            </Typography>
            <Typography variant="small" className="text-gray-500 text-xs font-normal mt-0.5">
              UPSC Study Tracker &bull; Single-user personal dashboard
            </Typography>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Parth"
                className="w-full bg-white border border-blue-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 focus:outline-none focus:border-gray-900 shadow-xs"
              />
            </div>

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

            <div>
              <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                Password <span className="text-gray-400 font-normal">(min 6 characters)</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-blue-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 focus:outline-none focus:border-gray-900 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-gray-800 mb-1">
                Optional Subject <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={optionalSubject}
                onChange={(e) => setOptionalSubject(e.target.value)}
                placeholder="e.g. Anthropology, PSIR, Geography"
                className="w-full bg-white border border-blue-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-blue-gray-900 focus:outline-none focus:border-gray-900 shadow-xs"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              className="bg-gray-900 hover:bg-gray-800 normal-case font-semibold text-xs py-2.5 mt-2"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-900 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
