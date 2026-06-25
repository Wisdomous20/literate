# Organization Member Roles Design

## Goal

Add organization-level roles so a member can be either an `ADMIN` or a `USER` inside a specific organization.

Organization admins can manage the organization and its members. Organization users can use the software through the organization subscription but cannot manage members or organization settings.

## Current State

Organization management is currently owner-based:

- `Organization.ownerId` identifies the owner.
- `OrganizationMember` only stores membership, not role.
- Server actions find organizations by `ownerId`, so only the owner can reach management services.
- The sidebar shows the Organization page only for global `User.role === "ORG_ADMIN"`.

This works for one owner-admin, but it does not support promoted organization admins.

## Data Model

Add an organization-scoped role to `OrganizationMember`:

```prisma
enum OrganizationMemberRole {
  ADMIN
  USER
}

model OrganizationMember {
  role OrganizationMemberRole @default(USER)
}
```

Backfill existing memberships:

- If `OrganizationMember.userId === Organization.ownerId`, set `role = ADMIN`.
- All other existing members remain `USER`.
- New accepted invitations create members as `USER`.
- Organization creation and subscription webhook auto-creation create the owner membership as `ADMIN`.

## Authorization Rules

Backend services are authoritative. UI visibility is convenience only.

- Owner is always treated as admin and cannot be demoted or disabled.
- Any organization admin can invite members.
- Any organization admin can promote a normal member to admin.
- Any organization admin can demote another admin to user, except the owner.
- Any organization admin can disable or enable non-owner members.
- An admin cannot disable their own account.
- Any organization admin can reset or generate passwords for non-owner members.
- Normal organization users cannot access organization management actions.

When checking permission, use membership role within the target organization rather than global `User.role`.

## Backend Shape

Add a small org authorization helper in the service layer:

- Resolve a requester membership for an organization.
- Return whether the requester is an admin.
- Treat the organization owner as admin even if legacy data is missing or inconsistent.

Update org services and actions:

- `getMembersAction` should locate the requester organization through membership, not only `ownerId`.
- `addOrgMemberService`, `getOrgMembersService`, `toggleMemberStatusService`, `generateMemberPasswordService`, and `updateMemberPasswordService` should require organization admin permission.
- Add a `updateMemberRoleService` plus server action for promotion/demotion.
- Service-level checks must verify the target user belongs to the same organization before changing role, status, or password.

## UI Behavior

The Organization page remains the management surface.

- Show the Organization nav item when the user is an org owner or has an `ADMIN` membership.
- Show each member role in the member list.
- For non-owner members, show a role action:
  - `Make admin` for users.
  - `Make user` for admins.
- Hide or disable role/status/password actions for the owner.
- Normal users do not see organization management controls.

## Error Handling

Use deny-by-default behavior:

- Missing session: `Unauthorized`.
- Missing organization membership: `No organization found`.
- Non-admin requester: `Only organization admins can manage members`.
- Attempt to demote/disable owner: return a clear validation error.
- Attempt to change own status: return a clear validation error.

## Testing

Add or update service tests for:

- Owner membership is admin on organization creation.
- Existing owner memberships are backfilled to `ADMIN`.
- Admin requester can view members, invite, disable/enable, reset passwords, and change member roles.
- Normal member requester is denied for every management action.
- Admin cannot demote or disable the owner.
- Admin cannot disable themselves.
- Invited members are created as `USER`.
- Member list includes `role` and `isOwner`.

Update UI-facing types/tests where needed so role is included in member data.
