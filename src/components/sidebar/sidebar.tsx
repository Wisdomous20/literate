"use client";

import { useEffect, useState } from "react";
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
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const schoolYear = getCurrentSchoolYear();
  const isOrgAdmin = session?.user?.role === "ORG_ADMIN";

  useEffect(() => {
    if (!session?.user?.id) return;

    let cancelled = false;
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
      }
    };

    tick();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !hasActiveSubscription) {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session?.user?.id, hasActiveSubscription]);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col bg-[#6666FF] shadow-[4px_0_20px_rgba(102,102,255,0.3)] transition-all duration-300 overflow-hidden",
        collapsed ? "w-20 min-w-20" : "w-65 min-w-65",
      )}
    >
      <div className="absolute inset-0 opacity-25">
        <svg
          viewBox="0 0 260 800"
          preserveAspectRatio="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="softBlur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            </filter>
          </defs>
          <path
            d="M0,150 Q65,100 130,130 T260,150 L260,0 L0,0 Z"
            fill="white"
            opacity="0.8"
            filter="url(#softBlur)"
          />
          <path
            d="M0,250 Q65,200 130,230 T260,250 L260,80 Q65,130 0,100 Z"
            fill="white"
            opacity="0.6"
            filter="url(#softBlur)"
          />
          <path
            d="M0,350 Q65,300 130,330 T260,350 L260,180 Q65,230 0,200 Z"
            fill="white"
            opacity="0.5"
            filter="url(#softBlur)"
          />
          <path
            d="M0,450 Q65,400 130,430 T260,450 L260,280 Q65,330 0,300 Z"
            fill="white"
            opacity="0.4"
            filter="url(#softBlur)"
          />
          <path
            d="M0,550 Q65,500 130,530 T260,550 L260,380 Q65,430 0,400 Z"
            fill="white"
            opacity="0.3"
            filter="url(#softBlur)"
          />
          <path
            d="M0,650 Q65,600 130,630 T260,650 L260,480 Q65,530 0,500 Z"
            fill="white"
            opacity="0.25"
            filter="url(#softBlur)"
          />
          <path
            d="M0,750 Q65,700 130,730 T260,750 L260,580 Q65,630 0,600 Z"
            fill="white"
            opacity="0.2"
            filter="url(#softBlur)"
          />
          <path
            d="M0,800 Q65,750 130,780 T260,800 L260,680 Q65,730 0,700 Z"
            fill="white"
            opacity="0.15"
            filter="url(#softBlur)"
          />
        </svg>
      </div>

      <div className="relative z-0 flex h-full flex-col">
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
              <span className="text-xl font-bold tracking-[0.02em] text-white">
                LiteRate
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#6666FF] shadow-lg ring-2 ring-[#6666FF] hover:bg-gray-100 transition-all"
          >
            {collapsed ? (
              <ChevronsRight className="h-6 w-6" />
            ) : (
              <ChevronsLeft className="h-6 w-6" />
            )}
          </button>
        </div>

        {!collapsed ? (
          <div className="px-8 pb-4 pt-2">
            <h2 className="text-lg font-semibold text-white">
              Hi, Teacher {firstName}!
            </h2>
            <p className="text-sm text-white/70">S.Y {schoolYear}</p>
          </div>
        ) : (
          <div className="pb-4 pt-2" />
        )}

        <div className={cn("flex-1", collapsed ? "px-3" : "px-6")}>
          {!collapsed && (
            <p className="mb-3 px-2 text-[11px] font-semibold tracking-[0.25em] text-white/90">
              MENU
            </p>
          )}
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
                      : "text-white/90 hover:text-white",
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB]">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  {!collapsed && (
                    <span className="text-[13px]">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div
            className={cn("my-5 h-px bg-white/30", collapsed ? "mx-1" : "mx-2")}
          />

          {!collapsed && (
            <p className="mb-3 px-2 text-[11px] font-semibold tracking-[0.25em] text-white/90">
              GENERAL
            </p>
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
                    isActive ? "bg-[rgba(93,93,251,0.6)] text-white" : "text-white/90 hover:text-white",
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
                      isActive ? "bg-[rgba(93,93,251,0.6)] text-white" : "text-white/90 hover:text-white",
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

          {!collapsed && !hasActiveSubscription && (
            <div className="mt-8 rounded-2xl bg-white p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-[#6666FF]" />
                <h3 className="text-sm font-bold text-[#6666FF]">
                  Upgrade to Premium
                </h3>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Unlock all assessments
              </p>
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
              "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-white/90 transition-all duration-200 hover:text-white",
              collapsed ? "w-auto justify-center" : "w-full",
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
