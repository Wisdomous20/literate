import { prisma } from "@/lib/prisma";
import { generateOrgPassword } from "@/utils/generateOrgPassword";
import bcrypt from "bcrypt";

interface AddMemberInput {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  requestedByUserId: string;
}

export async function addOrgMemberService(input: AddMemberInput) {
  const { email, firstName, lastName, organizationId, requestedByUserId } = input;

  if (!email?.trim() || !firstName?.trim() || !lastName?.trim()) {
    return { success: false, error: "Email, first name, and last name are required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email format" };
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: true,
      _count: { select: { members: true } },
    },
  });

  if (!org || org.ownerId !== requestedByUserId) {
    return { success: false, error: "Only the organization owner can add members" };
  }

  const currentCount = org._count.members;
  const maxMembers = org.subscription?.maxMembers || 1;

  if (currentCount >= maxMembers) {
    return {
      success: false,
      error: `Member limit reached (${maxMembers}). Upgrade your plan to add more members.`,
    };
  }

  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  const tempPassword = generateOrgPassword(org.name, lastName);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  if (user) {
    const existingMembership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
    });

    if (existingMembership) {
      return { success: false, error: "This user is already a member of your organization" };
    }

    await prisma.organizationMember.create({
      data: { userId: user.id, organizationId },
    });

    return {
      success: true,
      member: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isNewAccount: false,
      },
      tempPassword: null,
    };
  }

  user = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isVerified: true,
      isDisabled: false,
      role: "USER",
    },
  });

  await prisma.organizationMember.create({
    data: { userId: user.id, organizationId },
  });

  try {
    const now = new Date();
    const year = now.getFullYear();
    const schoolYear =
      now.getMonth() < 6 ? `${year - 1}-${year}` : `${year}-${year + 1}`;

    await prisma.classRoom.create({
      data: { name: "My Class", userId: user.id, schoolYear },
    });
  } catch (err) {
    console.error("Failed to create default class:", err);
  }

  return {
    success: true,
    member: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isNewAccount: true,
    },
    tempPassword,
  };
}