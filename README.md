# Titan Portal

A complete multi-role institute management system — **Student**, **Teacher**, **Sub Admin**, and
**Super Admin** portals — backed by a real Node.js/Express API and MongoDB database.

---

## 1. Project Structure

```
titan-portal/
├── frontend/                   # The React app — its own folder, its own npm project
│   ├── src/
│   │   ├── api/client.js       # Talks to the backend API
│   │   ├── context/            # Auth state (who's logged in), shared app-wide
│   │   └── components/
│   │       └── frontend/       # Admin/, Student/, Teacher/, Media/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── backend/                    # Express + MongoDB API — its own folder, its own npm project
    ├── config/db.js            # MongoDB connection
    ├── models/                 # 17 Mongoose schemas
    ├── controllers/            # Business logic for every route
    ├── routes/                 # Express routers
    ├── middleware/              # JWT auth guard, file upload, error handling
    ├── utils/                   # Sequential ID generator, uniqueness checker, OTP service
    ├── seed.js                  # Auto-creates the Super Admin account on first boot
    ├── server.js                 # Entry point
    └── .env                      # Your MongoDB URI, JWT secret, etc. (already filled in)
```

Two top-level folders, `frontend/` and `backend/` — run each with its own `npm install` + `npm run dev`
in its own terminal.

---

## 2. Setup & Running It

### Step 1 — MongoDB Atlas: allow this computer to connect

`backend/.env` already has your real connection string. Open
[MongoDB Atlas](https://cloud.mongodb.com) → your cluster → **Network Access** → **Add IP Address**,
and either add your current IP or choose **Allow Access from Anywhere** (`0.0.0.0/0`) for
development.

**If you see `querySrv ECONNREFUSED ...mongodb.net` in the terminal:** that's a DNS problem, not an
Atlas problem — your network isn't resolving the special DNS record Atlas uses, which is common on
some ISPs/routers/VPNs. The backend now automatically tries Google/Cloudflare DNS to work around
this. If it still happens: try a mobile hotspot to confirm it's DNS-related, or change your
computer's DNS to `8.8.8.8` / `1.1.1.1` in your network settings, or in Atlas → Connect → Drivers,
copy the standard (non `+srv`) connection string and use that as `MONGO_URI` instead.

### Step 2 — Install & run the backend

```bash
cd backend
npm install
npm run dev
```
You should see `🚀 Titan Portal API running on http://localhost:5000`. First boot also creates
your Super Admin account automatically.

### Step 3 — Install & run the frontend (second terminal)

```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints (usually `http://localhost:5173`).

### Step 4 — Log in

| Role | Login |
|------|-------|
| Super Admin | `ahmedraza123@gmail.com` / `ahmed$123` |
| Sub Admin | Created by Super Admin → Campuses or Sub Admins page |
| Teacher | Created by Sub Admin/Super Admin → Trainers page |
| Student | Pre-registered by a Sub Admin (Students → Add New), then creates their own login with CNIC + Date of Birth from the main page |

A sensible first run: Super Admin → add a Campus (+ its Sub Admin) → add a Course with a syllabus →
that Sub Admin → add a Trainer → add a Slot → add a Student into that slot → log in as the Student
and Teacher to see the rest come alive.

---

## 3. Everything That's Dynamic

**Auth** — login for all 4 roles, student self-registration (CNIC + DOB gated), Forgot Password
with real OTP, change password, real logout.

**Super Admin** — Dashboard, Campuses, Sub Admins (add/edit/suspend/**delete-with-replacement**),
Courses & Syllabus, Profile.

**Sub Admin** — Dashboard, Trainers (**delete-with-replacement**), Students (search/filter/export/
enrollment/status/PDF/vouchers), Administration & Slots, Student Attendance (Mark/View/Multi),
Trainer Attendance (check-in/out/View/Correction Requests), Feedback inbox, Updation, Profile.

**Teacher** — Dashboard, per-course: Students, Attendance, Assignments (create/approve/disapprove),
Quizzes (full MCQ builder/results/reset attempts), Course Progress (click-to-tick + comparison),
Calendar, My Attendance, Profile (+ animated ID-card PDF download).

**Student** — Feedback, Dashboard, Progress, Attendance (3-tier color coding), Payment (real
JazzCash video + vouchers), Assignments (submit/edit until due), Quiz (full timer-based
quiz-taking, server-side scoring), Profile.

Roll numbers (6-digit) and Employee IDs (5-digit) are sequential and atomic. Email/phone/CNIC
uniqueness is enforced across all 4 account types. Suspending an account or deleting a batch blocks
login immediately.

---

## 4. Latest Round of Fixes (from your feedback)

- **Reverted the login page** back to the original simple centered-card layout — the split-screen
  redesign from before is gone. Background is now a soft light gray (close to `#c9c9c9`) instead of
  stark white, everywhere else unchanged.
- **Restored your actual logo** (the TAJ Institute crest) exactly as you provided it — my earlier
  replacement is gone. Only change: cut a transparent background around it so it sits cleanly on
  any page background instead of showing a white box.
- **Folder structure**: `frontend/` and `backend/` are now two plain sibling folders at the top
  level, exactly as asked — nothing frontend-related sits loose at the root anymore.
- **MongoDB DNS fix**: added automatic DNS fallback (Google/Cloudflare) for the
  `querySrv ECONNREFUSED` error, plus a much clearer in-terminal explanation of what that specific
  error means and how to fix it if it persists (see Step 1 above).
- **Cursors fixed app-wide**: every clickable element (buttons, nav items, cards, toggles) now
  shows the pointer/hand cursor; every text input, search box, and textarea correctly shows the
  normal text cursor instead. Disabled buttons show a "not-allowed" cursor rather than a
  misleading pointer.

## 5. Things Worth Knowing

**WhatsApp OTP** needs a WhatsApp Business API account (Twilio, Meta Cloud API) with your own
billing — I can't create that for you. The OTP flow (generate/store/expire/verify) fully works;
only real WhatsApp delivery is stubbed to show you the code directly in the popup so you can test
right now. See `backend/utils/otpService.js` for where to plug in real sending later.

**Your MongoDB password** is `root`, which is very guessable — worth rotating in Atlas (Database
Access → Edit) if this project is ever shared or pushed publicly.

**npm audit** will show ~10 warnings from `exceljs`'s zip-handling dependencies — true even on
exceljs's latest version, only exploitable via attacker-controlled glob patterns which this app
never passes in. Not force-downgrading since the suggested fix is a major regression.

**Payment collection** itself is intentionally not wired up yet, as discussed — vouchers are
generated and tracked, students pay outside the system for now.
