import { getOrgInvitation } from "@/service/org/orgInvitationRedisService";
import { getEffectiveActiveSubscription } from "@/service/subscription/resolveUserSubscription";

export interface InviteAcceptPreview {
  /** False when the invitation token is missing/expired. */
  valid: boolean;
  /** Whether the authenticated invitee currently has an active Solo plan. */
  hasActivePersonalSubscription: boolean;
  /** When the Solo plan stays active through, if any. */
  currentPeriodEnd?: Date | null;
}

/**
 * Read-only preview shown before an authenticated user accepts an org invite.
 * Surfaces whether accepting will stop auto-renewal on an active Solo plan and
 * when that plan stays covered until. Performs no mutation.
 */
export async function getInviteAcceptPreviewService(
  token: string,
  authenticatedUserId?: string,
): Promise<InviteAcceptPreview> {
  const invitation = await getOrgInvitation(token);
  if (!invitation) {
    return { valid: false, hasActivePersonalSubscription: false };
  }

  if (!authenticatedUserId) {
    // A brand-new invitee (no account yet) has no Solo plan to warn about.
    return { valid: true, hasActivePersonalSubscription: false };
  }

  const resolved = await getEffectiveActiveSubscription(authenticatedUserId);

  // source === "DIRECT" is the user's own PERSONAL/Solo subscription.
  if (resolved && resolved.source === "DIRECT") {
    return {
      valid: true,
      hasActivePersonalSubscription: true,
      currentPeriodEnd: resolved.subscription.currentPeriodEnd,
    };
  }

  return { valid: true, hasActivePersonalSubscription: false };
}
