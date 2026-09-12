"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Typography,
  IconButton,
  List,
  ListItem,
  Collapse,
} from "@material-tailwind/react";
import {
  Squares2X2Icon,
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  FolderIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
  SunIcon,
  MoonIcon,
  FingerPrintIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatDisplayDate, formatDateToIso } from "@/lib/constants";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, isDemo, loading, hasBiometrics, isBiometricsAvailable } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const todayIso = formatDateToIso(new Date());

  // Protected route guard: Redirect unauthenticated visitors to /login
  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Sidebar navigation order matching specification:
  // Main: Dashboard, Habits, Syllabus, Reference Books, Calendar, Notes, Files
  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
    { name: "Habits", href: "/habits", icon: ClipboardDocumentCheckIcon },
    { name: "Syllabus", href: "/syllabus", icon: BookOpenIcon },
    { name: "Reference Books", href: "/books", icon: BuildingLibraryIcon },
    { name: "Calendar", href: "/calendar", icon: CalendarDaysIcon },
    { name: "Notes", href: "/notes", icon: DocumentTextIcon },
    { name: "Files", href: "/files", icon: FolderIcon },
  ];

  // Account: Settings, Logout
  const accountNavItems = [
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between bg-white dark:bg-gray-900 border-r border-blue-gray-100 dark:border-gray-800 transition-colors">
      <div>
        {/* Brand */}
        <div className="mb-4 p-4 border-b border-blue-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center font-bold shadow-xs">
              <AcademicCapIcon className="w-5 h-5" />
            </div>
            <div>
              <Typography variant="h6" color="blue-gray" className="font-bold tracking-tight text-sm leading-tight dark:text-white">
                UPSC Study Tracker
              </Typography>
              <Typography variant="small" className="text-[11px] text-gray-500 dark:text-gray-400 font-normal leading-tight mt-0.5">
                Simple habits. Consistent preparation.
              </Typography>
            </div>
          </div>

          {/* Theme Quick Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-gray-700" />}
          </button>
        </div>

        {/* Main Section */}
        <div className="px-3 mb-4">
          <Typography
            variant="small"
            color="gray"
            className="px-3 text-[11px] font-bold uppercase tracking-wider text-blue-gray-400 dark:text-gray-500 mb-1"
          >
            Main
          </Typography>
          <List className="p-0 min-w-full space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <ListItem
                    selected={isActive}
                    className={`rounded-lg py-2 px-3 transition-colors ${
                      isActive
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 focus:bg-gray-900 dark:hover:bg-gray-100"
                        : "text-blue-gray-700 dark:text-gray-300 hover:bg-blue-gray-50 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    <div className="mr-3 shrink-0 flex items-center">
                      <Icon className={`h-5 w-5 ${isActive ? "text-white dark:text-gray-900" : "text-blue-gray-500 dark:text-gray-400"}`} />
                    </div>
                    <Typography
                      variant="small"
                      color="inherit"
                      className={`font-medium ${isActive ? "font-semibold" : ""}`}
                    >
                      {item.name}
                    </Typography>
                  </ListItem>
                </Link>
              );
            })}
          </List>
        </div>

        {/* Account Section */}
        <div className="px-3">
          <Typography
            variant="small"
            color="gray"
            className="px-3 text-[11px] font-bold uppercase tracking-wider text-blue-gray-400 dark:text-gray-500 mb-1"
          >
            Account
          </Typography>
          <List className="p-0 min-w-full space-y-1">
            {accountNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <ListItem
                    selected={isActive}
                    className={`rounded-lg py-2 px-3 transition-colors ${
                      isActive
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 focus:bg-gray-900 dark:hover:bg-gray-100"
                        : "text-blue-gray-700 dark:text-gray-300 hover:bg-blue-gray-50 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    <div className="mr-3 shrink-0 flex items-center">
                      <Icon className={`h-5 w-5 ${isActive ? "text-white dark:text-gray-900" : "text-blue-gray-500 dark:text-gray-400"}`} />
                    </div>
                    <Typography
                      variant="small"
                      color="inherit"
                      className={`font-medium ${isActive ? "font-semibold" : ""}`}
                    >
                      {item.name}
                    </Typography>
                  </ListItem>
                </Link>
              );
            })}

            {/* Logout item */}
            <ListItem
              onClick={handleSignOut}
              className="rounded-lg py-2 px-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 transition-colors cursor-pointer"
            >
              <div className="mr-3 shrink-0 flex items-center">
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-500" />
              </div>
              <Typography variant="small" color="inherit" className="font-medium">
                Logout
              </Typography>
            </ListItem>
          </List>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-blue-gray-100 dark:border-gray-800 bg-blue-gray-50/40 dark:bg-gray-900/80">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <Typography variant="small" color="blue-gray" className="font-semibold text-xs truncate dark:text-gray-200">
              {profile?.full_name || "UPSC Aspirant"}
            </Typography>
            <Typography variant="small" className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {profile?.email || user?.email || "aspirant@upsc"}
            </Typography>
          </div>
          <div className="flex items-center gap-1">
            {hasBiometrics && (
              <span title="Fingerprint / Biometric Login Enabled" className="text-emerald-500">
                <FingerPrintIcon className="w-4 h-4" />
              </span>
            )}
            {isDemo && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-gray-100 dark:bg-gray-800 text-blue-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
                Demo
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <Typography variant="small" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Checking authentication...
          </Typography>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors">
      {/* 1. Sidebar (Desktop) */}
      <aside className="hidden md:block w-64 bg-white dark:bg-gray-900 border-r border-blue-gray-100 dark:border-gray-800 flex-shrink-0 sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b border-blue-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center font-bold text-xs">
            <AcademicCapIcon className="w-4 h-4" />
          </div>
          <Typography variant="h6" color="blue-gray" className="text-sm font-bold dark:text-white">
            UPSC Study Tracker
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
          >
            {isDark ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4" />}
          </button>
          <IconButton
            variant="text"
            color="blue-gray"
            size="sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1 dark:text-white"
          >
            {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </IconButton>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Collapse open={mobileOpen} className="md:hidden z-30 bg-white dark:bg-gray-900 border-b border-blue-gray-100 dark:border-gray-800">
        <div className="h-[calc(100vh-60px)]">
          {navContent}
        </div>
      </Collapse>

      {/* 2. Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {(title || subtitle) && (
          <div className="mb-6 border-b border-blue-gray-100 dark:border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              {title && (
                <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight text-xl sm:text-2xl dark:text-white">
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="small" className="text-gray-500 dark:text-gray-400 text-xs font-medium mt-0.5">
                  {subtitle}
                </Typography>
              )}
            </div>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500">
              {formatDisplayDate(todayIso)}
            </div>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
