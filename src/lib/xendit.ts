const XENDIT_BASE_URL = "https://api.xendit.co";

function getAuthHeader() {
  const key = (process.env.XENDIT_SECRET_KEY ?? "").trim();
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

export async function xenditRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" = "POST",
  body?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: getAuthHeader(),
    "Content-Type": "application/json",
  };

  if (path.startsWith("/sessions")) {
    headers["api-version"] = "2026-01-01";
  }

  const res = await fetch(`${XENDIT_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(formatXenditError(error, res.status));
  }

  return res.json();
}

function formatXenditError(error: unknown, status: number): string {
  if (!error || typeof error !== "object") {
    return `Xendit API error: ${status}`;
  }

  const payload = error as {
    message?: unknown;
    error_code?: unknown;
    errors?: unknown;
  };
  const parts: string[] = [];

  if (typeof payload.message === "string" && payload.message.trim()) {
    parts.push(payload.message.trim());
  }

  if (Array.isArray(payload.errors)) {
    const details = payload.errors
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return null;

        const detail = item as {
          field?: unknown;
          message?: unknown;
          path?: unknown;
        };
        const field =
          typeof detail.field === "string"
            ? detail.field
            : typeof detail.path === "string"
              ? detail.path
              : null;
        const message =
          typeof detail.message === "string" ? detail.message : null;

        return [field, message].filter(Boolean).join(": ");
      })
      .filter((item): item is string => Boolean(item));

    parts.push(...details);
  }

  if (typeof payload.error_code === "string" && payload.error_code.trim()) {
    parts.push(`code: ${payload.error_code.trim()}`);
  }

  return parts.length > 0
    ? parts.join(" | ")
    : `Xendit API error: ${status}`;
}
