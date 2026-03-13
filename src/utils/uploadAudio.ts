import { uploadAudioToGCS } from "@/app/actions/oral-fluency/uploadAudioToGCS";

export async function uploadAudio(
  audioBlob: Blob,
  studentId: string,
  passageId: string
): Promise<string | null> {
  try {
    const timestamp = Date.now();

    const isWav = audioBlob.type === "audio/wav" || audioBlob.type === "audio/wave";
    const ext = isWav ? "wav" : "webm";
    const contentType = isWav ? "audio/wav" : "audio/webm";

    const filePath = `oral-fluency/${studentId}-${passageId}-${timestamp}.${ext}`;

    const formData = new FormData();
    formData.append("file", new File([audioBlob], `${timestamp}.${ext}`, { type: contentType }));
    formData.append("filePath", filePath);

    const result = await uploadAudioToGCS(formData);

    if (!result.success) {
      console.error("Audio upload failed:", result.error);
      return null;
    }

    return result.url ?? null;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}