# VeriBrand AI — Evidence-First Brand Governance Platform

> **We Code Coders Hackathon — Round 2: The Build**  
> **Team Leader:** Shusovan Dutta (`shusovandutta153@gmail.com`)  
> **Team Members:** Shusovan Dutta, Debojit Pore, Swastik Baur, Soumodip Mondal  
> **Problem Provider:** Inkloom AI | **Deadline:** 28 October 2026, 10:00 AM IST  

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20In--Memory-green.svg)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/Tests-5%20Passed%20(100%25)-brightgreen.svg)]()

---

## 1. Executive Summary & Purpose

**VeriBrand AI** is an enterprise-grade pre-publication brand governance platform designed to ensure that marketing copy, promotional claims, and campaign graphics strictly adhere to verified product specifications and legal brand standards before publication.

Unlike generic AI grammar checkers or text generators, VeriBrand AI implements an **evidence-first verification pipeline**:
1. Marketing claims are evaluated against **versioned, immutable approved source specifications** (e.g. `SRC-FACT-001 v1.0`).
2. The hybrid verification engine runs **deterministic numerical & terminology checks** combined with optional server-side validated AI analysis.
3. Claims are categorized into clear, legally defensible statuses:
   - **`Contradicted by approved evidence`**: Explicit contradiction against an approved source (e.g. claiming 24 hours when the specification states up to 12 hours).
   - **`Guideline violation`**: Direct breach of prohibited terminology rules.
   - **`Insufficient approved evidence`**: Unbacked superlatives or absolute guarantees lacking documentation. *(Retrieval misses never prove a claim false; they produce an inconclusive/insufficient evidence finding).*
4. Strict **separation of duties** is enforced: Creators are blocked from approving their own work.
5. Approvals require recorded source snapshots; unresolved critical findings require mandatory reviewer override justification.

---

## 2. System Architecture & Workflow

```
       [Administrator]                  [Content Creator]               [Compliance Reviewer]
              │                                 │                                 │
     Configures Guidelines             Submits Draft Text or                    Inspects
     & Approved Facts                  Uploads PDF (PyMuPDF)                   Findings &
     (SRC-FACT-001 v1.0)                        │                               Citations
              │                                 ▼                                 │
              │                      [Confirmed Draft Text]                       │
              │                                 │                                 │
              └───────────────┬─────────────────┘                                 │
                              ▼                                                   │
                ┌───────────────────────────┐                                     │
                │ Hybrid Verification Engine│                                     │
                ├───────────────────────────┤                                     │
                │ 1. Prohibited Terms Scan  │                                     │
                │ 2. Numerical Fact Bounds  │                                     │
                │ 3. Guarantee Detection    │                                     │
                │ 4. Optional LLM Tone Scan │                                     │
                │ 5. Server-Side Citations  │                                     │
                └─────────────┬─────────────┘                                     │
                              ▼                                                   │
                     [Structured Findings]                                        │
                              │                                                   │
                              ├───────────────────────────────────────────────────┘
                              ▼
                   [Reviewer Decision Gate]
                   - Block Self-Approval
                   - Require Override Reason if Critical Findings Unresolved
                   - Store Immutable Snapshot of Sources (v1.0)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            [Changes Requested]     [Approved]
             (Creator Revises)   "READY TO PUBLISH"
```

---

## 3. Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11 / 3.14 compatible)
- **Validation:** Pydantic v2 & Pydantic-Settings
- **Security:** JWT authentication (`pyjwt`), password hashing (`bcrypt`), workspace tenant isolation
- **PDF Extraction:** PyMuPDF (`fitz`) with bounds checking (10 MB, 20 pages max) and `pypdf` fallback
- **Database:** MongoDB (`pymongo`) with automatic resilient in-memory fallback (`mongomock`) for offline execution
- **Image Processing:** `Pillow` for color sampling, Euclidean distance, and WCAG 2.2 contrast calculations
- **Testing:** `pytest`, `pytest-asyncio`, `starlette.testclient`

