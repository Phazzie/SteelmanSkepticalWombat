# The Skeptical Wombat

The Skeptical Wombat is a web application designed to help partners navigate disagreements by cutting through polite language and exposing the core of the issue with blunt, witty, and insightful AI-driven analysis.

## 🚀 Live Demo

- **GitHub Pages**: [Coming Soon]
- **Vercel**: [Coming Soon]
- **Google Cloud**: [Coming Soon]

## ✨ Features

- **AI-Powered Analysis**: Uses Google Gemini with LangChain for sophisticated prompting
- **Multi-Phase Problem Solving**: Structured approach to conflict resolution
- **Real-time Collaboration**: Supabase-powered partner synchronization
- **The Skeptical Wombat Persona**: Blunt, witty, and insightful AI feedback
- **State Management**: Centralized state machine for predictable interactions
- **Multi-Platform Deployment**: Ready for GitHub Pages, Google Cloud, and Vercel

## 🛠 Getting Started

### Prerequisites

- Node.js 22+ (required by `@supabase/supabase-js`)
- npm or yarn
- Supabase project (for backend) — run the migration in `supabase/migrations/0001_init.sql`
- Google Gemini API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Phazzie/SteelmanSkepticalWombat.git
   cd SteelmanSkepticalWombat
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```bash
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   VITE_GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`.

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions
- [Changelog](CHANGELOG.md) - Detailed consolidation history
- [Agent Instructions](AGENTS.md) - Development guidelines

## 🏗 Project Structure

```
src/
├── components/          # React components
│   ├── phases/         # Problem-solving phase components
│   └── ui/             # Reusable UI components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── services/           # External service integrations
│   ├── ai.ts                  # Gemini/LangChain AI service
│   ├── ai.test.ts             # AI service tests
│   ├── DataService.ts         # Backend seam (interface) — see below
│   ├── SupabaseDataService.ts # Real Supabase implementation of DataService
│   └── FakeDataService.ts     # In-memory implementation, used in tests
├── state/              # State management
│   └── problemMachine.ts # State machine for problem workflow
├── types/              # TypeScript type definitions
├── constants/          # Application constants
└── styles.css          # Global styles
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Type checking
npm run type-check
```

## 🚀 Deployment

The application is configured for deployment on multiple platforms:

### GitHub Pages
```bash
# Automatic deployment on push to main branch
# Or manually trigger GitHub Actions
```

### Vercel
```bash
# Connect repository to Vercel dashboard
# Or use CLI: vercel --prod
```

### Google Cloud
```bash
# App Engine
gcloud app deploy

# Cloud Run
docker build -t gcr.io/PROJECT_ID/skeptical-wombat .
gcloud run deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run type-check` - Check TypeScript types

### Key Technologies

- **Frontend**: React 18 + TypeScript + Vite
- **AI**: Google Gemini + LangChain
- **Backend**: Supabase (Auth + Postgres, behind a `DataService` seam — see `src/services/DataService.ts`)
- **Testing**: Vitest + React Testing Library
- **Deployment**: Multi-platform (GitHub Pages, Vercel, Google Cloud)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [AGENTS.md](AGENTS.md) for development guidelines and The Skeptical Wombat persona requirements.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- Supabase for the backend (Auth, Postgres, Realtime)
- LangChain for enhanced prompting
- The open-source community for amazing tools

## 📞 Support

For deployment issues or questions:
1. Check the [Deployment Guide](DEPLOYMENT.md)
2. Review the [Changelog](CHANGELOG.md)
3. Open an issue on GitHub

---

**The Skeptical Wombat** - *Cutting through relationship BS, one disagreement at a time.* 🦝
