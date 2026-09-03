# 🚀 SmartWay - Vercel 2025 Deployment Guide

This guide will help you deploy your SmartWay app to Vercel using the latest 2025 serverless function standards.

## ✨ What's New in 2025 Architecture

- **✅ Serverless Functions**: Individual API endpoints instead of monolithic server
- **✅ 2.5-minute timeout**: Extended processing time for large documents
- **✅ Memory optimization**: 1GB memory for AI generation, 256MB for health checks
- **✅ Node.js 20.x**: Latest runtime for optimal performance
- **✅ Framework detection**: Native Vite support with optimized builds

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free)
- Your project pushed to GitHub/GitLab/Bitbucket
- Google Gemini API key
- Supabase project setup

## Environment Variables

Set these in your Vercel dashboard under **Settings** → **Environment Variables**:

```env
# Required: Google Gemini AI API Key (for backend API)
GEMINI_API_KEY=your_gemini_api_key_here

# Required: Supabase Configuration (for frontend build only)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Automatically set by Vercel
NODE_ENV=production
```

**Important**: Backend API only needs `GEMINI_API_KEY`. Supabase credentials are used by frontend to upload files and generate public URLs.

## Step 1: Prepare Your Repository

1. **Commit and push your changes to GitHub**:
   ```bash
   git add .
   git commit -m "Migrate to Vercel 2025 serverless functions"
   git push origin main
   ```

2. **Verify your repository structure**:
   ```
   smartway/
   ├── api/                    # Serverless functions
   │   ├── health.js          # Health check endpoint
   │   └── generate.js        # AI generation endpoint
   ├── src/                   # React frontend
   ├── vercel.json           # Vercel 2025 configuration
   ├── package.json          # Updated dependencies
   └── README.md
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Vercel will auto-detect settings**:
   - **Framework Preset**: `Vite` (auto-detected)
   - **Build Command**: `npm run build` (auto-configured)
   - **Output Directory**: `dist` (auto-configured)
   - **Node.js Version**: `20.x` (from vercel.json)

5. **Add Environment Variables** (Critical Step):
   - Click "Environment Variables"
   - Add: `GEMINI_API_KEY` = `your_actual_api_key_here` (REQUIRED for backend)
   - Add: `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co` (for frontend build)
   - Add: `VITE_SUPABASE_ANON_KEY` = `your_anon_key_here` (for frontend build)
   - Make sure to use **Production**, **Preview**, and **Development** environments

6. **Click "Deploy"**

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel@latest
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   npm run deploy
   ```

4. **Add environment variables**:
   ```bash
   vercel env add GEMINI_API_KEY
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## Step 3: Verify Deployment

1. **Check build logs** in the Vercel dashboard
2. **Test your deployed app**:
   - Visit your app URL (e.g., `https://smartway.vercel.app`)
   - Test health check: `https://your-app-url.vercel.app/api/health`
   - Upload a document and generate study materials

## Step 4: Performance Optimization

### Function Configuration (Automatic via vercel.json)

- **Generate API**: 150s timeout, 1GB memory, Node.js 20.x
- **Health API**: 10s timeout, 256MB memory, Node.js 20.x
- **CORS headers**: Automatically configured
- **Framework detection**: Native Vite support

### Monitoring

1. **Function Logs**: Vercel Dashboard → Functions → View logs
2. **Performance**: Built-in metrics for response times
3. **Error Tracking**: Automatic error reporting

## Troubleshooting

### Common Issues:

1. **API Key Not Found**:
   ```bash
   # Check environment variables in Vercel dashboard
   # Redeploy after adding variables
   ```

2. **Function Timeout**:
   ```bash
   # Maximum timeout is now 150 seconds (2.5 minutes)
   # Large documents should process within this limit
   ```

3. **Build Fails**:
   ```bash
   # Check build logs for specific errors
   # Ensure all dependencies are correctly specified
   ```

4. **CORS Issues**:
   ```bash
   # CORS headers are automatically configured in vercel.json
   # No additional setup needed
   ```

### Debug Commands:

```bash
# Test health endpoint
curl https://your-app-url.vercel.app/api/health

# Local development with Vercel runtime
npm run dev:server

# Check function logs
vercel logs

# Deploy preview
npm run deploy:preview
```

## Features Available After Deployment

✅ **2.5-minute processing**: Extended timeout for large documents  
✅ **Memory optimization**: 1GB for AI processing  
✅ **Node.js 20.x**: Latest runtime performance  
✅ **Auto-scaling**: Handles traffic spikes automatically  
✅ **Global CDN**: Fast loading worldwide  
✅ **HTTPS**: Automatic SSL certificates  
✅ **Custom domains**: Easy domain configuration  

## API Endpoints

After deployment, your API will be available at:

### Health Check
```bash
GET https://your-app-url.vercel.app/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX",
  "environment": "production",
  "services": {
    "gemini": "configured",
    "supabase": "frontend-managed"
  },
  "version": "2.0.0",
  "deployment": "vercel-2025"
}
```

### AI Generation
```bash
POST https://your-app-url.vercel.app/api/generate
Content-Type: application/json

# Text input
{
  "text": "Your study material here..."
}

# File URL input (from Supabase)
{
  "fileUrl": "https://your-supabase-storage-url/file.pdf"
}
```

## Performance Metrics

- **Cold start**: < 1 second
- **Function execution**: 1-150 seconds (depending on content)
- **Memory usage**: Optimized for document processing
- **Concurrent requests**: Auto-scaling based on demand

## Custom Domain Setup

1. Go to **Settings** → **Domains** in your Vercel project
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate will be automatically provisioned

## Updating Your App

To update your deployed app:

1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Automatic deployment**: Vercel will automatically redeploy
3. **Manual deployment**: Use `npm run deploy` for immediate deployment

## Cost Optimization

**Vercel Free Tier Limits:**
- ✅ **100GB-hours** of function execution time per month
- ✅ **100GB** bandwidth per month  
- ✅ **6,000** function invocations per day
- ✅ **10s** function timeout (our functions use up to 150s on Pro)

**Pro Tier Benefits:**
- ✅ **1,000GB-hours** function execution
- ✅ **1TB** bandwidth
- ✅ **Unlimited** function invocations
- ✅ **5-minute** function timeout (we use 2.5 minutes)

## Support

If you encounter issues:
- Check Vercel function logs in the dashboard
- Review environment variables configuration
- Ensure Supabase policies are correctly set
- Verify Gemini API key permissions

---

🎉 **Congratulations!** Your SmartWay app is now deployed with Vercel 2025 serverless architecture! 