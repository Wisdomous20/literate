# Literate

**Literate** is a reading proficiency assessment platform built with Next.js, designed to help educators evaluate and track students' reading abilities through oral reading tests, reading fluency assessments, and comprehension evaluations.

---

## ✨ Features

### 📖 Oral Reading Test
- Record students reading passages aloud with real-time audio capture
- AI-powered transcription using OpenAI Whisper API
- Automatic miscue detection and analysis:
  - Mispronunciation
  - Omission
  - Substitution
  - Transposition
  - Insertion
  - Self-correction
  - Repetition
- Reading behavior detection:
  - Word-by-word reading
  - Monotonous reading
  - Dismissal of punctuation
- Words per minute (WPM) and accuracy calculations
- Classification levels: Independent, Instructional, Frustration

### 📊 Reading Fluency Test
- Assess students' reading fluency with timed passages
- Audio recording and playback functionality
- Detailed fluency scoring and analysis

### 📝 Reading Comprehension Test *(Coming Soon)*
- Passage-based comprehension quizzes
- Multiple question types:
  - Multiple choice
  - Essay questions
- Question tagging by cognitive level:
  - Literal
  - Inferential
  - Critical
- Automated scoring and progress tracking

### 🏫 Class Management
- Create and organize classes by school year
- Add and manage students within classes
- Track individual student progress across assessments
- View class-wide statistics and performance metrics

### ⚙️ Test Configuration
- **Auto-Scroll**: Automatically scrolls passage as student reads (Web Speech API)
- **Auto-Finish**: Detects when student completes reading
- Adjustable countdown timer before recording starts
- Readiness check system:
  - Microphone detection and selection
  - Background noise level monitoring
  - Internet connectivity verification

### 👨‍💼 Admin Dashboard
- Create and manage graded reading passages
- Configure passage metadata (language, grade level, test type)
- Create comprehension questions with answer tagging
- Monitor platform-wide statistics

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **PNPM** package manager
- **PostgreSQL** database (or Neon serverless PostgreSQL)
- **OpenAI API Key** for Whisper transcription
- **Supabase** account for audio file storage

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Wisdomous20/literate.git
   cd literate
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL=your_postgresql_connection_string

   # Authentication
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000

   # OpenAI (for Whisper transcription)
   OPENAI_API_KEY=your_openai_api_key

   # Supabase (for audio storage)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**

   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

5. **Run the development server**

   ```bash
   pnpm dev
   ```

6. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
literate/
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── api/            # API endpoints
│   │   ├── dashboard/      # Teacher dashboard pages
│   │   └── ...
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── class-lists/    # Class management components
│   │   ├── oral-reading-test/  # Oral reading test components
│   │   ├── sidebar/        # Navigation sidebar
│   │   └── ui/             # Base UI components
│   ├── context/            # React context providers
│   ├── generated/          # Prisma generated client
│   ├── lib/                # Utility libraries (Prisma, auth)
│   ├── service/            # Business logic services
│   │   ├── admin/          # Admin services
│   │   ├── assessment/     # Assessment creation services
│   │   └── oral-reading/   # Oral reading analysis services
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Helper utilities
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 15](https://nextjs.org) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org) |
| **Database** | [PostgreSQL](https://www.postgresql.org) via [Neon](https://neon.tech) |
| **ORM** | [Prisma](https://www.prisma.io) |
| **Authentication** | [NextAuth.js](https://next-auth.js.org) |
| **AI/ML** | [OpenAI Whisper API](https://openai.com/whisper) |
| **Storage** | [Supabase](https://supabase.com) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) |
| **UI Components** | [Radix UI](https://www.radix-ui.com) |
| **Charts** | [Recharts](https://recharts.org) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Package Manager** | [PNPM](https://pnpm.io) |

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the application for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint for code quality checks |
| `pnpm prisma generate` | Generate Prisma client |
| `pnpm prisma migrate dev` | Run database migrations |
| `pnpm prisma studio` | Open Prisma Studio for database management |

---

## 🌐 Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Core functionality | ✅ | ✅ | ✅ | ✅ |
| Audio recording | ✅ | ✅ | ✅ | ✅ |
| Auto-Scroll (Web Speech API) | ✅ | ✅ | ⚠️ Limited | ⚠️ Limited |
| Auto-Finish (Web Speech API) | ✅ | ✅ | ⚠️ Limited | ⚠️ Limited |

> **Note:** Auto-Scroll and Auto-Finish features rely on the Web Speech API, which works best on Chrome and Edge browsers.

---

## 🗺️ Roadmap

- [x] Oral Reading Test with AI transcription
- [x] Miscue detection and analysis
- [x] Reading behavior detection
- [x] Class and student management
- [x] Reading Fluency Test
- [ ] Reading Comprehension Test with quizzes
- [ ] Detailed student progress reports
- [ ] PDF report generation
- [x] Multi-language passage support expansion
- [ ] Parent portal for progress viewing

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

For questions, suggestions, or support, please reach out:

- **GitHub**: [Wisdomous20](https://github.com/Wisdomous20)
- **Repository Issues**: [Create an issue](https://github.com/Wisdomous20/literate/issues)

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for the Whisper API
- [Next.js](https://nextjs.org) team for the amazing framework
- [Prisma](https://prisma.io) for the excellent ORM
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
- [Radix UI](https://radix-ui.com) for accessible UI primitives
