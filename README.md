# Prime Prints

Next.js app with MongoDB-backed catalog collections for a printing product website.

## Run

```bash
pnpm install
pnpm dev
```

## Required Environment

Set these in `.env.local`:

```dotenv
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?appName=<app>
ADMIN_SESSION_SECRET=<long-random-secret>
ADMIN_SESSION_TTL_SECONDS=28800
```

Optional:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Dev-only TLS fallbacks (only if your machine has SSL cert issues)
# MONGODB_TLS_INSECURE=true
# MONGODB_TLS_ALLOW_INVALID_HOSTNAMES=true
```

