# SVM CultureLoop — Cultural Ecosystem & Student Engagement Platform

> **"Discover Your Talent. Find Your People. Create Together."**  
> Cultural website, talent discovery, and student community platform for **Sangeeta Vrinda Madhyam (SVM)**, affiliated with KLE Technological University.

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-13.1-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Node_24-003B57?logo=sqlite&logoColor=white)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-Multimodal-4285F4?logo=google&logoColor=white)](https://aistudio.google.com/)
[![Production Deploy](https://img.shields.io/badge/Deployment-Vercel-000000?logo=vercel&logoColor=white)](https://svm-gray.vercel.app)

---

## 1. Project Overview

SVM CultureLoop is an all-in-one cultural and artistic hub designed for university students. It bridges artistic discovery, peer collaboration, campus cultural events, official achievement recognition, and formative AI-powered creative mentorship.

The application serves two interconnected user experiences:
1. **Public Academy & Cultural Showcase (`#landing`)**: Editorial, imagery-rich website inspired by classical Indian arts academies, featuring event highlights, student spotlights, and open campus calls.
2. **Authenticated Student Portal**: Interactive portal featuring personalized dashboards, student talent feed, official achievement showcase, creative passports, interdisciplinary collaborations, campus opportunities, and creative portfolio tracking.

---

## 2. Core Features & Verified Modules

| Route / Module | Purpose & Verified Capabilities |
|---|---|
| **Public Landing Page** (`#landing`) | Editorial typography, responsive hero, interest discovery, video highlights, cultural workshop showcases, and student join modal. |
| **Authentication & Portals** (`#signin`) | Dual-mode authentication: live Firebase Auth (Email/Password, Google Sign-in, Account Registration) and instant Campus Demo Mode with 4 pre-configured student personas. |
| **Student Dashboard** (`#dashboard`) | Real-time status cards, creative works count, Creative Passport progress gauge, achievement badge spotlight, opportunity recommendations, and upcoming events feed. |
| **Talent Feed** (`#talent-feed`) | Student community feed supporting multimedia creative works across singing, dance, photography, poetry, design, and drama with likes, comments, and creator badge tags. |
| **Official Achievement Showcase** (`#achievements`) | 12 officially designed, transparent SVM achievement badges (`first-step`, `rising-star`, `voice-of-svm`, `rhythm-keeper`, etc.) with filter tabs, progress bars, unlock celebration modals, and feature badge controls. |
| **Creative Passport** (`#passport`) | Student artistic identity tracking: multi-discipline mapping, self-assessed skill levels, confidence ratings, semester goals, availability schedule, and role preferences. |
| **Cultural Opportunities Hub** (`#discover-app`) | Searchable directory of campus workshops, auditions, open jams, and challenges with category filters, difficulty tags, and live registration tracking. |
| **Interdisciplinary Collaborate** (`#collaborate`) | Student project callouts connecting complementary disciplines (e.g., vocalists seeking instrumentalists, poets seeking filmmakers) with join requests. |
| **Campus Cultural Calendar** (`#events-app`) | University cultural schedule, venue info, timing, and one-click RSVP tracking. |
| **My Creative Portfolio** (`#portfolio`) | Personal cataloged creative works with visibility controls (*Campus Showcase*, *Public*, *Private*) and structured formative evaluation scorecards. |
| **Profile & Settings** (`#settings`) | Student profile management, avatar customization, theme switching (Light / Dark / System), and feedback submission. |

---

## 3. Technology Stack

- **Frontend Core:** React 19, React DOM 19, Vite 6
- **Routing:** Browser Hash Router with hash-change listeners and deep-linking support (`#dashboard`, `#achievements`, `#talent-feed`, `#passport`, etc.)
- **Styling & Design System:** Custom semantic CSS variables, Google Fonts (`Manrope`, `DM Mono`), editorial Georgia serif headlines, responsive grid layouts, and full Dark Mode support.
- **Backend & Cloud Architecture (Dual-Mode):**
  - **Cloud Mode (Firebase Web SDK 12):** Firebase Authentication, Cloud Firestore for user profiles and collaboration projects, Firebase Storage rules for user media, and strict Row-Level Security (`firestore.rules`, `storage.rules`).
  - **Local Full-Stack Mode (Node.js & SQLite):** Built-in Node 24 native SQLite engine (`node:sqlite`) with WAL mode in `.data/cultureloop.db`, serving 18 REST endpoints and multimodal **Google Gemini AI evaluation** (`server/gemini.js`).
  - **Zero-Config Demo Mode:** Client-side fallback via browser `localStorage` ensuring that the application remains fully testable and operational out-of-the-box even without active credentials.
- **Hosting & Deployment:** Production deployment on Vercel (`https://svm-gray.vercel.app`) with single-page application URL rewrites via `vercel.json` and static build outputs.

---

## 4. Architecture Diagram

```text
                           ┌─────────────────────────────────────────┐
                           │       SVM CultureLoop React Client      │
                           │   Vite 6 + React 19 (SPA Hash Router)  │
                           └────────────────────┬────────────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │                                                 │
          (Cloud Mode / Production)                          (Local Full-Stack Mode)
                       ▼                                                 ▼
        ┌─────────────────────────────┐                  ┌───────────────────────────────┐
        │     Firebase Web SDK 12     │                  │      Node.js HTTP Server      │
        │  • Firebase Authentication  │                  │     (server.js / REST API)    │
        │  • Cloud Firestore          │                  └───────────────┬───────────────┘
        │  • Firebase Storage         │                                  │
        └─────────────────────────────┘                  ┌───────────────┴───────────────┐
                                                         ▼                               ▼
                                                 ┌──────────────┐                ┌───────────────┐
                                                 │ Native SQLite│                │ Google Gemini │
                                                 │ (cultureloop)│                │ Multimodal AI │
                                                 └──────────────┘                └───────────────┘
```

---

## 5. Getting Started & Installation

### Prerequisites

- **Node.js**: v18.0.0 or higher (Node v20+ or v24 recommended)
- **npm**: v9.0.0 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/manjunath-cod/SVM.git
   cd SVM
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

---

## 6. Environment Configuration

The application works immediately in **Campus Demo Mode** without configuring `.env`. To connect to a live Firebase project or use server-side Gemini AI evaluations, update your `.env` file:

```env
# ==========================================
# Firebase Web Configuration (Client-side)
# Get from Firebase Console > Project Settings > General > Your Apps (Web)
# ==========================================
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef

# ==========================================
# Google Gemini AI Integration (Server-side)
# Get from Google AI Studio: https://aistudio.google.com
# ==========================================
GEMINI_API_KEY=your-gemini-api-key

# Server Port (Optional, defaults to 3000)
PORT=3000
```

---

## 7. Development & Running

### Running the Frontend (Vite Dev Server)

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running the Full-Stack Node Server (with SQLite & Gemini)

```bash
npm run server
# or
npm start
```
Starts the full-stack server on [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
```
Creates an optimized production bundle in `dist/`.

### Previewing the Production Build Locally

```bash
npm run preview
```

---

## 8. Firebase Configuration Instructions

To set up your own Firebase backend:

1. **Create Project**: Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Enable Authentication**:
   - Navigate to **Build > Authentication > Sign-in method**.
   - Enable **Email/Password** provider.
   - Enable **Google** provider.
3. **Set Up Cloud Firestore**:
   - Navigate to **Build > Firestore Database** and create a database in production mode.
   - Deploy security rules:
     ```bash
     firebase deploy --only firestore:rules
     ```
     The security rules defined in [firestore.rules](firestore.rules) restrict write operations to verified users and owners.
4. **Set Up Firebase Storage**:
   - Navigate to **Build > Storage** and initialize default bucket.
   - Deploy storage rules:
     ```bash
     firebase deploy --only storage
     ```
     Rules in [storage.rules](storage.rules) enforce strict 25 MB file size limits and valid media MIME types.
5. **Register Web App**:
   - Go to **Project Settings > General > Your apps**.
   - Click the Web icon (`</>`) to add a Web App.
   - Copy the configuration object values into your `.env` file as `VITE_FIREBASE_*`.

---

## 9. Security & Data Protection

- **No Hardcoded Secrets**: Secrets and credentials are strictly excluded from git tracking via `.gitignore`.
- **Row-Level Security (RLS)**: Both Firestore rules (`firestore.rules`) and Supabase PostgreSQL migration (`supabase/migrations/20261102_init_cultureloop.sql`) enforce user isolation.
- **Media Validation**: File upload endpoints enforce 25 MB maximum payload sizes, MIME type whitelisting (images, audio, video, documents), and input sanitization.
- **Privacy Controls**: Submissions and portfolio items carry explicit visibility scopes (`campus`, `public`, `private`). Private works are never exposed in public feeds.

---

## 10. Deployment

The project is configured for continuous deployment on **Vercel**:

- **Repository**: `https://github.com/manjunath-cod/SVM.git`
- **Live URL**: `https://svm-gray.vercel.app`
- **Vercel Settings**:
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Rewrites: Managed via [vercel.json](vercel.json) to route all non-API paths to `/index.html`.

---

## 11. Known Limitations & Notes

1. **Firebase Web API Key**: In `.env`, ensure the `VITE_FIREBASE_API_KEY` is the Browser Web API key generated in the Firebase Console (starts with `AIzaSy...`). If invalid, the application automatically provides seamless Campus Demo Mode so testing is never blocked.
2. **Local SQLite Persistence**: The local Node backend uses Node 24 native SQLite (`node:sqlite`). When deploying on serverless static hosting (such as Vercel), the app operates via Firebase Cloud Firestore or browser local storage.
3. **AI Evaluation Rate Limits**: Gemini API calls adhere to standard Google AI Studio free-tier quotas (15 requests per minute).

---

## 12. License

Developed for **Sangeeta Vrinda Madhyam (SVM)**, KLE Technological University. All rights reserved.
