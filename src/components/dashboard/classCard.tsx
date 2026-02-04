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
    iconBg: "bg-[rgba(0,109,252,0.22)]",
    iconColor: "text-[#0066EC]",
    badgeBg: "bg-[rgba(0,109,252,0.22)]",
    badgeText: "text-[#00306E]",
  },
  yellow: {
    iconBg: "bg-[#F1F0BE]",
    iconColor: "text-[#E6CD0C]",
    badgeBg: "bg-[#F1F0BE]",
    badgeText: "text-[#867705]",
  },
  cyan: {
    iconBg: "bg-[#91E2F2]",
    iconColor: "text-[#47B6CA]",
    badgeBg: "bg-[#91E2F2]",
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

  // Close menu when clicking outside
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
    } catch (error) {
      alert("Error deleting class");
      console.error(error);
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
            "group relative flex w-full min-h-[127px] flex-col justify-between rounded-[15px] border border-[#5D5DFB] bg-[rgba(255,254,254,0.09)] p-4 text-left shadow-[0px_0px_20px_1px_rgba(84,164,255,0.65)] transition-all hover:scale-[1.02] cursor-pointer",
          )}
        >
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "flex h-[25px] w-[27px] items-center justify-center rounded-[3px]",
                styles.iconBg,
              )}
            >
              <Folder className={cn("h-3.5 w-3.5", styles.iconColor)} />
            </div>

            <span
              className={cn(
                "rounded-[3px] px-2 py-0.5 text-[8px] font-semibold leading-[12px] mr-8",
                styles.badgeBg,
                styles.badgeText,
              )}
            >
              {studentCount} students
            </span>
          </div>

          <div className="flex items-center justify-between pt-6">
            <span className="text-[15px] font-semibold leading-[22px] text-[#00306E]">
              {name}
            </span>
            <ChevronRight className="h-5 w-5 text-[#00306E] transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* 3-Point Menu - Outside button role */}
        <div className="absolute top-4 right-4 z-20" ref={menuRef}>
          <button
            type="button"
            onClick={handleMenuClick}
            aria-label="Open menu"
            className="relative z-10 p-1 rounded hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-[#00306E]" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-50 w-32 rounded-lg bg-white border border-gray-200 shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={handleUpdate}
                className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
                className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Class
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <p className="text-gray-600">
                Are you sure you want to delete the class{" "}
                <strong>{name}</strong>? This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Class Modal */}
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
