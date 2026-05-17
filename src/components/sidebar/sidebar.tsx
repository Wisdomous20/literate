"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
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
import type { LucideIcon } from "lucide-react";

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

type SidebarNavItemProps = {
  collapsed: boolean;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  itemRef?: (node: HTMLAnchorElement | null) => void;
  label: string;
  onActivate?: () => void;
};

function SidebarNavItem({
  collapsed,
  href,
  icon: Icon,
  isActive,
  itemRef,
  label,
  onActivate,
}: SidebarNavItemProps) {
  return (
    <Link
      ref={itemRef}
      href={href}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }

        onActivate?.();
      }}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative z-10 isolate flex items-center overflow-visible text-sm font-medium transition-all duration-200 ease-out",
        collapsed ? "justify-center rounded-lg px-0 py-2" : "gap-3 px-2 py-2",
        isActive
          ? collapsed
            ? "rounded-[20px] bg-white text-[#6666FF] shadow-[0_12px_28px_rgba(55,44,183,0.2)]"
            : "z-30 text-[#6666FF]"
          : "rounded-lg text-white/90 hover:text-white group hover:[&_.sidebar-label]:text-white hover:[&_.sidebar-icon]:text-white",
      )}
    >
      <div
        className={cn(
          "sidebar-icon relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200",
          isActive ? "bg-[#5D5DFB]" : "bg-white group-hover:bg-[#5D5DFB]",
        )}
      >
        <Icon
          className={cn(
            "sidebar-icon h-4 w-4",
            "transition-colors duration-200",
            isActive ? "text-white" : "text-[#6666FF] group-hover:text-white",
          )}
        />
      </div>
      {!collapsed && (
        <span
          className={cn(
            "sidebar-label relative z-10 max-w-[140px] text-[13px]",
            isActive
              ? "font-semibold text-[#6666FF]"
              : "text-white group-hover:text-white",
          )}
        >
          {label}
        </span>
      )}
    </Link>
  );
}

