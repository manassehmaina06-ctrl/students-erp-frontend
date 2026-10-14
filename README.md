# 🎓 Strathmore ERP + LMS

A full-stack **Student ERP + Learning Management System** built for Strathmore University. Admissions, fees, clearance, courses, assignments, quizzes, announcements, and messaging — all in one platform.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-Express-3c873a?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)

---

## ✨ Features

### 🎯 Public / Applicant
- **Landing page** — gradient hero, animated marquee of campus life, footer with contact info
- **Apply online** — public application form (no login needed)
- **Track application** — real-time status updates with an application number
- **AI Assistant** — rule-based chat widget for admissions questions

### 🎓 Student
- **Dual login chooser** — after sign-in, pick between **LMS** and **Student Portal**
- **Dashboard** — live stat cards (courses, deadlines, today's classes, announcements)
- **Courses** — enrol, view materials, syllabus per unit
- **Assignments** — view, submit (with file upload), track grades
- **Quizzes & Exams** — timed attempts, auto-graded MCQ/TF, manual short-answer grading
- **Materials** — lecture notes, slides, past papers
- **Announcements** — per-unit posts from lecturers
- **Messages** — direct messaging with lecturers of enrolled units
- **Results** — marks breakdown by unit and assessment
- **Attendance** — session-by-session view
- **Timetable** — weekly schedule across units
- **Fees** — bills, payments, receipt download
- **Registration** — unit registration with min/max credit enforcement
- **Clearance** — multi-office approval workflow + certificate download

### 👨‍🏫 Lecturer
- **Unit panel** — all assigned units with student counts
- **Assessments** — create marks components with weights (must total 100%)
- **Marks Entry** — grid-based bulk entry, auto-computes coursework/exam/final/grade
- **Assignments** — create, publish, close, delete + question attachments
- **Grading** — per-student, per-assignment score + feedback
- **Quizzes** — create quizzes with MCQ/TF/Short-answer questions, set timer & attempts
- **Quiz grading** — auto + manual grading with marks integration
- **Attendance** — session creation, mark present/absent/late/excused
- **Resources** — upload lecture notes, slides, past papers
- **Announcements** — post to unit with priority (normal/important/urgent)
- **Messages** — receive and reply to student questions

### 🏢 Staff (Admissions / Academic / Finance)
- **Admissions dashboard** — applications pipeline with status filters
- **Finance dashboard** — payment queue + validation workflow
- **Academic dashboard** — students, programmes, departments overview
- **Clearance queue** — approve/reject multi-office clearance requests
- **Fees management** — billing, payment validation, receipt generation

### 🎨 Cross-cutting
- **Dark mode** — user-toggleable, persisted to localStorage
- **AI Assistant** — rule-based chat on Landing + LMS + Staff + Portal
- **Global toast system** — 4 variants (success/error/info/warning), auto-dismiss
- **Confirm dialog** — styled replacement for `window.confirm`
- **Error boundary** — friendly crash screen with reload + home buttons
- **Password toggle** — eye icon on all password fields
- **Loading states** — spinners + skeleton placeholders
- **Empty states** — consistent design across all lists
- **404 page** — role-aware "Go to my dashboard" button
- **Pill navigation** — consistent tab styling across LMS, Portal, and Staff
- **Responsive** — mobile drawer nav, tablet layouts, horizontal-scroll tables

---

## 🏗️ Architecture

\`\`\`
students-erp-frontend/
├── backend/                       # Node.js + Express + MongoDB
│   ├── controllers/               # Business logic per domain
│   ├── models/                    # Mongoose schemas
│   ├── routes/                    # REST endpoints
│   ├── middleware/                # auth, roleCheck, multer uploads
│   ├── config/                    # multer configs, DB connection
│   ├── utils/                     # helpers (PDF gen, fileUrl, etc.)
│   └── server.js                  # Express entry point
│
└── src/                           # React + Vite
    ├── api/                       # axios instance with auth interceptor
    ├── components/                # shared UI
    │   ├── ui/                    # Button, Card, Badge, PageHeader, StatCard, PasswordInput
    │   ├── AiAssistant.jsx        # rule-based chat widget
    │   ├── ErrorBoundary.jsx      # crash recovery
    │   ├── LoadingState.jsx       # spinners + skeletons
    │   ├── ConfirmDialog.jsx      # styled confirm modal
    │   └── ...
    ├── context/
    │   ├── AuthContext.jsx        # JWT + user
    │   ├── ThemeContext.jsx       # light/dark
    │   └── ToastContext.jsx       # global toasts
    ├── data/                      # landing + LMS FAQ for AI assistant
    ├── lms/                       # LMS pages (student)
    ├── portal/                    # Student Portal pages
    ├── pages/                     # staff + auth + landing
    └── main.jsx                   # entry
\`\`\`

---

## 🛠️ Tech Stack

| Layer | Tech |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router, Tailwind CSS, Axios |
| **Backend** | Node.js, Express, MongoDB + Mongoose, JWT auth, Multer, PDFKit |
| **Fonts** | Inter (body) + Sora (headings) |
| **Theme** | Tailwind `darkMode: 'class'` with ThemeContext |
| **AI** | Rule-based keyword matcher (no external API) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### Backend Setup

\`\`\`bash
cd backend
npm install

# Create a .env file:
cat > .env << 'EOF'
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/students-erp
JWT_SECRET=your-very-long-random-secret
PUBLIC_BASE_URL=http://localhost:5000
EOF

npm run dev   # starts on http://localhost:5000
\`\`\`

### Frontend Setup

\`\`\`bash
cd ..        # project root
npm install
npm run dev  # starts on http://localhost:5173
\`\`\`

**Both servers must be running simultaneously.**

---

## 🔑 Test Credentials

| Role | Login | Password |
| :--- | :--- | :--- |
| Student | STU-2026-00002 | (ID number) |
| Lecturer | lecturer1@school.edu | lect1234 |
| Finance | (seed) | (seed) |
| Academic | (seed) | (seed) |
| Admissions | (seed) | (seed) |

---

## 📡 API Overview

### Auth
| Method | Endpoint | Access |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public (staff) |
| POST | `/api/auth/student-login` | Public (student # + ID) |
| GET | `/api/auth/me` | Any authed |
| PUT | `/api/auth/change-password` | Any authed |

### LMS (student)
| Method | Endpoint |
| :--- | :--- |
| GET | `/api/lms/me/dashboard` |
| GET | `/api/lms/me/courses` |
| GET | `/api/lms/me/assignments` |
| POST | `/api/lms/me/assignments/:id/submit` |
| GET | `/api/lms/me/quizzes` |
| POST | `/api/lms/me/quizzes/:id/start` |
| POST | `/api/lms/me/quizzes/attempts/:id/submit` |
| GET | `/api/lms/me/announcements` |
| GET | `/api/lms/me/messages` |
| POST | `/api/messages` |

### Lecturer
| Method | Endpoint |
| :--- | :--- |
| GET | `/api/lecturer/me/units` |
| POST | `/api/lecturer/units/:id/assessments` |
| POST | `/api/lecturer/units/:id/marks` |
| POST | `/api/lecturer/units/:id/assignments` |
| GET | `/api/lecturer/assignments/:id/submissions` |
| PUT | `/api/lecturer/submissions/:id` |
| POST | `/api/lecturer/units/:id/quizzes` |
| GET | `/api/lecturer/quizzes/:id/attempts` |
| PUT | `/api/lecturer/quizzes/attempts/:id/grade` |
| POST | `/api/announcements/units/:unitId` |

*(See `backend/routes/` for the full list.)*

---

## 🎨 Design System

- **Colors**: `brand` (indigo-500 → 950), `accent` (violet), semantic `emerald/amber/rose/sky`
- **Fonts**: Inter for body, Sora for headings
- **Shadows**: `shadow-card` (subtle), `shadow-hover` (lift), `shadow-glow` (focus)
- **Primitives** (in `src/components/ui/`):
  - `<Button variant="primary|secondary|ghost|danger|success|outline" size="sm|md|lg" loading />`
  - `<Card hoverable accent="brand|emerald|amber|rose|violet" />`
  - `<Badge tone="neutral|brand|success|warning|danger|info|violet" />`
  - `<PageHeader icon title subtitle actions />`
  - `<StatCard icon label value accent action />`
  - `<PasswordInput />` (with eye toggle)

---

## 📦 Deployment

### Frontend — Vercel
1. Push to GitHub (done ✅)
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import the repo
3. **Root directory:** `./
4. **Build command:** `npm run build`
5. **Output directory:** `dist`
6. **Environment variable:** `VITE_API_URL=https://your-backend.onrender.com`
7. Deploy

### Backend — Render
1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect the same repo
3. **Root directory:** `backend`
4. **Build command:** `npm install`
5. **Start command:** `node server.js`
6. **Environment variables:**
   - `PORT=5000`
   - `MONGO_URI=<your Atlas URI>`
   - `JWT_SECRET=<long random string>`
   - `PUBLIC_BASE_URL=https://your-backend.onrender.com`
7. Deploy

### MongoDB Atlas
1. Already set up? Whitelist Render's IP or use `0.0.0.0/0`
2. Rotate your database password if it was ever committed

### Post-deploy
- Update `src/api/axios.js` to use `import.meta.env.VITE_API_URL` instead of `localhost:5000`
- Test login flow end-to-end on the deployed URLs

---

## 🧪 Tested Flows

- ✅ Public application → track status → enroll
- ✅ Student login → chooser → LMS or Portal
- ✅ Lecturer creates assessment → student sees marks → auto-grade
- ✅ Lecturer creates quiz → student takes with timer → auto-grade MCQ → manual-grade short answer → marks sync
- ✅ Lecturer posts announcement → student notification
- ✅ Student messages lecturer → lecturer replies → student notification
- ✅ Finance validates payment → student sees updated balance
- ✅ Clearance request → multi-office approval → certificate download

---

## 📸 Screenshots

*(Add screenshots of key pages here for the portfolio version.)*

Suggested shots:
1. Landing page (hero + marquee + footer)
2. LMS Dashboard (StatCards)
3. Quiz taking page (with timer)
4. Lecturer Grading page
5. Dark mode variant of any page
6. AI Assistant open

---

## 🛡️ Security Notes

- JWT auth with refresh via `/auth/me`
- Role-based access control (`roleCheck` middleware)
- Passwords hashed with bcrypt
- File uploads validated (MIME type + size cap)
- **Never commit `.env`** — it's in `.gitignore`
- Rotate secrets if accidentally exposed

---

## 📝 License

MIT — feel free to fork, extend, and use for learning.

---

## 🙏 Acknowledgements

Built as a full-stack learning project covering:
- React + Vite + Tailwind CSS
- Node.js + Express + MongoDB
- JWT authentication + RBAC
- File uploads + PDF generation
- Real-time quiz timers + auto-save
- Design systems + dark mode
- Rule-based AI assistants

---

**Made with ❤️ in Nairobi**
