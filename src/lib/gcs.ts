import { Storage } from "@google-cloud/storage";
import { getGoogleCloudAuthOptions } from "@/lib/googleCloudAuth";
import { GCS_BUCKET } from "@/lib/media/storageBucket";

export const storage = new Storage(getGoogleCloudAuthOptions());

export { GCS_BUCKET };
