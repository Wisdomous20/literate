const DEFAULT_APPLICATION_URL = "http://localhost:3000";

function configuredApplicationUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    DEFAULT_APPLICATION_URL
  );
}

/** Builds a canonical application URL without propagating config whitespace. */
export function buildApplicationUrl(
  path: string,
  baseUrl = configuredApplicationUrl(),
): string {
  const base = new URL(baseUrl.trim());
  if (base.protocol !== "https:" && base.protocol !== "http:") {
    throw new Error("Application URL must use HTTP or HTTPS.");
  }

  const basePath = base.pathname.replace(/\/+$/, "");
  const relativePath = path.replace(/^\/+/, "");
  base.pathname = `${basePath}/${relativePath}`;
  base.search = "";
  base.hash = "";

  return base.toString();
}
