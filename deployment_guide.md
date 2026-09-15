# 🚀 Master Deployment Guide (100% Free, NO Credit Card Required)

This guide walks you through deploying your full-stack Laboratory Information System using:
1. **Supabase**: PostgreSQL Cloud Database (No card needed)
2. **Koyeb**: Express.js + Socket.IO Backend Server (No card needed)
3. **Vercel**: React (Vite) Frontend UI (No card needed)

---

## 🗄️ Step 1: Set up Cloud Database (Supabase)

1. Go to [Supabase.com](https://supabase.com) and click **Sign in with GitHub**.
2. Click **New Project**:
   - **Name**: `lis-database`
   - **Database Password**: Choose a strong password and save it!
   - **Region**: Choose closest location.
3. Click **Create New Project** (wait ~1 min).
4. Get your **Connection String**:
   - Go to **Project Settings** (gear icon) $\rightarrow$ **Database**.
   - Scroll to **Connection String** and copy the **URI**:
     `postgres://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
5. Run your database schema:
   - In Supabase, click **SQL Editor** on the left menu.
   - Copy all content from [schema.sql](file:///d:/Projects/Laboratory-Information-System-main/database/schema.sql), paste into SQL Editor, and click **Run**.
   - Copy all content from [seed.sql](file:///d:/Projects/Laboratory-Information-System-main/database/seed.sql), paste into SQL Editor, and click **Run**.

---

## ⚙️ Step 2: Deploy Backend Server (Koyeb)

1. Go to [Koyeb.com](https://www.koyeb.com) and click **Sign Up** $\rightarrow$ **Sign in with GitHub** (No credit card required!).
2. Click **Create Service** $\rightarrow$ select **GitHub**.
3. Choose your repository: `Kavindu379/Laboratory-Information-System-main`.
4. Configure service settings:
   - **Work Directory**: `backend`
   - **Builder**: `Node.js`
   - **Instance Type**: `Nano` (Free)
   - **Run Command**: `node index.js`
5. Click **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | Your Supabase connection URI string from Step 1 |
| `JWT_SECRET` | `super-secret-lis-key-2026` |
| `CLIENT_URL` | `https://laboratory-information-system.vercel.app` (your Vercel URL from Step 3) |

6. Click **Deploy**.
7. Once finished, Koyeb will give you your **Backend URL** (e.g. `https://lis-backend-kavindu.koyeb.app`). Copy this URL!

---

## 🌐 Step 3: Deploy Frontend UI (Vercel)

*(Looking at your screenshot on Vercel)*:

1. On Vercel screen:
   - Next to **Root Directory**, click **Edit**.
   - Change it from `backend` to **`frontend`**.
2. Framework Preset will automatically change to **Vite** (or select **Vite** manually).
3. Expand **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://lis-backend-kavindu.koyeb.app/api` |
| `VITE_SOCKET_URL` | `https://lis-backend-kavindu.koyeb.app` |

*(Replace `https://lis-backend-kavindu.koyeb.app` with your real Koyeb backend URL from Step 2)*.

4. Click **Deploy**!

---

## 🔄 Step 4: Update Backend Client URL

1. Copy your live Vercel URL (e.g. `https://laboratory-information-system-kavindu.vercel.app`).
2. Go to **Koyeb.com** $\rightarrow$ your Service $\rightarrow$ **Environment Variables**.
3. Update `CLIENT_URL` to match your Vercel URL.
4. Click **Save & Re-deploy**.

🎉 **Your app is now live on the internet!**
