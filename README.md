# My Week

Weekly task planner. Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL, deployed on Vercel.
Email/password login (bcrypt + signed JWT in an httpOnly cookie).

## Folder structure

```
my-week/
├── prisma/schema.prisma          # User + Task tables
├── src/
│   ├── app/
│   │   ├── layout.tsx            # fonts + metadata
│   │   ├── globals.css           # all styles (light/dark)
│   │   ├── page.tsx              # main planner (needs login)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── api/
│   │       ├── auth/{register,login,logout}/route.ts
│   │       ├── tasks/route.ts            # GET, POST, DELETE ?week=
│   │       ├── tasks/[id]/route.ts       # PATCH (done), DELETE
│   │       └── profile/route.ts          # PUT name, bio, avatar
│   ├── components/
│   │   ├── AuthForm.tsx          # shared login / sign-up form
│   │   └── WeekApp.tsx           # the planner UI
│   └── lib/
│       ├── prisma.ts             # DB client
│       └── auth.ts               # session helpers
├── .env.example
├── next.config.mjs
├── package.json
└── tsconfig.json
```

## Run locally

```bash
npm install
cp .env.example .env        # fill DATABASE_URL and AUTH_SECRET
npm run db:push             # creates the tables
npm run dev                 # http://localhost:3000
```

## Deploy on Vercel

1. Create a free Postgres DB at https://neon.tech (or Vercel dashboard -> Storage -> Neon). Copy the connection string.
2. Run once from your machine, with that string in `.env`: `npm run db:push`
3. Push this folder to a GitHub repo.
4. On https://vercel.com -> Add New Project -> import the repo (Framework: Next.js is auto-detected).
5. Add Environment Variables: `DATABASE_URL` and `AUTH_SECRET` (`openssl rand -base64 32`).
6. Deploy.
