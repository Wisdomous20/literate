"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreateQuestionForm } from "@/components/admin-dash/createQuestionForm";
import { ChevronLeft } from "lucide-react";
import { getPassageByIdAction } from "@/app/actions/passage/getPassageById";

interface Passage {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  tags: string;
  testType: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function CreateQuestionForPassagePage() {
  const params = useParams();
  const router = useRouter();
  const passageId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [passage, setPassage] = useState<Passage | null>(null);

  useEffect(() => {
    async function fetchPassage() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getPassageByIdAction({ id: passageId });
        if (data) {
          setPassage(data as Passage);
        } else {
          setPassage(null);
          setError("Failed to load passage");
        }
      } catch (err: any) {
        setPassage(null);
        setError("Failed to load passage");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPassage();
  }, [passageId]);

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F0F4FF] hover:bg-[#E4F4FF] text-[#162DB0] font-bold text-lg shadow transition-all"
              style={{ marginLeft: 0 }}
            >
              <ChevronLeft className="h-6 w-6" />
              Back
            </button>
          </div>
          <div className="mb-8">
            <p className="text-base text-[#00306E]/70">
              Create a comprehension question for this passage
            </p>
          </div>
          {isLoading && <p>Loading passage...</p>}
          {error && (
            <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {passage && <CreateQuestionForm passageId={passageId} />}
        </div>
      </main>
    </div>
  );
}