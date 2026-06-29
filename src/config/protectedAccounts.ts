export const SEEDED_SUPER_ADMIN_EMAIL = "wisdomoustech@gmail.com";

export function isSeededSuperAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === SEEDED_SUPER_ADMIN_EMAIL;
}
