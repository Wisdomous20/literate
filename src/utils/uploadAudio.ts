export async function uploadAudio(
  audioBlob: Blob,
  options?: { assessmentId?: string; assessmentToken?: string },
): Promise<string | null> {
  try {
    const timestamp = Date.now();

    const isWav = audioBlob.type === "audio/wav" || audioBlob.type === "audio/wave";
    const ext = isWav ? "wav" : "webm";
    const contentType = isWav ? "audio/wav" : "audio/webm";

    const formData = new FormData();
    formData.append("file", new File([audioBlob], `${timestamp}.${ext}`, { type: contentType }));
    if (options?.assessmentId) formData.append("assessmentId", options.assessmentId);

    const response = await fetch("/api/upload-audio", {
      method: "POST",
      body: formData,
      headers: options?.assessmentToken
        ? { "x-assessment-token": options.assessmentToken }
        : undefined,
    });

    const result = await response.json();

    if (!result.success) {
      console.error("Audio upload failed:", result.error);
      return null;
    }

    return result.audioObjectPath ?? null;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}
