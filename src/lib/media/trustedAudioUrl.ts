import { GCS_BUCKET } from "@/lib/media/storageBucket";

const AUDIO_OBJECT_PREFIX = "oral-fluency/";

export function isTrustedAudioUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const expectedPathPrefix = `/${GCS_BUCKET}/${AUDIO_OBJECT_PREFIX}`;

    return (
      url.protocol === "https:" &&
      url.hostname === "storage.googleapis.com" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname.startsWith(expectedPathPrefix)
    );
  } catch {
    return false;
  }
}
