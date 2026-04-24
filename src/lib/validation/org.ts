import { z } from "zod";
import {
  emailString,
  idString,
  isoDateString,
  passwordString,
  requiredString,
} from "@/lib/validation/common";

const personNameSchema = (label: string) =>
  requiredString(label).pipe(
    z.string().max(60, `${label} must be 60 characters or fewer`)
  );

const organizationNameSchema = requiredString("Organization name")
  .pipe(z.string().min(2, "Organization name must be at least 2 characters"))
  .pipe(
    z.string().max(100, "Organization name must be 100 characters or fewer")
  );

export const addOrgMemberSchema = z.object({
  email: emailString(),
  firstName: personNameSchema("First name"),
  lastName: personNameSchema("Last name"),
  organizationId: idString("Organization ID"),
  requestedByUserId: idString("User ID"),
});

export const createOrganizationSchema = z.object({
  name: organizationNameSchema,
  ownerId: idString("Owner ID"),
});

export const renameOrganizationSchema = z.object({
  newName: organizationNameSchema,
  requestedByUserId: idString("User ID"),
});

export const invitationTokenSchema = z.object({
  token: requiredString("Invitation token"),
});

export const acceptInvitationSchema = z.object({
  token: requiredString("Invitation token"),
  password: passwordString().optional(),
});

export const updateMemberPasswordSchema = z.object({
  memberId: idString("Member ID"),
  newPassword: passwordString(),
  organizationId: idString("Organization ID"),
  requestedByUserId: idString("User ID"),
});

export const toggleMemberStatusSchema = z.object({
  memberId: idString("Member ID"),
  organizationId: idString("Organization ID"),
  requestedByUserId: idString("User ID"),
  disable: z.boolean(),
});

export const generateMemberPasswordSchema = z.object({
  memberId: idString("Member ID"),
  organizationId: idString("Organization ID"),
  requestedByUserId: idString("User ID"),
});

export const createShareableLinkSchema = z.object({
  teacherId: idString("Teacher ID"),
  studentId: idString("Student ID"),
  passageId: idString("Passage ID"),
  type: z.enum(["ORAL_READING", "COMPREHENSION", "READING_FLUENCY"]),
  expiresAt: isoDateString("Deadline").optional(),
});
