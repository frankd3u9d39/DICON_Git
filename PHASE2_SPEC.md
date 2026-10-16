# DICON GITH APP - Phase 2 spec: Administration, Screening, Verification, Evaluation

Builds on Phase 1 without changing it. Rules for `assignments` and `assessments` and the
evaluator Storage read already exist. Target: a FlutterFlow web build (same Firebase project),
gated by role.

## Access
- Login routes by `users.role`: innovator -> mobile shell; admin/super_admin -> Admin Portal;
  evaluator -> Evaluator workspace. Non-matching role on a page -> redirect to Home.
- Role assignment only through the `setUserRole` function (super_admin).

## Status pipeline (admin-controlled)
submitted -> screening -> verification -> assessment -> shortlisted -> selected -> mentorship -> incubation
Side exits: `returned` (innovator may edit and resubmit) and `rejected`.
Every change: update `innovations.status` + `updatedAt`, write an `auditLogs` entry
`{userId, action:"status_change", targetId, from, to, createdAt}`. The existing
`onInnovationStatusChange` function notifies the innovator.

## Admin Portal screens
1. **Dashboard**: counts by status, submissions by category/state (aggregate count queries), latest 10 submissions.
2. **Innovator management**: searchable paginated list of `users`; detail view; deactivate (`isActive=false`); role change calls `setUserRole` (super_admin only).
3. **Innovation management**: filterable list (status, category, state), detail view with all media, status action buttons limited to valid next states.
4. **Screening**: queue of `submitted`; checklist (complete? original? in scope?) -> advance to `verification`, `returned` (with required reason message) or `rejected`.
5. **Verification**: queue of `verification`; record contact/site-visit notes (`verificationNotes`, `verifiedBy`, `verifiedAt`) -> advance to `assessment`.
6. **Evaluator assignment**: pick innovation(s) + evaluator(s) -> create `assignments/{innovationId}_{evaluatorUid}`; require >= 2 evaluators per innovation before moving on.
7. **Assessment results**: per innovation, table of submitted assessments, average score, spread; admin can reopen one (`submitted=false`).
8. **Shortlisting / Selection**: ranked list by average score; bulk action to `shortlisted`, then `selected` with confirmation dialog.
9. **Analytics**: charts for funnel by stage, geography, category.
10. **Notifications**: compose announcement -> batch-create `notifications` (type `announcement`) for chosen audience (use a Cloud Function for large audiences).
11. **Events**: `events` collection `{title, date, location, description, isPublished}`; innovator "Upcoming Opportunities" card reads published events.

## Evaluator workspace
- **My assignments**: query `assignments` where evaluatorId == UID, with due dates.
- **Review**: read-only innovation view with media, then score sheet.
- **Score sheet** (`assessments/{innovationId}_{uid}`): criteria scored 1-5, each with a comment:
  problem significance, originality, technical feasibility, community impact,
  scalability, team capability. Plus `recommendation` (advance / hold / reject) and overall comment.
  Save as draft (`submitted=false`); "Submit assessment" sets `submitted=true` (locks it).
- Evaluators never see other evaluators' scores or the applicant's contact details beyond name/location.

## New data
| Collection | Key fields |
|---|---|
| assignments | innovationId, evaluatorId, assignedBy, assignedAt, dueDate |
| assessments | innovationId, evaluatorId, scores{criterion:int}, comments{criterion:str}, recommendation, overallComment, submitted, updatedAt |
| events | title, date, location, description, isPublished |

## Needed before building
- [ ] Add rules for `events` (public read of published, admin write).
- [ ] Add `verificationNotes`, `verifiedBy`, `verifiedAt`, `returnReason` to `innovations` (admin-written only; innovator rules already block status changes, but add a field-level block if you want these hidden from applicants).
- [ ] Move role checks to custom claims (`request.auth.token.role`) to cut read costs once admin traffic grows. `setUserRole` already sets the claim.
- [ ] Define the scoring weights with the GITH panel before the score sheet is built.

## Phase 2 acceptance
Admin screens a submission -> verifies -> assigns two evaluators -> both submit assessments ->
admin sees averages -> shortlists -> selects. The innovator sees each status change plus a
notification in the mobile app, and never sees scores or evaluator identities.
