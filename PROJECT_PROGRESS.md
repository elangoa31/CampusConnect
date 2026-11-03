# CampusConnect - Project Progress

## Current Milestone: Role-Based Authentication & Portal Discovery (COMPLETED)

### Overview
CampusConnect is a College Staff Availability and Discovery System designed to connect students with faculty members in real time.

The system enforces strict two-role separation:
1. **Student**
2. **Staff (Faculty)**
*(Admin role is excluded by design).*

---

### Implementation Progress & Deliverables

#### 1. Initial Role Selection Screen (`/`)
- [x] Initial entry route at `/`.
- [x] Slogan: `"Welcome to CampusConnect"` and `"Choose how you want to access your campus."`.
- [x] **Student Selection Card**:
  - Title: `"I'm a Student"`
  - Description: `"Find faculty members, check their availability and discover where to reach them."`
  - Icon: Graduation Cap
  - Action: `"Continue as Student"` -> navigates to `/login?role=student`
- [x] **Faculty Selection Card**:
  - Title: `"I'm Faculty"`
  - Description: `"Manage your availability, update your location and keep students informed."`
  - Icon: Briefcase
  - Action: `"Continue as Staff"` -> navigates to `/login?role=staff`
- [x] Premium styling matching the aerial dark ocean visual identity, Framer Motion hover and entrance animations, responsive desktop and mobile layouts.

#### 2. Role-Based Authentication Flow & Database Verification
- [x] Portal retention: Portal role (`student` or `staff`) preserved via query parameter `?role=...` and session storage.
- [x] Portal badge in login: Displays whether user is accessing the **Student Portal** or **Faculty Portal** with a one-click `"Change role"` option.
- [x] **Database Role Verification**:
  - Authenticated user's actual role is queried from the Supabase `profiles` table.
  - If a student tries to sign in through the Faculty portal, or faculty tries to sign in through the Student portal, login is rejected with a clear role mismatch error.
  - The browser-selected role is never trusted for authorization; access control is strictly enforced using verified database records.

#### 3. Student & Staff Registration Controls
- [x] **Student Registration (`/signup?role=student`)**:
  - Full Name, College Email, Register Number, Department, Year of Study (Dropdown), Password, Confirm Password.
- [x] **Staff Registration (`/signup?role=staff`)**:
  - Full Name, College Email, Employee ID, Department, Designation (Dropdown), Faculty Verification Code, Password, Confirm Password.
  - **Staff Restriction Mechanism**: Requires a valid institutional Faculty Verification Code (`VITE_STAFF_VERIFICATION_CODE` or default `FACULTY2026`) to prevent unauthorized users from claiming staff accounts.

#### 4. Route Protection & Dashboard Placeholders
- [x] **ProtectedRoute (`src/components/auth/ProtectedRoute.tsx`)**:
  - Blocks unauthenticated access and redirects to the appropriate login portal.
  - Verifies user's database role and restricts cross-role portal access.
- [x] **Student Dashboard Placeholder (`/student/dashboard`)**:
  - Protected route exclusively for verified student accounts.
  - Renders user profile information, verified session indicator, phase notice, and Sign Out action.
- [x] **Faculty Dashboard Placeholder (`/staff/dashboard`)**:
  - Protected route exclusively for verified staff accounts.
  - Renders faculty profile attributes, verified session indicator, phase notice, and Sign Out action.

#### 5. Supabase Cloud Security & RLS
- [x] RLS policies updated in `supabase/schema.sql`:
  - `CREATE POLICY "Users can update their own profile without escalating role"` ensures clients cannot modify their assigned `role` column.
- [x] Client initialization in `src/lib/supabase.ts` handles missing credentials safely without crashing or simulating false authentication.

---

### Verification & Test Results
- **Automated Tests**: 29/29 passing (Vitest + Testing Library).
  - `src/test/validation.test.ts`: 14 tests (Email, password strength, student fields, staff verification code).
  - `src/test/auth-components.test.tsx`: 9 tests (Role selector, password toggles, login/signup forms, layout).
  - `src/test/role-flow.test.tsx`: 6 tests (Role selection screen, navigation, role mismatch rejection, route protection, dashboard placeholders).
- **TypeScript**: 0 errors (`tsc -b`).
- **Linter**: `oxlint` reports 0 warnings and 0 errors across 30 files.
- **Production Build**: `vite build` completed successfully in ~650ms.

---

### Configuration & Run Instructions

```bash
# Start development server (opens at http://localhost:5173/)
npm run dev

# Run all test suites
npm run test

# Run linter
npm run lint

# Build production bundle
npm run build
```

**Environment Variables (`.env`):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STAFF_VERIFICATION_CODE=FACULTY2026
```

---

### Scope Boundary Notice
Actual dashboard features (faculty discovery, real-time availability toggle, timetable, location broadcasting, and notifications) are intentionally omitted and reserved for Phase 2 upon user approval.
