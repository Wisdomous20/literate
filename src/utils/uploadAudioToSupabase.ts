import { uploadAudioToSupabase as uploadAudioAction } from "@/app/actions/oral-reading/uploadAudioToSupabase"

export async function uploadAudioToSupabase(
  audioBlob: Blob,
  studentId: string,
  passageId: string
): Promise<string | null> {
  try {
    const timestamp = Date.now()
    const filePath = `oral-reading/${studentId}-${passageId}-${timestamp}.webm`

    const formData = new FormData()
    formData.append("file", new File([audioBlob], `${timestamp}.webm`, { type: audioBlob.type || "audio/webm" }))
    formData.append("filePath", filePath)

    const result = await uploadAudioAction(formData)

    if (!result.success) {
      console.error("Audio upload failed:", result.error)
      return null
    }

    return result.url ?? null
  } catch (error) {
    console.error("Upload error:", error)
    return null
  }
}