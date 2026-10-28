# Archived migrations — do not use

These are the original migrations, kept for history only. Prisma never reads this folder.

They were replaced on 2026-10-27 by `prisma/migrations/0_init`. The history here was incomplete: several columns and tables that production has (`users.isVerified`, `stores.isApproved`, `reviews`, `verification_tokens`, …) were never added by any migration. They were probably applied with `prisma db push`. Running these files on an empty database produced a schema the app couldn't run against.

See README → "Database migrations" for the baselining steps.