### Frontend
- **Framework:** React 19 with Vite 8
- **Styling:** Tailwind CSS v4 with dark navy enterprise surface design system
- **Routing:** React Router v7
- **Icons:** Lucide React
- **HTTP Client:** Axios with JWT request & response interceptors

---

## 4. Local Installation & Windows Setup

### Prerequisites
- Python 3.11+ installed
- Node.js v18+ and npm installed

### Step 1: Clone / Navigate to Workspace
```powershell
cd "c:\Users\Shusovan Dutta\OneDrive\Desktop\varibrang ai"
```

### Step 2: Backend Setup
```powershell
# 1. Activate or create Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Install backend dependencies
pip install -r backend\requirements.txt

# 3. Seed demonstration data (Users, Guidelines, Section 7 Headphones Fact)
python .\backend\seed_data.py

# 4. Start the FastAPI backend server
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at: `http://127.0.0.1:8000`  
API Swagger Documentation: `http://127.0.0.1:8000/docs`  
Health check: `http://127.0.0.1:8000/health`

### Step 3: Frontend Setup (in a separate terminal)
```powershell
cd "c:\Users\Shusovan Dutta\OneDrive\Desktop\varibrang ai\frontend"

# 1. Install frontend packages
npm install

# 2. Start Vite dev server
npm run dev
```
The frontend is now accessible at: `http://127.0.0.1:5173`

---

## 5. Automated Tests Execution

To execute the automated test suite verifying auth, the Section 7 demonstration, rule engine logic, self-approval prevention, and cross-workspace isolation:

```powershell
.\venv\Scripts\python.exe -m pytest -v .\backend\tests
```

**Test Suite Results:**
```
backend/tests/test_auth.py::test_register_and_login PASSED               [ 20%]
backend/tests/test_rule_engine.py::test_section_7_master_demonstration PASSED [ 40%]
backend/tests/test_rule_engine.py::test_compliant_draft PASSED           [ 60%]
backend/tests/test_rule_engine.py::test_prohibited_terms_and_replacement PASSED [ 80%]
backend/tests/test_workflow.py::test_end_to_end_workflow PASSED          [100%]

======================== 5 passed in 3.32s ========================
```

---

## 6. Pre-Seeded Demo Accounts for Hackathon Judges

VeriBrand AI includes **1-click persona switching** on the Landing Page and Navbar:

| Role | Name | Email | Password | Responsibilities |
|---|---|---|---|---|
| **Brand Admin** | Sarah Connor | `admin@veribrand.ai` | `AdminPass123!` | Manages brand rules, verified product specifications, bumps versions |
| **Content Creator** | Alex Rivera | `creator@veribrand.ai` | `CreatorPass123!` | Submits copy & PDFs, inspects findings, submits revised revisions |
| **Reviewer** | Marcus Vance | `reviewer@veribrand.ai` | `ReviewerPass123!` | Audits evidence citations, resolves findings, requests changes, approves |

---

## 7. Master Demonstration Walkthrough (Section 7)

### Approved Specification
- **Product:** Example Wireless Headphones
- **Approved Fact:** `"Battery life: up to 12 hours under standard testing conditions."` (Source ID: `SRC-FACT-001`, Version: `v1.0`)

### Submitted Marketing Copy
`"Our headphones deliver guaranteed 24-hour battery life."`

### Verification Results Produced by the Engine:
1. **Finding 1: Factual Contradiction**
   - **Severity:** `Critical`
   - **Status:** `Contradicted by approved evidence`
   - **Grounded Citation:** `SRC-FACT-001` (`v1.0`)
   - **Explanation:** Draft claims 24 hours, whereas approved specification `SRC-FACT-001` states "Battery life: up to 12 hours under standard testing conditions."
   - **Intent-Preserving Suggestion:** `"Enjoy up to 12 hours of battery life"`
