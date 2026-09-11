"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@material-tailwind/react";
import { useAuth } from "@/context/AuthContext";
import { isIOS } from "@/lib/device";

interface SocialAuthButtonsProps {
  mode?: "signin" | "signup";
  onError?: (err: string) => void;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  mode = "signin",
  onError,
}) => {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  useEffect(() => {
    setIsIosDevice(isIOS());
  }, []);

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await signInWithGoogle();
      if (error && onError) {
        onError(error.message);
      }
    } catch (err: any) {
      if (onError) onError(err.message || "Google authentication failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    try {
      setAppleLoading(true);
      const { error } = await signInWithApple();
      if (error && onError) {
        onError(error.message);
      }
    } catch (err: any) {
      if (onError) onError(err.message || "Apple authentication failed");
    } finally {
      setAppleLoading(false);
    }
  };

  const actionText = mode === "signup" ? "Sign up" : "Continue";

  return (
    <div className="space-y-2.5">
      {/* Google Sign In */}
      <Button
        type="button"
        variant="outlined"
        fullWidth
        disabled={googleLoading || appleLoading}
        onClick={handleGoogle}
        className="flex items-center justify-center gap-2.5 py-2.5 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 normal-case font-semibold text-xs transition-colors shadow-xs"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.01 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>
          {googleLoading ? "Connecting to Google..." : `${actionText} with Google`}
        </span>
      </Button>

      {/* Apple Sign In (Only displayed on iOS devices as requested) */}
      {isIosDevice && (
        <Button
          type="button"
          fullWidth
          disabled={googleLoading || appleLoading}
          onClick={handleApple}
          className="flex items-center justify-center gap-2.5 py-2.5 bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 normal-case font-semibold text-xs transition-colors shadow-xs"
        >
          <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.62 1.35-.57.65-1.07 1.71-.93 2.74 1 .08 2.01-.49 2.63-1.24z" />
          </svg>
          <span>
            {appleLoading ? "Connecting to Apple..." : `${actionText} with Apple`}
          </span>
        </Button>
      )}

      {/* Divider */}
      <div className="relative my-3 pt-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 text-[10px] font-bold tracking-wider">
            or continue with
          </span>
        </div>
      </div>
    </div>
  );
};
