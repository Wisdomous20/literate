"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPassageByIdAction } from "@/app/actions/passage/getPassageById";
import { UpdatePassageForm } from "@/components/admin-dash/updatePassageForm";

interface Passage {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  testType: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function EditPassagePage() {
  const params = useParams();
  const router = useRouter();
  const passageId = params.id as string;

  const [passage, setPassage] = useState<Passage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPassage = async () => {
      setIsLoading(true);
      try {
        const data = await getPassageByIdAction({ id: passageId });
        if (data) {
          setPassage(data as Passage);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load passage");
      } finally {
        setIsLoading(false);
      }
    };
    loadPassage();
  }, [passageId]);

  const handleSuccess = () => {
    router.push(`/admin`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!passage) {
    return <div className="text-red-600">Passage not found: {error}</div>;
  }

  return <UpdatePassageForm passage={passage} onSuccess={handleSuccess} />;
}