2. **Finding 2: Potential Unsupported Guarantee**
   - **Severity:** `High`
   - **Status:** `Insufficient approved evidence`
   - **Explanation:** The claim 'guaranteed' lacks supporting evidence or legal warranty documentation in approved sources. Under FTC advertising substantiation guidelines, objective guarantees must be substantiated.
   - **Suggested Revision:** Remove absolute guarantee or replace with descriptive performance wording (e.g., 'reliable', 'designed for').

### Revision & Approval Flow:
- The creator edits the text to: `"Our Example Wireless Headphones feature Active Noise Cancellation (ANC) with up to 12 hours of battery life."` and submits **Revision #2**.
- The engine re-runs verification: **0 critical findings**.
- Reviewer Marcus Vance approves Revision #2.
- The draft is marked **"READY TO PUBLISH"**.

---

## 8. Three Round 3 Named Improvements (MVP Demonstration)

### Improvement 1: Source-Change Alerts
- **Behavior:** When an administrator updates a brand rule or approved specification (e.g. from `v1.0` to `v1.1`), the platform queries all historical drafts that cited `v1.0`.
- **Integrity:** The historical approval decision is retained for legal auditing, but a **Re-Review Alert** is triggered on the dashboard and draft page notifying the team to re-evaluate the draft.

### Improvement 2: Limited Image Review
- **Behavior:** Accepts campaign graphics (PNG/JPEG/WebP) and allows sampling or entering a brand color hex code.
- **Verification:** Computes normalized Euclidean color distance (Delta-E) against the approved brand palette (`#0F172A`, `#4F46E5`, `#06B6D4`, `#FFFFFF`).
- **Accessibility:** Automatically calculates WCAG 2.2 Level AA relative luminance contrast ratios against white and dark surfaces.
- **Human Guidance:** Displays manual review prompts for logo container margins and distortion.

### Improvement 3: Revision Analytics & Diff Comparison
- **Behavior:** Accessible under the `/insights` route.
- **Diff Comparison:** Computes side-by-side line diffs between Revision 1 and Revision 2.
- **Issue Tracking:** Identifies issues successfully resolved vs newly introduced violations.
- **Workspace Trends:** Tracks top violated rules and recurring mistakes across all team submissions.

---

## 9. Differences from the Original Round 1 Plan

1. **In-Memory Resilient DB Fallback:** In addition to MongoDB Atlas/local MongoDB, an automated resilient in-memory MongoDB engine was integrated so evaluators can run the entire system with zero external database setup.
2. **Interactive 1-Click Role Switcher:** Added directly into the Navbar and Landing Page to allow hackathon judges to switch between Admin, Creator, and Reviewer seamlessly.
3. **Live Character Limit & Bounds Warnings:** Real-time feedback for the 10,000 extracted character boundary and 10 MB / 20 page PDF limit.
4. **Interactive Suggested Revision Application:** Creators can click "Apply" on any verification suggestion to automatically insert the intent-preserving text directly into the revision editor.

---

## 10. Deployment Configuration

- **Backend (Render):** `render.yaml` provided in repository root for 1-click Render web service deployment.
- **Frontend (Vercel):** `frontend/vercel.json` provided with client-side SPA rewrite rules.
- **Containerization:** `docker-compose.yml` and `Dockerfile.backend` configured for Docker deployment with MongoDB.

---

## 11. Final Acceptance Verification

- [x] Backend starts and responds cleanly to `/health`.
- [x] Persistent MongoDB models and indexes active.
- [x] User registration, JWT login, and role enforcement operational.
- [x] Admin can create and version brand rules and product specifications.
- [x] Creator can submit drafts and extract text from PDFs.
- [x] Deterministic verification engine identifies contradictions and unsupported guarantees.
- [x] Grounded citations reference actual approved source IDs (`SRC-FACT-001`).
- [x] Creator can submit revised drafts (Revision #1 -> Revision #2).
- [x] Reviewer can approve or request changes (self-approval blocked).
- [x] Approved content marked "Ready to Publish".
- [x] Dashboard statistics calculated dynamically from real database records.
- [x] Automated test suite passes with 100% success rate.
