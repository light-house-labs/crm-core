# Lighthouse Labs CRM

This branch configures the generic CRM for Lighthouse Labs. Keep these files out of `main` unless the generic client-playbook structure itself changes.

## Deployment Targets

- CRM app: `https://app.lighthouselabs.in`
- Public form route: `https://lighthouselabs.in/forms`
- Supabase project name: `lighthouse-labs-crm`
- Supabase region: `ap-south-1` (Mumbai)

## Supabase Setup

Run the generic core schema first, then run the Lighthouse-only SQL in this order:

1. `clients/lighthouse/migrations/001_lhl_lead_extensions.sql`
2. `clients/lighthouse/migrations/002_lhl_project_extensions.sql`
3. `clients/lighthouse/seeds/001_pipeline_stages.sql`
4. `clients/lighthouse/seeds/002_allowed_users.sql` after replacing the placeholder emails.
5. `clients/lighthouse/seeds/003_crm_options.sql`

Do not run these against any shared or generic Supabase project.

## Public Form Integration

Use Option A: add `/forms` to the existing `lighthouselabs.in` site and render an iframe pointing to the CRM public form on `app.lighthouselabs.in`.

The existing `/contact` Start a Project form on `lighthouselabs.in` should also insert into the Lighthouse Supabase `leads` table with `source = 'website_form'`.

## Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[lighthouse-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[lighthouse anon key]
SUPABASE_SERVICE_ROLE_KEY=[lighthouse service role key]
```

## Auth Setup

- Site URL: `https://app.lighthouselabs.in`
- Redirect URLs:
  - `https://app.lighthouselabs.in`
  - `https://app.lighthouselabs.in/auth/callback`
- Google Cloud Console redirect URI: `https://[lighthouse-ref].supabase.co/auth/v1/callback`
- JWT expiry: `3600` seconds

## Client Playbook

1. Branch from `main` into `feature/[client-name]`.
2. Create `clients/[client-name]/[client].config.ts`, then copy it to root `tenant.config.ts` in that branch.
3. Create a dedicated Supabase project for the client.
4. Run the generic schema, then client migrations and seeds.
5. Configure Google OAuth and whitelisted users.
6. Deploy a Vercel project from the client branch and set the custom domain.
7. Verify allowed and blocked logins, then submit a public test lead.
8. Handoff Supabase access details and explain that Settings/allowed users control CRM access.

When pulling core fixes into this branch, run `git merge main` from the client branch and keep Lighthouse values in `tenant.config.ts`. Never merge this client branch back into `main`.
