"use client";

import { useParams, useRouter } from "next/navigation";
import { UpdatePassageForm } from "@/components/admin-dash/updatePassageForm";
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
    return <div>Loading...</div>;
  }

  if (!passage) {
    return (
      <div className="text-red-600">
        Passage not found: {error?.message || ""}
      </div>
    );
  }

  return <UpdatePassageForm passage={passage} onSuccess={handleSuccess} />;
}
