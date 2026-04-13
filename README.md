# Lighthouse Labs CRM

A full-stack, multi-tenant CRM built with Next.js 14, Tailwind CSS, and Supabase.

## Architecture
- `main` branch: Generic white-label core.
- `feature/lighthouse` branch: Lighthouse Labs specific configuration.

## Deployment to Vercel

1.  Go to [Vercel Dashboard](https://vercel.com/new).
2.  Import the `light-house-labs/crm-core` repository.
3.  In the **Configure Project** section:
    - **Production Branch**: Set to `feature/lighthouse` (for Lighthouse Labs branding).
    - **Environment Variables**: Add the following from your Supabase Project Settings (API):
        - `NEXT_PUBLIC_SUPABASE_URL`
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        - `SUPABASE_SERVICE_ROLE_KEY`
4.  Click **Deploy**.

## Supabase Setup
Ensure you have run the `supabase-setup.sql` script in your Supabase SQL Editor and configured Google OAuth.
