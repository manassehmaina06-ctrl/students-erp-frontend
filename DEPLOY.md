# 🚀 Deployment Guide

Step-by-step instructions to deploy the Strathmore ERP + LMS to production.

---

## Prerequisites

- GitHub account (repo already pushed ✅)
- [Vercel](https://vercel.com) account (free)
- [Render](https://render.com) account (free)
- [MongoDB Atlas](https://cloud.mongodb.com) cluster

---

## Step 1 — MongoDB Atlas

1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Click **Network Access** in the left sidebar
3. Click **Add IP Address** → choose **Allow Access from Anywhere** (0.0.0.0/0) for simplicity, or whitelist Render's IPs
4. Click **Confirm**

**Get your connection string:**
1. Go to **Database** → **Connect** → **Drivers**
2. Copy the URI: `mongodb+srv://user:password@cluster.../dbname`
3. Replace `<password>` with your actual password

---

## Step 2 — Deploy Backend to Render

1. Go to [render.com](https://render.com) → **New +** → **Web Service**
2. Connect your GitHub repo: `students-erp-frontend`
3. Fill in:
   - **Name:** `strathmore-erp-backend`
   - **Region:** Frankfurt (or closest to you)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
4. **Environment Variables** (click "Advanced" → "Add Environment Variable"):
   | Key | Value |
   | :--- | :--- |
   | `PORT` | `5000` |
   | `MONGO_URI` | `<your Atlas URI>` |
   | `JWT_SECRET` | `<64-char random string — generate with node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">` |
   | `PUBLIC_BASE_URL` | `https://strathmore-erp-backend.onrender.com` *(fill after deploy)* |
5. Click **Create Web Service**
6. Wait ~2 minutes for the first deploy
7. **Copy the URL** shown at the top (e.g., `https://strathmore-erp-backend.onrender.com`)
8. Go back to **Environment** → update `PUBLIC_BASE_URL` to that URL → **Save**

**Test the backend:**
\`\`\`bash
curl https://strathmore-erp-backend.onrender.com/api/auth/me
# Expected: { "message": "Not authorized, no token" }
\`\`\`

---

## Step 3 — Update Frontend API URL

Open `src/api/axios.js`:

\`\`\`js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});
\`\`\`

That's the only change needed — no hardcoded URLs.

Commit + push:
\`\`\`bash
git add src/api/axios.js
git commit -m "Use VITE_API_URL for production"
git push
\`\`\`

---

## Step 4 — Deploy Frontend to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo: `students-erp-frontend`
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables:**
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://strathmore-erp-backend.onrender.com/api` |
5. Click **Deploy**
6. Wait ~1 minute → copy the deployment URL

---

## Step 5 — Test the Deployed App

1. Open the Vercel URL
2. Log in as a student (`STU-2026-00002` + ID)
3. Navigate through LMS and Portal
4. Try creating a quiz as lecturer (login on the backend URL's frontend)

**If you see CORS errors:**

Update `backend/server.js` CORS config:

\`\`\`js
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-vercel-app.vercel.app',
  ],
  credentials: true,
}));
\`\`\`

Commit + push → Render auto-redeploys.

---

## Optional — Custom Domain

**Frontend:** Vercel → Project → Settings → Domains → Add your domain

**Backend:** Render → Service → Settings → Custom Domain → Add

---

## Troubleshooting

| Problem | Fix |
| :--- | :--- |
| **Backend slow on first request** | Render free tier sleeps after 15 min inactivity; first request wakes it (~30s) |
| **CORS errors** | Update CORS origins in `server.js` with your Vercel URL |
| **MongoDB connection error** | Whitelist 0.0.0.0/0 in Atlas Network Access |
| **Login returns 401** | Check `JWT_SECRET` matches between deploys |
| **File uploads fail** | Render's filesystem is ephemeral; use S3/Cloudinary for production |
| **PDF downloads broken** | Ensure `PUBLIC_BASE_URL` is set on Render |

---

## Post-Deploy Checklist

- [ ] Backend responds at `/api/auth/me`
- [ ] Frontend loads
- [ ] Login as student works
- [ ] Login as lecturer works
- [ ] Quiz flow end-to-end
- [ ] File upload works
- [ ] PDF download works
- [ ] Dark mode toggle works

---

## Cost Summary

| Service | Tier | Cost |
| :--- | :--- | :--- |
| Vercel | Hobby | Free |
| Render | Free | Free (sleeps) |
| MongoDB Atlas | M0 | Free (512 MB) |
| **Total** | | **$0/month** |

Upgrade Render to Starter ($7/month) if you want no cold starts.

---

**🎉 Your app is now live on the internet.**
