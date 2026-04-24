export interface OrgSummary {
  id: string;
  name: string;
  plan: string | null;
  maxMembers: number;
  currentMembers: number;
  totalMembers: number;
}

export interface Member {
  membershipId: string;
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  isDisabled: boolean;
  createdAt: string | Date;
  joinedAt: string | Date;
  isOwner: boolean;
}

export interface TempPasswordInfo {
  email: string;
  password: string;
}

export interface InvitationSentInfo {
  email: string;
  expiresAt: Date;
}
