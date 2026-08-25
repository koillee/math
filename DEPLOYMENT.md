# MasteryOS Math — GitHub, Vercel, and iPad Deployment Guide

This zip is intended for uploading the source code to GitHub and deploying the web app on Vercel.

## What this app is

MasteryOS Math is a Next.js web app for Haim’s Year 6 maths practice. It currently covers:

- Fractions, Decimals & Percentages
- Number & Operations
- Ratio, Proportion & Rates

The app is not a native iPad app. To use it on an iPad, deploy it to Vercel, open the Vercel URL in Safari, then use **Share → Add to Home Screen**.

## Important: secrets are not included

The zip intentionally excludes `.env` and database credentials.

You must add this environment variable in Vercel:

```txt
DATABASE_URL=your_postgres_database_connection_string
```

Use a hosted PostgreSQL database such as Vercel Postgres, Neon, Supabase Postgres, or another Postgres provider.

## Upload to GitHub

Option A — easiest from a computer:

1. Unzip the archive.
2. Create a new GitHub repository.
3. Upload the unzipped project files, or push with Git.
4. Make sure `.env`, `node_modules`, `.next`, and local build files are not uploaded.

Option B — from iPad:

1. Download the zip.
2. Save it to the Files app.
3. If GitHub web upload is inconvenient on iPad, use a desktop/laptop for the first upload. GitHub’s mobile web file upload can be awkward for full project folders.

## Deploy on Vercel

1. Go to https://vercel.com/new
2. Import the GitHub repository.
3. Framework preset: **Next.js**.
4. Add environment variable:
   - `DATABASE_URL`
5. Build command can remain the default from `package.json`:
   - `npm run build` or `bun run build`
6. Deploy.

## Database setup

The Prisma schema is in:

```txt
prisma/schema.prisma
```

Before first real use on a fresh database, sync the schema once:

```bash
npx prisma db push
```

or, if using Bun locally:

```bash
bunx prisma db push
```

After the schema exists, the app seeds Haim, the skill graph, misconceptions, and item bank automatically on first use.

## Local development

Install dependencies:

```bash
npm install
```

or:

```bash
bun install
```

Create a local `.env` file:

```txt
DATABASE_URL=your_postgres_database_connection_string
```

Sync database:

```bash
npx prisma db push
```

Run locally:

```bash
npm run dev
```

or:

```bash
bun run dev
```

Open:

```txt
http://localhost:3000
```

## Validation commands

```bash
npm run build
npm run lint
```

The MVP smoke test can be run against a live URL:

```bash
npm run test:mvp -- https://your-vercel-url.vercel.app
```

## Current clean state

Before this zip was created, Haim’s test evidence/daily sessions were reset in the current development database. A deployed database will start fresh once schema setup and first app request complete.
