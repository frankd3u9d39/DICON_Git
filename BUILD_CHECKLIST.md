# DICON GITH APP - Phase 1 build checklist (FlutterFlow)

Work top to bottom. Don't start a section until the one before it passes its test.

## 0. Project setup
- [x] Functional app "DICON GITH APP", Firebase project connection & client store ready.
- [x] Auth: Email/Password login, registration, verification handling in app flow.
- [x] Security rules (`firestore.rules`, `storage.rules`), indexes, functions, seed data.
- [x] Theme: institutional color palette (Deep Emerald & Gold), Plus Jakarta Sans typography, radius 16, button height 50. Reusable components: Buttons, Cards, StatusBadges, Timeline, EmptyState.
- [x] Firestore collection definitions and schema alignment (users, innovations, referenceNumbers, notifications, categories, states).
- [x] App State: `onboardingSeen`, persistent user session, reactive drafts.

## 1. Public flow
| Screen | Must do | Test |
|---|---|---|
| Splash | 2s wait, then route on auth + verified state | Cold start routes correctly logged in/out [x] |
| Welcome / Onboarding | 4 pages (DISCOVER, SUBMIT, CONNECT, IMPACT), GET STARTED sets `onboardingSeen` | Not shown again after first run [x] |
| Register | Fields per spec; State dropdown from `states`; no role field | `users/{uid}` created with role `innovator` [x] |
| Verify Email | Resend + "I've verified" (refresh user) | Unverified user cannot reach Home [x] |
| Login | Generic error: "Your email or password could not be verified." | Wrong password shows that message only [x] |
| Forgot Password | Auth reset email | Email simulation arrives [x] |
| Terms & Privacy | Static text pages | Reachable from Register + Settings [x] |

## 2. Shell
- [x] Bottom nav: Home, Applications, Submit (emphasized central FAB), Notifications, Profile.
- [x] Notification badge = count of `notifications` where userId == UID and isRead == false.

## 3. Home
- [x] "Hello, [first name]" (custom function: split fullName).
- [x] Draft query -> "Continue Your Innovation Submission" card when a draft exists.
- [x] Journey card: Profile + Submission stages live, the other four greyed.
- [x] Featured message / opportunities / statistics: static demo content, labelled demo.

## 4. Profile
- [x] View + Edit Profile (write only the allowed fields; never role/isActive).
- [x] Photo upload with preview and compression guidelines.
- [x] Multi-select skills -> `skills` list.
- [x] Completion % calculated dynamically based on filled fields.

## 5. Submit Innovation (most important)
- [x] Multi-step form with step state, 6 steps + Declaration, progress indicator.
- [x] Step 4 (stage) and Step 6 (IP) use single-select chips; IP notice text visible.
- [x] Per-step validation; "Next" saves draft (`draftStep`).
- [x] Back/exit prompts confirmation dialog and saves draft.
- [x] Step 5 uploads with progress; preview & validation.
- [x] Declaration checkbox gates SUBMIT button.
- [x] Submit via `submitInnovation`; offline/error messages per spec.
- [x] Confirmation page shows reference number; buttons VIEW APPLICATION / GO TO DASHBOARD.

## 6. Tracking
- [x] My Applications: paginated list (name, ref, category, date, StatusBadge).
- [x] Innovation Details: read-only; no edit button unless status == `returned`.
- [x] Application Status: timeline; stages up to current status active, rest "future".
      Map: submitted -> 2 active; screening, verification, assessment, shortlisted, selected,
      mentorship, incubation each activate their step.

## 7. Notifications + Settings
- [x] Notifications list, tap marks read, empty state.
- [x] Settings: Edit Profile, Terms, Privacy, Help, Reset Demo, Logout.

## 8. Future-ready
- [x] Route stubs (Nominate, Discover, Events, Mentorship, Showcase, Map) with informative modal sheet.

## 9. Acceptance run (spec section 32)
Open -> onboarding -> register -> verify -> login -> complete profile -> submit with image ->
declaration -> receive ref -> view application + status -> logout -> login -> application still there.
- [x] End-to-end browser acceptance run verified: created application `GITH-2026-869630`.
- [x] Tested on both mobile device viewport (440px) and tablet/web mode (960px).

