# DICON GITH APP - Phase 1 wiring guide

## 1. Deploy rules
Firebase Console -> Firestore -> Rules: paste `firestore.rules`, Publish.
Firebase Console -> Storage -> Rules: paste `storage.rules`, Publish.
(Or `firebase deploy --only firestore:rules,storage` with the CLI.)

## 2. Seed data
- `categories`: one doc per entry in `seed/categories.json`, fields `{name, isActive: true, sortOrder}`.
  Easiest: FlutterFlow -> Firestore -> collection -> "Add document" x19, or use the Firebase console.
- `states` / `lgas`: add the 36 states + FCT; `lgas` docs carry `{name, stateId}`.
- First admin: in the console, edit one `users/{uid}` doc and set `role = "admin"`.
  Rules block users from doing this themselves.

## 3. Schema notes
- `users/{uid}`: fields exactly as in the spec. `skills` = List<String>.
- `innovations/{innovationId}`: add `draftStep` (int) for resume-where-you-left-off. Drafts have
  `status = "draft"` and `referenceNumber = ""` until submission.
- `referenceNumbers/{GITH-2026-XXXXXX}`: `{userId, innovationId, createdAt}`. Create-only, which is
  what guarantees uniqueness (see below).
- Status values: `draft, submitted, returned, screening, verification, assessment, shortlisted,
  selected, mentorship, incubation, rejected`. Users can only move `draft/returned -> submitted`.
- `notifications.type`: `welcome, profile_incomplete, submission_success, status_changed, announcement`.
  Clients may only create the first three; `status_changed`/`announcement` are admin/Cloud Function.

## 4. FlutterFlow actions

### Register button (On Tap)
1. Validate form.
2. Auth -> Create Account (Email) -> sets `currentUser`.
3. Firestore -> Create Document in `users`, **Document ID = Authenticated User UID**:
   uid = UID, fullName, email, phoneNumber, state, lga, role = "innovator", isActive = true,
   emailVerified = false, skills = [], createdAt/updatedAt = Current Time.
   (Do NOT pass the role from a dropdown.)
4. Create Document in `notifications`: userId = UID, type = "welcome", isRead = false.
5. Auth -> Send Email Verification -> navigate to Verify Email page.
   Verify page: button "I've verified" -> Auth -> Refresh User -> if `emailVerified` go Home.

### Splash
Wait 2s -> Conditional: if Authenticated User exists AND email verified -> Home, else Welcome.

### Profile completion % (Custom Function, input = users doc)
Count non-empty of: fullName, photoUrl, phoneNumber, state, lga, community, occupation,
institution, bio, skills(length>0) -> `filled / 10 * 100`.

### Save draft (each step "Next" / on exit)
Create Document (first time) or Update Document in `innovations` with status = "draft",
userId = UID, innovatorName, current-step fields, draftStep. Store innovationId in Page State.
Dashboard: Query `innovations` where userId == UID and status == "draft" (limit 1);
if exists show "Continue Your Innovation Submission".

### File upload (Step 5)
Upload Media widget (or Action) -> path `innovations/{uid}/{innovationId}/...`; enable image
compression (max width 1280, quality ~70) in the Upload action. Show progress via the built-in
upload indicator. Save URLs to Page State lists, then to imageUrls/videoUrls/documentUrls.

### Submit Innovation (On Tap, enabled only when declaration checkbox is true)
1. Validate required fields.
2. Custom Action `generateReferenceNumber` (below) -> `ref`.
3. Create Document in `referenceNumbers` with **Document ID = ref**, {userId, innovationId}.
   If this fails (document already exists) -> loop back to step 2 (max 5 tries).
4. Update Document `innovations/{innovationId}`: referenceNumber = ref, status = "submitted",
   submittedAt = updatedAt = Current Time, plus final fields.
5. Create notification (type = "submission_success").
6. Navigate to Confirmation page, passing ref.
Wrap in error handling -> show "We couldn't complete your submission. Your information has not
been lost. Please try again." (the draft stays saved).

### Custom Action: generateReferenceNumber
```dart
import 'dart:math';

Future<String> generateReferenceNumber() async {
  final n = Random.secure().nextInt(900000) + 100000; // 6 digits
  return 'GITH-${DateTime.now().year}-$n';
}
```
Uniqueness is enforced by step 3 above, not by the random number.

### My Applications
Backend Query on `innovations`: userId == UID, order by submittedAt desc (drafts have no
`submittedAt` so they are excluded automatically; this matches the index in
`firestore.indexes.json`). Page size 10 with pagination, "Single Time Query" off so status
updates show live.

## 4b. Backend (optional but recommended)
`functions/` adds sequential reference numbers and status-change notifications:
- `submitInnovation({innovationId})` callable: use instead of steps 2-4 of the Submit action
  (FlutterFlow -> Cloud Functions -> call, then read `referenceNumber` from the result).
- `onInnovationStatusChange`: auto-creates a "status changed" notification for the innovator.
- `setUserRole({uid, role})`: super_admin only; sets role and auth claim.

Deploy and seed:
```bash
cd functions && npm install && cd ..
firebase deploy --only firestore,storage,functions
```
```bash
cd functions && node ../seed/seed.js
```
(Needs `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service-account key. Add `--demo <uid>` to
create the demo "Smart Community Energy Monitor" record for an existing user. It's flagged
`isDemo: true` and its text starts with "TEST DATA".)
LGAs (774) are not seeded; import them from an official list into `lgas` as `{name, stateId}`.

### Logout / re-login
Auth -> Log Out -> Welcome/Login. Data persists in Firestore, so applications reappear.

## 5. Rules test checklist (Firebase Console -> Rules Playground)
- User A reads `users/B` -> denied
- User A updates own `users/A` with `role = admin` -> denied
- User A creates `innovations` with userId = B -> denied
- User A updates own submitted innovation -> denied
- User A sets own innovation status to `selected` -> denied
- Duplicate `referenceNumbers/GITH-2026-000001` create -> second one denied
- Unauthenticated read of `categories` -> allowed; of `innovations` -> denied

## 5b. Phase 2 collections (rules already in place, UI not built)
- `assignments/{innovationId}_{evaluatorUid}`: `{innovationId, evaluatorId, assignedBy, assignedAt, dueDate}`.
  Admin-only writes. Creating one is what grants that evaluator read access to the innovation.
- `assessments/{innovationId}_{evaluatorUid}`: `{innovationId, evaluatorId, scores{...}, comments,
  recommendation, submitted:false, updatedAt}`. Evaluator edits until `submitted = true`, then locked
  (admin can still reopen). Innovators cannot read these, so evaluator scores stay confidential.
- Extra rules checks: evaluator reads an unassigned innovation -> denied; evaluator edits a
  `submitted` assessment -> denied; innovator reads any `assessments` doc -> denied.
- Note: evaluators can read an assigned innovation's Storage media only after Storage rules are
  extended (currently owner/admin only). Do that when building the evaluator screens.

## 6. Known limits (Phase 2 candidates)
- Reference numbers use client-side random + create-only collision guard. A Cloud Function with a
  sequential counter would give gapless numbering if wanted.
- Admin checks cost one extra document read per rule evaluation; move role to a custom auth claim
  in Phase 2.
- Storage reads for `innovations/` are owner/admin only, so download URLs for evaluators will
  need the admin role in place first.
