import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadAudioToSupabase(
  audioBlob: Blob,
  sessionId: string
): Promise<{ url: string | null; error: string | null }> {
  const fileName = `oral-reading/${sessionId}-${Date.now()}.webm`

  const { data, error } = await supabase.storage
    .from("audio-recordings")
    .upload(fileName, audioBlob, {
      contentType: "audio/webm",
      upsert: false,
    })

  if (error) {
    console.error("Supabase upload error:", error)
    return { url: null, error: error.message }
  }

  const { data: publicUrlData } = supabase.storage
    .from("audio-recordings")
    .getPublicUrl(data.path)

  return { url: publicUrlData.publicUrl, error: null }
}