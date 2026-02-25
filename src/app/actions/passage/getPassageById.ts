"use server";

import { getPassageByIdService } from "@/service/admin/getPassageByIdService";

interface GetPassageByIdActionInput {
  id: string;
}

export async function getPassageByIdAction(input: GetPassageByIdActionInput) {
  const { id } = input;

  // Call the service to fetch the passage by ID
  const result = await getPassageByIdService({ id });

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch passage.");
  }

  return result.passage;
}