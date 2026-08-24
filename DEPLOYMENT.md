# Deployment Guide - The Skeptical Wombat

This application is configured for deployment on three platforms: GitHub Pages, Google Cloud Platform, and Vercel.

## Prerequisites

Before deploying, ensure you have the following environment variables set up:

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_GEMINI_API_KEY="your-gemini-api-key"
```

## Platform Deployment Instructions

### 1. GitHub Pages

**Automatic Deployment (Recommended)**
1. Push to the `main` branch
2. The GitHub Action workflow will automatically build and deploy
3. Access your site at: `https://[username].github.io/SteelmanSkepticalWombat`

**Manual Setup**
1. Go to repository Settings → Pages
2. Set source to "GitHub Actions"
3. Add secrets in Settings → Secrets and variables → Actions:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`

### 2. Google Cloud Platform

**App Engine Deployment**
```bash
# Install Google Cloud SDK
# Configure your project
gcloud config set project YOUR_PROJECT_ID

# Deploy
gcloud app deploy app.yaml
```

**Cloud Run Deployment**

This image serves a pre-built static bundle from nginx — Vite substitutes
`VITE_*` values into that bundle at `docker build` time, not when the
container starts. `gcloud run deploy --set-env-vars` only sets the running
container's environment, which the already-built bundle never reads, so
the values must be passed as **build args**, not deploy-time env vars:

```bash
# Build and push Docker image — note --build-arg, not --set-env-vars
docker build \
  --build-arg VITE_SUPABASE_URL="your-url" \
  --build-arg VITE_SUPABASE_ANON_KEY="your-anon-key" \
  --build-arg VITE_GEMINI_API_KEY="your-key" \
  -t gcr.io/YOUR_PROJECT_ID/skeptical-wombat .
docker push gcr.io/YOUR_PROJECT_ID/skeptical-wombat

# Deploy to Cloud Run — no VITE_* vars here; they're already baked into the image
gcloud run deploy skeptical-wombat \
  --image gcr.io/YOUR_PROJECT_ID/skeptical-wombat \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 3. Vercel

**Automatic Deployment (Recommended)**
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
3. Deploy automatically on push

**CLI Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Environment Configuration

### Supabase Setup
1. Create a project at https://supabase.com/dashboard
2. Run the schema migration: `supabase/migrations/0001_init.sql` (via the SQL Editor, or `supabase db push` with the CLI)
3. **Enable anonymous sign-ins** — Authentication → Providers → Anonymous Sign-Ins. This is off by default on new projects; the app only supports anonymous auth today, so a fresh project will fail to authenticate anyone until this is turned on.
4. Get your URL and anon key from Project Settings → API

### Gemini API Setup
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add it to your environment variables

## Build Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Type checking
npm run type-check
```

## Troubleshooting

### Common Issues

1. **Supabase Configuration Error / Authentication failed on load**
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set — the app throws at startup if either is missing
   - Confirm Anonymous Sign-Ins is enabled in Authentication → Providers (see Supabase Setup above); this is the most common cause of "Authentication failed" on a fresh project
   - Confirm `supabase/migrations/0001_init.sql` has been applied to the project

2. **Gemini API Key Issues**
   - Verify the API key is valid and active
   - Check API quotas and billing

3. **Build Failures**
   - Run `npm run type-check` to identify TypeScript errors
   - Ensure all dependencies are installed with `npm install`

4. **Deployment Issues**
   - Verify environment variables are set correctly
   - Check build logs for specific error messages

### Performance Monitoring

The application includes:
- Code splitting with vendor and Supabase chunks
- Gzip compression
- Asset caching
- Error boundaries for graceful failure handling

### Security Considerations

- `VITE_*` environment variables are baked into the client bundle at build time, not hidden — this includes `VITE_GEMINI_API_KEY`, which is a known open issue (see the roadmap: SEC-01, move Gemini calls behind a backend proxy before public launch)
- The Supabase anon key is meant to be public; real access control comes from the Row Level Security policies in `supabase/migrations/0001_init.sql`, not from keeping the key secret
- Review the RLS policies before launch — the migration file documents a known gap where either problem participant can currently read/write the other's private fields

## Support

For deployment issues, check:
1. Build logs for error details
2. Browser console for runtime errors
3. Network tab for API failures
4. Supabase dashboard → Logs for auth/database errors