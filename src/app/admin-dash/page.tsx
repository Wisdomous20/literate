"use client";

import { useState, useEffect } from "react";
import { FileText, HelpCircle, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import { getAllPassagesAction } from "../actions/admin/getAllPassage";

export default function AdminDashboard() {
  const [passageCount, setPassageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const passages = await getAllPassagesAction();
        if (Array.isArray(passages)) {
          setPassageCount(passages.length);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  const stats = [
    {
      label: "Total Passages",
      value: passageCount,
      icon: FileText,
      color: "#6666FF",
      bgColor: "rgba(102, 102, 255, 0.12)",
    },
    {
      label: "Comprehension Questions",
      value: 156,
      icon: HelpCircle,
      color: "#54A4FF",
      bgColor: "rgba(84, 164, 255, 0.12)",
    },
    {
      label: "Languages",
      value: 2,
      icon: BookOpen,
      color: "#2E8B57",
      bgColor: "rgba(46, 139, 87, 0.12)",
    },
    {
      label: "Active Teachers",
      value: 24,
      icon: Users,
      color: "#D4A017",
      bgColor: "rgba(212, 160, 23, 0.12)",
    },
  ];

  const quickLinks = [
    {
      title: "Manage Graded Passages",
      description:
        "Create and manage standardized reading passages for assessments",
      href: "/admin-dash/passages/create",
      icon: FileText,
    },
    {
      title: "Comprehension Questions",
      description: "Create and tag literal, inferential, or critical questions",
      href: "/admin-dash/questions/create",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-[118px] items-center border-b border-[#8D8DEC] bg-transparent px-10 shadow-[0px_4px_4px_#54A4FF] rounded-tl-[50px]">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
          </div>
          <h1 className="text-[25px] font-semibold leading-[38px] text-[#31318A]">
            Admin Dashboard
          </h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-[20px] bg-white p-5 shadow-[0px_0px_20px_1px_rgba(84,164,255,0.35)]"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bgColor}`}
              >
                <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#00306E]/60">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-[#00306E]">
                  {isLoading && stat.label === "Total Passages"
                    ? "..."
                    : stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="flex flex-col justify-between rounded-[20px] bg-white p-6 transition-all hover:scale-[1.01]"
              style={{
                boxShadow: "0px 0px 20px 1px rgba(84, 164, 255, 0.35)",
              }}
            >
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4F4FF]">
                    <link.icon className="h-5 w-5 text-[#6666FF]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#31318A]">
                    {link.title}
                  </h3>
                </div>
                <p className="text-sm text-[#00306E]/60">{link.description}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <span className="rounded-lg bg-[#2E2E68] px-5 py-2.5 text-sm font-semibold text-white shadow-[0px_4px_15px_rgba(46,46,104,0.4)]">
                  Manage
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
