# Security Specification & Threat Model

## 1. Data Invariants
1. Apps: Package name must be valid reverse-DNS format and unique across apps. Only published, public apps can be read by anonymous visitors.
2. Versions: An APK version belongs strictly to its parent app. Only versions in `published` status can be read or downloaded by public visitors.
3. Mutations & Writes: All creations, metadata updates, status changes, rollbacks, and deletions require authenticated Administrator authority (`isAdmin()`).
4. Audit Trail: Audit logs are append-only by verified administrators.
5. System Configuration: System configuration can be read publicly for maintenance status, but only modified by administrators.
6. Identity: Authenticated administrator is verified against configured administrative identity (`mh3620305@gmail.com`) with `email_verified == true` or presence in the `/admins` collection.

## 2. The Dirty Dozen Attack Payloads
1. Spoofed Admin Claim: Anonymous user attempting to mutate `/apps/test-app` without token.
2. Unverified Email Admin Spoof: Token with `email: 'mh3620305@gmail.com'` but `email_verified: false` attempting to update `/apps/test-app`.
3. Unpublished App Leak: Anonymous user querying `/apps` with `status: 'draft'` or `status: 'archived'`.
4. Staging APK / Upload Session Interception: Anonymous or non-admin user querying `/uploadSessions`.
5. Direct Binary State Manipulation: Non-admin trying to update `apps/{appId}/versions/{versionId}` to set `status: 'published'`.
6. Audit Log Tampering: Malicious user attempting to `delete` or `update` documents in `/auditLogs`.
7. Oversized Payload Injection: Injection of >100KB strings into `name` or `shortDescription` to trigger denial of wallet.
8. Path Variable Poisoning: Attempting to target document IDs containing path traversal or 2KB junk characters.
9. Ghost Field / Shadow Update: Modifying app with undeclared internal privilege fields.
10. Unvalidated Binary Publication: Bypassing backend validation to set `latestPublishedVersionId` directly from client.
11. Arbitrary Stats Overwrite: Public user attempting to write or reset `downloadStats`.
12. Maintenance Mode Lockdown Bypass: Non-admin attempting to toggle `/systemConfig/global` maintenance mode.
