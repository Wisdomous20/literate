const XENDIT_BASE_URL = "https://api.xendit.co";

function getAuthHeader() {
  const key = process.env.XENDIT_SECRET_KEY ?? "";
  console.log(`[Xendit] Key length: ${key.length}, starts with: ${key.substring(0, 10)}, ends with: ${JSON.stringify(key.slice(-5))}`);
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

export async function xenditRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" = "POST",
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${XENDIT_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error.message || `Xendit API error: ${res.status}`
    );
  }

  return res.json();
}