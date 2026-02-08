"use client"

interface PassageDisplayProps {
  content: string
}

export function PassageDisplay({ content }: PassageDisplayProps) {
  return (
    <div
      className="h-full overflow-auto p-5"
      style={{
        background: "#EFFDFF",
        border: "1px solid #54A4FF",
        boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.37)",
        borderRadius: "10px",
      }}
    >
      {content ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#00306E]">
          {content}
        </p>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-[#00306E]/40">
            Click Add Passage button and select reading passages to start oral reading test
          </p>
        </div>
      )}
    </div>
  )
}
