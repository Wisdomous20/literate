"use client";

import { ChevronRight, Folder, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { deleteClass } from "@/app/actions/class/deleteClass";
import { useRouter } from "next/navigation";
import { UpdateClassModal } from "./updateClassModal";

type ClassCardVariant = "blue" | "yellow" | "cyan";

interface ClassCardProps {
  name: string;
  studentCount: number;
  variant?: ClassCardVariant;
  onClick?: () => void;
  classId: string;
  onClassUpdated?: () => void;
}

const variantStyles: Record<
  ClassCardVariant,
  {
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  blue: {
    iconBg: "bg-[rgba(0,109,252,0.18)]",
    iconColor: "text-[#0066EC]",
    badgeBg: "bg-[rgba(0,109,252,0.18)]",
    badgeText: "text-[#00306E]",
  },
  yellow: {
    iconBg: "bg-[#F1F0BE]",
    iconColor: "text-[#C9AC00]",
    badgeBg: "bg-[#F1F0BE]",
    badgeText: "text-[#7A6300]",
  },
  cyan: {
    iconBg: "bg-[#C0EEF8]",
    iconColor: "text-[#2B9DB5]",
    badgeBg: "bg-[#C0EEF8]",
    badgeText: "text-[#0D4F5D]",
  },
};

export function ClassCard({
  name,
  studentCount,
  variant = "blue",
  onClick,
  classId,
  onClassUpdated,
}: ClassCardProps) {
  const styles = variantStyles[variant];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteClass(classId);
      if (result.success) {
        setIsDeleteModalOpen(false);
        setIsMenuOpen(false);
        onClassUpdated?.();
        router.refresh();
      } else {
        alert(result.error || "Failed to delete class");
      }
    } catch (err) {
      alert("Error deleting class");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsUpdateModalOpen(true);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <>
      <div className="relative">
        <div
          role="button"
          onClick={onClick}
          onKeyDown={handleCardKeyDown}
          tabIndex={0}
          className={cn(
            "group relative flex h-29 w-full flex-col justify-between overflow-hidden rounded-[15px] border border-[#5D5DFB] bg-white p-4 shadow-[0px_0px_16px_1px_rgba(84,164,255,0.55)] transition-all hover:scale-[1.02] cursor-pointer",
          )}
        >
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-lg",
                styles.iconBg,
              )}
            >
              <Folder className={cn("h-3.5 w-3.5", styles.iconColor)} />
            </div>
            <span
              className={cn(
                "mr-7 rounded-lg px-2 py-0.5 text-[9px] font-semibold",
                styles.badgeBg,
                styles.badgeText,
              )}
            >
              {studentCount} students
            </span>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-1">
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight text-[#00306E]">
              {name}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#00306E]/60 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        <div className="absolute right-3 top-3 z-20" ref={menuRef}>
          <button
            type="button"
            onClick={handleMenuClick}
            aria-label="Open class options"
            className="rounded p-0.5 transition-colors hover:bg-gray-100"
          >
            <MoreVertical className="h-3.5 w-3.5 text-[#00306E]/60" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-6 z-50 w-28 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg">
              <button
                type="button"
                onClick={handleUpdate}
                className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Update
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full border-t border-gray-100 px-3 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Delete Class
              </h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete{" "}
                <strong className="text-gray-900 block truncate max-w-full">
                  {name}
                </strong>{" "}
                be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="rounded-lg bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <UpdateClassModal
        isOpen={isUpdateModalOpen}
        classId={classId}
        currentName={name}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdateSuccess={() => {
          onClassUpdated?.();
          router.refresh();
        }}
      />
    </>
  );
}
