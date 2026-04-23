"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { hasActiveAccessAction } from "@/app/actions/subscription/hasActiveAccess";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ClipboardList,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  Users,
} from "lucide-react";

function getCurrentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

const menuItems = [
  {
    label: "My Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Oral Reading Test",
    href: "/dashboard/oral-reading-test",
    icon: FileText,
  },
  {
    label: "Reading Fluency Test",
    href: "/dashboard/reading-fluency-test",
    icon: BookOpen,
  },
  {
    label: "Reading Comprehension Test",
    href: "/dashboard/reading-comprehension-test",
    icon: ClipboardList,
  },
];

const generalItems = [
  {
    label: "Settings",
    href: "/dashboard/settings-page",
    icon: Settings,
  },
];

const orgAdminItems = [
  {
    label: "Organization",
    href: "/dashboard/organization",
    icon: Users,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const hasActiveSubscriptionRef = useRef<boolean | null>(null);

  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const schoolYear = getCurrentSchoolYear();
  const isOrgAdmin = session?.user?.role === "ORG_ADMIN";

  useEffect(() => {
    hasActiveSubscriptionRef.current = hasActiveSubscription;
  }, [hasActiveSubscription]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) {
      setHasActiveSubscription(false);
      return;
    }

    let cancelled = false;
    setHasActiveSubscription(null);
    const justPaid =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("subscription") ===
        "success";
    const maxAttempts = justPaid ? 8 : 1;
    let attempt = 0;

    const tick = async () => {
      const res = await hasActiveAccessAction();
      if (cancelled) return;

      if (res.success && res.hasAccess) {
        setHasActiveSubscription(true);
        return;
      }

      if (++attempt < maxAttempts) {
        setTimeout(tick, 2000);
        return;
      }

      setHasActiveSubscription(false);
    };

    tick();

    const onVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        hasActiveSubscriptionRef.current !== true
      ) {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session?.user?.id, status]);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col bg-[#6e55fd] shadow-[4px_0_20px_rgba(102,102,255,0.3)] transition-all duration-300 overflow-hidden",
        collapsed ? "w-20 min-w-20" : "w-65 min-w-65",
      )}
    >
      {/* SVG background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg
          viewBox="0 0 320 800"
          preserveAspectRatio="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,120 Q80,180 320,60 L320,800 L0,800 Z"
            fill="#7878FF"
            opacity="0.35"
          />
          <path
            d="M0,300 Q120,400 320,220 L320,800 L0,800 Z"
            fill="#5555EE"
            opacity="0.25"
          />
          <path
            d="M0,600 Q160,700 320,540 L320,800 L0,800 Z"
            fill="#8888FF"
            opacity="0.20"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-0 flex h-full flex-col">
        {/* Top Header with Button */}
        <div
          className={cn(
            "flex items-center gap-2 pb-4 pt-4 px-4",
            collapsed ? "justify-center" : "justify-between px-6",
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                >
                  <path d="M16 4L6 10V22L16 28L26 22V10L16 4Z" fill="white" />
                  <path
                    d="M16 4L6 10M16 4L26 10M16 4V16M6 10V22L16 28M6 10L16 16M26 10V22L16 28M26 10L16 16M16 28V16"
                    stroke="#6666FF"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-[0.02em] text-white">LiteRate</span>
            </div>
          )}

          {/* Toggle Button - Now Purple */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="z-50 flex h-9 w-9 items-center justify-center rounded-full bg-[#5D5DFB] text-white shadow-lg ring-2 ring-[#5D5DFB] hover:bg-[#6652fb] transition-all"
          >
            {collapsed ? <ChevronsRight className="h-6 w-6" /> : <ChevronsLeft className="h-6 w-6" />}
          </button>
        </div>

        {!collapsed ? (
          <div className="px-8 pb-4 pt-2">
            <h2 className="text-lg font-semibold text-white">Hi, Teacher {firstName}!</h2>
            <p className="text-sm text-white/70">S.Y {schoolYear}</p>
          </div>
        ) : (
          <div className="pb-4 pt-2" />
        )}

        <div className={cn("flex-1", collapsed ? "px-3" : "px-6")}>
          {!collapsed && <p className="mb-3 px-2 text-[11px] font-semibold tracking-[0.25em] text-white/90">MENU</p>}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center px-0" : "px-2",
                    isActive
                      ? "bg-[rgba(93,93,251,0.6)] text-white"
                      : "text-white/90 hover:bg-[#6652fb] hover:text-white",
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB]">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  {!collapsed && <span className="text-[13px]">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className={cn("my-5 h-px bg-white/30", collapsed ? "mx-1" : "mx-2")} />

          {!collapsed && (
            <p className="mb-3 px-2 text-[11px] font-semibold tracking-[0.25em] text-white/90">GENERAL</p>
          )}
          <nav className="space-y-1">
            {generalItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center px-0" : "px-2",
                    isActive
                      ? "bg-[rgba(93,93,251,0.6)] text-white"
                      : "text-white/90 hover:bg-[#6652fb] hover:text-white",
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB]">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  {!collapsed && <span className="text-[13px]">{item.label}</span>}
                </Link>
              );
            })}
            {isOrgAdmin &&
              orgAdminItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                      collapsed ? "justify-center px-0" : "px-2",
                      isActive
                        ? "bg-[rgba(93,93,251,0.6)] text-white"
                        : "text-white/90 hover:bg-[#6652fb] hover:text-white",
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB]">
                      <item.icon className="h-4 w-4 text-white" />
                    </div>
                    {!collapsed && <span className="text-[13px]">{item.label}</span>}
                  </Link>
                );
              })}
          </nav>

          {/* Upgrade Premium Box */}
          {!collapsed && hasActiveSubscription === false && (
            <div className="mt-8 rounded-2xl bg-white p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-[#6666FF]" />
                <h3 className="text-sm font-bold text-[#6666FF]">Upgrade to Premium</h3>
              </div>
              <p className="text-xs text-gray-600 mb-4">Unlock all assessments</p>
              <Link
                href="/dashboard/subscription"
                className="block w-full rounded-lg bg-[#6666FF] px-4 py-2 text-center text-xs font-semibold text-white transition-all hover:bg-[#5555ee]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        <div className={cn("h-px bg-white/30", collapsed ? "mx-3" : "mx-8")} />

        <div className={cn("p-6", collapsed && "flex justify-center")}>
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout Account" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-white/90 transition-all duration-200 hover:bg-[#6652fb] hover:text-white",
              collapsed ? "w-auto justify-center" : "w-full"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB]">
              <LogOut className="h-4 w-4 text-white" />
            </div>
            {!collapsed && <span className="text-[13px]">Logout Account</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
