"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemPrefix,
  Collapse,
} from "@material-tailwind/react";
import {
  Squares2X2Icon,
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  FolderIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
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
  const { user, profile, signOut, isDemo, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const todayIso = formatDateToIso(new Date());

  // Protected route guard: Redirect unauthenticated visitors to /login
  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Sidebar navigation order matching specification:
  // Main: Dashboard, Habits, Syllabus, Calendar, Notes, Files
  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
    { name: "Habits", href: "/habits", icon: ClipboardDocumentCheckIcon },
    { name: "Syllabus", href: "/syllabus", icon: BookOpenIcon },
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
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand: Clean & not oversized */}
        <div className="mb-4 p-4 border-b border-blue-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold shadow-xs">
            <AcademicCapIcon className="w-5 h-5" />
          </div>
          <div>
            <Typography variant="h6" color="blue-gray" className="font-bold tracking-tight text-sm leading-tight">
              UPSC Study Tracker
            </Typography>
            <Typography variant="small" className="text-[11px] text-gray-500 font-normal leading-tight mt-0.5">
              Simple habits. Consistent preparation.
            </Typography>
          </div>
        </div>

        {/* Main Section */}
        <div className="px-3 mb-4">
          <Typography
            variant="small"
            color="gray"
            className="px-3 text-[11px] font-bold uppercase tracking-wider text-blue-gray-400 mb-1"
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
                    className={`rounded-lg py-2.5 px-3 transition-colors ${
                      isActive
                        ? "bg-gray-900 text-white hover:bg-gray-800 focus:bg-gray-900"
                        : "text-blue-gray-700 hover:bg-blue-gray-50"
                    }`}
                  >
                    <ListItemPrefix>
                      <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-blue-gray-500"}`} />
                    </ListItemPrefix>
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
            className="px-3 text-[11px] font-bold uppercase tracking-wider text-blue-gray-400 mb-1"
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
                    className={`rounded-lg py-2.5 px-3 transition-colors ${
                      isActive
                        ? "bg-gray-900 text-white hover:bg-gray-800 focus:bg-gray-900"
                        : "text-blue-gray-700 hover:bg-blue-gray-50"
                    }`}
                  >
                    <ListItemPrefix>
                      <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-blue-gray-500"}`} />
                    </ListItemPrefix>
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
              className="rounded-lg py-2.5 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
            >
              <ListItemPrefix>
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-500" />
              </ListItemPrefix>
              <Typography variant="small" color="inherit" className="font-medium">
                Logout
              </Typography>
            </ListItem>
          </List>
        </div>
      </div>

      {/* User Profile Footer Snippet */}
      <div className="p-4 border-t border-blue-gray-100 bg-blue-gray-50/40">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <Typography variant="small" color="blue-gray" className="font-semibold text-xs truncate">
              {profile?.full_name || "UPSC Aspirant"}
            </Typography>
            <Typography variant="small" className="text-[11px] text-gray-500 truncate">
              {profile?.email || user?.email || "aspirant@upsc"}
            </Typography>
          </div>
          {isDemo && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-gray-100 text-blue-gray-700 font-semibold uppercase tracking-wider">
              Demo
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <Typography variant="small" className="text-xs font-semibold text-gray-500">
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* 1. Sidebar (Desktop) */}
      <aside className="hidden md:block w-64 bg-white border-r border-blue-gray-100 flex-shrink-0 sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-blue-gray-100 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-gray-900 text-white flex items-center justify-center font-bold text-xs">
            <AcademicCapIcon className="w-4 h-4" />
          </div>
          <Typography variant="h6" color="blue-gray" className="text-sm font-bold">
            UPSC Study Tracker
          </Typography>
        </div>

        <IconButton
          variant="text"
          color="blue-gray"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1"
        >
          {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </IconButton>
      </div>

      {/* Mobile Nav Drawer / Collapse */}
      <Collapse open={mobileOpen} className="md:hidden bg-white border-b border-blue-gray-100 shadow-md">
        <div className="p-2">{navContent}</div>
      </Collapse>

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with date & status */}
        <div className="bg-white border-b border-blue-gray-100 py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Typography variant="small" color="blue-gray" className="font-semibold text-xs text-gray-600">
            {formatDisplayDate(todayIso)}
          </Typography>

          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Supabase
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Local Demo Mode
              </div>
            )}
          </div>
        </div>

        {/* 3. Page Header & 4. Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {title && (
            <div className="border-b border-blue-gray-100 pb-4 mb-6">
              <Typography variant="h4" color="blue-gray" className="font-bold tracking-tight">
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="small" className="text-gray-500 font-medium mt-0.5">
                  {subtitle}
                </Typography>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
