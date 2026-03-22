# Codentia Learning Platform

A hybrid interactive coding academy — self-paced lessons, live classes, and an AI tutor in one platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL via Neon |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| AI | OpenAI API (GPT-4o) |
| Email | Resend |
| Hosting | Vercel |
| Styling | Tailwind CSS + Lato font |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/codentia.git
cd codentia
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env` with your credentials:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | [neon.tech](https://neon.tech) → Connection string |
| `AUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for dev |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) |
| `RESEND_API_KEY` | [resend.com](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Your verified Resend sender |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for dev |

### 3. Set up the database

```bash
# Push schema to your Neon database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed with sample data
npm run db:seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@codentia.dev | admin123 |
| Student | john@example.com | student123 |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (marketing)/     # Landing page (public)
│   ├── (dashboard)/     # Student app
│   ├── admin/           # Admin panel
│   └── api/             # API routes
├── components/
│   ├── ui/              # Button, Card, Badge, Modal, Toast
│   ├── dashboard/       # Student components
│   ├── admin/           # Admin components
│   └── shared/          # Sidebar, TopBar
├── lib/                 # Server utilities
├── hooks/               # Client hooks
├── types/               # TypeScript types
├── constants/           # App-wide constants
└── styles/              # CSS tokens
```

---

## Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB (no migration)
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed sample data
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Vercel auto-runs `prisma generate && next build`

### Post-deploy

Run the seed once against your production Neon DB:

```bash
DATABASE_URL="your-neon-url" npm run db:seed
```

---

## Features

### Student
- Browse and enrol in courses
- Watch video lessons with progress tracking
- Take quizzes with instant AI-powered explanations
- Submit assignments (GitHub URL / live URL)
- Get AI feedback on submissions before instructor review
- Ask the AI tutor anything on any lesson page
- Join live classes (Zoom / Google Meet)
- Watch recordings of past classes
- Track progress across all enrolled courses

### Admin
- Create and publish courses with modules and lessons
- Generate quizzes from a text prompt using AI
- Review and grade student assignment submissions
- Schedule live classes with automatic student notifications
- Monitor student progress and activity

---

## Roadmap

- [ ] In-browser code playground (CodePen/Replit style)
- [ ] Certificate generation on course completion
- [ ] Community discussion forums
- [ ] Job placement portal
- [ ] Mobile app (React Native)
- [ ] Payment integration for commercial courses
- [ ] Built-in WebRTC for live classes

---

*Codentia Learning Platform — Confidential*