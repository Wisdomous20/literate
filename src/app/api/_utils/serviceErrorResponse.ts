import { NextResponse } from "next/server";

interface ServiceError {
  error?: string;
  code?: string;
}

export function serviceErrorStatus(code?: string): number {
  if (code === "NOT_FOUND") return 404;
  if (code === "INTERNAL_ERROR") return 500;
  return 400;
}

export function serviceErrorResponse(
  result: ServiceError,
  fallbackMessage: string,
) {
  return NextResponse.json(
    { error: result.error ?? fallbackMessage },
    { status: serviceErrorStatus(result.code) },
  );
}
