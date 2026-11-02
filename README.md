# SVM CultureLoop — AI Talent Discovery & Creative Ecosystem

> **Discover Your Talent. Find Your People. Create Together.**  
> A creative arts and cultural platform for students and faculty at **SVM Institute of Technology**.

---

## Overview

SVM CultureLoop provides students across every major an accessible, welcoming entry point into creative exploration. The platform bridges creative expression, peer collaboration, campus cultural events, and individualized **Google Gemini AI mentorship**.

### Core Capabilities

1. **AI Talent Discovery & Showcase (`#showcase-app`)**:
   - Supports **15 distinct creative categories**: Singing & Vocals, Music Production, Instrumental Music, Dance & Movement, Photography, Videography & Film, Painting & Fine Arts, Graphic Design, Creative Writing, Poetry & Spoken Word, Anchoring & Emceeing, Acting & Monologues, Theatre & Stagecraft, Event Management, and Cross-Disciplinary Arts.
   - Multimodal file uploads (Images, Audio, Video, PDF, Text/Markdown) up to 25 MB with instant validation.
   - Genuine, server-side **Google Gemini AI evaluation** (via Gemini 2.5/1.5 Flash models):
     - Multimodal media analysis directly assessing audio, visual, and textual artifacts.
     - Category-specific rubric criteria and individualized observations.
     - Concrete strengths and constructive growth areas.
     - Practical exercises with recommended frequency and target outcomes.
     - Targeted SVM campus activity and club recommendations (e.g. *SVM Unplugged*, *Frames of Campus*, *SVM Theatre Guild*).
     - Confidence ratings and meaningful scores (1.0 to 10.0) only when supported by evidence.
     - Clear disclaimers on automated evaluation boundaries (evaluates the submitted artifact, not personal artistic worth).
     - SHA-256 duplicate submission detection.
     - Visibility controls: *Campus Showcase*, *Public Portfolio*, or *Private*.

2. **Creative Passport (`#passport`)**:
   - Dynamic record of a student's creative journey.
   - Multi-discipline interest mapping with per-category skill level (Beginner, Intermediate, Advanced) and confidence rating (Just exploring, Building confidence, Ready to collaborate, Stage-ready).
   - Participation preferences (Solo, Ensemble, Behind-the-scenes/tech, Mentorship).
   - Semester creative goals and availability tracking.
   - Uploaded portfolio links and AI evaluation growth history.
   - Real-time passport completeness percentage gauge.

3. **Cultural Opportunities Hub (`#discover-app`)**:
   - Real database-backed directory of workshops, auditions, open jams, creative challenges, and exhibitions.
   - Multi-criteria filtering by category, format, and experience level.
   - One-click registration and interest tracking with live capacity counts.

4. **Interdisciplinary Collaboration Hub (`#collaborate`)**:
   - Connects students with complementary skills (e.g. filmmakers seeking audio composers, poets seeking graphic designers).
   - Post project callouts and send direct collaboration requests.

5. **Campus Cultural Calendar (`#events-app`)**:
   - Schedule of SVM performances, festivals, and exhibitions.
   - One-click RSVP tracking with attendee counts.

6. **Student Portfolio (`#portfolio`)**:
   - Considered home for a student's uploaded works and AI evaluation badges.
   - Embedded multimodal media players for audio, video, images, and documents.

7. **Profile & Settings (`#profile`)**:
   - Student academic details and system diagnostic monitor.

---

## Technology Stack

- **Frontend:** React 19, React DOM 19, Vite 6
- **Backend / API:** Node.js Connect middleware (`vite.config.js`) + standalone Node HTTP server (`server.js`)
- **Database & Persistence:** Native Node 24 SQLite (`node:sqlite`) with WAL journaling — zero external dependencies
- **Cloud Migration Ready:** Supabase / PostgreSQL migration schema in `supabase/migrations/`
- **AI Engine:** Google Gemini API (`gemini-2.5-flash`, `gemini-1.5-flash`) with server-side multimodal inline payloads
- **Styling:** Custom Swiss Minimalist CSS with semantic design tokens, Google Fonts (`Manrope`, `DM Mono`), and Georgia editorial typography
- **Accessibility:** Reduced motion support (`prefers-reduced-motion`), visible focus rings, high contrast ratios

---

## Project Structure

