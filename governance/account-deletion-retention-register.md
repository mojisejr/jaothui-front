# Account deletion retention register

## Scope and policy

- **System:** JAOTHUI mobile Account (LINE / Sign in with Apple) identity boundary.
- **Policy version:** `jaothui-account-deletion-v1`.
- **Effective review date:** 2026-08-13.
- **Outcome:** deletion is permanent to the customer. The Account cannot authenticate or be restored. A future provider sign-in can create a fresh Account, but never restores a prior wallet association or merges by email.
- **Execution boundary:** Phase 2 must execute the deletions and Account update in one database transaction. This Phase 1 register and migration do not delete customer data or apply a database change.

## Data action matrix

| Record / field | Action on deletion | Retention purpose / boundary |
| --- | --- | --- |
| `Account.id` | Retain | Minimal non-personal audit anchor for the completed deletion. It is never used to restore access. |
| `Account.role` | Retain | Minimal authorization-history context; deleted Accounts are rejected by active-account guards. |
| `Account.createdAt`, `Account.updatedAt` | Retain | Minimal audit chronology. |
| `Account.status` | Set to `DELETED` | Permanent unusable-account marker; no reactivation flow. |
| `Account.deletedAt` | Set at deletion | Deletion event timestamp. Nullable before deletion. |
| `Account.deletionPolicyVersion` | Set to `jaothui-account-deletion-v1` | Records which deletion policy was applied. Nullable before deletion. |
| `Account.email`, `Account.displayName`, `Account.avatarUrl` | Set to `NULL` | Remove Account-level personal profile data. |
| All `AccountIdentity` rows | Permanently delete | Removes LINE / Apple provider identifiers and associated provider profile fields so the former credential cannot authenticate the deleted Account. |
| All `WalletLink` rows | Permanently delete | Removes the wallet-to-Account association; it is never recovered automatically by future sign-in. |
| Legacy `User`, `Farm`, `Certificate`, `Payment`, `MicrochipOrder`, blockchain / registry records | No change in this flow | Outside this Apple-review remediation. Owner must approve a separate lawful-retention/anonymization policy before any mutation. |

## Sign in with Apple without a server key

JAOTHUI does not currently generate or hold an Apple server key, authorization code, refresh token, or access token. Account deletion must still complete in-app for JAOTHUI data according to the matrix above. After a successful deletion that involved an Apple identity, the mobile app may offer optional, truthful user guidance to remove JAOTHUI under iOS Settings > Apple Account > Sign in with Apple. It must not state or imply that JAOTHUI revoked Apple authorization programmatically.

## Production operation guardrail

Before a production rollout, an authorized operator must take an approved backup, run `prisma migrate status`, and apply the reviewed migration with `prisma migrate deploy`. Do not run `prisma migrate dev` or `prisma db push` against production.
