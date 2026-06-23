import { resolveStoredAudioObjectPath } from "@/lib/media/audioObjectPath";

/** @deprecated New requests must use a server-generated audio object path. */
export function isTrustedAudioUrl(value: string): boolean {
  return resolveStoredAudioObjectPath(value) !== null;
}
