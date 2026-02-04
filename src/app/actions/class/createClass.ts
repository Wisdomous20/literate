"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClassService } from "@/service/class/createClassService";
import { revalidatePath } from "next/cache";

export async function createClass(name: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await createClassService({
    name,
    userId: session.user.id,
  });

  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/classes");
  }

  return result;
}