import { createHash, randomBytes } from "crypto";
import { getRedis } from "@/lib/redis";

export interface OrgInvitationPayload {
  email: string;
  organizationId: string;
  invitedById: string;
  expiresAt: string;
}

export type CreateOrgInvitationResult =
  | { status: "created"; token: string; expiresAt: Date }
  | { status: "duplicate" }
  | { status: "seat_limit" };

const INVITATION_TTL_SECONDS = 7 * 24 * 60 * 60;
const CLAIM_TTL_SECONDS = 2 * 60;
const invitationKeyPrefix = "organization-invitation:";
const pendingKeyPrefix = "organization-invitations:pending:";
const recipientKeyPrefix = "organization-invitation:recipient:";
const claimKeyPrefix = "organization-invitation:claim:";

const CREATE_INVITATION_SCRIPT = `
  redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", ARGV[1])

  local existingTokenHash = redis.call("GET", KEYS[2])
  if existingTokenHash then
    if redis.call("EXISTS", ARGV[5] .. existingTokenHash) == 1 then
      return 0
    end
    redis.call("DEL", KEYS[2])
    redis.call("ZREM", KEYS[1], existingTokenHash)
  end

  local pendingCount = redis.call("ZCARD", KEYS[1])
  if tonumber(ARGV[2]) + pendingCount >= tonumber(ARGV[3]) then
    return 1
  end

  redis.call("SET", KEYS[3], ARGV[4], "EX", ARGV[6])
  redis.call("SET", KEYS[2], ARGV[7], "EX", ARGV[6])
  redis.call("ZADD", KEYS[1], ARGV[8], ARGV[7])
  return 2
`;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function invitationKey(tokenHash: string): string {
  return `${invitationKeyPrefix}${tokenHash}`;
}

function pendingKey(organizationId: string): string {
  return `${pendingKeyPrefix}${organizationId}`;
}

function recipientKey(organizationId: string, email: string): string {
  return `${recipientKeyPrefix}${organizationId}:${hash(email)}`;
}

function claimKey(tokenHash: string): string {
  return `${claimKeyPrefix}${tokenHash}`;
}

export async function createOrgInvitation(input: {
  email: string;
  organizationId: string;
  invitedById: string;
  activeMemberCount: number;
  maxMembers: number;
}): Promise<CreateOrgInvitationResult> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_SECONDS * 1000);
  const payload: OrgInvitationPayload = {
    email: input.email,
    organizationId: input.organizationId,
    invitedById: input.invitedById,
    expiresAt: expiresAt.toISOString(),
  };
  const redis = getRedis();

  const result = Number(
    await redis.eval(
      CREATE_INVITATION_SCRIPT,
      3,
      pendingKey(input.organizationId),
      recipientKey(input.organizationId, input.email),
      invitationKey(tokenHash),
      Date.now(),
      input.activeMemberCount,
      input.maxMembers,
      JSON.stringify(payload),
      invitationKeyPrefix,
      INVITATION_TTL_SECONDS,
      tokenHash,
      expiresAt.getTime(),
    ),
  );

  if (result === 0) return { status: "duplicate" };
  if (result === 1) return { status: "seat_limit" };

  return { status: "created", token, expiresAt };
}

export async function getOrgInvitation(
  token: string,
): Promise<{ tokenHash: string; payload: OrgInvitationPayload } | null> {
  const tokenHash = hash(token);
  const serialized = await getRedis().get(invitationKey(tokenHash));
  if (!serialized) return null;

  try {
    const payload = JSON.parse(serialized) as OrgInvitationPayload;
    if (
      !payload.email ||
      !payload.organizationId ||
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

export async function countPendingOrgInvitations(
  organizationId: string,
): Promise<number> {
  const key = pendingKey(organizationId);
  const result = await getRedis().eval(
    'redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", ARGV[1]); return redis.call("ZCARD", KEYS[1])',
    1,
    key,
    Date.now(),
  );

  return Number(result);
}

export async function claimOrgInvitation(tokenHash: string): Promise<string | null> {
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

export async function releaseOrgInvitationClaim(
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

export async function consumeOrgInvitation(
  tokenHash: string,
  claimId: string,
  payload: OrgInvitationPayload,
): Promise<void> {
  await getRedis().eval(
    `
      if redis.call("GET", KEYS[1]) ~= ARGV[1] then return 0 end
      redis.call("DEL", KEYS[1], KEYS[2], KEYS[3])
      redis.call("ZREM", KEYS[4], ARGV[2])
      return 1
    `,
    4,
    claimKey(tokenHash),
    invitationKey(tokenHash),
    recipientKey(payload.organizationId, payload.email),
    pendingKey(payload.organizationId),
    claimId,
    tokenHash,
  );
}

export async function discardOrgInvitation(
  token: string,
  payload: OrgInvitationPayload,
): Promise<void> {
  const tokenHash = hash(token);
  await getRedis().multi()
    .del(invitationKey(tokenHash))
    .del(recipientKey(payload.organizationId, payload.email))
    .zrem(pendingKey(payload.organizationId), tokenHash)
    .exec();
}
