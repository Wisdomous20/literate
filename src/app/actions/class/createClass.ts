"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClassService } from "@/service/class/createClassService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { createClassSchema } from "@/lib/validation/classroom";
import { revalidatePath } from "next/cache";

export async function createClass(name: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = createClassSchema.safeParse({
    name,
    userId: session.user.id,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await createClassService(validationResult.data);

  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/classes");
  }

  return result;
}
