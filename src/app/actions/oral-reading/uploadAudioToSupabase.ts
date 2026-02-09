"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function uploadAudioToSupabase(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File
    const filePath = formData.get("filePath") as string

    if (!file || !filePath) {
      return { success: false, error: "Missing file or filePath" }
    }

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabase.storage
      .from("audio-recordings")
      .upload(filePath, buffer, {
        contentType: file.type || "audio/webm",
        upsert: false,
      })

    if (error) {
      console.error("Supabase upload error:", error)
      return { success: false, error: error.message }
    }

    const { data: publicUrlData } = supabase.storage
      .from("audio-recordings")
      .getPublicUrl(data.path)

    return { success: true, url: publicUrlData.publicUrl }
  } catch (err) {
    console.error("Upload error:", err)
    return { success: false, error: String(err) }
  }
}