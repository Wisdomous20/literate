"use server";

import { deletePassageService } from "@/service/passage/deletePassageService";
import { deletePassageSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { requirePassageManager } from "@/utils/roleCheck";
import { recordActivityLog } from "@/service/activity/activityLogService";

interface DeletePassageActionInput {
  id: string;
}

export async function deletePassageAction(input: DeletePassageActionInput) {
  const session = await requirePassageManager();

  const validationResult = deletePassageSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  // Call the service to delete the passage
  const result = await deletePassageService(validationResult.data);

  if (!result.success) {
    throw new Error(result.error || "Failed to delete passage.");
  }

  if (result.passage) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "PASSAGE_DELETED",
      entityType: "passage",
      entityId: result.passage.id,
      entityTitle: result.passage.title,
    });
  }

  return { success: true };
}
