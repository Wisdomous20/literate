"use client";

import { ChevronRight, Folder, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { deleteClass } from "@/app/actions/class/deleteClass";
import { useRouter } from "next/navigation";
import { UpdateClassModal } from "./updateClassModal";
import { createPortal } from "react-dom";

type ClassCardVariant = "blue" | "yellow" | "cyan";

interface ClassCardProps {
  name: string;
  studentCount: number;
  variant?: ClassCardVariant;
  onClick?: () => void;
  classRoomId: string;
  onClassUpdated?: () => void;
}

const variantStyles: Record<
  ClassCardVariant,
  {
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    border: string;
  }
> = {
  blue: {
    iconBg: "bg-[#EEF1FF]",
    iconColor: "text-[#5D5DFB]",
    badgeBg: "bg-[#EEF1FF]",
    badgeText: "text-[#24356E]",
    border: "hover:border-[#8B93FF]",
  },
  yellow: {
    iconBg: "bg-[#FFF4D9]",
    iconColor: "text-[#C08A00]",
    badgeBg: "bg-[#FFF4D9]",
    badgeText: "text-[#7B5900]",
    border: "hover:border-[#E4C562]",
  },
  cyan: {
    iconBg: "bg-[#DEF7FF]",
    iconColor: "text-[#1582A6]",
    badgeBg: "bg-[#DEF7FF]",
    badgeText: "text-[#155A73]",
    border: "hover:border-[#79CBE2]",
  },
};

export function ClassCard({
  name,
  studentCount,
  variant = "blue",
  onClick,
  classRoomId,
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
      const result = await deleteClass(classRoomId);
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
            "surface-panel-interactive group relative flex min-h-35 flex-col justify-between overflow-hidden rounded-[26px] p-5 cursor-pointer",
            styles.border,
          )}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),transparent)]" />
          {/* Top section with folder icon and label */}
          <div className="flex items-center gap-2">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-[16px]", styles.iconBg)}>
              <Folder className={cn("h-4 w-4", styles.iconColor)} />
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
                styles.badgeBg,
                styles.badgeText,
              )}
            >
              Class
            </span>
          </div>
          {/* Bottom section with class name and student count */}
          <div className="mt-6">
            <h3 className="mb-1 truncate text-xl font-bold tracking-[-0.03em] text-[#16215C]">
              {name}
            </h3>
            <p className="text-sm text-[#6072A6]">
              {studentCount} student{studentCount === 1 ? "" : "s"}
            </p>
          </div>

          {/* Arrow indicator */}
          <ChevronRight className="absolute bottom-5 right-5 h-4 w-4 text-[#6072A6] transition-transform group-hover:translate-x-0.5" />
        </div>

        {/* Menu button */}
        <div className="absolute right-3 top-3 z-20" ref={menuRef}>
          <button
            type="button"
            onClick={handleMenuClick}
            aria-label="Open class options"
            className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
          >
            <MoreVertical className="h-4 w-4 text-[#00306E]/50" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-50 w-28 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg">
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

      {/* Delete confirmation modal */}
      {isDeleteModalOpen &&
        typeof window !== "undefined" &&
        createPortal(
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
                    {name}?
                  </strong>{" "}
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
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <UpdateClassModal
        isOpen={isUpdateModalOpen}
        classRoomId={classRoomId}
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
