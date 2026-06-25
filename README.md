# Attendance AI System

A web application for employee attendance tracking and AI-driven HR policy management.

---

## 🚀 Setup Steps

### 1. Database Setup
* Go to [Supabase](https://supabase.com) and create a free project.
* Copy the database connection string (URI) from your database settings.

---

### 2. Server Setup (Backend)
* Open a terminal window and go to the `server` folder:
  ```bash
  cd server
  ```
* Create a new file named `.env` and fill it with these keys:
  ```env
  PORT=5000
  DATABASE_URL="your-supabase-connection-string"
  JWT_SECRET="choose-any-secret-password-string"
  OPENAI_API_KEY="your-openai-api-key"
  GROQ_API_KEY="your-groq-api-key"
  ```
* Run these commands in order:
  ```bash
  npm install
  npx prisma db push
  npx prisma generate
  npm run dev
  ```

---

### 3. Client Setup (Frontend)
* Open a new terminal window and go to the `client` folder:
  ```bash
  cd client
  ```
* Run these commands in order:
  ```bash
  npm install
  npm run dev
  ```
* Open your browser and go to: [http://localhost:5173](http://localhost:5173)

---

## 👥 Role-Based Access Guide

- **Admin Pages:**
  - Dashboard (System-wide statistics and activity summary)
  - AI Assistant (Full database search and policy querying capabilities)
  - Employee Manager (Create/edit users, assign managers, toggle roles and active status)
  - Document Uploads (Upload PDF company policies to the vector database)
  - AI Configurations (Configure or clear OpenAI and Groq API keys)
  - Profile Settings (Edit personal details, skills, and experience)

- **Manager Pages:**
  - Dashboard (Attendance metrics summary of direct reports)
  - Team Reports (Detailed check-in/out log table of direct reports)
  - AI Assistant (AI querying restricted strictly to direct reports)
  - Profile Settings (Edit personal details, skills, and experience)

- **Staff Pages:**
  - Dashboard (Real-time clock, Check-In/Check-Out timer, and personal attendance history log)
  - AI Policy Chat (Interactive chat query assistant restricted strictly to policy documents)
  - Profile Settings (Edit personal details, skills, and experience)

---

## 💬 Developer Prompts to Setup and Create This Project

- How do I set up a PostgreSQL database on Supabase and get the connection string for my app?
- Can you make a template for a backend `.env` file that includes PORT, DATABASE_URL, JWT_SECRET, and keys for OpenAI and Groq?
- What commands do I need to run to install packages, push the Prisma schema to Supabase, generate the client, and start the backend server in dev mode?
- How do I get into the client folder, install React dependencies, and start the Vite dev server?
- Help me set up a new project with a backend folder called 'server' using Node/Express and a frontend folder called 'client' using React + Vite. Give me a good root gitignore file too.
- Set up TypeScript for the Express backend. I need a tsconfig file that builds everything into a dist folder and has strict type checks enabled.
- Create a script using Prisma to seed my database with some fake users (an Admin, a Manager, and a couple of Staff accounts) and check-in logs so I have test data.
- Can you add helmet, cors, compression, rate-limiting, and request logging with morgan and winston to my backend? Make sure the server logs requests and errors nicely.
- Create my database tables using Prisma connected to Supabase: I need tables for Users, Attendance logs, policy Documents, policy Document Chunks with vector support, and System Settings.
- Implement sign-up, sign-in, and refresh token endpoints using bcryptjs and jsonwebtoken. Let's validate the request bodies using zod schemas.
- I need check-in and check-out APIs that calculate working hours and set anything over 8 hours as overtime. Use socket.io to update the dashboard live.
- Write an endpoint for uploading policy PDFs. Parse the text using pdf-parse, break it into chunks of 800 characters with 100 character overlap, generate OpenAI embeddings (with a free local hashing fallback if key is missing), and save them using pgvector.
- Build the main AI endpoint. If staff queries, search the policy chunks with a custom keyword stemmer/re-ranker (no DB tool access). If managers query, they can ask about attendance but only for their direct reports. Admins get full tool access to list users and attendance.
- Set up a clean React frontend with Vite, Tailwind/Vanilla CSS, axios, and socket.io-client. Build a sidebar layout that hides or shows pages depending on if the user is an admin, manager, or staff.
- Build the check-in panel for the dashboard. Show a clock, a check-in toggle button, and a live counter showing hours worked like '1hr 15 min'. Show their history table below.
- Show attendance graphs using recharts on the manager and admin dashboards, showing weekly trends and working hours.
- Add employee profile settings where staff can fill in their skills and experience. Save these as text embeddings so we can search for developers or staff semantically.
- Make sure the check-in timer doesn't reset to zero if the page is refreshed. Fetch the active session from the database and resume it automatically.
- Send a real-time toast alert to the manager's dashboard whenever one of their direct reports checks in or out.
- Create a user management list where admins can activate/deactivate accounts or change their roles with a simple dropdown.
- Let admins save or clear their OpenAI/Groq keys in the settings panel. If they leave them blank, fall back to the environment variables.
- If an admin deletes a document, make sure it deletes all its chunks and vector embeddings from the database too.
- Build a responsive sidebar layout where the links shown depend on the logged-in user's role. If they're STAFF, only show them the Dashboard and AI Policy Chat. If they're a MANAGER, let them see Dashboard, Team Reports, and AI Assistant. If they're an ADMIN, let them see everything including Document Uploads, User Management, and AI settings.
- Create a Dashboard view that changes its panels based on roles: staff should see their own personal check-in stats and hours worked; managers should see a grid of their direct reports with quick summary cards; admins should see total system stats.
- Inside the AI Assistant page, hide the Reports tab from Staff users completely so they only see the Policy Chat tab. Managers and Admins should be able to switch between the Policy Chat and the database-connected Reports Assistant.
- Make sure routes are protected on the React side! If a STAFF user tries to manually type `/settings` or `/upload` in the URL, redirect them back to the dashboard with an error alert.
- Create a Settings page where admins can enter and save their own OpenAI API Key or Groq API Key, choose which AI provider to use as the default LLM (OpenAI or Groq), and save these settings directly to the database. The server should dynamically use the key saved in the database, and if the database settings are blank or deleted, automatically fall back to using the keys set in the server's `.env` environment file.
