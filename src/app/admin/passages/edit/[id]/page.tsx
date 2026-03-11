"use client";

import { useParams, useRouter } from "next/navigation";
import { UpdatePassageForm } from "@/components/admin-dash/passages/updatePassageForm";
import { usePassageById } from "@/lib/hooks/usePassageById";

export default function EditPassagePage() {
  const params = useParams();
  const router = useRouter();
  const passageId = params.id as string;

  const { data: passage, isLoading, error } = usePassageById(passageId);

  const handleSuccess = () => {
    router.push(`/admin`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#31318A] border-t-transparent" />
        <span className="ml-3 text-sm text-[#00306E]/60 font-medium">
          Loading passage...
        </span>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-sm text-red-700 shadow-sm">
          Passage not found: {error?.message || ""}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen w-full overflow-auto invisible-scrollbar">
      <style jsx global>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <UpdatePassageForm passage={passage} onSuccess={handleSuccess} />
    </div>
  );
}