```text
SVM/
├── .data/                                    # Local SQLite database directory (cultureloop.db)
├── uploads/                                  # Local storage for student creative media
├── server/
│   ├── env.js                                # Environment variable loader
│   ├── db.js                                 # Database initialization, schema & seed data
│   ├── seedData.js                           # Initial opportunities, events & collaborations
│   ├── gemini.js                             # Gemini multimodal AI service & category rubrics
│   └── api.js                                # REST API route handlers
├── supabase/
│   └── migrations/
│       └── 20261102_init_cultureloop.sql     # PostgreSQL / Supabase migration script
├── src/
│   ├── components/
│   │   ├── Icons.jsx                         # Line SVG icons
│   │   ├── Navigation.jsx                    # AppShell, Header, Sidebar
│   │   ├── MediaViewer.jsx                   # Multimodal media previewers
│   │   ├── Modal.jsx                         # Accessible modal dialogs
│   │   └── Toast.jsx                         # Notification toast feedback
│   ├── pages/
│   │   ├── LandingPage.jsx                   # Public marketing & discover experience
│   │   ├── SignIn.jsx                        # Student sign-in & demo personas
│   │   ├── Dashboard.jsx                     # Student dashboard with live metrics
│   │   ├── Showcase.jsx                      # AI Talent Discovery & Showcase flagship
│   │   ├── Passport.jsx                      # Full Creative Passport manager
│   │   ├── Discover.jsx                      # Opportunities hub with filters & registration
│   │   ├── Collaborate.jsx                   # Interdisciplinary collaboration matchmaker
│   │   ├── Events.jsx                        # Campus cultural events calendar & RSVPs
│   │   ├── Portfolio.jsx                     # Student creative portfolio & work viewer
│   │   └── Profile.jsx                       # Academic details & system diagnostics
│   ├── services/
│   │   └── api.js                            # Frontend API client
│   ├── main.jsx                              # Application entry & hash router
│   └── styles.css                            # Complete design system & responsive styling
├── .env.example                              # Environment configuration template
├── server.js                                 # Standalone production server
├── vite.config.js                            # Vite bundler & API middleware plugin
├── package.json
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- **Node.js:** v20+ or v24+
- **npm:** v10+

### 2. Installation
```powershell
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Open `.env` and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
> **Note:** If `GEMINI_API_KEY` is not provided, the application will run normally, saving all submissions, passports, registrations, and collaborations into the SQLite database. The AI evaluation system will transparently report that credentials are queued rather than generating fake or simulated feedback.

### 4. Running Development Server
```powershell
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Running Production Build & Standalone Server
```powershell
npm run build
npm start
```
Open `http://localhost:3000` in your browser.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check (DB, Gemini key status, timestamp) |
| `GET` | `/api/auth/session` | Get active student session and profile |
| `POST` | `/api/auth/session` | Sign in or create student profile |
| `GET` | `/api/profile` | Retrieve student profile details |
| `PUT` | `/api/profile` | Update student profile information |
| `GET` | `/api/passport` | Retrieve Creative Passport, completeness %, and evaluation history |
| `PUT` | `/api/passport` | Save updated disciplines, skills, confidence, goals, and availability |
| `POST` | `/api/showcase/upload` | Upload media, record submission, and trigger Gemini AI evaluation |
| `GET` | `/api/showcase/submissions` | Query campus submissions (with optional category filter) |
| `GET` | `/api/showcase/submission/:id`| Retrieve single submission with full evaluation scorecard |
| `POST` | `/api/showcase/evaluate/:id` | Re-run or trigger AI evaluation on existing submission |
| `GET` | `/api/opportunities` | Search and filter campus creative opportunities |
| `POST` | `/api/opportunities/:id/register` | Toggle registration for a campus opportunity |
| `GET` | `/api/events` | List all campus cultural events with RSVP counts |
| `POST` | `/api/events/:id/rsvp` | Toggle RSVP for a campus event |
| `GET` | `/api/collaborations` | List open collaboration requests across disciplines |
| `POST` | `/api/collaborations` | Create a new project collaboration callout |
| `POST` | `/api/collaborations/:id/request` | Send collaboration message to project author |
| `GET` | `/api/media/:filename` | Serve uploaded media files with caching headers |

---

## License

SVM CultureLoop is an internal open project for the SVM Institute of Technology community.

