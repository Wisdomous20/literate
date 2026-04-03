<div align="center">

# Literate

A reading proficiency assessment platform that helps educators evaluate and track students' reading abilities through AI-powered oral reading tests, fluency assessments, and comprehension evaluations.


</div>

---

## Overview

**Literate** enables teachers to conduct structured reading assessments with real-time audio capture, AI-powered transcription, and automated miscue analysis. Students are assessed across oral reading, fluency, and comprehension — with results tracked per student and per class over time.

---

## Features

### Oral Reading Test
Record students reading passages aloud with real-time audio capture. AI-powered transcription via Google Cloud Speech-to-Text V2 (Chirp 2) automatically detects miscues including mispronunciation, omission, substitution, transposition, insertion, self-correction, and repetition. The system also identifies reading behaviors such as word-by-word reading, monotonous reading, and dismissal of punctuation. Passage-guided phrase boosting improves transcription accuracy for known reading material. Results include words per minute (WPM), accuracy percentage, and classification levels (Independent, Instructional, Frustration).

### Reading Fluency Test
Assess students' reading fluency with timed passages, audio recording and playback, and detailed fluency scoring.

### Reading Comprehension Test *(Coming Soon)*
Passage-based comprehension quizzes with multiple choice and essay questions, tagged by cognitive level (Literal, Inferential, Critical) with automated scoring and progress tracking.

### Class Management
Create and organize classes by school year, manage students, track individual progress across assessments, and view class-wide performance metrics.

### Test Configuration
- **Auto-Scroll** — automatically scrolls the passage as the student reads (Web Speech API)
- **Auto-Finish** — detects when the student completes reading
- Adjustable countdown timer, microphone detection, background noise monitoring, and connectivity verification

