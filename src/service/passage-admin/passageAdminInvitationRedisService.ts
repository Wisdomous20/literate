import { createHash, randomBytes } from "crypto";
import { getRedis } from "@/lib/redis";

export interface PassageAdminInvitationPayload {
  email: string;
  invitedById: string;
  expiresAt: string;
}

export type CreatePassageAdminInvitationResult =
  | { status: "created"; token: string; expiresAt: Date }
  | { status: "duplicate" };

const INVITATION_TTL_SECONDS = 7 * 24 * 60 * 60;
const CLAIM_TTL_SECONDS = 2 * 60;
const invitationKeyPrefix = "passage-admin-invitation:";
const recipientKeyPrefix = "passage-admin-invitation:recipient:";
const claimKeyPrefix = "passage-admin-invitation:claim:";

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function invitationKey(tokenHash: string): string {
  return `${invitationKeyPrefix}${tokenHash}`;
}

function recipientKey(email: string): string {
  return `${recipientKeyPrefix}${hash(email)}`;
}

function claimKey(tokenHash: string): string {
  return `${claimKeyPrefix}${tokenHash}`;
}

export async function createPassageAdminInvitation(input: {
  email: string;
  invitedById: string;
}): Promise<CreatePassageAdminInvitationResult> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_SECONDS * 1000);
  const payload: PassageAdminInvitationPayload = {
    email: input.email,
    invitedById: input.invitedById,
    expiresAt: expiresAt.toISOString(),
  };
  const redis = getRedis();
  const existingTokenHash = await redis.get(recipientKey(input.email));

  if (
    existingTokenHash &&
    (await redis.exists(invitationKey(existingTokenHash))) === 1
  ) {
    return { status: "duplicate" };
  }

  if (existingTokenHash) {
    await redis.del(invitationKey(existingTokenHash), recipientKey(input.email));
  }

  await redis
    .multi()
    .set(
      invitationKey(tokenHash),
      JSON.stringify(payload),
      "EX",
      INVITATION_TTL_SECONDS,
    )
    .set(recipientKey(input.email), tokenHash, "EX", INVITATION_TTL_SECONDS)
    .exec();

  return { status: "created", token, expiresAt };
}

export async function getPassageAdminInvitation(
  token: string,
): Promise<{ tokenHash: string; payload: PassageAdminInvitationPayload } | null> {
  const tokenHash = hash(token);
  const serialized = await getRedis().get(invitationKey(tokenHash));
  if (!serialized) return null;

  try {
    const payload = JSON.parse(serialized) as PassageAdminInvitationPayload;
    if (
      !payload.email ||
      !payload.invitedById ||
      new Date(payload.expiresAt).getTime() <= Date.now()
    ) {
      return null;
    }

    return { tokenHash, payload };
  } catch {
    return null;
  }
}

export async function claimPassageAdminInvitation(
  tokenHash: string,
): Promise<string | null> {
  const claimId = randomBytes(16).toString("hex");
  const result = await getRedis().set(
    claimKey(tokenHash),
    claimId,
    "EX",
    CLAIM_TTL_SECONDS,
    "NX",
  );

  return result === "OK" ? claimId : null;
}

export async function releasePassageAdminInvitationClaim(
  tokenHash: string,
  claimId: string,
): Promise<void> {
  await getRedis().eval(
    'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) end return 0',
    1,
    claimKey(tokenHash),
    claimId,
  );
}

export async function consumePassageAdminInvitation(
  tokenHash: string,
  claimId: string,
  payload: PassageAdminInvitationPayload,
): Promise<void> {
  await getRedis().eval(
    `
      if redis.call("GET", KEYS[1]) ~= ARGV[1] then return 0 end
      redis.call("DEL", KEYS[1], KEYS[2], KEYS[3])
      return 1
    `,
    3,
    claimKey(tokenHash),
    invitationKey(tokenHash),
    recipientKey(payload.email),
    claimId,
  );
}

export async function discardPassageAdminInvitation(
  token: string,
  payload: PassageAdminInvitationPayload,
): Promise<void> {
  const tokenHash = hash(token);
  await getRedis()
    .multi()
    .del(invitationKey(tokenHash))
    .del(recipientKey(payload.email))
    .exec();
}
