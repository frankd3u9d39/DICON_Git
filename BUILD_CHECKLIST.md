# DICON GITH APP - Phase 1 build checklist (FlutterFlow)

Work top to bottom. Don't start a section until the one before it passes its test.

## 0. Project setup
- [ ] FlutterFlow project "DICON GITH APP", Firebase project connected (Auth, Firestore, Storage).
- [ ] Auth: enable Email/Password. Turn on "Require email verification" handling in the app flow.
- [ ] Deploy `firestore.rules`, `storage.rules`, indexes, functions, seed (see FLUTTERFLOW_SETUP.md).
- [ ] Theme: set colors, fonts (one sans-serif), radius 16, button height 52. Create reusable
      components: PrimaryButton, AppCard, StatusBadge, EmptyState, LoadingState, ErrorState.
- [ ] Firestore collection definitions in FlutterFlow match the schema (re-pull schema after seeding).
- [ ] App State: `onboardingSeen` (persisted bool).

## 1. Public flow
| Screen | Must do | Test |
|---|---|---|
| Splash | 2s wait, then route on auth + verified state | Cold start routes correctly logged in/out |
| Welcome / Onboarding | 4 pages (DISCOVER, SUBMIT, CONNECT, IMPACT), GET STARTED sets `onboardingSeen` | Not shown again after first run |
| Register | Fields per spec; State dropdown from `states`; no role field | `users/{uid}` created with role `innovator` |
| Verify Email | Resend + "I've verified" (refresh user) | Unverified user cannot reach Home |
| Login | Generic error: "Your email or password could not be verified." | Wrong password shows that message only |
| Forgot Password | Auth reset email | Email arrives |
| Terms & Privacy | Static text pages | Reachable from Register + Settings |

## 2. Shell
- [ ] Bottom nav: Home, Submit (emphasized), Applications, Notifications, Profile.
- [ ] Notification badge = count of `notifications` where userId == UID and isRead == false.

## 3. Home
- [ ] "Hello, [first name]" (custom function: split fullName).
- [ ] Draft query -> "Continue Your Innovation Submission" card when a draft exists.
- [ ] Journey card: Profile + Submission stages live, the other four greyed.
- [ ] Featured message / opportunities / statistics: static demo content, labelled demo.

## 4. Profile
- [ ] View + Edit Profile (write only the allowed fields; never role/isActive).
- [ ] Photo upload to `users/{uid}/profile/`, compressed.
- [ ] Multi-select skills -> `skills` list.
- [ ] Completion % via custom function; if < 100 on first Home visit, create `profile_incomplete` notification once.

## 5. Submit Innovation (most important)
- [ ] One page with PageView/step state, 6 steps + Declaration, progress indicator.
- [ ] Step 4 (stage) and Step 6 (IP) use single-select chips; IP notice text visible.
- [ ] Per-step validation; "Next" saves draft (`draftStep`).
- [ ] Back/exit prompts confirmation dialog and saves draft.
- [ ] Step 5 uploads with progress; failure message: "We couldn't upload this file. Please try again."
- [ ] Declaration checkbox gates SUBMIT button.
- [ ] Submit via `submitInnovation` (or client flow); offline/error messages per spec.
- [ ] Confirmation page shows reference number; buttons VIEW APPLICATION / GO TO DASHBOARD.

## 6. Tracking
- [ ] My Applications: paginated list (name, ref, category, date, StatusBadge).
- [ ] Innovation Details: read-only; no edit button unless status == `returned`.
- [ ] Application Status: timeline; stages up to current status active, rest "future".
      Map: submitted -> 2 active; screening, verification, assessment, shortlisted, selected,
      mentorship, incubation each activate their step.

## 7. Notifications + Settings
- [ ] Notifications list, tap marks read, empty state.
- [ ] Settings: Edit Profile, Change Password (re-auth), notification prefs (stored on user doc), Terms, Privacy, Help, Logout.

## 8. Future-ready
- [ ] Route stubs (Nominate, Discover, Events, Mentorship, Showcase, Map) behind "Coming soon" page; not in bottom nav.

## 9. Acceptance run (spec section 32)
Open -> onboarding -> register -> verify -> login -> complete profile -> submit with image ->
declaration -> receive ref -> view application + status -> logout -> login -> application still there.
- [ ] Also run the Rules Playground checks from FLUTTERFLOW_SETUP.md section 5.
- [ ] Test on a throttled network (Chrome "Slow 3G" in web test mode) and in airplane mode: confirm offline messages and that the draft survives.
