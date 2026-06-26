# Attendance AI System

A web application for employee attendance tracking and AI-driven HR policy management.

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

## 🚀 Setup Steps

### 1. Database Setup

- Go to [Supabase](https://supabase.com) and create a free project.
- Copy the database connection string (URI) from your database settings.

---

### 2. Server Setup (Backend)

- Open a terminal window and go to the `server` folder:
  ```bash
  cd server
  ```
- Create a new file named `.env` and fill it with these keys:
  ```env
  PORT=5000
  DATABASE_URL="your-supabase-connection-string"
  JWT_SECRET="choose-any-secret-password-string"
  OPENAI_API_KEY="your-openai-api-key"
  GROQ_API_KEY="your-groq-api-key"
  ```
- Run these commands in order:
  ```bash
  npm install
  npx prisma db push
  npx prisma generate
  npm run dev
  ```

---

### 3. Client Setup (Frontend)

- Open a new terminal window and go to the `client` folder:
  ```bash
  cd client
  ```
- Run these commands in order:
  ```bash
  npm install
  npm run dev
  ```
- Open your browser and go to: [http://localhost:5173](http://localhost:5173)

---

## Developer Prompts to Setup and Create This Project

- How do I set up a PostgreSQL databse on Supabase and get the connection string for my app?
- Can you make a template for a backend `.env` file that includes PORT, DATABASE_URL, JWT_SECRET, and keys for OpenAI and Groq?
- What commands do I need to run to install packages, push the Prisma schema to Supabase, generate the client, and start the backend server in dev mode?
- how do I get in client folder, install react dependecies and start vite dev server
- help me setup new project with backend folder called server using node express and frontend called client using react vite, also give a good root gitignore
- setup typescript for express backend, I need a tsconfig file that build everything in dist folder and strict check enabled
- create a script using prisma to seed my database with some fake user like one admin, manager and staff accounts and checkin logs so I have test data
- can you add helmet, cors, compression, rate limiting, and request loging with morgan and winston, make sure it log request and errors nicely
- can you design prisma schema for postgresql databse for user accounts with roles ADMIN, MANAGER, STAFF and self relation for manager and staff
- design the schema for attendance logs, each record link to user, checkin checkout dates, workign hours and overtime hours as decimals
- write prisma models for store uploaded documents. We need Document table for meta like title and filename and DocumentChunk to store text and embedding using pgvector
- create SystemSetting model to store config settings as key value pairs like provider, openai key and groq key so they persist in db
- Create my database tables using Prisma connected to Supabase: I need tables for Users, Attendance logs, policy Documents, policy Document Chunks with vector support, and System Settings.
- implemet signup, login, and refresh token endpoints using bcrypt and jwt, validate request body using zod
- I need checkin checkout api that calculate workign hours and set over 8 hours as overtime, use socket.io to update dashboard live
- write endpoint to upload policy pdf, parse text using pdf-parse, make chunks of 800 chars and 100 overlap, generate openai embedings and save using pgvector
- build AI endpoint, if staff ask search policy chunks with custom keyword stemmer (no db access), if manager ask they can get attendance of direct reports only, admin get full tool access
- setup clean react frontend using vite, css, axios and socket.io, build sidebar layout that hide/show pages depending user is admin, manager or staff
- build checkin panel on dashboard, show clock, checkin toggle button and live counter of workign hours like 1hr 15 min, show history table below
- show attendance graph using recharts on manager and admin dashboards showing weekly trends
- add employee profile settings where staff can fill skills and experience, save these as text embeding so we can search semantically
- make sure checkin timer does not reset to zero if page refreshed, fetch active session from db and resume
- send real time toast alert to manager dashboard when direct report checkin checkout
- create user management list where admin can activate deactivate account or change roles with dropdown
- let admin save/clear openai groq keys in settings, if blank use env variables
- if admin delete doc make sure it delete all chunks and embedings from database too
- build sidebar layout where links depend on user role. if staff only show dashboard and policy chat, if manager show reports too, if admin show settings and document uploads
- create dashboard page that change base on role: staff see own checkin timer and logs, manager see reports stats cards, admin see system stats
- in AI Assistant page hide reports tab from staff so they only see policy chat, manager and admin can switch between policy chat and reports
- make sure routes are protected on react side, if staff try to type url manually redirect them dashboard
- create settings page where admin can save open ai and groq key, select default provider, save to db, server should dynamic use key from database, and if blank fallback to env key
- AI is giving back raw markdown text with asterisks and pipes, but on UI it looks bad. Write a custom response formatter in react so it renders real tables, bullet points, numbered lists, and bold text beautifully like chatgpt
- inside the message formatter, make a loop that processes LLM output line by line. If a line starts with pipe symbols, join them into a styled html table. If it has dash/number prefixes, parse them into bullet and ordered list items
- make sure the react custom formatter escapes raw html tags first to prevent security issues, then translates inline code backticks, asterisks for bold, and double asterisks to proper inline tags
- fix intermittent `400 Failed to call a function` error with the Groq AI assistant on policy/attendance queries by adding strict tool formatting instructions and implementing fallback policy direct-RAG routing and retries
- group employee check-in logs by date per user in the staff, manager, and admin panels. if an employee has checked in multiple times in a single day, merge them into a single row showing the overall check-in, check-out, combined working hours, and a collapsible detailed session log list
