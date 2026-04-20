"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getSubscriptionAction } from "@/app/actions/subscription/getSubscription";
import { PLANS, PlanKey } from "@/config/plans";
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

interface SubscriptionInfo {
  isActive: boolean;
  planName: string | null;
  loading: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo>({
    isActive: false,
    planName: null,
    loading: true,
  });

  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const schoolYear = getCurrentSchoolYear();
  const isOrgAdmin = session?.user?.role === "ORG_ADMIN";

  useEffect(() => {
    let cancelled = false;
    async function fetchSubscription() {
      if (!session?.user?.id) {
        if (!cancelled) {
          setSubInfo({ isActive: false, planName: null, loading: false });
        }
        return;
      }
      try {
        const res = await getSubscriptionAction();
        if (cancelled) return;
        const sub =
          res.success && "subscription" in res ? res.subscription : null;
        const isActive =
          sub?.status === "ACTIVE" &&
          sub.currentPeriodEnd != null &&
          new Date(sub.currentPeriodEnd) >= new Date();
        const planName =
          sub?.planType && sub.planType in PLANS
            ? PLANS[sub.planType as PlanKey].name
            : null;
        setSubInfo({ isActive, planName, loading: false });
      } catch {
        if (!cancelled) {
          setSubInfo({ isActive: false, planName: null, loading: false });
        }
      }
    }
    fetchSubscription();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

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

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-2 shrink-0 pb-4 pt-4 px-4",
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

        {/* Greeting */}
        {!collapsed ? (
          <div className="px-8 pb-4 pt-2 shrink-0">
            <h2 className="text-lg font-semibold text-white">
              Hi, Teacher {firstName}!
            </h2>
            <p className="text-sm text-white/70">S.Y {schoolYear}</p>
          </div>
        ) : (
          <div className="pb-4 pt-2 shrink-0" />
        )}

        {/* Scrollable menu content area + premium box */}
        <div
          className={cn("flex-1 overflow-y-auto", collapsed ? "px-3" : "px-6")}
        >
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
                    "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-200 group",
                    collapsed ? "justify-center px-0" : "px-2",
                    isActive
                      ? "bg-[rgba(93,93,251,0.7)] text-white shadow-md"
                      : "text-white/90 hover:text-white hover:bg-[rgba(93,93,251,0.25)] hover:shadow-2xl hover:scale-[1.06] hover:ring-2 hover:ring-white hover:ring-offset-2 hover:ring-offset-[#6666FF]",
                  )}
                  style={{ transition: "box-shadow 0.2s, transform 0.2s" }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB] group-hover:scale-110 transition-transform">
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
                    "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-200 group",
                    collapsed ? "justify-center px-0" : "px-2",
                    isActive
                      ? "bg-[rgba(93,93,251,0.7)] text-white shadow-md"
                      : "text-white/90 hover:text-white hover:bg-[rgba(93,93,251,0.25)] hover:shadow-2xl hover:scale-[1.06] hover:ring-2 hover:ring-white hover:ring-offset-2 hover:ring-offset-[#6666FF]",
                  )}
                  style={{ transition: "box-shadow 0.2s, transform 0.2s" }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB] group-hover:scale-110 transition-transform">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  {!collapsed && (
                    <span className="text-[13px]">{item.label}</span>
                  )}
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
                      "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-200 group",
                      collapsed ? "justify-center px-0" : "px-2",
                      isActive
                        ? "bg-[rgba(93,93,251,0.7)] text-white shadow-md"
                        : "text-white/90 hover:text-white hover:bg-[rgba(93,93,251,0.25)] hover:shadow-2xl hover:scale-[1.06] hover:ring-2 hover:ring-white hover:ring-offset-2 hover:ring-offset-[#6666FF]",
                    )}
                    style={{ transition: "box-shadow 0.2s, transform 0.2s" }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB] group-hover:scale-110 transition-transform">
                      <item.icon className="h-4 w-4 text-white" />
                    </div>
                    {!collapsed && (
                      <span className="text-[13px]">{item.label}</span>
                    )}
                  </Link>
                );
              })}
          </nav>
          {/* Responsive Premium Box */}
          {!collapsed && (
            <div
              className="mt-6 rounded-xl p-4 shadow-lg border border-[#a78bfa] bg-gradient-to-br from-[#ede9fe] via-[#f3e8ff] to-[#c4b5fd] relative overflow-hidden w-full max-w-xs mx-auto sm:max-w-sm md:max-w-md"
              style={{
                boxShadow: "0 4px 16px 0 rgba(139,92,246,0.10)",
                minHeight: "120px",
              }}
            >
              {subInfo.loading ? (
                /* Loading skeleton — prevents flicker */
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-28 rounded bg-[#c4b5fd]/50" />
                  <div className="h-3 w-36 rounded bg-[#c4b5fd]/30" />
                  <div className="h-7 w-32 rounded-full bg-[#c4b5fd]/40 mt-3" />
                </div>
              ) : (
                <>
                  {/* Decorative icon background */}
                  <div className="absolute right-1 top-1 opacity-15 pointer-events-none">
                    <Zap className="h-10 w-10 text-[#a78bfa]" />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#6735f0] mb-0.5 relative z-10">
                    {subInfo.isActive ? "Premium Access" : "Upgrade to Premium"}
                  </h3>
                  <p className="text-[12px] text-[#6d28d9] mb-2 relative z-10">
                    {subInfo.isActive
                      ? "You have access to all features."
                      : "Unlock all assessments"}
                  </p>
                  <div className="flex items-center gap-2 mt-3 mb-1 relative z-10">
                    {subInfo.isActive && subInfo.planName ? (
                      <span
                        className={cn(
                          "px-5 py-1 rounded-full text-[15px] font-bold tracking-wide shadow bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white",
                        )}
                      >
                        {`${subInfo.planName} Plan`}
                      </span>
                    ) : (
                      <span className="text-[12px] font-semibold tracking-wide text-[#7c3aed]">
                        Free User Plan
                      </span>
                    )}
                  </div>
                  {!subInfo.isActive && (
                    <Link
                      href="/dashboard/subscription"
                      className="block w-full rounded-md bg-gradient-to-r from-[#a78bfa] to-[#643aed] px-2 py-1 text-center text-[12px] font-semibold text-white shadow hover:from-[#7c3aed] hover:to-[#a78bfa] hover:scale-105 transition-all mt-2"
                      style={{ transition: "background 0.2s, transform 0.2s" }}
                    >
                      Upgrade
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Divider + Logout — pinned to bottom */}
        <div
          className={cn(
            "shrink-0 h-px bg-white/30",
            collapsed ? "mx-3" : "mx-8",
          )}
        />

        <div
          className={cn(
            "shrink-0 px-6 py-4",
            collapsed && "flex justify-center",
          )}
        >
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout Account" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-white/90 transition-all duration-200 hover:text-white hover:bg-[rgba(93,93,251,0.25)] hover:shadow-2xl hover:scale-[1.06] hover:ring-2 hover:ring-white hover:ring-offset-2 hover:ring-offset-[#6666FF]",
              collapsed ? "w-auto justify-center" : "w-full",
            )}
            style={{ transition: "box-shadow 0.2s, transform 0.2s" }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5D5DFB] group-hover:scale-110 transition-transform">
              <LogOut className="h-4 w-4 text-white" />
            </div>
            {!collapsed && <span className="text-[13px]">Logout Account</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
