import { Storage } from "@google-cloud/storage";
import { getGoogleCloudAuthOptions } from "@/lib/googleCloudAuth";

export const storage = new Storage(getGoogleCloudAuthOptions());

export const GCS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET ?? "cpuliterate-v2";
