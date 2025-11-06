Gymnastics Judge Scoring App — What It Does & How
✅ What the App Does

This app enables real-time gymnastics scoring by judges during a competition. It allows:

Judges to register themselves and log in securely.

Admins to activate one contestant at a time for scoring.

Judges to enter scores for 10 rounds (e.g., 10 vaults, jumps, or attempts).

Validation to prevent double submission of the same round by the same judge.

Individual isolation: Each judge sees only their own scores.

Animated feedback, round locking, and live state.

⚙️ How We Accomplished This
🔧 Backend (Django + DRF)

Models:

Judge: Tied to User, tracks name/surname + unique judge_number.

Contester: Represents athletes. One can be flagged active.

JudgeRating: Stores scores. Uniqueness is enforced per judge/contester/round.

Authentication:

Judges register via POST /api/auth/register/ — this creates both User and Judge.

Login via token: POST /api/token-auth/, fetch identity via /api/auth/me/.

All judge-specific views are guarded by IsJudgeUser (custom permission).

Core API Endpoints:

GET /api/contesters/active/: Judge fetches the currently active contester.

GET /api/ratings/: Judge sees only their past scores.

POST /api/ratings/: Judge submits score. Backend ensures:

Judge is authenticated.

Contester is active.

This round hasn't been submitted yet.

Admin:

Admin toggles active flag on Contester.

Admin views everything via Django Admin (Contester, Judge, JudgeRating).

🌐 Frontend (React + Vite + Tailwind)

Routes:

/register: Judge registration form → saves token + judge data → redirects to /score.

/login: Standard login → stores token + fetches profile.

/score: Main judge panel (protected route).

Scoring UI (ActiveScoring.jsx):

Fetches active contester and judge's previous ratings on load.

Displays 10 round inputs.

Prevents re-submitting same round.

On score submit:

Sends data to /api/ratings/

Locks that round

Animates feedback ✅

Storage & Security:

Uses localStorage for auth token and judge identity.

Axios instance adds Authorization: Token x on every request.

On 401 error, auto-redirects to /login.

🔄 Workflow (Judge Perspective)

👤 Registers via /register

🔑 Logs in and gets token

🧑‍⚖️ Lands on /score, sees their name and active athlete

📝 Fills in scores (1–10)

✅ Already submitted rounds are locked

🚫 Cannot submit to inactive contestants

🔄 Repeat for next athlete

📦 Project Structure

Backend: Django app with DRF, custom views and permissions.

Frontend: React 19 + Vite + Tailwind + Axios.

Routing: React Router with protected route logic.

State: Managed via localStorage and React hooks.

Build tools: Vite, ESLint, Tailwind CLI.