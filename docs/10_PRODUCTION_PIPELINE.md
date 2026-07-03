# RunQuest PH Production Pipeline

RunQuest PH uses a controlled release workflow. Normal development can still use `npm.cmd run dev`, but production changes should go through the safe push pipeline.

## Main Flow

```text
Developer action
  -> npm.cmd run safe-push
  -> pre-deploy checks
  -> Supabase migration validation
  -> changelog generation
  -> explicit deployment confirmation
  -> git commit
  -> git push origin main
  -> release tag push
  -> GitHub
  -> Vercel auto deploy
  -> Supabase schema already validated
  -> production updated
```

## Commands

```bash
npm.cmd run predeploy
npm.cmd run migration:check
npm.cmd run changelog
npm.cmd run safe-push
npm.cmd run release:version
npm.cmd run rollback
```

## Safety Rules

- `safe-push` asks for confirmation before staging, committing, pushing, or tagging.
- `predeploy` fails if required Supabase env variables are missing, TypeScript fails, or the app cannot build.
- `migration:check` validates required Supabase tables and blocks destructive working-tree schema changes such as `DROP TABLE`, `DROP COLUMN`, `TRUNCATE TABLE`, and `DELETE FROM`.
- `release:version` supports semantic versioning and release tags.
- `rollback` creates a rollback branch from a release tag and prints Vercel/Supabase rollback instructions.

## Required Environment Variables

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Keep secrets out of source control. Store local values in `.env` or deployment values in Vercel project settings.
