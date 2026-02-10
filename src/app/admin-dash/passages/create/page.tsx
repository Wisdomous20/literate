import { CreatePassageForm } from "@/components/admin-dash/createPassageForm";

export default function CreatePassagePage() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-[118px] items-center px-10 border-b border-[#8D8DEC] shadow-[0px_4px_4px_#54A4FF] bg-transparent rounded-tl-[50px]">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
          </div>
          <h1 className="text-[25px] font-semibold leading-[38px] text-[#31318A]">
            Create Passage
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          {/* Description */}
          <div className="mb-8">
            <p className="text-base text-[#00306E]/70">
              Create a new graded reading passage for assessments
            </p>
          </div>

          <CreatePassageForm />
        </div>
      </main>
    </div>
  );
}
