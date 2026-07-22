# Project: qr-menu-saas Audit

## Architecture
The application is a SaaS platform for hotel QR menus.
- **Frontend**: Next.js App Router (located at repository root, `src/app/`). Communicates with the backend API.
- **Backend**: Laravel API (located at `backend/`). Uses SQLite database at `backend/database/database.sqlite`. Auth via JWT/Laravel Sanctum.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Env Assessment & Launch | Start Laravel & Next.js, verify dev environment works, run seeders | None | PLANNED |
| 2 | Backend API Audit | Actively test backend endpoints for logic/validation errors | M1 | PLANNED |
| 3 | Frontend UI/UX Audit | Actively test frontend pages and interactions for bugs | M1 | PLANNED |
| 4 | Security & Isolation | Actively test for IDOR, access control, tenant leaks | M1 | PLANNED |
| 5 | Verify & Compile Report | Validate reproduction steps and output bug_report.md | M2, M3, M4 | PLANNED |

## Code Layout
- Frontend: `src/`
- Backend: `backend/app/`
- Backend Database: `backend/database/`
- Backend Routes: `backend/routes/`
