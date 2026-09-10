"use client";

import React, { useState } from "react";
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
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [optionalSubject, setOptionalSubject] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, optionalSubject);
    setLoading(false);

    if (error) {
      setErrorMsg(
        error.message.includes("already registered")
          ? "An account with this email already exists."
          : "Registration failed. Please try again."
      );
    } else {
      setSuccessMsg("Account created! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold mx-auto mb-3 shadow-sm">
          <AcademicCapIcon className="w-7 h-7" />
        </div>
        <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight">
          UPSC STUDY TRACKER
        </Typography>
        <Typography variant="small" className="text-gray-500 font-normal mt-1">
          Simple habits. Consistent preparation.
        </Typography>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardBody className="p-8">
            <Typography variant="h6" color="blue-gray" className="font-bold text-sm mb-4 text-center">
              Create Your Aspirant Account
            </Typography>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                <ExclamationCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Parth"
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aspirant@upsc.test"
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                  UPSC Optional Subject (Optional)
                </label>
                <input
                  type="text"
                  value={optionalSubject}
                  onChange={(e) => setOptionalSubject(e.target.value)}
                  placeholder="e.g. Anthropology, PSIR, Geography"
                  className="w-full px-3 py-2 text-xs border border-blue-gray-200 rounded-lg focus:outline-none focus:border-gray-900 font-medium"
                />
              </div>

              <Button
                type="submit"
                size="sm"
                color="gray"
                disabled={loading}
                className="w-full normal-case font-semibold text-xs py-2.5 bg-gray-900 hover:bg-gray-800 mt-2"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-blue-gray-50 flex items-center justify-between text-xs text-gray-500">
              <span>Already have an account?</span>
              <Link href="/login" className="font-bold text-gray-900 hover:underline">
                Login
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
