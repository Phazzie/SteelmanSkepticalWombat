# Deployment Guide - The Skeptical Wombat

This application is configured for deployment on three platforms: GitHub Pages, Google Cloud Platform, and Vercel.

## Prerequisites

Before deploying, ensure you have the following environment variables set up:

```bash
VITE_FIREBASE_CONFIG='{"apiKey":"your-api-key","authDomain":"your-project.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"your-app-id"}'
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
   - `VITE_FIREBASE_CONFIG`
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
```bash
# Build and push Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/skeptical-wombat .
docker push gcr.io/YOUR_PROJECT_ID/skeptical-wombat

# Deploy to Cloud Run
gcloud run deploy skeptical-wombat \
  --image gcr.io/YOUR_PROJECT_ID/skeptical-wombat \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars VITE_FIREBASE_CONFIG="your-config",VITE_GEMINI_API_KEY="your-key"
```

### 3. Vercel

**Automatic Deployment (Recommended)**
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_FIREBASE_CONFIG`
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

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication and Firestore
3. Get your config from Project Settings → General → Your apps

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

1. **Firebase Configuration Error**
   - Ensure `VITE_FIREBASE_CONFIG` is properly formatted JSON
   - Check that all Firebase services are enabled

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
- Code splitting with vendor and Firebase chunks
- Gzip compression
- Asset caching
- Error boundaries for graceful failure handling

### Security Considerations

- Environment variables are build-time only and not exposed in the client
- Firebase security rules should be configured appropriately
- API keys have appropriate restrictions

## Support

For deployment issues, check:
1. Build logs for error details
2. Browser console for runtime errors
3. Network tab for API failures
4. Firebase console for authentication issues