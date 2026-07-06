# RunQuest PH Deployment Pipeline

## Production Flow

```text
git push main
  -> GitHub production checks
  -> Vercel build command: npm run vercel-build
  -> npm run predeploy
  -> Supabase migration check
  -> production safety check
  -> TypeScript build
  -> Vite build
  -> Vercel production deploy
  -> npm run health:check
```

## Required Environment Variables

Configure these in Vercel and GitHub Actions secrets:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
ADMIN_SECRET
PRODUCTION_URL
AUTO_ROLLBACK=false
HEALTH_CHECK_RETRIES=3
HEALTH_CHECK_DELAY_SECONDS=20
```

`ADMIN_SECRET` is used by deployment automation to call `/api/health`. Do not expose it in client-side code.

## Supabase Migration Tracking

Schema changes are tracked through `public.migration_history`.

Migration checks validate:

- required production tables exist
- required columns exist
- row level security is enabled
- destructive statements are blocked unless intentionally reviewed
- `ALTER TABLE` operations are printed in the build log

## Health Check

`/api/health` validates:

- deployment admin secret
- Supabase environment configuration
- Supabase REST connectivity
- admin route protection metadata

Use:

```bash
npm run health:check
```

## Rollback

Manual rollback:

```bash
npm run rollback
```

Automated rollback can be enabled by setting:

```text
AUTO_ROLLBACK=true
```

When enabled, failed deployment health checks run:

```bash
npm run auto:rollback
```

This resets `main` to the previous release tag and force-pushes it. Keep `AUTO_ROLLBACK=false` unless production release tags are maintained carefully.

## Internal Status Page

Admins can open:

```text
/deploy/status
```

The page is protected by the same admin guard as `/admin`.
