import { randomUUID } from "node:crypto";
import { GCS_BUCKET } from "@/lib/media/storageBucket";

export const AUDIO_OBJECT_PREFIX = "oral-fluency/";

const AUDIO_FILE_EXTENSIONS = new Map<string, string>([
  ["audio/wav", "wav"],
  ["audio/x-wav", "wav"],
  ["audio/wave", "wav"],
  ["audio/webm", "webm"],
  ["audio/mp4", "m4a"],
  ["audio/mpeg", "mp3"],
  ["audio/ogg", "ogg"],
]);

const GENERATED_AUDIO_OBJECT_PATH = new RegExp(
  `^${AUDIO_OBJECT_PREFIX}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(?:wav|webm|m4a|mp3|ogg)$`,
);
const LEGACY_AUDIO_OBJECT_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,255}\.(?:wav|webm|m4a|mp3|ogg)$/i;

function normalizeContentType(contentType: string): string {
  return contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

export function getAudioFileExtension(contentType: string): string | null {
  return AUDIO_FILE_EXTENSIONS.get(normalizeContentType(contentType)) ?? null;
}

export function isSupportedAudioContentType(contentType: string): boolean {
  return getAudioFileExtension(contentType) !== null;
}

export function createAudioObjectPath(contentType: string): string {
  const extension = getAudioFileExtension(contentType);
  if (!extension) {
    throw new Error("Unsupported audio content type.");
  }

  return `${AUDIO_OBJECT_PREFIX}${randomUUID()}.${extension}`;
}

export function isUploadedAudioObjectPath(value: string): boolean {
  return GENERATED_AUDIO_OBJECT_PATH.test(value);
}

/**
 * Resolves the database's legacy `audioUrl` field to a private GCS object path.
 * New records contain opaque server-generated paths; the URL branch only supports
 * existing, previously stored objects during the migration to private storage.
 * Legacy signed-URL query parameters are deliberately ignored after the configured
 * bucket and object name have been validated because the server reads the object
 * through its own credentials.
 */
export function resolveStoredAudioObjectPath(value: string): string | null {
  if (isUploadedAudioObjectPath(value)) return value;

  try {
    const url = new URL(value);
    const prefix = `/${GCS_BUCKET}/${AUDIO_OBJECT_PREFIX}`;

    if (
      url.protocol !== "https:" ||
      url.hostname !== "storage.googleapis.com" ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      url.hash !== "" ||
      !url.pathname.startsWith(prefix)
    ) {
      return null;
    }

    const objectName = decodeURIComponent(url.pathname.slice(prefix.length));
    return LEGACY_AUDIO_OBJECT_NAME.test(objectName)
      ? `${AUDIO_OBJECT_PREFIX}${objectName}`
      : null;
  } catch {
    return null;
  }
}
