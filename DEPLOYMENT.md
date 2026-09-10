# UPSC Study Tracker — Private Vercel & Supabase Deployment Guide

This guide walks you through deploying your personal, private **UPSC Study Tracker** web application to **Vercel** connected to your **Supabase** backend.

---

## Architecture & Security Model
- **Single-User Private Access**: Protected by Supabase Authentication. Unauthenticated visitors are automatically redirected to `/login`.
- **Row-Level Security (RLS)**: Enforced across all tables (`profiles`, `topic_progress`, `daily_stats`, `notes`, `study_files`). Users can only access their own records.
- **Private Storage Bucket**: `study-files` storage bucket is private (`public = false`). Study PDFs and documents are accessed exclusively via secure, short-lived signed URLs generated on demand.
- **No Secrets in Client Code**: Uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The service-role key is never exposed to the frontend.

---

## Step 1: Set Up Supabase Database & Storage

1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. In the Supabase Dashboard, open the **SQL Editor** (left navigation).
3. Open [`supabase/schema.sql`](./supabase/schema.sql) from this repository, copy its entire contents, paste it into the SQL Editor, and click **Run**.
   - This creates all tables (`profiles`, `syllabus_subjects`, `syllabus_sections`, `syllabus_topics`, `topic_progress`, `daily_stats`, `notes`, `study_files`), RLS policies, and the private `study-files` storage bucket.
4. Open [`supabase/seed_syllabus.sql`](./supabase/seed_syllabus.sql), copy its contents, paste it into the SQL Editor, and click **Run**.
   - This seeds the complete 26-subject, 55-section, 420-topic official UPSC syllabus.
5. In Supabase, go to **Project Settings** $\rightarrow$ **API** and note down:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **Project API Anon Key** (`anon` / `public`)

---

## Step 2: Push Project to GitHub

1. Initialize git and push your repository to your private GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Complete UPSC Study Tracker with Private Study Library"
   git branch -M main
   git remote add origin https://github.com/<your-username>/upsc-study-tracker.git
   git push -u origin main
   ```

---

## Step 3: Import Project into Vercel

1. Go to [https://vercel.com](https://vercel.com) and log in.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository (`upsc-study-tracker`).
4. Keep the Framework Preset as **Next.js**.

---

## Step 4: Configure Environment Variables in Vercel

Under the **Environment Variables** section before deploying, add:

| Name | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Your Supabase Anonymous (`anon`/`public`) Key |

> [!WARNING]
> Do NOT add `SUPABASE_SERVICE_ROLE_KEY` to Vercel client environment variables.

Click **Deploy**. Vercel will build and deploy your application to a URL like `https://upsc-study-tracker-yourname.vercel.app`.

---

## Step 5: Configure Supabase Auth Redirects

1. Go to the Supabase Dashboard $\rightarrow$ **Authentication** $\rightarrow$ **URL Configuration**.
2. Set **Site URL** to your Vercel deployment URL:
   ```text
   https://upsc-study-tracker-yourname.vercel.app
   ```
3. Under **Redirect URLs**, add:
   ```text
   https://upsc-study-tracker-yourname.vercel.app/**
   http://localhost:3000/**
   ```
4. Click **Save**.

---

## Step 6: Verify & Test Your Personal Application

Open your deployed Vercel URL and test all key workflows:

1. **Unauthenticated Redirect**:
   - Visit `https://your-domain.vercel.app/dashboard` in an incognito window.
   - Verify that it immediately redirects you to `/login`.
2. **Account Creation & Sign In**:
   - Navigate to `/signup` and create your personal account.
   - Sign in on `/login` and confirm you land on `/dashboard`.
3. **Daily Habits & Stats**:
   - Check off subjects in **Today's Habits**.
   - Enter study hours/minutes and click **Save Today's Progress**.
4. **Master Syllabus Explorer**:
   - Open `/syllabus`.
   - Test the **Prelims** and **Mains** switcher.
   - Search for `Fundamental Rights` or `Plate Tectonics` and verify breadcrumbs.
5. **Personal Study File Library (`/files`)**:
   - Click **+ Upload File**.
   - Select a PDF or study document, pick a subject (e.g. `Polity`), and click **Upload**.
   - Verify the file appears in your private library with size and upload date.
   - Click **Open** to verify the PDF opens in a new tab via a private signed URL.
   - Click **Download** to verify downloading works securely.
   - Click **Delete** and confirm the file is removed from storage and database.
6. **Logout**:
   - Click **Logout** from the sidebar and verify you are returned to `/login`.