### Admin Dashboard
Create and manage graded reading passages, configure metadata (language, grade level, test type), build comprehension questions, and monitor platform-wide statistics.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router, Standalone Output) |
| Language | [TypeScript](https://typescriptlang.org) |
| Database | [PostgreSQL](https://postgresql.org) via [Neon](https://neon.tech) |
| ORM | [Prisma](https://prisma.io) |
| Authentication | [NextAuth.js](https://next-auth.js.org) |
| AI / Transcription | [Google Cloud Speech-to-Text V2](https://cloud.google.com/speech-to-text) (Chirp 2) |
| Job Queue | [BullMQ](https://docs.bullmq.io) + [Redis](https://redis.io) |
| Storage | [Google Cloud Storage](https://cloud.google.com/storage) |
| Styling | [Tailwind CSS](https://tailwindcss.com) + [Radix UI](https://radix-ui.com) |
| Charts | [Recharts](https://recharts.org) |
| Icons | [Lucide React](https://lucide.dev) |
| Package Manager | [PNPM](https://pnpm.io) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18.0.0+
- [PNPM](https://pnpm.io)
- [PostgreSQL](https://postgresql.org) (or [Neon](https://neon.tech) serverless)
- [Redis](https://redis.io) (for background job processing)
- [Google Cloud](https://cloud.google.com) project with Speech-to-Text and Cloud Storage APIs enabled
- [Supabase](https://supabase.com) account (for audio file storage)

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Google Cloud (Speech-to-Text & Cloud Storage)
GOOGLE_CLOUD_PROJECT_ID=your_gcp_project_id
GOOGLE_CLOUD_CLIENT_EMAIL=your_service_account_email
GOOGLE_CLOUD_PRIVATE_KEY=your_service_account_private_key
GOOGLE_CLOUD_STORAGE_BUCKET=your_gcs_bucket_name
# OR use a key file instead of inline credentials:
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Supabase (audio storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Redis (automatically set by Docker Compose, only needed for manual setup)
REDIS_URL=redis://localhost:6379
```

---

### Option 1: Docker (Recommended)

The easiest way to get Literate running locally. Docker Compose will spin up the Next.js app, the background worker, and Redis in a single command.

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

```bash
# Clone the repository
git clone https://github.com/Wisdomous20/literate.git
cd literate

# Create your .env file (see Environment Variables above)
cp .env.example .env   # then edit with your values

# Build and start all services
docker compose up --build
```

This starts three services:

| Service | Description | Port |
|---|---|---|
| `app` | Next.js application | `3000` |
| `worker` | BullMQ background worker (transcription, grading, oral reading level) | — |
| `redis` | Redis 7 (Alpine) with persistent storage | `6379` (internal) |

Common Docker commands:

```bash
# Start in detached mode
docker compose up --build -d

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f app

# Stop all services
docker compose down

# Stop and remove volumes (clears Redis data)
docker compose down -v

# Rebuild a single service
docker compose up --build app
```

> **Note:** The `REDIS_URL` is automatically injected by Docker Compose — you do not need to set it in your `.env` file when using Docker.

---

### Option 2: Manual Setup

If you prefer running services directly on your machine:

```bash
# Clone the repository
git clone https://github.com/Wisdomous20/literate.git
cd literate

# Install dependencies
pnpm install

# Generate Prisma client and run migrations
pnpm prisma generate
pnpm prisma migrate dev
```

You need three processes running simultaneously. Open three separate terminals:

**Terminal 1 — Redis:**
```bash
docker start redis
```
> If you don't have a Redis container yet, create one first: `docker run -d --name redis -p 6379:6379 redis:7-alpine`

**Terminal 2 — Background Worker:**
```bash
npx tsx watch src/workers/index.ts
```

**Terminal 3 — Development Server:**
```bash
pnpm dev
```

Make sure your `.env` includes `REDIS_URL=redis://localhost:6379`, then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
literate/
├── prisma/                     # Database schema and migrations
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router (pages + API routes)
│   │   ├── admin/              # Admin dashboard
│   │   ├── api/                # API endpoints
│   │   └── dashboard/          # Teacher dashboard
│   ├── components/             # UI components
│   │   ├── auth/               # Authentication
│   │   ├── class-lists/        # Class management
│   │   ├── oral-reading-test/  # Oral reading test
│   │   ├── sidebar/            # Navigation
│   │   └── ui/                 # Base UI primitives
│   ├── context/                # React context providers
│   ├── generated/              # Prisma generated client
│   ├── lib/                    # Utility libraries (Prisma, auth, queues, Redis)
│   ├── service/                # Business logic
│   │   ├── admin/
│   │   ├── assessment/
│   │   └── oral-reading/
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Helper utilities
│   └── workers/                # BullMQ background workers
├── Dockerfile                  # Production app container
├── Dockerfile.worker           # Production worker container
├── docker-compose.yml          # Multi-service orchestration
├── package.json
└── README.md
```

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm prisma generate` | Generate Prisma client |
| `pnpm prisma migrate dev` | Run database migrations |
| `pnpm prisma studio` | Open Prisma Studio (database GUI) |


---

## Roadmap

- [x] Oral Reading Test with AI transcription
- [x] Miscue detection and analysis
- [x] Reading behavior detection
- [x] Class and student management
- [x] Reading Fluency Test
- [x] Multi-language passage support
- [x] Background job processing (BullMQ + Redis)
- [x] Reading Comprehension Test with quizzes
- [x] Detailed student progress reports
- [x] PDF report generation

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contributing

Contributions are welcome. Please open an [issue](https://github.com/Wisdomous20/literate/issues) to discuss proposed changes before submitting a pull request.

---

## Acknowledgments

- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text) — AI transcription
- [Google Cloud Storage](https://cloud.google.com/storage) — Audio file storage
- [Next.js](https://nextjs.org) — React framework
- [Prisma](https://prisma.io) — Database ORM
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [Radix UI](https://radix-ui.com) — Accessible UI primitives
- [BullMQ](https://docs.bullmq.io) — Job queue for Node.js