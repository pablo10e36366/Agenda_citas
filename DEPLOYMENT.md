# Deployment

## Required environment variables

Set these variables in each production provider:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="replace-with-a-secure-secret-of-at-least-32-characters"
JWT_EXPIRES_IN=86400
NODE_ENV=production
SEED_ADMIN_NAME="Admin"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="replace-with-a-secure-temporary-password"
```

`PORT` is optional. Railway injects it automatically; local development falls back to `3000`.

## Seed admin user

Run the seed only when you need to create the first admin user:

```bash
npm run prisma:seed
```

The seed is idempotent. If `SEED_ADMIN_EMAIL` already exists, it does not create a duplicate user.

## Railway

Railway should run this as the main backend service.

1. Create a Railway project from this GitHub repository.
2. Add a Railway PostgreSQL service.
3. Set the API service `DATABASE_URL` to the PostgreSQL connection URL.
4. Set `JWT_SECRET` and `NODE_ENV=production`.
5. Deploy the `andy` branch or merge it into the production branch.

The repository includes `railway.json` with:

- Build command: `npm run build`
- Pre-deploy command: `npm run prisma:migrate:deploy`
- Start command: `npm run start:prod`
- Healthcheck path: `/health`

## Vercel

Vercel is configured as an optional serverless API deployment through `api/index.ts`.

1. Import the same GitHub repository in Vercel.
2. Set `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `NODE_ENV=production`.
3. Deploy the selected branch.

For production traffic, prefer Railway as the primary API runtime because this Nest/Prisma API keeps normal Node server behavior and runs migrations before deploy. If Vercel is used against PostgreSQL, use a pooled database URL for Prisma to reduce connection pressure from serverless cold starts.
