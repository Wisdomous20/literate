export function generateOrgPassword(orgName: string, lastName: string): string {
  const sanitize = (str: string) =>
    str
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 15);

  const orgPart = sanitize(orgName) || "Org";
  const namePart = sanitize(lastName) || "User";
  const digits = String(Math.floor(1000 + Math.random() * 9000));

  return `${orgPart}-${namePart}-${digits}`;
}