function renderMenuItems(
  activeHref: string | undefined,
  collapsed: boolean,
  onActivate: (href: string) => void,
  setItemRef: (href: string, node: HTMLAnchorElement | null) => void,
) {
  return (
    <nav
      className="relative z-10 space-y-1"
      data-tour-target="sidebar-assessments"
    >
      {menuItems.map((item) => (
        <SidebarNavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          isActive={activeHref === item.href}
          collapsed={collapsed}
          itemRef={(node) => setItemRef(item.href, node)}
          label={item.label}
          onActivate={() => onActivate(item.href)}
        />
      ))}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<
    boolean | null
  >(null);
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);
  const hasActiveSubscriptionRef = useRef<boolean | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const navItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [activeHighlight, setActiveHighlight] = useState({
    height: 0,
    top: 0,
    visible: false,
  });

  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const schoolYear = getCurrentSchoolYear();
  const isOrgAdmin = session?.user?.role === "ORG_ADMIN";
  const routeActiveHref = [
    ...menuItems,
    ...generalItems,
    ...(isOrgAdmin ? orgAdminItems : []),
  ].find((item) => pathname === item.href)?.href;
  const activeHref = optimisticHref ?? routeActiveHref;

  useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  const setNavItemRef = useCallback(
    (href: string, node: HTMLAnchorElement | null) => {
      navItemRefs.current[href] = node;
    },
    [],
  );

  const updateActiveHighlight = useCallback(() => {
    const container = navContainerRef.current;
    const activeItem = activeHref ? navItemRefs.current[activeHref] : null;

    if (!container || !activeItem || collapsed) {
      setActiveHighlight((current) =>
        current.visible ? { ...current, visible: false } : current,
      );
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const next = {
      height: itemRect.height,
      top: itemRect.top - containerRect.top,
      visible: true,
    };

    setActiveHighlight((current) =>
      current.height === next.height &&
      current.top === next.top &&
      current.visible === next.visible
        ? current
        : next,
    );
  }, [activeHref, collapsed]);

  useLayoutEffect(() => {
    updateActiveHighlight();

    const container = navContainerRef.current;
    const activeItem = activeHref ? navItemRefs.current[activeHref] : null;
    if (!container || !activeItem || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateActiveHighlight);
    observer.observe(container);
    observer.observe(activeItem);

    return () => observer.disconnect();
  }, [activeHref, isOrgAdmin, updateActiveHighlight]);

  useEffect(() => {
    window.addEventListener("resize", updateActiveHighlight);
    return () => window.removeEventListener("resize", updateActiveHighlight);
  }, [updateActiveHighlight]);

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
        "relative z-30 flex h-screen flex-col overflow-hidden bg-[#6e55fd] transition-all duration-300",
        collapsed ? "w-20 min-w-20" : "w-65 min-w-65",
      )}
    >
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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
        <div
          className={cn(
            "flex items-center gap-2 pb-4 pt-4 px-4",
            collapsed ? "flex-col justify-center gap-2" : "justify-between px-6",
          )}
        >
          {collapsed ? null : (
            <div className="flex items-center gap-3">
              <Image
                src="/Final%20Icon%20Logo.svg"
                alt="LiteRate"
                width={40}
                height={40}
                className="h-10 w-10"
              />
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
            className={cn(
              "z-50 flex h-9 w-9 items-center justify-center rounded-full bg-[#5D5DFB] text-white shadow-lg ring-2 ring-[#5D5DFB] transition-all hover:bg-[#6652fb]",
              collapsed ? "" : "",
            )}
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

        <div
          ref={navContainerRef}
          className={cn("relative flex-1", collapsed ? "px-3" : "px-6")}
        >
          {!collapsed && (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -left-6 right-0 z-0 bg-white transition-[height,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                activeHighlight.visible ? "opacity-100" : "opacity-0",
              )}
              style={{
                height: activeHighlight.height,
                transform: `translateY(${activeHighlight.top}px)`,
              }}
            >
              <span
                className="absolute -top-6 right-0 h-6 w-6 bg-white"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(circle at 0 0, transparent 23px, #000 24px)",
                  maskImage:
                    "radial-gradient(circle at 0 0, transparent 23px, #000 24px)",
                }}
              />
              <span
                className="absolute -bottom-6 right-0 h-6 w-6 bg-white"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(circle at 0 100%, transparent 23px, #000 24px)",
                  maskImage:
                    "radial-gradient(circle at 0 100%, transparent 23px, #000 24px)",
                }}
              />
            </span>
          )}
          {!collapsed && (
            <p className="mb-3 px-2 text-[11px] font-semibold tracking-[0.25em] text-white/90">
              MENU
            </p>
          )}
          {renderMenuItems(
            activeHref,
            collapsed,
            setOptimisticHref,
            setNavItemRef,
          )}

          <div
            className={cn("my-5 h-px bg-white/30", collapsed ? "mx-1" : "mx-2")}
          />

          {!collapsed && (
            <p className="mb-3 px-2 text-[11px] font-semibold tracking-[0.25em] text-white/90">
              GENERAL
            </p>
          )}
          <nav className="relative z-10 space-y-1">
            {generalItems.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  isActive={isActive}
                  collapsed={collapsed}
                  itemRef={(node) => setNavItemRef(item.href, node)}
                  label={item.label}
                  onActivate={() => setOptimisticHref(item.href)}
                />
              );
            })}
            {isOrgAdmin &&
              orgAdminItems.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <SidebarNavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    isActive={isActive}
                    collapsed={collapsed}
                    itemRef={(node) => setNavItemRef(item.href, node)}
                    label={item.label}
                    onActivate={() => setOptimisticHref(item.href)}
                  />
                );
              })}
          </nav>

          {/* Upgrade Premium Box */}
          {!collapsed && hasActiveSubscription === false && (
            <div className="mt-8 rounded-2xl bg-white p-4 shadow-lg">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#6666FF]" />
                <h3 className="text-sm font-bold text-[#6666FF]">
                  Upgrade to Premium
                </h3>
              </div>
              <p className="mb-4 text-xs text-gray-600">
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
              "relative z-10 flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-white/90 group",
              collapsed ? "w-auto justify-center" : "w-full",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white group-hover:bg-[#5D5DFB] transition-colors duration-200">
              <LogOut className="h-4 w-4 text-[#6666FF] group-hover:text-white transition-colors duration-200" />
            </div>
            {!collapsed && <span className="text-[13px]">Logout Account</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
