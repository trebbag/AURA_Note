# AURA Note
# First Release Functional Product Specification and Commercial Blueprint

**Legacy source names:** RevenuePilot / RP2 / RevenuePilot vNext  
**Current working name:** AURA Note  
**Positioning:** Companion module to M17 / AURA NP Cockpit, connected to the larger AURA data model and adjacent to AURA Charge Integrity, staff task orchestration, analytics, and future claims/denials modules.  
**Version date:** May 18, 2026
**Updated version:** First-release planning expansion with AURA ClinicOS/M17 alignment  
**Document purpose:** A nontechnical but highly detailed product, workflow, user-experience, commercial, and MVP planning document. It preserves the original RevenuePilot/RP2 functionality while reframing the app for a fresh planning cycle and for alignment with the broader AURA application ecosystem.

---

# 1. Executive Summary

AURA Note is not simply an AI scribe. It is a clinician-first encounter operating layer that turns a scheduled outpatient visit into a documented note, supported coding package, patient-facing summary, staff follow-up loop, draft claim preview, and coaching signal. The product should feel like a calm visit companion inside the clinician's broader cockpit: it starts from the schedule, listens during the visit, structures chart context, surfaces justified opportunities, forces human review before finalization, and sends the right work to the right person after the visit.

The legacy RevenuePilot concept already included the right center of gravity: real-time note support, coding support, patient summaries, staff worklists, revenue-cycle review, denials learning, and coaching. The new planning direction should keep all of that functionality, but reframe the product around AURA Note as a modular component inside a larger intelligent outpatient operating system. AURA Note should become the encounter documentation and charge-readiness companion to M17, rather than a standalone technical product locked to the old RP2 build assumptions.

The primary first user is the clinician. The clinician must be able to open a schedule-linked visit, click Start Visit, have recording and transcription begin automatically, document with support, make decisions on suggestions, clear compliance blockers, finalize the note through a six-step wizard, approve both the final note and patient summary, and dispatch the output. The app should then create staff tasks, show the finalized note in a Finalized Notes area, preserve the full transcript after finalization, and generate a draft claim-style review without requiring real claim submission in the MVP.

The product should also serve staff, billing, administrators, and medical directors, but in a way that protects the clinician's attention. Staff should see patient summaries, finalized notes, and assigned follow-up tasks. Billing staff should see billing detail and transcripts when needed. Treating clinicians and admins should see coaching outputs. Admins should see trends and ROI. The patient should only receive clinically appropriate summary content; revenue opportunities, payer logic, and internal optimization commentary must stay out of patient-facing outputs.

The commercial thesis is that basic ambient documentation and basic coding suggestions are becoming table stakes. AURA Note should compete by owning the closed loop: evidence-linked visit selections, finalization gates, payer-ready note sections, MA follow-up blockers, draft claim preview, Patient Opportunity Analysis, staff task conversion, and premium coaching. Those are the features most likely to create durable value because they connect time saved, revenue captured, denials avoided, and training improvement into one product story.

## 1.1 MVP non-negotiables

- AURA Note is the working product name.
- Primary first user is the clinician.
- Schedule Builder is core, but modular enough to be replaced by an external schedule later.
- Every appointment has a one-to-one clinician note shell, even if the note is inactive until opened.
- Start Visit must be clicked before editing is allowed.
- Start Visit automatically starts recording and transcription.
- Clinicians should not document inside the note editor without active recording, unless a specifically approved exception path is used.
- Recording and transcription are MVP critical.
- All transcript content should remain available after finalization for authorized roles.
- All suggestion categories should be present in the first version, even if some are initially simpler than others.
- Compliance and Quality Review must include blockers that stop finalization.
- Any History Gap question can be sent to an MA for follow-up.
- Open or unadjudicated MA follow-up questions block note signing until answered, closed, or assigned/resolved according to policy.
- All six Finalization Wizard steps are needed for MVP.
- Primary care and all visit types are in scope for the reference implementation.
- Clinicians should see the maximum justified coding support supported by the available data, with a revenue-integrity-first posture.
- Finalized notes must appear in a Finalized Notes section located in the same general area as Draft Notes.
- Claims and denials can be later expansions, but the finalized note should be viewable as a draft claim / claim-readiness preview in MVP.

## 1.2 What this document intentionally avoids

This is not an engineering plan. It does not prescribe code architecture, repository structure, programming languages, frameworks, databases, cloud hosting, CI/CD, or terminal workflows. It describes product behavior, user experience, information flow, role boundaries, commercial logic, and MVP scope. Future technical planning can translate these requirements into implementation details once the product direction is approved.

---

# 2. Product Thesis and Strategic Positioning

AURA Note should be positioned as a closed-loop encounter intelligence module for outpatient clinics. Its strongest value is not that it writes notes. Its value is that it helps the clinic capture the clinical truth of the visit, convert it into a faithful and usable note, identify justified codes and care opportunities, prevent obvious billing and documentation failures, create patient and staff follow-through, and generate coaching insights for continuous improvement.

## 2.1 The core product promise

AURA Note helps a clinic complete this chain reliably:

1. The appointment exists on the schedule.
2. The appointment has a linked note shell.
3. The clinician starts the visit.
4. Recording and transcription begin automatically.
5. The note editor unlocks.
6. The app renders chart context in clean, easy-to-follow panels.
7. The app packages relevant context for AI support without requiring the clinician to manually reassemble the chart.
8. Suggestions appear with confidence, evidence, and rationale.
9. The clinician selects diagnoses, codes, services, procedures, and plan items into Visit Selections.
10. Compliance and history gaps are surfaced before finalization.
11. The clinician reviews every selected item and every high-confidence final suggestion.
12. The app composes a clean, payer-readable final note and patient summary.
13. The clinician compares, edits, approves, attests, signs, and dispatches.
14. Accepted plan items create staff tasks and enter the plan section of the note.
15. Finalized notes, patient summaries, transcripts, and billing previews become available to authorized users.
16. Coaching and analytics learn from the encounter.

## 2.2 Commercial strategy: stop competing only as an AI scribe

Publicly marketed ambient AI tools increasingly include documentation, EHR integration, coding support, after-visit summaries, and revenue-cycle intelligence. This means AURA Note should not rely on "AI note generation" as the differentiator. The more defensible position is the combination of real-time clinical documentation, enforced finalization decisions, evidence-linked coding, staff task conversion, value-based care opportunity capture, and premium coaching.

The best commercial story should be built around four ROI pillars:

- **Time saved:** less after-hours documentation, fewer clicks, less manual chart hunting, fewer rework loops, and less staff back-and-forth.
- **Revenue captured:** better supported E/M, ICD-10, HCC, CPT, procedures, services, chronic care, preventive care, and follow-up capture.
- **Denials reduced:** fewer unsupported codes, missing documentation elements, unresolved questions, incompatible selections, or incomplete attestations.
- **Training improved:** coaching dashboards, provider scorecards, documentation fidelity measures, billing optimization patterns, and targeted micro-coaching.

## 2.3 The AURA Note moat

The most defensible features are the ones that combine clinical workflow, revenue integrity, and operational follow-through. These are harder to copy than simple note generation because they require a full encounter state model and disciplined human-in-the-loop UX.

| Commercial feature bet | Why it matters | Why it is harder to commoditize |
| --- | --- | --- |
| Finalization gates | Prevents the clinician from signing with unresolved gaps, unsupported selected codes, or skipped suggestion review. | Requires workflow state, role routing, and clinical/billing logic, not just text generation. |
| Visit Selections evidence map | Every selected code/item carries confidence, evidence, rationale, and payer-facing support. | Requires linking transcript, note, chart, and selected items into one reviewable object. |
| MA follow-up blockers | Turns missing history into routed work instead of hoping the clinician remembers. | Requires staff workflow and sign-blocking adjudication. |
| Patient Opportunity Analysis | Converts chart and visit context into clinical, quality, risk, and appropriate revenue opportunities. | Requires linking quality, chronic disease, HCC, care gaps, services, and plan generation. |
| Draft claim preview | Lets the clinician and billing team see the note as a claim-readiness package before submission. | Requires charge integrity concepts without needing full claims submission in MVP. |
| Premium coaching | Turns each encounter into training, QA, and ROI data. | Requires longitudinal analysis, scorecards, benchmarks, and privacy-aware role access. |
| M17 companion positioning | AURA Note becomes part of the clinician cockpit and broader outpatient command platform. | Integration with Flow, staff tasks, charge integrity, and analytics creates suite value. |

---

# 3. Ecosystem Fit: AURA Note as the M17 Companion

AURA Note should be planned as a companion module to M17, the AURA NP Cockpit / clinician encounter support layer. M17 is the place where the clinician needs the right patient, right schedule context, right visit state, and right clinical operations support. AURA Note is the documentation, visit-selection, finalization, and charge-readiness extension of that cockpit.

## 3.1 Relationship to adjacent modules

- **M17 / AURA NP Cockpit:** AURA Note lives inside or adjacent to the clinician's active visit workspace. It provides note authoring, transcript awareness, guidance, selections, finalization, and patient summary output.
- **AURA Flow:** Schedule state, rooming state, visit timing, staffing bottlenecks, and patient flow can inform which encounters need attention and how staff tasks should be prioritized.
- **AURA Charge Integrity / M21:** AURA Note feeds selected codes, payer justification, draft claim preview, billing flags, and evidence maps into the charge integrity layer.
- **AURA Staff Task Orchestrator:** Accepted plan items, MA follow-up questions, scheduling needs, referrals, labs, and patient summary actions become task objects with owners and statuses.
- **AURA Analytics Studio:** Note completion, documentation gaps, coding support, quality opportunities, revenue capture, denial risk, time-to-close, and coaching metrics become dashboards.
- **AURA Govern:** Role permissions, audit trails, attestation, policy gates, compliance rules, and access controls align with the broader governance model.

## 3.2 Shared data model in product language

AURA Note should use shared AURA objects rather than isolated RevenuePilot-specific objects. At the product level, the application should think in these core objects:

| Shared object | Product meaning |
| --- | --- |
| Patient | The person receiving care; used for chart context and final artifacts. |
| Appointment | The scheduled visit slot or external schedule item. |
| Encounter | The active clinical event associated with an appointment. |
| Note shell | The inactive note created when the appointment exists. |
| Active draft note | The editable note after Start Visit. |
| Transcript | The full diarized record of the visit recording, available after finalization to authorized roles. |
| Suggestion | An AI-supported possible code, gap, differential, service, plan item, or question. |
| Visit Selection | A clinician-selected item from suggestions or manual entry. |
| History Gap Question | A question that could improve clinical, documentation, or coding confidence. |
| Staff task | Work assigned after clinician decision, such as scheduling, follow-up, referral, or patient outreach. |
| Patient summary | The patient-facing plain-language output. |
| Draft claim preview | A billing-facing view of codes, evidence, charges, risk, and missing elements. |
| Coaching signal | A derived teaching/quality/revenue insight from completed encounters. |
| Audit event | A record that a user reviewed, accepted, removed, overrode, attested, or dispatched something. |

## 3.3 Design language and UX posture

AURA Note should follow the newer app pattern of a command layer rather than a cluttered documentation screen. The UX should feel like a cockpit with a clear center of gravity and just-in-time drawers, not like a maze of tabs.

Design principles:

- Minimal tabs; use side drawers, inline cards, collapsible sections, sticky headers, and sidecar panels when possible.
- The active patient and encounter should be unmistakable at all times.
- The app should show what needs attention now, not every possible metric.
- Suggestions should be grounded in evidence and uncertainty, not presented as commands.
- Revenue opportunities should be visible to clinicians and appropriate internal roles, but never leak into the patient-facing summary.
- The clinician should always remain the final decision maker.

---

# 4. Users, Permissions, and Visibility

AURA Note should be role-aware from the first version. The same underlying encounter can produce different views depending on who is using the app. This protects privacy, reduces clutter, and helps each role focus on the work they can actually complete.

## 4.1 Primary personas

### Treating clinician

The clinician is the primary first user. They start visits, document, review suggestions, select codes/items, resolve or assign history gaps, approve the final note and patient summary, attest, sign, and dispatch. They should see rich coding support, clinical reasoning, risk rating, patient opportunity analysis, transcript access, and their own coaching outputs.

### MA / clinical support staff

The MA helps build the schedule, verify patient context, room patients, answer assigned history gap questions, contact patients after the clinician visit, close loop on follow-up needs, and manage assigned staff tasks. They should not be responsible for deciding clinical diagnoses or coding support unless explicitly allowed by workflow.

### Front desk / scheduling staff

The scheduler creates appointments, manages visit status, handles cancellations/no-shows, schedules follow-ups, prints or distributes summaries if that is the clinic workflow, and closes scheduling tasks.

### Billing staff

Billing staff can review finalized notes, transcripts, Visit Selections, draft claim previews, payer justification sections, billing flags, and audit/unused lists. They should not see clinician coaching outputs unless they also have an admin role.

### Admin / medical director / supervising clinician

Admins and medical directors see dashboards, coaching outputs, provider trends, billing performance, documentation quality, training needs, policy compliance, and quality/revenue opportunities. In NP-heavy environments, supervising physicians or medical directors may need review queues, cosign workflows, or oversight views.

### Patient

The patient only receives the patient-facing summary, instructions, follow-up plan, and appropriate education. The patient does not see revenue opportunities, payer logic, coding confidence, internal coaching, or billing optimization commentary.

## 4.2 Visibility matrix

| Content type | Treating clinician | MA / staff | Billing staff | Admin / medical director | Patient |
| --- | --- | --- | --- | --- | --- |
| Draft note | Yes | Limited if assigned | No or limited | Yes if permitted | No |
| Final note | Yes | Yes | Yes | Yes | No, unless clinic chooses to share formal record separately |
| Patient summary | Yes | Yes | Limited/yes | Yes | Yes |
| Full transcript | Yes | No by default | Yes | Yes | No |
| Billing detail / draft claim preview | Yes | No by default | Yes | Yes | No |
| Visit Selections | Yes | Limited to task-relevant items | Yes | Yes | No |
| Coaching outputs | Treating clinician's own | No | No unless admin | Yes | No |
| Staff tasks | Own/related tasks | Yes | Billing-related tasks | Yes | No |
| Revenue opportunities | Yes | No by default | Yes | Yes | No |
| Patient Opportunity Analysis clinical plan items | Yes | Only accepted tasks | Billing sees billing-relevant portions | Yes | Only patient-safe summary items |

---

# 5. Encounter Lifecycle and Note State Model

Every appointment should have exactly one clinician note shell. The note shell exists when the appointment exists, but it should not necessarily clutter the clinician's Draft Notes view. The note becomes visible as a draft only when the clinician opens the appointment and starts or activates the visit.

## 5.1 Appointment-to-note relationship

- A staff member creates an appointment in Schedule Builder, or an appointment arrives from an external schedule.
- The appointment creates a linked note shell.
- The note shell is inactive until opened from the schedule.
- The clinician clicks Start Visit for that appointment.
- The note becomes an active draft.
- Start Visit begins timer, recording, and transcription automatically.
- The note editor unlocks only after Start Visit.
- If the clinician pauses or exits, the note remains in Draft Notes with the correct workflow status.
- When the note is signed and dispatched, it moves to Finalized Notes while remaining visible in the same general note work area.

## 5.2 Note statuses

Draft note statuses should mostly relate to the stage of the note workflow, not generic labels. Suggested statuses:

| Status | Meaning | Primary action |
| --- | --- | --- |
| Scheduled note shell | Appointment exists, note is created but inactive. | Start Visit from schedule. |
| Ready to start | Patient and chart context are matched enough for visit start. | Start Visit. |
| Chart context incomplete | Patient/chart match or context package is incomplete. | Review or attach context; still may allow start with warning. |
| Visit active - recording | Timer, recording, transcript, and note editor are active. | Continue documenting. |
| Visit paused | Recording is stopped/paused; note saved. | Resume Visit or Continue Draft. |
| Compliance open | Blocking compliance issues are unresolved. | Open Compliance & Quality Review. |
| History follow-up pending | One or more history questions are assigned/open and block sign. | Answer, close, or adjudicate questions. |
| Ready for finalization | Required blockers cleared; Finalize Note button active. | Enter Finalization Wizard. |
| In Finalization - Step 1 | Visit Selection Review in progress. | Decide on every selected card. |
| In Finalization - Step 2 | Suggestion Review in progress. | Review all qualifying final suggestions. |
| In Finalization - Step 3 | Compose in progress. | Wait for generated note/summary. |
| In Finalization - Step 4 | Compare & Edit in progress. | Approve note and patient summary. |
| In Finalization - Step 5 | Billing & Attest in progress. | Review draft claim, evidence, attestation. |
| Awaiting sign | All reviews complete, note ready for signature. | Sign & Dispatch. |
| Finalized | Note and patient summary are final. | View, download, copy, or route. |
| Billing review flagged | Finalized note has billing review flags. | Billing staff review. |
| Amendment needed | Final note needs formal addendum/amendment. | Follow amendment workflow. |

## 5.3 Draft Notes and Finalized Notes layout

The Notes area should have two adjacent sections: Draft Notes and Finalized Notes. Draft Notes should show only active or incomplete notes. Finalized Notes should show read-only final artifacts, not reopen the active editor. Both sections should be in the same general area so users do not need to hunt for completed work.

Draft entries should show:

- Patient / visit label.
- Provider.
- Appointment time.
- Note workflow status.
- Last saved time.
- Recording/transcription status.
- Current finalization step if applicable.
- Compliance blocker count.
- History gap count.
- Visit Selection count.
- Next action.

Finalized entries should show:

- Final note status.
- Patient summary status.
- Transcript available indicator.
- Draft claim preview status.
- Billing review flags.
- Staff tasks created.
- Download Note PDF.
- Download Patient Summary PDF.
- Copy Note.
- Copy Patient Summary.
- View Transcript, if role-permitted.
- View Billing Preview, if role-permitted.

---

# 6. Schedule Builder and External Schedule Modularity

The Schedule Builder is core because AURA Note needs an encounter anchor. It should be treated as a first-class workflow in MVP, but it should also be modular so that a future external schedule can replace or feed it. The product should not become dependent on owning scheduling forever.

## 6.1 MA workflow for schedule creation

1. The MA or scheduler logs in.
2. They open Schedule Builder.
3. They create each appointment by clicking a day/time slot or selecting New Appointment.
4. They complete the appointment popup.
5. They enter or select the patient ID / patient identity.
6. The appointment appears in the Schedule view.
7. A linked note shell is created automatically.
8. Chart context begins to populate if a connection or uploaded context exists.
9. The schedule item displays readiness indicators.
10. The clinician later clicks Start Visit from the schedule.

## 6.2 Appointment popup fields

The appointment creation popup should be simple but complete:

- Patient lookup / patient ID.
- Patient name display after match.
- Provider.
- Date and time.
- Visit type.
- Reason for visit / chief concern.
- Location.
- Room or telehealth indicator.
- Duration.
- Appointment status.
- Payer/coverage indicator if available.
- Required previsit items.
- Staff notes.
- External appointment ID if imported.

## 6.3 Readiness indicators

Each schedule card should display practical readiness, not technical status.

| Indicator | Meaning |
| --- | --- |
| Patient matched | The appointment is linked to the intended patient. |
| Chart context ready | Key chart context is available for rendering and AI support. |
| Context partial | Some chart slices are missing or stale. |
| Note shell created | The one-to-one note relationship exists. |
| Visit not started | Clinician has not clicked Start Visit. |
| Visit active | Timer/recording/transcription are active. |
| Visit paused | Draft exists but recording is stopped. |
| Finalization pending | Documentation is in the wizard. |
| Finalized | Final note and patient summary exist. |
| Follow-up open | Staff tasks or MA questions remain open. |

## 6.4 External schedule replacement

When an external schedule is connected later, AURA Note should still use the same encounter lifecycle. External appointments should create note shells, display readiness indicators, and support Start Visit. If the external schedule is down or unavailable, staff should be able to use Schedule Builder as a fallback.

---

# 7. EHR and Chart Context Experience

The EHR connection, uploaded chart, or other record source should be used to pull patient information and render it in distinct, easy-to-follow ways. This is one of the most important parts of AURA Note because it creates two kinds of value: it helps the clinician understand the patient without digging, and it creates the structured context package used by the AI guidance engine.

## 7.1 The Clinical Context Package

AURA Note should convert messy chart information into a Clinical Context Package. This package is not a screen by itself. It is the organized set of patient and encounter facts that supports the note editor, suggestions, patient opportunity analysis, billing review, coaching, and patient summary.

The package should include:

- Patient identity and demographics.
- Appointment and encounter details.
- Visit reason / chief concern.
- Problem list and prior diagnoses.
- Current diagnoses relevant to the visit.
- Medications.
- Allergies.
- Vitals and trends.
- Relevant labs and trends.
- Imaging and diagnostic results.
- Past medical, surgical, family, and social history.
- Prior note excerpts and unresolved plan items.
- Referrals and outside records.
- Immunizations and preventive care.
- Payer and eligibility indicators when available.
- Quality gaps / HEDIS-like gaps.
- HCC / risk adjustment history where relevant.
- Prior authorization or payer rule flags if known.

## 7.2 Rendering chart context without too many tabs

The product should avoid forcing the clinician to click away from the note repeatedly. Tabs may be helpful for sorting information, but the app should use them minimally. Better patterns include a patient context sidecar, collapsible cards, pinned key facts, inline inserts, and quick hover details.

Recommended context layout:

| Area | Behavior |
| --- | --- |
| Patient Bar | Always visible. Shows patient, age, appointment, visit type, chart readiness, and key risk flags. |
| Context sidecar | Opens without leaving the note. Contains grouped chart slices. |
| Pinned facts | Clinician can pin important labs, meds, diagnoses, or prior plans into view. |
| Evidence drawers | Suggestion cards can open evidence without navigating away. |
| Compact tabs | Use only for major categories such as Overview, Visit, Transcript, Codes, Unused, Billing. |
| Search | Search across chart context, current note, transcript, and prior plans. |

## 7.3 Chart context slices

| Slice | What the user sees | How it helps |
| --- | --- | --- |
| Snapshot | Most important patient facts and open issues. | Orients clinician quickly. |
| Problems and diagnoses | Active problems, recent diagnoses, HCC-sensitive conditions. | Supports assessment, coding, risk adjustment integrity. |
| Medications and allergies | Active meds, adherence issues, refill needs, allergies. | Supports plan, safety, medication optimization. |
| Vitals and labs | Recent values and trend flags. | Supports chronic disease decisions and documentation. |
| Prior plans | Unfinished labs, referrals, screenings, follow-ups. | Prevents dropped care and creates staff tasks. |
| Quality gaps | Preventive care and measure-related opportunities. | Supports patient outcomes and value-based care. |
| Payer context | Coverage/payer hints, authorization needs, benefits if available. | Supports billing review and patient financial estimates. |
| Transcript | Live and final diarized transcript. | Supports documentation fidelity and audit review. |

## 7.4 AI context packaging

The clinician should not have to understand the AI packaging process, but the product should visibly communicate what the app is using. The app should show labels such as:

- "Using current note + transcript + chart snapshot."
- "Using current note only; chart context unavailable."
- "Medication list may be stale."
- "Lab data available through [date]."
- "Payer requirements unavailable; billing estimate is preliminary."

This helps users calibrate trust in suggestions. It also makes the system feel honest when context is incomplete.

---

# 8. Documentation Workspace

The Documentation workspace is the product heartbeat. It should only become fully active after the clinician enters through a specific appointment or active encounter. Outside an encounter, the user may see an empty or limited documentation area, but not the complete editing experience.

## 8.1 Required workspace zones

| Zone | Purpose |
| --- | --- |
| Top Panel | Patient Bar, visit controls, recording/timer, transcript access, compliance review, history gap review, finalization button. |
| Note Editor | The main clinical note authoring area. |
| Visit Selections Panel | The selected codes/items/services/procedures/plan opportunities the clinician is actively choosing for this visit. |
| Suggestions Panel | AI-generated suggestions not yet selected, with confidence, rationale, evidence, and actions. |

## 8.2 Patient Bar

The Patient Bar should always show:

- Patient name and identifier display.
- Age and sex/gender if clinically relevant.
- Appointment time and visit type.
- Provider.
- Chief concern / visit reason.
- Chart context readiness.
- Risk flags.
- Payer indicator if relevant.
- Recording status.
- Note status.

The bar should make wrong-patient work visually obvious. A user should never wonder which chart they are documenting.

## 8.3 Visit Controls Bar

The Visit Controls Bar should include:

- Start Visit.
- Stop/Pause Visit.
- Timer.
- Recording status.
- Transcript preview.
- Finalize Note button.
- Compliance & Quality Review drawer.
- History Gap Review drawer.

Rules:

- Start Visit is required before editing.
- Start Visit automatically starts recording.
- Start Visit automatically starts transcription.
- Stop Visit pauses timer, recording, and transcription.
- Exiting while active auto-saves the note.
- Returning to the draft allows Resume Visit.
- Finalize Note is disabled until blocking compliance items are cleared.
- Finalize Note ends recording and moves the current note, Visit Selections, suggestions, transcript, and context into the Finalization Wizard.

## 8.4 Recording and transcript behavior

Recording and transcription are MVP critical. The product should make recording status visible but not distracting.

Required transcript behavior:

- Recording starts automatically when Start Visit is clicked.
- Transcript is generated in real time.
- Transcript is diarized by speaker where possible.
- A hover preview shows a small extract of live transcript.
- Clicking the transcript area opens a larger transcript drawer.
- Transcript can be searched.
- Transcript can be used as evidence for suggestions.
- Full transcript remains available after finalization to authorized roles.
- Transcript is not patient-facing by default.

## 8.5 Note Editor

The note editor should feel familiar to clinicians but smarter than a text box. It should support:

- Structured sections for common visit types.
- Manual typing.
- Formatting tools.
- Templates.
- Dot phrases.
- Inline insertion of transcript snippets.
- Inline insertion of chart facts with source labels.
- Autosave.
- Section-level completion indicators.
- Warning when text appears unsupported by transcript/chart context.
- Clear separation of original user-entered text and AI-enhanced final output.

The editor is not active when the visit is not running, except for approved pause/resume or finalization editing states.

## 8.6 Templates and dot phrases

Templates can come from four sources:

- Specialty-specific templates.
- Appointment type-specific templates.
- Provider-specific templates.
- Clinic-approved templates.

Dot phrases should be managed in Settings. Clinic-level dot phrases should be available across the clinic. Provider-level dot phrases should allow individual style and efficiency. The app should also support suggested dot phrases that the clinic can approve later.

---

# 9. AI Guidance and Suggestion Categories

All suggestion categories should belong in the first version. Some categories may be initially simpler, but the first product should establish the complete guidance vocabulary. This matters commercially because AURA Note should feel like a full encounter assistant, not a narrow note writer.

## 9.1 Suggestion card anatomy

Every suggestion card should include:

- Category.
- Title.
- Suggested action.
- Confidence score.
- Evidence summary.
- "Why was this suggested?" button.
- Supporting note/transcript/chart excerpts.
- Missing evidence or uncertainty.
- Suggested next question if confidence could be improved.
- Revenue relevance, if internal role permits.
- Patient-care relevance.
- Add / keep / dismiss / defer action.

## 9.2 MVP suggestion categories

| Category | Examples | MVP behavior |
| --- | --- | --- |
| Diagnosis / ICD-10 | Diabetes, hypertension, asthma exacerbation, UTI. | Suggest diagnosis candidates with evidence and confidence. |
| Differential | Migraine vs tension headache, viral URI vs sinusitis. | Allow adding as Differential or promoting to Diagnosis with safeguards. |
| CPT / services | Office visit, procedure, vaccination, screening, counseling. | Suggest justified billable services and procedures. |
| E/M support | MDM level, time-based support, complexity. | Explain what supports or weakens selected level. |
| HCC / risk adjustment | Chronic conditions needing current-year support. | Highlight only when clinically supported; require evidence. |
| Documentation gaps | Missing HPI, ROS, exam, assessment, plan, medical necessity. | Populate Compliance & Quality Review or History Gap Review. |
| Denial risk | Unsupported code, missing procedure details, incompatible selections. | Block or warn depending on severity. |
| History gap questions | Questions that improve confidence or close documentation gaps. | Can be asked during visit or assigned to MA after visit. |
| Quality / care gaps | Preventive screenings, chronic disease monitoring, immunizations. | Populate Patient Opportunity Analysis and plan recommendations. |
| Patient plan items | Labs, referrals, follow-ups, education, medication changes. | Accepted items enter the plan and create staff tasks when appropriate. |
| Services/procedures needing scheduling | Follow-up visit, lab appointment, vaccine, imaging, procedure. | Represented as Visit Selection cards; accepted items create staff tasks. |
| Medication opportunities | Refills, adherence, statin/ACE/ARB prompts, reconciliation issues. | Suggest plan items and safety checks. |
| Public health / population health | Vaccination gaps, screenings, social needs, communicable risk prompts. | Suggest when appropriate and patient-safe. |
| Patient summary items | Plain-language instructions and red flags. | Feed patient summary after clinician approval. |
| Billing preview flags | Modifier, unit, place of service, payer evidence issues. | Feed Step 5 Billing & Attest. |

## 9.3 Confidence rules

- Suggestions should display confidence in a way that is useful but not misleading.
- Differential-to-diagnosis promotion below 75% confidence requires a warning and override reason.
- If a clinician overrides a below-75% diagnosis warning, the override is flagged for coaching and billing review.
- Final pass suggestions in Step 2 should be limited to items above 50% confidence.
- Clinicians cannot skip Suggestion Review.
- Confidence should be paired with evidence and uncertainty, not shown as a standalone number.

## 9.4 Low-confidence diagnosis warning

When a differential with confidence below 75% is added as a diagnosis, a warning modal should appear. The modal should show:

- The diagnosis being added.
- Why the app thinks it is supported.
- Why the app thinks it is not fully supported.
- What missing information could increase confidence.
- The possible actions: do not add, add as differential, override and add as diagnosis.
- If overriding, the clinician must enter a reason.
- The override is flagged for billing review and coaching review.

---

# 10. Visit Selections Panel

The panel formerly described as Selected Codes should be called Visit Selections. This better reflects that the panel contains more than billing codes. It contains the clinician's active choices for the encounter: codes, diagnoses, differentials, services, procedures, scheduling needs, and plan-relevant items.

## 10.1 What belongs in Visit Selections

| Item type | Examples | Final destination |
| --- | --- | --- |
| CPT / HCPCS codes | Office visit, procedure, vaccine administration. | Payer-facing justification section and draft claim preview. |
| ICD-10 diagnoses | Diabetes, hypertension, acute bronchitis. | Assessment, diagnosis list, billing preview. |
| HCC-relevant diagnoses | Clinically supported chronic conditions. | Assessment, risk adjustment support, billing review. |
| Differentials | Possible causes not finalized as diagnosis. | Assessment or clinical reasoning section. |
| Services / procedures | Foot exam, vaccination, EKG, spirometry, procedure scheduling. | Plan and staff task when accepted. |
| Appointment needs | Follow-up visit, annual wellness, lab visit, imaging. | Plan and staff scheduling task. |
| Patient plan items | Education, monitoring, medication changes, referrals. | Plan and staff task when applicable. |

Cards should not be generic staff tasks. They should represent clinically meaningful selections such as services, procedures, follow-up appointments, labs, referrals, or actions that need to be scheduled. Actual staff tasks are created later after the clinician accepts plan items.

## 10.2 Panel behavior

- At visit start, Visit Selections is empty.
- The clinician can manually add items.
- Accepted suggestions move into Visit Selections.
- Manually entered items receive AI feedback and confidence during the next review cycle.
- Items update as new context appears.
- Differentials can be added as Differential or Diagnosis.
- Services/tasks can live in the panel as differently colored cards.
- Filters allow users to view categories such as Codes, Diagnoses, Differentials, Services, Procedures, Scheduling, Plan, and Billing Flags.
- Selected items should not persist visibly through the entire wizard if doing so creates clutter. The wizard should surface the right subset at the right step.
- Removed selected items remain in an unused/audit list.

## 10.3 Color and visual language

| Card family | Visual intent |
| --- | --- |
| Diagnosis / ICD | Clinical condition. |
| CPT / service | Billable service. |
| E/M | Visit level / complexity. |
| HCC / risk | Risk adjustment integrity. |
| Procedure | Procedure or procedure-like service. |
| Follow-up / scheduling | Staff scheduling action after acceptance. |
| Plan item | Patient care action. |
| Compliance issue | Warning or blocker. |
| History question | Question needing clinician or MA adjudication. |

## 10.4 How selections appear in the final note

During Compose, selected codes should be written into the note in a format that makes payer justification easy to see. The final note should not merely list codes. It should include a clean payer-readable section that explains why selected codes apply, using only supported facts from the note, transcript, and chart context.

Services, procedures, follow-up needs, and accepted plan recommendations should be placed in the Plan section of the note. Accepted plan items should create staff tasks when follow-through is needed.

---

# 11. Compliance and Quality Review Alert Panel

The Compliance & Quality Review drawer should show AI-driven guidance on issues that need to be addressed to avoid obvious denial problems, unsupported billing, incomplete medical necessity, unsafe documentation, or missing required decisions. Some issues should block finalization. Others should warn but allow finalization with acknowledgement.

## 11.1 Blocking issues that should stop finalization

These should prevent the Finalize Note button or Sign & Dispatch step until resolved, assigned, or formally overridden according to policy.

| Blocker | Why it should block | Resolution |
| --- | --- | --- |
| Start Visit not completed | Editing without visit start breaks the required recording/transcript workflow. | Start or resume visit, or use an approved exception path. |
| Recording/transcription absent or failed without acknowledgement | Transcript is core to fidelity, coding support, coaching, and auditability. | Re-record if possible, document exception, or route for admin review. |
| Wrong or unmatched patient/encounter | Wrong-patient documentation is a serious safety and billing risk. | Fix patient/appointment link before continuing. |
| No chief concern or visit reason | Note lacks basic encounter anchor. | Add or confirm reason for visit. |
| Assessment exists without plan | Clinical note is incomplete and patient care follow-through is unclear. | Add plan or explain why none is needed. |
| Selected diagnosis unsupported by note/transcript/chart | Billing and clinical record may be inaccurate. | Add support, downgrade to differential, remove, or override if allowed. |
| Below-75% diagnosis override without reason | User rule requires an override reason. | Enter reason or change selection. |
| Selected CPT/procedure lacks required evidence | Payer justification and medical necessity may be missing. | Add documentation or remove code/service. |
| E/M level unsupported by MDM or time documentation | High denial/audit risk. | Adjust level or add valid support. |
| Procedure selected without procedure details | Indication, consent, technique, outcome, or complications may be missing. | Add procedure documentation or remove. |
| Time-based code selected without qualifying time | Time-based billing requires clear support. | Document time and qualifying activities or remove code. |
| HCC/risk diagnosis lacks current evidence | Risk adjustment diagnoses require chart support. | Add MEAT-style support where appropriate or remove. |
| Open History Gap / MA follow-up question | User explicitly requires open questions to block signing. | Answer, close, or assign/adjudicate according to workflow. |
| Unreviewed Step 1 card | Every selected item must receive a decision. | Keep or remove every card. |
| Unreviewed Step 2 qualifying suggestion | Clinicians cannot skip final suggestion review. | Keep or remove every qualifying suggestion. |
| Patient summary not approved | Patient-facing output must be reviewed. | Approve or edit patient summary. |
| Final note not approved | Final note must be clinician-accepted enhanced version. | Approve or edit final note. |
| Required attestation missing | Billing/clinical accountability incomplete. | Complete attestation. |
| Plan item accepted but no owner for required follow-up | Follow-through may fail. | Assign owner, close as not needed, or remove. |
| Conflicting critical facts | The note contains conflicting facts that affect care or billing. | Correct conflict or explain. |
| Patient-facing summary contains internal revenue/billing logic | Revenue opportunities must be hidden from patient output. | Remove or regenerate summary. |

## 11.2 Warning issues that should not always block

Warnings should be visible and may require acknowledgement, but they do not always stop the workflow.

- Chart context is partial or stale.
- Medication list was not refreshed.
- Payer rules are unavailable.
- Confidence is moderate but above threshold.
- Patient summary readability is higher than desired.
- Follow-up timeframe is nonspecific.
- Note contains broad template language not clearly supported by the visit.
- Suggested opportunity was dismissed despite moderate confidence.
- Draft claim estimate may be incomplete due to missing benefit data.

## 11.3 Alert severity model

| Severity | Meaning | UX behavior |
| --- | --- | --- |
| Blocker | Must be resolved before finalization/signing. | Red alert, disables next action. |
| Required decision | User must keep/remove/approve/attest. | Orange alert, step cannot proceed. |
| Warning | May increase denial, safety, or quality risk. | Yellow alert, acknowledgement may be required. |
| Advisory | Useful opportunity or improvement. | Blue/neutral card, no block. |
| Coaching flag | Not necessarily a workflow block, but useful for later review. | Logged for coaching/billing review. |

---

# 12. History Gap Review and MA Follow-Up Loop

History Gap Review should show questions that would produce helpful information for the clinician, documentation quality, code confidence, care plan, or payer support. Questions should be labeled by the element they support.

## 12.1 History Gap card anatomy

Each question should show:

- Question text.
- What it supports: diagnosis, differential, CPT, E/M, HCC, procedure, quality measure, medication safety, plan, or patient summary.
- Confidence impact.
- Why it matters.
- Suggested asker: clinician now, MA after visit, billing clarification, or admin review.
- Possible actions: ask now, add answer to note, assign to MA, close as not needed, defer, or remove.

## 12.2 MA follow-up timing

MA follow-up questions can happen anytime after the clinician portion of the visit is over. This is important because a clinician may identify a missing history element during finalization, after the patient has left the exam room but before the note is signed.

Workflow:

1. A history gap appears.
2. Clinician decides the question can be answered by MA follow-up.
3. Clinician assigns it to MA with context.
4. The MA contacts the patient or collects the answer according to clinic process.
5. The answer returns to the question card.
6. Clinician adjudicates the answer: add to note, close, or revise plan/selection.
7. Open/unadjudicated questions block note signing.

## 12.3 Question statuses

| Status | Meaning | Blocks signing? |
| --- | --- | --- |
| Open | Question has not been answered or closed. | Yes |
| Assigned to MA | MA is responsible for follow-up. | Yes until answered/closed/adjudicated |
| Answered by MA | Answer exists but clinician has not adjudicated. | Yes |
| Added to note | Clinician accepted answer into documentation. | No |
| Closed - not needed | Clinician decided it is not needed. | No |
| Closed - unable to reach patient | Clinic follow-up attempted but no answer. | Usually no after clinician acknowledgement |
| Deferred to future visit | Not needed for signing but tracked for continuity. | No if clinician acknowledges |

---

# 13. Finalization Wizard Overview

All six Finalization Wizard steps are needed for MVP. The wizard is where AURA Note becomes commercially valuable: it forces structured review, prevents skipped suggestions, turns selected codes into payer-readable support, creates the patient summary, generates the draft claim preview, and dispatches final outputs.

The wizard should show all phases as a progress indicator. The user should always know which step they are in, what is required to continue, and what remains.

## 13.1 Six required steps

| Step | Name | Main user action |
| --- | --- | --- |
| 1 | Visit Selection Review | Decide keep/remove for every selected item. |
| 2 | Suggestion Review | Review all qualifying unselected final suggestions. |
| 3 | Compose | Generate standardized final note and patient summary. |
| 4 | Compare & Edit | Compare original and enhanced note; approve note and summary. |
| 5 | Billing & Attest | Review draft claim, evidence, risk, patient-care/billing checks, and attestation. |
| 6 | Sign & Dispatch | Finalize, route, download, copy, and create downstream work. |

## 13.2 Wizard-wide rules

- The wizard receives current note text, Visit Selections, current suggestions, transcript, and chart context.
- The user cannot skip Step 1 or Step 2.
- Every Step 1 selected card requires a decision.
- Every Step 2 qualifying suggestion requires a decision.
- Removed selected items remain in the unused/audit list.
- Final pass suggestions are limited to items above 50% confidence.
- Selected items should not persist visibly through the entire wizard; each step should show only what is relevant.
- Re-beautify replaces the old enhanced version using the current left-side/original note content.
- The final note is the accepted enhanced version, not the raw original draft.
- The patient summary must be approved separately.
- The note cannot be signed while open/unadjudicated questions remain.

---

# 14. Finalization Wizard Step 1: Visit Selection Review

Step 1 reviews what the clinician already selected during the visit. The goal is to confirm that every Visit Selection still belongs in the final note and billing package.

## 14.1 Screen layout

- Left side: original note editor, still editable.
- Right side: carousel or stacked review list of Visit Selection cards.
- Drawer: History Gap Review remains available.
- Evidence mode: "Why was this suggested?" highlights relevant note/transcript/chart evidence.
- Decision controls: Keep, Remove, Convert, Edit, Request MA Follow-up, or Add Support.

## 14.2 Required user actions

- Every selected card must receive a decision.
- Removed items go to the audit/unused list.
- Low-confidence diagnosis cards require appropriate warning/override handling.
- Open History Gap questions must be answered, closed, or assigned.
- Staff tasks should not be raw cards in this step; cards represent services/procedures/appointments or plan needs that may later create staff tasks.

## 14.3 Card details

Each card should show:

- Item type and title.
- Latest confidence.
- Supporting evidence.
- Missing evidence.
- Why it matters for patient care.
- Why it matters for billing/revenue, if role-permitted.
- What could improve confidence.
- Decision history.

---

# 15. Finalization Wizard Step 2: Suggestion Review

Step 2 reviews high-confidence suggestions that the clinician did not select during the visit. This is the last chance to catch missed documentation, coding, care, and follow-up opportunities before the note is composed.

## 15.1 Suggestion inclusion rules

- Include suggestions that were present but not selected.
- Include final-pass suggestions generated from the complete note/transcript/context package.
- Limit to suggestions above 50% confidence unless a policy-specific exception is created.
- Do not include low-confidence noise that clutters the clinician's review.
- Include only suggestions that are actionable.

## 15.2 Required user actions

- Clinician must review every card.
- Keep moves the item into the final Visit Selections list.
- Remove sends the item to the unused/audit list.
- Defer can be allowed only when the product has a clear follow-up destination.
- The user cannot continue until all qualifying cards are decided.

## 15.3 Suggestion review should feel like safety net, not nagging

The UX should make it clear that Step 2 is protecting the clinician and clinic from missed opportunities. It should be fast, evidence-based, and respectful of the user's time. Cards should be sorted by priority, confidence, and likely impact.

---

# 16. Finalization Wizard Step 3: Compose

Step 3 composes the final enhanced note and patient summary. The output should be a standardized note format that best shows all information written by the clinician and supported by the visit, without making up anything. It should be useful for clinical continuity and payer review.

## 16.1 Compose progress indicator

The progress indicator should show all phases:

1. Analyzing Content.
2. Enhancing Structure.
3. Beautifying Language.
4. Final Review.

The user should see which phase is active. The language should feel reassuring and precise, not magical.

## 16.2 Compose outputs

Step 3 should produce:

- Enhanced final note draft.
- Patient summary draft.
- Payer-facing code justification section.
- Plan section with accepted services, procedures, and follow-up needs.
- Draft claim preview inputs for Step 5.
- List of changes or improvements made.
- Validation warnings if content could not be supported.

## 16.3 Payer-facing section

All selected codes should be added to the note in a clean section written so payers can easily see the justification. The section should not be bloated or adversarial. It should be concise, evidence-linked, and compliant.

Suggested section label: **Documentation Support for Selected Services and Diagnoses**.

It should include:

- Selected E/M level or service.
- Diagnoses supporting the visit.
- Medical decision-making support.
- Time support if time-based.
- Procedure support if applicable.
- HCC/risk adjustment support if applicable.
- Any limitations or missing elements noted by the system.

## 16.4 No fabrication rule

Compose must not invent symptoms, diagnoses, exam findings, counseling, procedures, time, patient statements, or plan details. If the system believes something is missing, it should flag the gap rather than fill it in.

---

# 17. Finalization Wizard Step 4: Compare & Edit

Step 4 lets the clinician compare the original note and the AI-enhanced note, edit the original if needed, re-beautify, use planning support, review Patient Opportunity Analysis, and approve both the final note and patient summary.

## 17.1 Screen layout

- Left side: original note as it appeared entering the compose step, still editable.
- Right side: enhanced version of the note.
- Header: patient and visit information.
- Info button: opens a panel with Overview, Visit/Transcript, Codes, Unused, and Billing Preview tabs.
- Toggle: switch right side between Final Note and Patient Summary.
- Actions: Re-beautify, Approve Note, Approve Patient Summary, Open Planning Assistant, Open Patient Opportunity Analysis.

## 17.2 Re-beautify behavior

Re-beautify should replace the old enhanced version. It should use anything new from the left/original side. If the clinician adds new details, removes unsupported statements, or incorporates an MA answer, re-beautify should regenerate the enhanced note and patient summary from the updated source.

## 17.3 Info panel tabs

| Tab | Contents |
| --- | --- |
| Overview | Basic patient, encounter, visit type, provider, chart context status. |
| Visit / Transcript | Full transcript broken out by speaker. |
| Codes | Final selected codes/items list. |
| Unused | Removed selected items and rejected suggestions; emergent items can be elevated. |
| Billing Preview | Early view of draft claim evidence and missing billing details. |

## 17.4 AI Planning Assistant

The AI Planning Assistant should show:

- Current plan inferred from the note.
- Overall patient risk rating.
- Recommended plan items.
- Suggested timing / priority.
- Reasoning and evidence.
- Checkbox actions to add to the plan.
- Free-text action entry.

Risk rating can be shown to all clinicians. All plan recommendations are acceptable for MVP. Accepted plan items should be added to the Plan section of the note and create staff tasks when follow-through is required.

## 17.5 Required approvals

Before moving forward, the clinician must approve:

- Final enhanced note.
- Patient summary.

If either is not approved, Step 5 remains locked.

---

# 18. Patient Opportunity Analysis

The former Neural Patient Analysis should be renamed Patient Opportunity Analysis. This should be one of AURA Note's most important differentiators. It should identify opportunities that help the patient get healthier, help the clinic close important care gaps, and help the clinic capture appropriate, supported revenue. Revenue opportunities must be hidden from the patient-facing summary flow.

## 18.1 Product definition

Patient Opportunity Analysis is a visit-specific opportunity engine that reviews the chart context, current visit, transcript, note, Visit Selections, care gaps, payer context, and chronic disease history to identify high-value next actions.

It should not be framed as "the AI knows what to do." It should be framed as: "Here are opportunities the clinician may want to consider, with evidence and uncertainty."

## 18.2 Opportunity categories

| Category | Examples | Output behavior |
| --- | --- | --- |
| Clinical risk radar | Rising A1c, uncontrolled BP, frequent exacerbations, fall risk, depression risk. | Suggest plan item, follow-up, lab, referral, or monitoring. |
| Preventive care / quality | Colon cancer screening, mammogram, diabetic retinal exam, nephropathy monitoring, vaccines. | Suggest care gap closure and staff task if accepted. |
| Chronic disease optimization | Diabetes, hypertension, COPD, CKD, obesity, CHF, asthma. | Suggest monitoring, medication review, education, follow-up cadence. |
| HCC / risk adjustment integrity | Chronic conditions needing current-year support with evidence. | Suggest documentation question or diagnosis support; never code without evidence. |
| High-value services | Annual wellness visit, advanced care planning, chronic care management, transitional care management, behavioral health integration, RPM, preventive counseling. | Suggest only when clinically appropriate and operationally supported. |
| Medication optimization | Statin gaps, refills, adherence, deprescribing, duplicate therapy, safety monitoring. | Suggest plan item or medication reconciliation prompt. |
| Social and access barriers | Transportation, food insecurity, cost barriers, health literacy, caregiver support. | Suggest supportive task or documentation prompt. |
| Referral and diagnostic loop closure | Pending referral, missed imaging, overdue lab, specialist note not received. | Create staff task and note plan item if accepted. |
| Patient activation | Teach-back, warning signs, self-monitoring plan, home BP/glucose log. | Add to patient summary and plan. |
| Revenue integrity opportunities | Supported services/codes that may otherwise be missed. | Internal only; never patient-facing. |

## 18.3 Opportunity card anatomy

Each opportunity card should include:

- Opportunity title.
- Patient-care reason.
- Evidence used.
- Confidence / strength.
- Suggested next action.
- Suggested owner: clinician, MA, scheduler, billing, admin.
- Suggested timeframe.
- Whether it belongs in the note, patient summary, staff task, or billing preview.
- Whether it is patient-facing or internal only.
- Revenue/quality relevance when role-permitted.

## 18.4 Cutting-edge differentiators

AURA Note should eventually support these more advanced Patient Opportunity Analysis ideas:

- **One-more-question engine:** suggests the single highest-value question that could improve diagnosis confidence, HCC support, care quality, or billing integrity.
- **Care-gap bundling:** groups multiple appropriate preventive/chronic care opportunities into one patient-friendly plan rather than separate nagging prompts.
- **Opportunity-to-work conversion:** one click turns an accepted opportunity into note text, patient summary language, and an assigned staff task.
- **Clinical risk trajectory:** highlights trends over time, not just single abnormal values.
- **Revenue-hidden patient outputs:** the clinician can use internal financial/quality insight without exposing it to the patient summary.
- **Payer evidence precheck:** shows whether selected opportunities are likely to need stronger documentation, authorization, or follow-up evidence.
- **Provider style learning:** learns which opportunity types a clinician accepts or rejects, while preserving clinic policy and compliance rules.
- **Medical director oversight:** aggregates missed opportunities by provider, visit type, clinic, or payer.

---

# 19. Finalization Wizard Step 5: Billing & Attest

Step 5 should become one of the product's most commercially valuable areas. It is not full claims submission in MVP. It is the final internal review that shows whether the note, selections, patient-care plan, and billing package are ready enough for signature and downstream billing review.

## 19.1 Step 5 goals

- Give the clinician confidence that selected codes are supported.
- Give billing staff a clearer draft claim view after finalization.
- Catch obvious denial and documentation risks before signing.
- Make patient-care follow-up visible before the note is dispatched.
- Show estimated charge, patient out-of-pocket estimate, and likely clinic revenue when reliable data exists.
- Require attestations and acknowledgements.
- Preserve a human-in-the-loop approval path.

## 19.2 Step 5 screen sections

| Section | Purpose |
| --- | --- |
| Claim Readiness Score | A high-level readiness indicator with blockers, warnings, and advisories. |
| Draft Claim Preview | Shows selected codes/items as a preliminary claim package. |
| Payer Evidence Map | Connects each selected code to note/transcript/chart evidence. |
| E/M and MDM Support | Shows why the E/M level appears supported or not. |
| HCC / Risk Adjustment Review | Shows diagnosis support and RADV-style evidence needs. |
| Procedure / Service Detail Review | Confirms indication, consent, technique, result, units, modifiers, and documentation. |
| Patient Care Follow-through | Shows accepted plan items, staff tasks, follow-up appointments, labs, referrals, and patient instructions. |
| Financial Estimates | Shows total charge, likely allowed/reimbursed amount, and patient out-of-pocket estimate if data is sufficient. |
| Denial Risk Flags | Shows risks such as unsupported code, missing documentation, payer rules, duplicates, or conflicts. |
| Attestation | Requires clinician acknowledgement of note accuracy, selected items, patient summary, and human responsibility. |

## 19.3 Draft claim preview

The draft claim preview should make the finalized note visible as a claim-readiness object. It should not submit a claim in MVP. It should show:

- CPT/HCPCS codes.
- ICD-10 diagnoses tied to each service.
- E/M level.
- HCC-sensitive diagnoses, if any.
- Modifiers, units, place of service, and provider if available.
- Procedures/services selected.
- Estimated charges.
- Missing billing details.
- Payer-facing evidence snippets.
- Denial risk flags.
- Billing review status.

## 19.4 Billing and patient-care checks

Step 5 should not only be about revenue. It should also check whether the patient-care plan is complete and actionable.

Billing checks:

- Is every selected code supported?
- Are diagnoses linked to the right services?
- Does the E/M level match MDM or time evidence?
- Is medical necessity visible?
- Are required procedure details present?
- Are modifiers/units/place of service clear?
- Are HCC conditions supported with current evidence?
- Are any selected items incompatible or duplicative?
- Are payer rules or prior authorization issues visible?

Patient-care checks:

- Does every assessment have a plan?
- Are abnormal findings addressed?
- Are medication changes clear?
- Are follow-ups scheduled or assigned?
- Are referrals/labs/imaging assigned to staff when needed?
- Does the patient summary include the right instructions and red flags?
- Are MA follow-up questions resolved or routed?

## 19.5 Attestation statements

The clinician should attest to statements such as:

- I have reviewed and accepted the final note.
- I have reviewed and accepted the patient summary.
- I have reviewed selected codes/items and understand they remain my responsibility.
- I have resolved, closed, or assigned open history questions.
- I have reviewed any compliance blockers, warnings, and override reasons.
- I understand the draft claim preview is a support tool and not an automated claim submission.

---

# 20. Finalization Wizard Step 6: Sign & Dispatch

Step 6 makes the note and patient summary final. It should also trigger downstream work in a controlled way.

## 20.1 Dispatch behavior

When the clinician signs and dispatches:

- Recording is already ended.
- Final note becomes read-only.
- Patient summary becomes final.
- Full transcript is stored and available to authorized users.
- The note appears in Finalized Notes.
- Draft entry changes state or moves out of Draft Notes.
- Staff tasks are created from accepted plan items.
- MA follow-up tasks are either closed, assigned, or tracked.
- Draft claim preview is available to billing.
- Billing review flags are visible to billing staff.
- PDFs can be generated for note and patient summary.
- Copy/export actions are available based on role.

## 20.2 Finalized note view

Clicking a finalized note should not reopen the active note editor. It should open a final view with:

- Final Note tab.
- Patient Summary tab.
- Transcript tab for authorized roles.
- Billing Preview tab for authorized roles.
- Audit/Unused tab for authorized roles.
- Download Note PDF.
- Download Patient Summary PDF.
- Copy Note.
- Copy Patient Summary.
- View Staff Tasks.
- Start Addendum / Amendment if needed.

## 20.3 PDF and export behavior

AURA Note should support:

- Download final note PDF.
- Download patient summary PDF.
- Copy final note.
- Copy patient summary.
- Export to EHR when a connection exists.
- Manual copy/paste workflow when no connection exists.
- Audit trail of export/copy/download actions.

---

# 21. Patient Summary Experience

The patient summary should be patient-centered, easy to understand, and separated from billing optimization logic. It is one of the key trust-building outputs of AURA Note.

## 21.1 Required patient summary content

- Plain-language reason for visit.
- What was discussed.
- Assessment in patient-friendly terms.
- Medications or medication changes.
- Tests ordered or reviewed.
- Follow-up plan.
- Referrals or appointments needed.
- Red flags / when to seek urgent care.
- Self-care instructions.
- Questions to call about.
- Staff contact or next-step expectations.

## 21.2 Content that must stay out of patient summary

- Revenue opportunities.
- Payer strategy.
- Coding confidence scores.
- Draft claim details.
- HCC/RADV optimization commentary.
- Internal coaching commentary.
- Billing risk rationale.
- Staff-only tasks that are not patient-relevant.

## 21.3 Patient summary approval

The clinician must approve the patient summary separately from the final note. This ensures patient-facing language is accurate, appropriate, and not accidentally exposing internal logic.

---

# 22. Staff Worklists and Closed-Loop Follow-up

AURA Note should convert accepted plan items into staff work only after clinician approval. This is how the product moves from documentation to operations.

## 22.1 Worklist sources

Staff tasks can be created from:

- Accepted plan recommendations.
- History Gap questions assigned to MA.
- Follow-up appointments needing scheduling.
- Labs or imaging needing scheduling.
- Referrals needing coordination.
- Patient summary print/distribution tasks.
- Billing review flags.
- Patient Opportunity Analysis items accepted by clinician.
- Draft claim review flags.

## 22.2 Staff task anatomy

Each task should include:

- Patient/encounter reference.
- Task type.
- Owner role.
- Priority.
- Due date or timeframe.
- Source: plan item, history gap, billing review, patient summary, etc.
- Patient-facing instructions if applicable.
- Internal notes if applicable.
- Status.
- Completion evidence.

## 22.3 Task statuses

| Status | Meaning |
| --- | --- |
| Open | Task created and not yet claimed. |
| Assigned | Owner assigned. |
| In progress | Staff member started work. |
| Waiting on patient | Staff attempted contact or needs patient response. |
| Scheduled | Follow-up/procedure/referral/lab scheduled. |
| Completed | Task done. |
| Closed - not needed | Clinician/admin closed. |
| Escalated | Needs clinician/admin attention. |
| Overdue | SLA exceeded. |

---

# 23. Analytics and Dashboards

Analytics should support clinic leaders without turning the product into an overwhelming dashboard. The most useful analytics should connect workflow, revenue, quality, and coaching.

## 23.1 Core dashboards

| Dashboard | Key questions answered |
| --- | --- |
| Clinician Work | Which notes are unfinished, paused, blocked, or pending finalization? |
| Staff Work | Which follow-ups, MA questions, summaries, or scheduling tasks are open or overdue? |
| Documentation Quality | Where are notes missing key elements? Which visit types struggle? |
| Revenue Integrity | Where are supported codes missed? Where are selected codes unsupported? |
| Patient Opportunity | Which care gaps and high-value services are being accepted or missed? |
| Billing Preview | Which finalized notes need billing review? Where are draft claims incomplete? |
| Coaching | Which clinicians need support and what is improving over time? |
| Adoption | Are clinicians using Start Visit, recording, suggestions, wizard steps, and summaries? |

## 23.2 Metrics to include

- Notes finalized same day.
- Average time from visit start to final signature.
- Drafts stuck by workflow stage.
- Compliance blockers per visit type.
- History gaps per visit type.
- Open MA follow-up questions.
- Suggestion acceptance rate.
- Suggestion dismissal rate.
- Below-75% diagnosis overrides.
- Billing review flags.
- Draft claim readiness scores.
- HCC support opportunities accepted/removed.
- Preventive care opportunities accepted/removed.
- Staff task completion time.
- Patient summary generation and download rate.
- Coaching improvement trends.

---

# 24. Premium Coaching Module

Coaching should be premium. It should be framed as quality improvement, revenue integrity, training acceleration, and denial reduction. It should not feel punitive. It should give the treating clinician useful self-improvement insight and give admins a way to manage performance at scale.

## 24.1 Coaching input signals

- Full transcript.
- Final note.
- Original draft note.
- Visit duration.
- Documentation timing.
- Visit type.
- Selected codes/items.
- Removed suggestions.
- Override reasons.
- Compliance blockers.
- History gaps.
- Draft claim readiness.
- Billing review outcomes.
- Denial outcomes when available later.
- Staff task follow-through.

## 24.2 Coaching dimensions

| Dimension | What it measures |
| --- | --- |
| Documentation completeness | Whether the note captured essential encounter elements and transcript-mentioned details. |
| Billing optimization | Missed justified codes/services and unsupported selections. |
| Patient-voice fidelity | Whether the note reflects what the patient actually said. |
| Communication clarity | Organization, readability, and clinical usefulness of the note. |
| Clinical reasoning | Whether assessment and plan include rationale. |
| History-taking depth | Whether important questions were asked and documented. |
| E/M justification | Whether documentation supports selected E/M level. |
| HCC / risk adjustment integrity | Whether chronic/risk conditions are supported with current evidence. |
| Patient summary quality | Whether the summary is accurate, clear, and patient-safe. |
| Follow-up reliability | Whether accepted plan items become tasks and close. |
| Finalization behavior | Whether clinician skips, overrides, delays, or clears blockers appropriately. |

## 24.3 Coaching outputs

- Encounter-level coaching report.
- Weekly clinician scorecard.
- Monthly provider trend view.
- Heatmap by provider and metric.
- Peer benchmarks.
- Visit-type benchmarks.
- Micro-lessons.
- Override review queue.
- Billing review flag summary.
- Documentation habit insights.
- Denial-prevention learning when claims/denials later connect.

## 24.4 Coaching access rules

Only the treating clinician and admin/medical director should see coaching outputs. Billing staff can see billing details and transcripts, but not coaching outputs unless they also have an admin role. This is important because coaching must feel like education and quality improvement, not a billing surveillance tool.

## 24.5 Coaching ROI story

The premium coaching story should be simple:

- **Time saved:** clinicians learn how to document more efficiently.
- **Revenue captured:** missed supported codes and services decrease.
- **Training improved:** new clinicians receive targeted feedback based on real encounters.
- **Denials reduced:** unsupported codes, incomplete evidence, and missing attestations decline.
- **Quality improved:** patient voice, clarity, plan follow-through, and care gaps improve.

---

# 25. Product Safety, Human Review, and Compliance Posture

AURA Note should be ambitious but conservative in safety language. It suggests, organizes, drafts, compares, and flags. It does not independently diagnose, independently submit claims, independently release patient materials, or independently make high-risk clinical or billing decisions.

## 25.1 Human-in-the-loop rules

- Clinician owns final note content.
- Clinician owns diagnosis selection.
- Clinician owns final plan.
- Clinician owns attestation.
- Billing staff or designated billing workflow owns claim submission when that expansion exists.
- Admin/medical director owns coaching and quality oversight.
- AI can suggest and explain, but not finalize.

## 25.2 Evidence-first AI behavior

Every material suggestion should be tied to evidence. If the app cannot find evidence, it should say so. It should not fill gaps by inventing facts.

The app should distinguish:

- Said in transcript.
- Written in current note.
- Found in chart context.
- Inferred from multiple sources.
- Missing / not supported.
- Needs clinician confirmation.

## 25.3 Revenue-integrity-first stance

AURA Note should maximize justified revenue, not maximize billing at any cost. The product should support the highest appropriate revenue that is backed by the care delivered and the documentation available. This is important for trust, compliance, and long-term commercial viability.

---

# 26. MVP Scope and Release Tiers

AURA Note's MVP should be robust enough to prove the complete product thesis. It should not be a narrow note generator. However, claims submission and denials processing can be deferred as long as a draft claim preview exists.

## 26.1 MVP scope

- AURA Note name and clinician-first framing.
- Schedule Builder with appointment creation.
- One-to-one appointment-note shell relationship.
- Draft Notes and Finalized Notes sections.
- Start Visit required before editing.
- Automatic recording and transcription.
- Live transcript preview and full transcript drawer.
- EHR/chart context rendering or manually attached chart context.
- Note editor with templates and dot phrases.
- Visit Selections panel.
- Suggestions panel with all category families.
- Compliance & Quality Review with blockers.
- History Gap Review with MA assignment.
- Low-confidence diagnosis warning and override reason.
- All six Finalization Wizard steps.
- Patient Opportunity Analysis.
- Patient Summary approval.
- Step 5 draft claim preview and billing/attestation review.
- Sign & Dispatch.
- PDFs/copy/export for final note and patient summary.
- Staff worklist task creation.
- Basic analytics.
- Premium coaching blueprint, with initial scorecard/report if feasible.

## 26.2 Later expansions

- Full clearinghouse claims submission.
- Claim status tracking.
- 277/835 parsing.
- Denial normalization.
- Appeal letter generation.
- Payer-specific rule library.
- External schedule replacement integrations.
- Advanced EHR write-back.
- Full enterprise benchmarking.
- Medical director cosign workflows.
- Advanced value-based care contracts and payer attribution logic.
- Automated previsit patient outreach.
- Patient portal delivery.

---

# 27. Commercial Differentiation and Market-Informed Feature Bets

A public market scan shows that leading ambient AI companies already market combinations of documentation, coding, EHR integration, revenue-cycle intelligence, clinical summaries, referral letters, after-visit summaries, and specialty customization. AURA Note should therefore compete above the scribe layer.

## 27.1 What is becoming table stakes

- Ambient recording and note generation.
- Specialty-specific notes.
- Coding suggestions.
- ICD-10/CPT support.
- E/M assistance.
- EHR integration.
- After-visit summaries.
- Referral letters.
- Clinical Q&A or information surfacing.
- Revenue cycle / coding-aware positioning.

## 27.2 AURA Note differentiating bets

| Bet | Functional description | Commercial value |
| --- | --- | --- |
| Sign-blocking finalization gates | Prevent signing until selected items, suggestions, history gaps, note, summary, billing review, and attestation are complete. | Reduces rework, denials, and incomplete notes. |
| MA follow-up as first-class workflow | Missing questions can be assigned after the clinician visit and block signing until adjudicated. | Converts uncertainty into operational work rather than clinician memory. |
| Visit Selections evidence object | Every selected item carries confidence, evidence, rationale, and audit trail. | Makes codes and plan items easier to defend. |
| Patient Opportunity Analysis | Combines care gaps, chronic disease, HCC, services, prevention, and plan tasks. | Connects better patient care with appropriate revenue capture. |
| Draft claim preview before signature | Shows billing readiness without requiring full claims submission in MVP. | Creates immediate billing value and a pathway to claims expansion. |
| Payer-ready note section | Selected codes are justified in the final note with concise evidence. | Helps billers and payers understand why services apply. |
| Revenue-hidden patient summary | Patient output is clean and patient-centered while internal revenue logic stays internal. | Protects trust and reduces reputational risk. |
| Premium coaching | Converts every encounter into documentation and revenue-improvement data. | Creates high-margin upsell and leadership value. |
| M17 companion integration | Embeds note workflow in the broader clinician cockpit and clinic operations system. | Creates suite value beyond standalone scribe pricing. |
| Staff worklist conversion | Accepted plan items create assigned tasks. | Reduces dropped follow-up and makes value visible to operations leaders. |

## 27.3 Commercial packages to consider

| Package | Included value |
| --- | --- |
| AURA Note Core | Schedule-linked notes, recording/transcription, note editor, basic suggestions, final note, patient summary, copy/download/export. |
| AURA Note Charge Integrity | Visit Selections, coding support, Compliance & Quality Review, Step 5 draft claim preview, payer evidence map. |
| AURA Note Opportunity | Patient Opportunity Analysis, care gaps, quality capture, high-value service prompts, staff task conversion. |
| AURA Note Coaching Premium | Scorecards, heatmaps, benchmarks, micro-coaching, ROI reporting, provider trend dashboards. |
| AURA Note Enterprise | Multi-site analytics, external schedule/EHR integrations, admin governance, advanced permissions, claims/denials expansion. |

---

# 28. Open Product Decisions for Founder Review

This section is meant to make editing easier. Each decision can be marked Keep, Revise, Defer, or Remove.

## 28.1 Naming and ecosystem

- Confirm AURA Note as final product name.
- Decide whether legacy RevenuePilot/RP2 appears anywhere in the product or only in internal notes.
- Decide whether AURA Note is a standalone app, a module inside M17, or both.
- Decide whether M21 Charge Integrity is separate or bundled as a premium tier.

## 28.2 MVP workflow

- Confirm all six wizard steps are MVP.
- Confirm all suggestion categories are present in version one.
- Confirm Start Visit locks/unlocks editing.
- Confirm recording is required for normal documentation.
- Confirm whether an exception path is allowed when recording fails.
- Confirm which compliance blockers require admin override versus clinician resolution.

## 28.3 Role and privacy decisions

- Confirm transcript access by role.
- Confirm billing staff transcript access.
- Confirm coaching access restrictions.
- Confirm whether MAs can see any draft note content.
- Confirm what all staff can see in final notes and patient summaries.

## 28.4 Commercial packaging

- Confirm coaching as premium.
- Confirm draft claim preview is MVP even without claims submission.
- Confirm Patient Opportunity Analysis is core or premium.
- Confirm whether Charge Integrity is included in core or a paid tier.
- Confirm whether value-based care / MA features are a named package.

## 28.5 Product experience

- Decide how minimal tabs should be enforced.
- Decide where Finalized Notes live relative to Draft Notes.
- Decide whether Visit Selections panel is below note editor, collapsible, or side-by-side.
- Decide how aggressive alerts should be without overwhelming clinicians.
- Decide how much chart context appears before Start Visit.

---

# 29. Source Backbone and Market Scan Notes

## 29.1 Internal source backbone

This document consolidates and expands the prior RevenuePilot/RP2 planning materials, the nontechnical planning drafts, the RevenuePilot Concept document, the founder review answers, and the clinician documentation coaching plan. Key inherited concepts include Schedule Builder, appointment-to-note relationship, active Documentation tab, live recording/transcription, Selected Codes/Suggestions behavior, Compliance & Quality Review, History Gap Review, the six-step Finalization Wizard, patient summary approval, billing/attestation review, Sign & Dispatch, staff worklists, claims/denials expansion, analytics, and premium coaching.

## 29.2 Public market scan notes used for commercial positioning

Public pages reviewed during this planning pass indicate that ambient clinical documentation vendors increasingly market coding, revenue-cycle, EHR integration, after-visit summary, and workflow automation capabilities. The implication is that AURA Note should not rely on "AI scribe" positioning alone. It should differentiate through finalization gates, Visit Selections, MA follow-up blockers, Patient Opportunity Analysis, draft claim preview, payer-ready note sections, and premium coaching.

Representative public sources reviewed:

- Abridge - Ambient AI for Revenue Cycle: revenue-cycle gaps, audit-ready billable documentation, linked evidence, real-time visit diagnosis suggestions, HCC/documentation impact.
- Ambience Healthcare: documentation and coding platform, revenue integrity, HCC/E/M/ICD/CPT support, audit defensibility, ROI positioning.
- Microsoft Dragon Copilot: documentation, surfacing information, automating tasks, coding suggestions, clinical evidence summaries, referral letters, after-visit summaries.
- Suki: documentation, coding, clinical reasoning, Q&A, and EHR integration.
- Freed: ICD-10/CPT codes, patient instructions, referral letters.
- DeepScribe: AI coding, real-time insights, audit-ready documentation, note customization.
- CMS Evaluation & Management Services and CMS RADV materials: support the importance of documentation standards, E/M compliance, and diagnosis support for risk adjustment.
- NCQA HEDIS resources: support the importance of quality-measure and care-gap capture in value-based care.

---

# 30. One-Page Product North Star

AURA Note is the clinician's encounter companion inside the AURA ecosystem. It starts with the schedule, requires Start Visit, records and transcribes the visit, renders chart context cleanly, supports documentation in real time, lets clinicians choose Visit Selections, blocks unsafe or incomplete finalization, converts justified codes into a payer-readable note section, turns accepted plan items into staff work, creates a patient-safe summary, presents a draft claim preview, stores the full transcript for authorized review, and powers premium coaching.

The MVP should prove this full loop. The long-term product should become the outpatient documentation, charge integrity, care opportunity, and coaching layer that helps clinics save clinician time, improve care follow-through, capture appropriate revenue, reduce denials, and train clinicians with less manual auditing.

---

# 31. First Release Lock: What Must Be True Before Build Starts

This section turns the product vision above into a first-release definition that is specific enough for product review, design work, development planning, QA, and pilot preparation. The first release should not be treated as a narrow ambient-note MVP. It should be treated as the smallest complete version of the AURA Note loop: schedule-linked note shell, active recorded visit, transcript-aware documentation, evidence-linked suggestions, Visit Selections, compliance blockers, history-gap follow-up, six-step finalization, payer-readable final note, patient-safe summary, draft claim preview, staff work creation, finalized note storage, transcript retention for authorized roles, and premium coaching signal capture.

The first release should align with AURA ClinicOS and M17 by treating each encounter as a controlled operational event. AURA Note is the M17 documentation and finalization companion. It should not replace the NP Decision Cockpit; it should extend it by helping the clinician capture the visit, select supported items, produce a defensible note, and dispatch follow-up work.

## 31.1 Release name and release thesis

**Release name:** AURA Note First Release / AURA Note v1.

**Release thesis:** A clinician can complete a primary care encounter from schedule to signed note without leaving AURA Note, while the system preserves source evidence, blocks unresolved finalization gaps, creates patient-safe and billing-aware outputs, and captures coaching signals for future improvement.

**Release posture:** Clinician-first, human-in-the-loop, evidence-first, revenue-integrity-first, and AURA ClinicOS-compatible.

**Release success definition:** A pilot clinic can use AURA Note for real primary care visits and demonstrate a complete workflow: schedule item, note shell, Start Visit, recording/transcription, note drafting, suggestions, Visit Selections, history gap management, finalization, patient summary, draft claim preview, dispatch, staff tasks, finalized note view, transcript review, and basic dashboards.

## 31.2 Release non-negotiables

1. Every appointment has a one-to-one note shell.
2. A note does not become an active draft until the clinician opens the appointment and clicks Start Visit.
3. Start Visit starts the timer, recording, and transcription automatically.
4. The note editor is locked when the visit is not actively started or intentionally resumed.
5. A documented exception path exists when recording is unavailable, refused, or technically fails.
6. The transcript is diarized by speaker and remains available after finalization to authorized users.
7. Chart context is rendered in simple, distinct, easy-to-follow slices and also packaged into structured AI context.
8. The Suggestions panel includes all MVP suggestion families.
9. The Visit Selections panel replaces Selected Codes and includes codes, diagnoses, differentials, services, procedures, plan items, and staff-work candidates with different visual card types.
10. A clinician can manually add a Visit Selection, and the app re-evaluates it for support and confidence.
11. Diagnosis selection below 75% confidence requires a reasoned override if the clinician keeps it as a diagnosis.
12. Low-confidence overrides are flagged for coaching and billing review.
13. Compliance and Quality Review can block finalization.
14. History Gap questions can be answered by the clinician, closed, or assigned to an MA.
15. Any unresolved, unassigned, or unadjudicated History Gap item that is required for a kept item blocks signing.
16. Step 1 of the Finalization Wizard requires a keep/remove decision on every selected item.
17. Removed selected items are preserved in an unused/audit list.
18. Step 2 requires clinician review of all final-pass suggestions above the configured threshold, with an MVP default of greater than 50% confidence.
19. Clinicians cannot skip Suggestion Review.
20. Step 3 creates an enhanced note and patient summary without inventing facts.
21. Selected codes are added to the final note in a clean payer-readable support section.
22. Services, tasks, and plan items are incorporated into the plan rather than the payer support section.
23. Step 4 allows compare/edit, re-beautify, Patient Opportunity Analysis, AI Planning Assistant, and explicit approval of both note and patient summary.
24. Step 5 includes billing, draft claim preview, charge readiness, compliance attestation, patient-care review, and patient financial awareness where applicable.
25. Step 6 signs and dispatches the final note, patient summary, transcript references, task outputs, and draft claim preview to the correct destinations.
26. Draft Notes and Finalized Notes are separate but adjacent work areas.
27. Finalized notes cannot reopen into the active editor without an amendment workflow.
28. Patient summaries exclude revenue opportunities, payer logic, coding confidence, and internal coaching commentary.
29. Coaching is a premium product layer, but first-release events should capture coaching signals from day one.
30. Claims and denials submission are not required in the first release, but draft claim/claim-readiness preview is required.

## 31.3 Release boundaries

### Included in first release

- AURA Note app shell and role-aware navigation.
- Schedule Builder and Schedule view.
- External schedule compatibility posture.
- Appointment-to-note shell creation.
- Draft Notes and Finalized Notes work areas.
- Documentation workspace.
- Patient/context bar.
- Start/Stop/Resume Visit controls.
- Recording, live transcription, transcript drawer, and post-finalization transcript access.
- Note editor, templates, dot phrases, autosave, and editing lock behavior.
- Chart context package.
- AI Suggestions panel with all MVP suggestion families.
- Visit Selections panel.
- Compliance and Quality Review panel.
- History Gap Review panel and MA follow-up loop.
- Six-step Finalization Wizard.
- Patient Opportunity Analysis.
- AI Planning Assistant.
- Billing & Attest step with draft claim preview.
- Sign & Dispatch.
- Patient summary.
- Staff task creation.
- Basic dashboards.
- Premium coaching data capture and at least an initial coaching report/dashboard stub.
- Role-based visibility and audit logging.
- First-release settings for templates, dot phrases, visit types, thresholds, and clinic policies.

### Excluded from first release unless already easy to connect

- Full clearinghouse submission.
- Claim status monitoring.
- 277/835 parsing.
- Denial appeal generation.
- Fully automated EHR writeback of final note.
- Patient portal delivery of summaries.
- Full AURA ClinicOS RTLS and flow optimization.
- Full medical director chart review/cosign workflow, unless needed for the pilot site.
- Full payer rule library across every payer.
- Full enterprise benchmarking.
- Multi-specialty packs beyond primary care.

### Must be designed for but can be staged later

- SMART-on-FHIR embedded launch.
- Deep EHR integrations.
- AURA ClinicOS Visit Readiness Graph.
- AURA ClaimGuard / M21 workflows.
- AURA Concierge patient-facing messaging.
- AURA PreVisit handoff ingestion.
- AURA QualityGuard and CareOps opportunity feeds.
- AURA Copilot and AI governance controls.

---

# 32. AURA ClinicOS and M17 Alignment

AURA Note should be described and built as a companion to AURA ClinicOS, especially M17 / AURA NP Cockpit. The first release must preserve the original AURA Note workflow while making sure it can later plug into the ClinicOS model of VisitGraph, EvidenceNodes, Tasks, Rules, Events, AuditLog, and module-specific work queues.

## 32.1 AURA Note's role in the ClinicOS ecosystem

AURA ClinicOS is the larger outpatient operating system. It coordinates readiness, flow, revenue, quality, safety, patient engagement, staff work, and governance across the clinic. AURA Note is the encounter documentation and finalization layer inside that ecosystem.

| ClinicOS concept | What AURA Note should do in v1 |
| --- | --- |
| M17 / NP Decision Cockpit | Give the clinician the active documentation, recording, suggestion, selection, finalization, and dispatch layer during the encounter. |
| VisitGraph | Represent the note as a visit-linked object with source evidence, readiness blockers, suggestions, selections, and finalization status. |
| EvidenceNode | Treat transcript snippets, note text, chart data, labs, medications, problem list items, forms, and staff answers as evidence for suggestions and final outputs. |
| Task | Turn accepted plan items, MA follow-up questions, scheduling needs, billing review needs, and unresolved actions into owned work. |
| Rule | Use configurable rules for finalization blockers, low-confidence overrides, billing warnings, transcript requirements, role access, and patient-summary exclusions. |
| AuditLog | Record all high-value decisions: Start Visit, Stop Visit, suggestion accepted/removed, override reason, history gap assignment, re-beautify, approvals, attestation, dispatch. |
| M21 / Charge Integrity | Provide draft claim preview, claim-readiness score, documentation sufficiency, code support, modifier caveats, and billing holds without auto-submitting charges. |
| M23 / Copilot Runtime | Treat AI as source-linked draft support that cannot diagnose, code, bill, order, or determine medical necessity autonomously. |
| M24 / AI Governance | Preserve prompt/output/source/approval/rejection metadata for future evaluation, safety review, and model monitoring. |

## 32.2 M17 companion behavior

AURA Note should inherit M17's operating premise: the clinician should start at the point of decision, not the point of discovery. In practice, this means AURA Note should not force the clinician to manually hunt through the EHR to build the note. It should surface the relevant agenda, reason for visit, safety flags, visit type, recent utilization, medications, quality gaps, RCM caveats, infection status, care-management opportunities, and decisions needed.

The first release should support this even if the full M17 module is not yet built. In that case, AURA Note should include an M17-compatible encounter header and context package that can later be replaced by the full NP Cockpit feed.

## 32.3 M17-to-AURA Note handoff

When a clinician opens a scheduled visit, AURA Note should receive or construct the following handoff package:

- Patient identity and preferred name.
- Appointment date, time, clinician, site, and visit type.
- Encounter ID or temporary encounter shell.
- Patient-stated reason for visit when available.
- Staff-completed intake or previsit data when available.
- Open decisions requiring clinician judgment.
- Recent utilization summary.
- Problem list and active chronic conditions.
- Medication and allergy summary.
- Latest relevant vitals and labs.
- Quality gaps and preventive care opportunities.
- Revenue integrity caveats such as possible services, payer caveats, or missing documentation.
- Infection/safety flags if available.
- Existing staff tasks or previsit blockers.
- Source timestamps and confidence for each information slice.

## 32.4 AURA Note-to-M17 outputs

After finalization, AURA Note should provide M17 and the larger AURA ecosystem with:

- Final clinician note.
- Patient summary.
- Final Visit Selections.
- Removed/unused items.
- Draft claim preview.
- Claim-readiness score.
- History Gap resolutions.
- Staff tasks created.
- Follow-up plan.
- Attestation metadata.
- Transcript reference and access policy.
- Coaching signal summary.
- Defect/override events.

## 32.5 Human accountability boundary

AURA Note should use strong decision support but not autonomous decision-making. In first-release language:

- The clinician decides diagnoses, differentials, plans, note content, patient summary approval, attestation, and signature.
- Billing staff or the configured billing workflow decides final charge submission when that exists.
- Staff can complete assigned tasks, but they do not make diagnosis or coding decisions unless their role explicitly permits a defined action.
- AI can summarize, draft, explain, classify, and recommend tasks, but it cannot finalize diagnoses, codes, charges, medical necessity, orders, or patient financial conclusions.

---

# 33. First Release Screen Inventory

Each screen should be planned as a production command surface, not merely a report. Every screen should answer: what is happening, what needs attention, who owns it, what evidence supports it, what action can be taken, and what is blocked.

## 33.1 Global app shell

**Purpose:** Provide role-aware navigation and patient/encounter context.

**Required elements:**

- AURA Note logo/product name.
- Current user and role.
- Site/clinic selector if the user has access to more than one site.
- Main navigation: Schedule, Draft Notes, Finalized Notes, Worklists, Analytics, Coaching, Settings.
- Optional M17/ClinicOS launcher.
- Global search for patient, appointment, note, or task based on permissions.
- Alert indicator for overdue tasks, unassigned history gaps, recording errors, or notes blocked from signing.
- Help/support menu.

**Required states:** loading, permission denied, no site selected, demo data mode, integration degraded, and normal.

## 33.2 Schedule Builder / Schedule view

**Purpose:** Create and manage same-day and future appointments, each of which creates a note shell.

**Primary users:** MA, scheduler, clinician, admin.

**Required components:**

- Day/week calendar view.
- Provider/care-pod filter.
- New Appointment button.
- Click-on-calendar appointment creation.
- Appointment detail drawer.
- Appointment cards with patient, time, clinician, visit type, note status, readiness indicator, and action buttons.
- Start Visit button for clinicians.
- Open Note Shell / View Draft / View Final actions depending on status.
- External schedule source indicator.

**Appointment popup required fields:**

- Patient identifier or patient lookup.
- Patient name display after lookup.
- Date/time.
- Duration.
- Clinician/provider.
- Visit type.
- Appointment modality: in-person, telehealth, phone, hybrid.
- Reason for visit/chief concern.
- Appointment source: internal, imported, manual correction, external schedule.
- Insurance/payer summary if available.
- Interpreter/accommodation needs.
- Priority/urgency.
- Optional previsit notes.

**Required behavior:**

- Creating an appointment creates a linked inactive note shell.
- Imported appointments also create note shells.
- Canceling or no-showing an appointment changes note visibility but preserves audit history.
- Rescheduling retains the note shell relationship unless the user intentionally creates a new encounter.
- Duplicate appointment detection warns when the same patient/provider/time appears duplicated.
- External schedule mode disables internal editing where the external source is authoritative but still allows AURA Note to attach the note shell and documentation state.

## 33.3 Draft Notes

**Purpose:** Show all note shells and active drafts that require clinician action.

**Required components:**

- Filter by clinician, date, visit type, note status, blocked/unblocked, and search.
- Note cards or table rows.
- Status badge.
- Last updated timestamp.
- Timer/recording status if active or paused.
- Open/Resume action.
- Blocker count.
- MA follow-up count.
- Finalization step indicator if in wizard.

**Draft status categories:**

- Inactive shell.
- Active recording.
- Paused draft.
- Documentation in progress.
- Ready to finalize.
- Compliance blocked.
- History follow-up pending.
- Finalization Step 1, 2, 3, 4, 5, or 6.
- Signature blocked.
- Error/recovery needed.

## 33.4 Finalized Notes

**Purpose:** Store and display completed notes in the same general work area as Draft Notes while preventing accidental editing.

**Required components:**

- Finalized note list.
- Filters by date, clinician, patient, visit type, export status, billing status, and task status.
- Read-only final note viewer.
- Patient summary viewer.
- Transcript access button for authorized roles.
- Draft claim preview button for authorized roles.
- Download note PDF.
- Download patient summary PDF.
- Copy/export actions.
- Amendment request action.

**Required behavior:**

- Clicking a finalized note opens a read-only viewer, not the editable note editor.
- Amendments must create a new workflow or addendum state rather than silently altering the final note.
- All exports record who exported what and when.
- Finalized notes remain visible to staff according to permission rules.

## 33.5 Documentation workspace

**Purpose:** The core clinician workspace for active encounter documentation.

**Required zones:**

1. Sticky Patient/Visit Bar.
2. Visit Controls Bar.
3. Main Note Editor.
4. Visit Selections panel.
5. Suggestions panel.
6. Compliance and Quality Review drawer.
7. History Gap Review drawer.
8. Transcript drawer.
9. Chart Context drawer/panel.

**Layout principle:** Use the note editor as the center, with side panels and drawers instead of forcing the clinician to move across many tabs. Tabs may exist inside context drawers only where needed.

---

# 34. Core Objects and State Models

First release planning should define product objects before implementation. These objects are intentionally implementation-neutral but specific enough that product, design, and engineering can build the same thing.

## 34.1 Appointment

An appointment is the scheduled care activity that creates the note shell.

**Minimum fields:** appointment ID, patient ID, clinician ID, site, date/time, duration, visit type, modality, source, status, note shell ID, payer summary, reason for visit, created by, created timestamp, last updated timestamp.

**Statuses:** scheduled, checked in, roomed, started, paused, completed, finalized, canceled, no-show, rescheduled, imported, source-conflict.

## 34.2 Note shell

The note shell is created when the appointment exists. It is not editable until Start Visit.

**Statuses:** shell-created, active-draft, paused-draft, compliance-blocked, history-gap-blocked, ready-to-finalize, finalizing, pending-signature, signed-dispatched, amended, archived.

## 34.3 Recording session

The recording session captures the encounter audio and drives transcription.

**Statuses:** not-started, recording, paused, stopped, processing-transcript, transcript-complete, failed, exception-approved.

**Required metadata:** start time, stop time, pause intervals, device/source, participant/speaker labels, recording exception reason if applicable, transcript completion status.

## 34.4 Transcript

The transcript is the visit speech record. It must be diarized and accessible after finalization to authorized roles.

**Required fields:** transcript ID, recording session ID, speaker-labeled segments, timestamps, confidence by segment when available, correction history, transcript source, finalization inclusion status, access policy.

**Allowed clinician actions:** view, search, copy snippet into note, flag correction, link segment as evidence, cite segment for Visit Selection support.

## 34.5 Suggestion

A suggestion is an AI- or rule-supported item that has not yet become a clinician-selected item.

**Suggestion types:** diagnosis, differential, ICD code, CPT/service, E/M support, HCC/risk adjustment evidence, quality gap, care-management opportunity, medication/safety issue, history gap question, follow-up plan item, patient instruction, billing caveat, documentation gap.

**Statuses:** proposed, visible, hidden, accepted, dismissed, expired, superseded, final-pass, blocked, low-confidence, needs-evidence.

**Required fields:** type, title, confidence, rationale, supporting evidence, missing evidence, source categories, last evaluated time, applicable visit type, impact tags, safety level, billing relevance, patient-summary eligibility, next action.

## 34.6 Visit Selection

A Visit Selection is a clinician-selected item that may influence the note, plan, staff tasks, patient summary, or draft claim preview.

**Visit Selection categories:** diagnosis, differential, CPT/service, procedure, preventive care item, quality item, care-management item, medication item, plan item, task item, patient instruction, billing review item.

**Statuses:** selected, selected-manual, needs-review, supported, weakly-supported, low-confidence-override, kept, removed, moved-to-plan, moved-to-payer-support, unused, final-accepted, billing-review, coaching-review.

**Required fields:** category, color/type, source, confidence, evidence list, missing evidence, clinician decision, reason for override/removal when applicable, payer-support placement, plan placement, task-conversion status, audit trail.

## 34.7 History Gap Question

A History Gap Question is an actionable question that could increase confidence, improve care, or close a documentation/billing gap.

**Statuses:** open, answered-by-clinician, added-to-note, sent-to-MA, assigned, answered-by-MA, closed-not-needed, unresolved-blocker, expired, no-longer-relevant.

**Blocking rule:** If the question is required to support a kept Visit Selection or finalization gate, it blocks signing until answered, closed with reason, or assigned/resolved according to policy.

## 34.8 Compliance Alert

A Compliance Alert is a blocker or warning surfaced by Compliance and Quality Review.

**Severity levels:** info, warning, blocker, hard-stop.

**Required fields:** title, affected item, reason, evidence, missing evidence, recommended action, owner, severity, can clinician override, can admin override, required attestation, audit result.

## 34.9 Final note

The final note is the accepted enhanced version after compare/edit approval and attestation.

**Required sections:** visit header, reason for visit, history, exam/objective findings as applicable, assessment, plan, patient instructions as appropriate, follow-up, care coordination, payer-readable code/service support section, attestation/signature metadata.

## 34.10 Patient summary

The patient summary is the patient-facing version of the encounter output.

**Required sections:** what we discussed, assessment in patient-friendly language, what to do next, medications/instructions if included by clinician, warning signs, follow-up plan, pending tasks/tests, contact instructions.

**Must exclude:** coding confidence, payer justification, revenue opportunity, HCC/risk adjustment commentary, internal coaching, billing optimization, draft claim estimates unless the clinic intentionally creates a separate patient financial document.

## 34.11 Draft claim preview

The draft claim preview is not a submitted claim. It is an internal claim-readiness view.

**Required elements:** candidate codes/items, evidence, confidence, missing documentation, payer caveats, modifier possibilities, duplicate-billing risk, patient responsibility estimate when available, clinic revenue estimate when available, hold/release status, human review ownership.

## 34.12 Staff task

Staff tasks are created from accepted plan items, scheduling needs, history gaps, billing review, patient summary actions, or dispatch follow-up.

**Statuses:** open, assigned, in-progress, waiting-on-patient, waiting-on-external, completed, closed-not-needed, escalated, overdue, canceled.

**Required fields:** task type, owner, patient/visit, source selection, due date, priority, instructions, evidence, completion requirements, audit history.

---

# 35. Chart Context Package and AI Context Preparation

AURA Note's EHR/chart connection should not simply dump chart data into the interface. It should parse the chart into useful slices and convert those slices into a structured context package for AI support.

## 35.1 Chart context goals

1. Help the clinician understand the patient quickly.
2. Help suggestions use the right facts with the right confidence.
3. Preserve source evidence for every meaningful suggestion.
4. Avoid overwhelming the user with raw chart dumps.
5. Prepare the future M17/VisitGraph integration.

## 35.2 Context slices in first release

| Slice | What it includes | Why it matters |
| --- | --- | --- |
| Identity and visit | Patient, appointment, encounter, clinician, visit type, modality. | Prevents documenting against the wrong encounter. |
| Reason for visit | Chief concern, patient agenda, staff-entered notes, imported schedule reason. | Grounds documentation and suggestions. |
| Problems and diagnoses | Active problem list, recent diagnoses, chronic conditions, prior HCC-relevant items. | Supports assessment, specificity prompts, and opportunity analysis. |
| Medications and allergies | Active meds, recent changes, allergies, medication risks, refill/adherence signals if available. | Supports safety, chronic disease, and plan prompts. |
| Vitals and measurements | Recent vitals, trends, abnormal values, home readings if available. | Supports MDM, chronic disease follow-up, and quality gaps. |
| Labs and diagnostics | Recent labs, imaging, pending results, abnormal trends. | Supports care gaps, chronic disease, and documentation evidence. |
| Preventive and quality | AWV status, screenings, immunizations, HEDIS/STARS-style gaps when available. | Supports care quality and revenue-integrity opportunities. |
| Utilization | ED, hospital, specialist, urgent care, recent transitions. | Supports TCM, risk, care coordination, and opportunity analysis. |
| Prior notes and records | Recent note summaries, outside records, discharge summaries. | Reduces chart hunting and supports continuity. |
| Billing/coverage context | Eligibility, payer caveats, service coverage notes when available. | Supports draft claim preview and compliance alerts. |
| Staff/previsit input | Rooming info, forms, HRA, questionnaires, MA notes, social barriers. | Supports note completeness and plan tasks. |

## 35.3 Chart context UI rules

- Show the most relevant context by default, not every available fact.
- Use collapsible sections and drawers before adding tabs.
- Every fact should have a source label and last-updated date when available.
- Stale facts should be visually marked.
- Conflicting facts should be marked as conflict, not hidden.
- AI-generated summaries should remain visually distinct from verified chart data.
- Sensitive data should honor role permissions.

## 35.4 AI context package

The AI context package should include structured sections rather than a single unorganized prompt. At a product level, it should contain:

- Encounter metadata.
- Current note text.
- Transcript segments since the last analysis.
- Full transcript summary when needed.
- Visit Selections with current statuses.
- Suggestions already accepted/dismissed.
- Chart context slices.
- Patient opportunity inputs.
- Compliance blockers.
- History Gap questions and answers.
- Prior AI outputs and clinician decisions.
- Source evidence map.
- Rules and thresholds relevant to the current visit type.

## 35.5 AI call trigger rules

To avoid excessive cost and clinician distraction, AI calls should run only after meaningful change.

**Suggested trigger categories:**

- Start Visit context initialization.
- Meaningful note change, such as a new assessment, plan, diagnosis, procedure, or significant history segment.
- Meaningful transcript change, such as a new symptom, medication, risk factor, diagnosis discussion, plan decision, or procedure discussion.
- Manual Visit Selection added.
- Suggestion accepted or removed.
- History Gap answered.
- Finalization Wizard launch.
- Re-beautify requested.
- Patient Opportunity Analysis opened or refreshed.
- Step 5 Billing & Attest opened.

**Non-trigger examples:** punctuation-only edits, cursor movement, minor formatting changes, repeated transcript filler, duplicate statements, and rapid typing within a short debounce window.

---

# 36. Documentation Workspace: Detailed Behavior

## 36.1 Patient / Visit Bar

The Patient / Visit Bar should be sticky and always visible during active documentation. It should include:

- Patient display name and preferred name.
- DOB/age if permitted.
- Visit type.
- Modality.
- Clinician.
- Appointment time.
- Encounter/note status.
- Recording status.
- Finalization blocker count.
- Quick access to chart context.
- Quick access to transcript.
- Quick access to Visit Selections.

## 36.2 Visit Controls Bar

Required controls:

- Start Visit.
- Stop/Pause Visit.
- Resume Visit.
- Timer.
- Recording status.
- Transcript status.
- Finalize Note.
- Compliance & Quality Review drawer.
- History Gap Review drawer.

**Start Visit behavior:**

- Activates note shell.
- Starts timer.
- Starts recording.
- Starts live transcription.
- Unlocks editor.
- Loads chart context package.
- Runs initial suggestion/context analysis.
- Creates audit event.

**Stop/Pause behavior:**

- Pauses timer.
- Stops recording or pauses capture depending on product policy.
- Preserves autosaved note.
- Keeps note in Drafts.
- Allows exit and resume.
- Creates audit event.

**Finalize Note behavior:**

- Enabled only when minimum pre-finalization requirements are met.
- Ends recording and timer if still running.
- Freezes current note/transcript/selections snapshot.
- Opens Finalization Wizard.
- Creates audit event.

## 36.3 Recording and transcription behavior

Recording is MVP critical. First release should treat active recording as the normal prerequisite for editing. The product should still define exception cases so a real clinic is not blocked by a device problem.

**Required recording features:**

- Automatic recording on Start Visit.
- Visible recording indicator.
- Timer linked to visit state.
- Stop/pause/resume behavior.
- Live transcript preview.
- Full transcript drawer.
- Speaker diarization.
- Transcript search.
- Transcript-to-note snippet insertion.
- Transcript segment evidence linking.
- Post-finalization transcript availability for authorized roles.

**Allowed recording exceptions:**

- Patient declines recording.
- Technical failure.
- Telehealth platform incompatible.
- Clinician documents from a historical encounter or phone note where recording is not available.
- Clinic policy permits manual documentation for a defined visit type.

**Exception requirements:**

- Clinician must select reason.
- Optional admin policy can require second approval.
- Note should be labeled no-recording exception.
- Coaching metrics should account for missing transcript.
- Certain transcript-dependent coaching and fidelity metrics should not be computed or should be marked unavailable.

## 36.4 Note editor

The editor should be robust but calm. Required features:

- Rich text formatting.
- Structured headings.
- Templates drawer.
- Dot phrase expansion.
- Autosave.
- Undo/redo.
- Copy/paste support.
- Section insertion.
- Evidence highlight links where applicable.
- Draft AI text indicator.
- Manual note text vs AI-enhanced note separation.
- Locked state before Start Visit.
- Read-only state after finalization.

## 36.5 Templates and dot phrases

Template families:

- Specialty-specific.
- Appointment/visit-type-specific.
- Provider-specific.
- Clinic-approved.

Dot phrases:

- Provider dot phrases.
- Clinic-wide dot phrases.
- Visit-type dot phrases.
- Patient-instruction dot phrases.
- Billing-support language templates, limited to compliant language and not unsupported claims.

Settings should allow clinic administrators to create clinic-wide dot phrases and approve clinic-wide templates. Provider-specific templates should not override clinic-approved compliance requirements.

---

# 37. Suggestions and Visit Selections: First-Release Logic

## 37.1 Suggestion families required in v1

All suggestion categories should be represented in the first release. Some categories can be rule-light at launch, but the UI and object model should support them.

| Category | Example output | Primary destination |
| --- | --- | --- |
| Diagnosis suggestions | Possible active diagnosis with confidence and evidence. | Visit Selections or differential. |
| Differential suggestions | Possible diagnosis not yet confirmed. | Differential card or diagnosis override workflow. |
| ICD-10 specificity | Stage, acuity, severity, laterality, complication, control status. | Visit Selection evidence and final note support. |
| CPT/service suggestions | AWV, E/M, procedure, injection, vaccine, ECG, spirometry, RPM setup, telehealth. | Visit Selections and draft claim preview. |
| E/M and MDM support | Problems addressed, data reviewed, risk, time, complexity caveats. | Billing & Attest and payer support section. |
| HCC/risk adjustment evidence | Conditions to review, not automatic coding. | Patient Opportunity Analysis and Visit Selections. |
| Quality gaps | A1c, UACR, eGFR, BP, vaccines, screenings, AWV/HRA. | Plan items, patient summary if accepted. |
| Care-management opportunities | TCM, CCM/APCM, RPM/RTM, BHI/CoCM, CHI/PIN. | Patient Opportunity Analysis and plan/tasks. |
| Medication safety | Adherence, refill gap, interaction, high-risk medication, affordability. | Plan/task suggestions. |
| History gaps | Questions that increase support or improve care. | History Gap Review. |
| Documentation gaps | Missing elements needed to support selected items. | Compliance & Quality Review. |
| Patient instruction suggestions | Follow-up, warning signs, lifestyle, medication instructions. | Patient summary after clinician approval. |
| Staff task suggestions | Schedule follow-up, lab, referral, vaccine, outreach, MA question. | Staff worklist after clinician acceptance. |

## 37.2 Suggestion card anatomy

Every suggestion card should include:

- Title.
- Category.
- Confidence.
- Severity/importance.
- Why suggested.
- Supporting evidence.
- Missing evidence.
- Source types: transcript, note, chart, lab, medication, prior record, staff input.
- Action buttons: accept, dismiss, convert to differential, convert to diagnosis, assign question, add to plan, mark not relevant.
- Patient-summary eligibility indicator.
- Billing relevance indicator.
- Last updated time.
- Audit/access indicator if sensitive.

## 37.3 Confidence rules

Suggested defaults:

- 90-100%: Strongly supported; still requires clinician decision.
- 75-89%: Supported but clinician should verify.
- 50-74%: Weak/moderate; can appear as final-pass suggestion, but diagnosis selection requires caution.
- Below 50%: Do not include in Step 2 final-pass list by default; may appear only in exploratory drawers or Patient Opportunity Analysis when clearly labeled.

Diagnosis rule: Adding an item as a diagnosis below 75% confidence triggers a warning and requires an override reason if kept as diagnosis.

## 37.4 Visit Selections panel

The Visit Selections panel is the clinician-owned list of selected items. It should not be treated as only codes.

**Required filters:** all, diagnoses, differentials, codes/services, procedures, quality, care management, plan items, staff tasks, billing review, low-confidence, missing evidence.

**Card color families:**

- Diagnosis / condition.
- Differential / possibility.
- CPT/service/procedure.
- Quality/preventive.
- Care management.
- Plan item.
- Staff task.
- Billing/compliance.
- Warning/low confidence.

**Behavior rules:**

- Selections should update as new context arrives.
- Selections can be manually added.
- Manual selections receive AI/rule feedback on the next analysis.
- Selections should not remain visibly persistent through every wizard step if they are not relevant to the current step.
- Removed selections remain in unused/audit list.
- Codes go into the payer-readable note section during compose.
- Services/tasks/plan items go into the plan.
- Staff task candidates do not become staff tasks until accepted in planning/finalization.

---

# 38. Compliance and Quality Review Alert Catalog

This section defines the alert panel requested in the founder review. It should be configurable by clinic policy, but first release needs a robust default catalog.

## 38.1 Severity model

| Severity | Meaning | User impact |
| --- | --- | --- |
| Info | Helpful context; no action required. | Does not block. |
| Warning | Something may reduce quality, confidence, or revenue. | Does not always block. |
| Blocker | Must be resolved, assigned, removed, or overridden before signing. | Blocks final signature. |
| Hard stop | Cannot proceed without required action and often admin/clinician leadership reason. | Blocks finalization/dispatch. |

## 38.2 Finalization blockers

The following should stop finalization or signing by default:

1. No active recording/transcript and no approved recording exception.
2. Patient/appointment/encounter identity mismatch.
3. Note not linked to an appointment or encounter.
4. Missing clinician attestation.
5. Note editor has unsaved changes at finalization.
6. Transcript still processing when transcript-dependent support is required.
7. Mandatory selected item review incomplete.
8. Mandatory final-pass suggestion review incomplete.
9. Patient summary not approved.
10. Final note not approved.
11. Open required History Gap question.
12. History Gap assigned to MA but not adjudicated when needed for a kept item.
13. Low-confidence diagnosis kept below 75% without override reason.
14. Selected code/service lacks required documentation support.
15. Diagnosis or service support relies only on unsupported AI inference.
16. Possible duplicate billing conflict not addressed.
17. Preventive plus E/M or modifier-sensitive combination not reviewed.
18. TCM candidate missing required dates or required visit timing review.
19. CCM/APCM/RPM/care-management candidate missing consent, eligibility, or time/activity requirement.
20. Procedure/service candidate missing procedure note elements, consent, result, medication/product, or required documentation.
21. Vaccine/injection candidate missing product/admin distinction or lot/product evidence where required by clinic workflow.
22. Telehealth visit missing patient location, identity confirmation, or telehealth consent when required.
23. Safety escalation unresolved: critical vital, positive suicide-risk workflow, urgent symptom, or other clinic-defined red flag.
24. Infection-control hard stop if integrated: room/equipment/precaution state unresolved for relevant procedure or visit.
25. Required billing/attestation checkboxes incomplete.
26. Patient financial notice/GFE/ABN-like workflow unresolved when configured and applicable.
27. Re-beautify required because source note changed after enhanced note approval.
28. Draft claim preview has a hold that requires clinician action.
29. User lacks permission to sign for the clinician/encounter.
30. Attempted dispatch to a destination not approved or not available.

## 38.3 Warnings that should not always block

- Low-confidence suggestions not selected.
- Quality opportunity not addressed but not mandatory.
- Patient Opportunity Analysis item not accepted.
- Possible but unsupported care-management opportunity.
- Minor documentation clarity issue.
- Non-critical missing historical detail.
- Patient summary language could be simplified.
- Suggested follow-up interval differs from default but clinician documented a plan.
- Billing estimate unavailable but claim preview is not blocked.
- Transcript has low-confidence diarization segment not used as evidence.

## 38.4 Alert card anatomy

Each alert card should include:

- Alert name.
- Severity.
- Why it matters.
- Affected selection/note section.
- Required action.
- Owner.
- Evidence.
- Missing evidence.
- Allowed resolution actions.
- Override requirements.
- Audit behavior.

## 38.5 Resolution actions

Allowed actions should include:

- Add missing note text.
- Add answer from transcript.
- Ask patient / send to MA.
- Remove selected item.
- Convert diagnosis to differential.
- Keep with reason.
- Assign to billing review.
- Assign to admin/medical director review.
- Mark not applicable with reason.
- Request re-analysis.
- Re-beautify.

---

# 39. History Gap Review and MA Follow-up Requirements

## 39.1 Purpose

History Gap Review converts missing history into explicit work. It should reduce incomplete documentation, unsupported selections, and after-the-fact clinician memory burden.

## 39.2 History Gap sources

A History Gap question can be generated from:

- A selected diagnosis with missing evidence.
- A selected CPT/service with missing support.
- An E/M/MDM documentation gap.
- A quality gap requiring patient-specific information.
- A care-management opportunity requiring consent, goals, barriers, or activity details.
- A medication issue requiring patient clarification.
- Patient Opportunity Analysis.
- Billing & Attest review.
- Manual clinician creation.

## 39.3 History Gap card required fields

- Question.
- Plain-language version if MA will ask patient.
- Supported item(s).
- Why it matters.
- Evidence already present.
- Missing evidence.
- Required or optional.
- Blocking status.
- Suggested owner.
- Due time.
- Patient contact instructions.
- Resolution options.

## 39.4 Clinician actions

- Answer now and add to note.
- Answer now and keep in History Gap record.
- Add answer to specific note section.
- Send to MA.
- Close as not needed.
- Remove related Visit Selection.
- Convert diagnosis to differential.
- Assign to billing review.

## 39.5 MA actions

- View assigned question in worklist.
- Contact patient or review existing source according to clinic policy.
- Add answer.
- Mark unable to reach.
- Request clinician clarification.
- Close with reason where permitted.
- Return to clinician for adjudication.

## 39.6 Signing rules

- Open required questions block signing.
- Assigned but unanswered required questions block signing unless policy permits clinician attestation to sign with pending follow-up.
- Answered MA questions require clinician review if they affect diagnosis, code, procedure, or plan.
- Optional questions do not block but should remain visible.
- Closing a required question requires reason and is logged.

---

# 40. Finalization Wizard: Locked First-Release Specification

The six-step wizard is required for MVP. It should feel guided rather than bureaucratic. The UI should show a progress indicator across all phases and should always make clear what is left before signature.

## 40.1 Wizard-wide rules

- The wizard opens from a frozen snapshot of the note, transcript, Visit Selections, suggestions, and chart context.
- Edits during the wizard are allowed only in defined areas and should trigger re-analysis or re-beautify when they materially change final output.
- Every step has a completion requirement.
- Users cannot skip steps.
- Every decision is audited.
- Final note and patient summary approval are separate decisions.
- The final note is the accepted enhanced note, not the original draft.
- Re-beautify replaces the prior enhanced version using the current left-side/original text and current selected items.

## 40.2 Step 1 - Visit Selection Review

**Goal:** Decide whether every clinician-selected item should remain in the final package.

**Layout:** original note on the left; review cards on the right; History Gap drawer available.

**Required cards:** all active Visit Selections at wizard launch.

**Required user decision:** keep, remove, convert, or send for follow-up as applicable.

**Card details:**

- Category.
- Current confidence.
- Evidence summary.
- Missing support.
- Why selected.
- Why suggested.
- Exact note/transcript highlight when available.
- Potential note section impact.
- Draft claim impact.
- Patient summary eligibility.

**Completion gate:** every card decided; any blocking History Gap either answered, assigned, removed, or closed according to policy.

## 40.3 Step 2 - Suggestion Review

**Goal:** Review unselected final-pass suggestions so the clinician does not miss meaningful opportunities.

**Inclusion rule:** final-pass suggestions greater than 50% confidence by default, plus any hard-rule documentation/compliance items even if confidence is not expressed the same way.

**Required user decision:** keep or remove every included suggestion.

**Keep behavior:** moves item into the selected set and may trigger new support requirements.

**Remove behavior:** places item into unused/audit list with reason optional by default and required for high-impact items.

**Completion gate:** all included suggestions reviewed.

## 40.4 Step 3 - Compose

**Goal:** Generate the enhanced note and patient summary.

**Progress indicator phases:**

1. Analyzing Content.
2. Enhancing Structure.
3. Beautifying Language.
4. Final Review.

**Inputs:** final original note text, transcript, Visit Selections kept, answers to History Gap questions, chart context package, compliance blockers, and patient-summary rules.

**Outputs:** enhanced clinician note, patient summary, payer-readable support section, plan task mapping, source integrity validation, and warnings if facts could not be supported.

**No-fabrication rule:** The AI cannot add clinical facts that are not in the original note, transcript, chart context, clinician-approved selections, or documented staff answers. If it proposes a better phrasing that adds specificity, the source must be clear or the specificity must be removed.

## 40.5 Step 4 - Compare & Edit

**Goal:** Let the clinician compare original and enhanced note, review patient summary, and use planning/opportunity tools before final approval.

**Left panel:** original/current note, editable.

**Right panel:** enhanced note, editable if policy allows, visually distinct from original.

**Info panel tabs:** overview, transcript, codes/selections, unused items, audit, patient summary.

**Required tools:**

- Re-beautify.
- AI Planning Assistant.
- Patient Opportunity Analysis.
- Patient Summary review toggle.
- Note approval.
- Patient Summary approval.

**Re-beautify rule:** If the left note changes materially after compose, re-beautify should replace the enhanced version and regenerate the patient summary. Prior enhanced versions are preserved in audit history but not presented as current.

## 40.6 Step 5 - Billing & Attest

**Goal:** Combine billing readiness and patient-care attestation into one final internal review.

**Required sections:**

1. Claim-readiness summary.
2. Candidate codes/items.
3. Payer-readable support preview.
4. Documentation sufficiency checks.
5. Duplicate-billing and modifier review.
6. Service-specific checklist.
7. Patient-care plan completeness.
8. Patient financial awareness when applicable.
9. Internal revenue estimate when available.
10. Out-of-pocket estimate when available.
11. Holds and unresolved billing issues.
12. Required attestations.

**Clinician-facing language:** The section should support appropriate capture without pressuring upcoding. It should show why an item appears, what evidence supports it, and what is missing.

**Completion gate:** all required attestations complete; all hard holds resolved, removed, or assigned according to policy.

## 40.7 Step 6 - Sign & Dispatch

**Goal:** Convert the reviewed package into final artifacts and route them appropriately.

**Actions triggered:**

- Final note becomes signed/dispatched.
- Patient summary becomes final.
- Finalized Notes entry is created or updated.
- Draft Notes entry changes to final/closed state.
- PDFs become available.
- Staff tasks are created.
- Draft claim preview is saved.
- Transcript access policy is applied.
- Coaching signals are queued.
- Audit events are written.

**Dispatch destinations:**

- Finalized Notes area.
- Patient summary viewer/export.
- Staff worklists.
- Billing/draft claim preview.
- Optional EHR export/copy workflow.
- Optional patient delivery workflow if configured.

---

# 41. Patient Opportunity Analysis: Robust v1 Definition

Patient Opportunity Analysis replaces the older Neural Patient Analysis name. It should be one of AURA Note's premium-feeling differentiators because it connects better patient care, value-based quality, care management, and appropriate revenue without exposing revenue logic to patients.

## 41.1 Purpose

Patient Opportunity Analysis scans the chart context, transcript, note, Visit Selections, quality gaps, and plan to identify opportunities that may improve health outcomes, close care gaps, reduce future utilization, improve follow-through, or support appropriate services. It should be framed as a clinical and operational assistant, not a coding pressure tool.

## 41.2 Opportunity domains

| Domain | Examples | Default destination |
| --- | --- | --- |
| Chronic disease optimization | Diabetes labs, CKD monitoring, BP control, COPD/asthma follow-up, CHF monitoring. | Plan items, staff tasks, clinician prompts. |
| Preventive and quality care | AWV, vaccines, cancer screening, depression screening, fall risk, HRA gaps. | Plan, patient summary, staff tasks. |
| Risk adjustment review | Chronic conditions not assessed this year, specificity opportunities, objective evidence to review. | Clinician-only internal prompts; never patient summary. |
| Care management | TCM, CCM/APCM, PCM, RPM/RTM, BHI/CoCM, CHI/PIN candidates. | Plan/task suggestions and Billing & Attest review. |
| Medication optimization | Refill gaps, adherence, affordability, high-risk medication, renal dosing, med reconciliation. | Plan, tasks, patient summary when accepted. |
| Social barriers | Transportation, food, housing, digital access, caregiver support, interpreter needs. | Staff tasks and patient-safe plan. |
| Utilization risk | Recent ED/hospital, missed follow-up, high-risk transitions, repeated urgent visits. | Follow-up and care coordination tasks. |
| Patient engagement | Portal/SMS access, education needs, missed instructions, teach-back opportunity. | Patient summary and tasks. |
| Documentation and follow-up | Missing plan specificity, pending tests, referrals, return precautions. | Note/plan suggestions. |
| Revenue integrity | Supported service opportunities, draft claim caveats, documentation requirements. | Internal-only billing/clinician view. |

## 41.3 Opportunity card anatomy

Each card should show:

- Opportunity title.
- Patient-care rationale.
- Evidence.
- Source dates.
- Confidence.
- Suggested action.
- Suggested timing.
- Owner if accepted.
- Patient-summary eligibility.
- Revenue/billing relevance hidden from patient-facing outputs.
- Risk if ignored.
- Related quality/care-management category.
- Acceptance/dismissal reason.

## 41.4 Risk rating

The overall patient risk rating can be visible to clinicians. It should not present itself as a final diagnosis or actuarial conclusion. It should be an encounter-support rating based on evidence and designed to guide attention.

Risk rating inputs can include:

- Acute concern severity.
- Chronic disease control.
- Recent utilization.
- Medication risk.
- Social barriers.
- Quality gaps.
- Missed follow-up.
- Abnormal vitals/labs.
- Care-management eligibility.
- Patient comprehension/follow-through concerns.

## 41.5 Accepted opportunity behavior

When accepted:

- Plan items are inserted into the plan.
- Staff tasks are created when assigned.
- Patient-safe instructions can appear in patient summary after clinician approval.
- Billing-relevant items appear only in internal draft claim/charge-readiness views.
- The decision is logged for coaching and analytics.

---

# 42. Billing & Attest: First-Release Feature Set

Step 5 should be a first-release showcase. It should help the clinician and billing team see whether the note, patient care plan, and candidate billing package make sense before signing.

## 42.1 Step 5 principles

- Show billing support without pressuring upcoding.
- Separate clinical care from revenue impact.
- Make missing evidence obvious.
- Make duplicate-billing risk obvious.
- Require human attestation.
- Keep patient-facing summary free of internal revenue logic.
- Save a draft claim preview, not a submitted claim.

## 42.2 Draft claim preview sections

1. Candidate code/service list.
2. E/M support view.
3. Diagnosis support view.
4. Procedure/service support view.
5. Preventive/AWV support view.
6. Care-management support view.
7. Modifier possibilities and caveats.
8. Duplicate-billing risk.
9. Documentation hold list.
10. Payer/coverage caveats if available.
11. Patient financial estimate if available.
12. Internal revenue estimate if available.
13. Claim readiness score.
14. Required human review owner.

## 42.3 Service-specific readiness checks

| Service/item | Example readiness checks |
| --- | --- |
| E/M | Problems addressed, data reviewed, risk, time if used, MDM support, medical necessity note. |
| Preventive + E/M | Separately identifiable problem work, modifier caveat, patient reason, documentation separation. |
| AWV/IPPE | Eligibility, HRA, required elements, preventive plan, patient summary, quality gaps. |
| TCM | Discharge date, interactive contact, face-to-face timing, medication reconciliation, decision complexity. |
| CCM/APCM/PCM | Eligibility, consent, care plan, chronic conditions, time/activity, duplicate service risk. |
| RPM/RTM | Consent, device setup, device data, patient ability, alert plan, monthly communication. |
| Vaccine | Product/admin distinction, lot/product evidence if captured, route/site, consent/VIS if required. |
| Injection/medication admin | Medication, dose, route, site, indication, supply/product evidence, supervision policy. |
| Procedure | Consent, indication, technique, findings, complications, aftercare, equipment/supply support. |
| ECG/spirometry/labs | Order/reason, result/interpretation when needed, equipment/result evidence, follow-up plan. |
| Telehealth | Modality, patient location, consent, emergency backup, payer caveat if known. |

## 42.4 Attestation statements

Required attestation prompts can include:

- I reviewed and approved the final clinician note.
- I reviewed and approved the patient summary.
- I reviewed selected diagnoses, codes, services, and plan items.
- I reviewed low-confidence diagnosis overrides and documented my reason where applicable.
- I reviewed unresolved warnings and accept responsibility for the documented plan.
- I understand the draft claim preview is not a submitted claim.
- I confirm selected billing-related items are supported by care delivered and documentation available to me.
- I confirm patient-facing summary content excludes internal revenue and payer optimization details.

## 42.5 Holds and release logic

A draft claim preview can have hold states:

- No hold.
- Documentation hold.
- Clinician clarification hold.
- Billing review hold.
- Payer/coverage hold.
- Duplicate-billing hold.
- Patient financial notice hold.
- Missing consent/eligibility hold.

A hold should always have owner, reason, evidence, due date, and release criteria.

---

# 43. Role Permissions and Visibility Matrix for v1

## 43.1 Permission principles

- Minimum necessary access.
- Treat transcripts and billing details as sensitive.
- Treat coaching outputs as premium and role-restricted.
- Preserve staff visibility for final notes and patient summaries as requested, but limit sensitive internal details.
- Apply role-based visibility before AI retrieval and before display.

## 43.2 First-release access matrix

| Feature/content | Treating clinician | MA/staff | Billing | Admin/medical director | Patient |
| --- | --- | --- | --- | --- | --- |
| Schedule | Own/all allowed schedules | Yes | Limited | Yes | No |
| Inactive note shell | Yes | Limited | No | Yes | No |
| Active draft note | Yes | Limited only if assigned/configured | No by default | Yes if policy permits | No |
| Start/Stop Visit | Treating clinician | No | No | No except override support | No |
| Recording controls | Treating clinician | No | No | No except admin policy | No |
| Full transcript | Yes | No by default | Yes | Yes | No |
| Live transcript preview | Yes | No | No | No | No |
| Suggestions | Yes | Limited task-relevant | Billing-relevant only | Yes | No |
| Visit Selections | Yes | Task-relevant only | Yes | Yes | No |
| Compliance alerts | Yes | Assigned items only | Billing-relevant only | Yes | No |
| History Gap assignments | Yes | Assigned questions | No unless billing-related | Yes | No |
| Final note | Yes | Yes | Yes | Yes | No by default |
| Patient summary | Yes | Yes | Yes/limited | Yes | Yes |
| Draft claim preview | Yes | No | Yes | Yes | No |
| Patient Opportunity Analysis | Yes | Accepted tasks only | Billing-relevant only | Yes | Patient-safe accepted items only |
| Coaching output | Own only | No | No unless admin | Yes | No |
| Settings | Provider preferences | No or limited | No | Yes | No |

## 43.3 Audit events that must be captured

- Appointment created/imported/changed/canceled.
- Note shell created.
- Start Visit clicked.
- Recording started/stopped/failed/exception approved.
- Note edited and autosaved.
- Suggestion accepted/dismissed.
- Visit Selection manually added, kept, removed, converted, or overridden.
- Low-confidence diagnosis override reason.
- History Gap answered, assigned, closed, or returned.
- Compliance alert resolved/overridden.
- Finalization step completed.
- Re-beautify requested.
- Note approved.
- Patient summary approved.
- Billing attestation completed.
- Sign & Dispatch completed.
- Export/download/copy.
- Transcript accessed.
- Coaching report viewed.

---

# 44. Settings and Configuration Required in v1

AURA Note should include enough settings for a pilot clinic to adapt the product without asking developers to change every rule.

## 44.1 Clinic settings

- Clinic name/site.
- Default visit length.
- Default visit types.
- Provider list.
- Staff roles.
- Schedule source.
- Export/copy workflow.
- Patient summary template.
- Recording exception policy.
- Transcript retention policy.
- Finalized note retention/export policy.

## 44.2 Provider settings

- Preferred note templates.
- Preferred sections.
- Personal dot phrases.
- Default patient summary style.
- Display preferences.
- Notification preferences.

## 44.3 Template settings

- Specialty-specific templates.
- Appointment-type templates.
- Provider-specific templates.
- Clinic-approved templates.
- Required template sections for certain visit types.
- Template version history.

## 44.4 Dot phrase settings

- Clinic-wide dot phrases.
- Provider dot phrases.
- Patient instruction dot phrases.
- Billing-safe standardized language snippets.
- Quality/preventive plan snippets.
- Review/approval workflow for clinic-wide phrases.

## 44.5 AI and suggestion settings

- Confidence thresholds.
- Final-pass threshold, default greater than 50%.
- Low-confidence diagnosis threshold, default less than 75%.
- Suggestion categories enabled.
- Alert severity rules.
- Patient summary exclusions.
- Revenue-opportunity visibility.
- AI call throttling rules.
- Source requirements for suggestion types.

## 44.6 Finalization settings

- Required wizard steps.
- Blocking alert catalog.
- Allowed override roles.
- Required attestation statements.
- MA follow-up blocking rules.
- Billing review required conditions.
- Draft claim preview fields enabled.

---

# 45. First-Release Functional Requirements

This list gives product/design/development a traceable set of first-release requirements. It is intentionally more specific than a strategy document.

## 45.1 Schedule and note shell requirements

| ID | Requirement |
| --- | --- |
| AN-FR-001 | The system shall create a note shell for every appointment. |
| AN-FR-002 | The system shall preserve a one-to-one relationship between appointment and note shell unless an authorized user creates an explicit replacement workflow. |
| AN-FR-003 | The Schedule Builder shall support manual appointment creation by click-on-calendar and New Appointment. |
| AN-FR-004 | The Schedule view shall support imported appointments from an external schedule source. |
| AN-FR-005 | The appointment card shall display note status and Start Visit action where permitted. |
| AN-FR-006 | Starting a visit shall activate the note shell and make it appear in Draft Notes. |
| AN-FR-007 | Canceled/no-show appointments shall preserve note shell audit history. |
| AN-FR-008 | The system shall warn on duplicate patient/time/provider appointments. |

## 45.2 Documentation requirements

| ID | Requirement |
| --- | --- |
| AN-FR-009 | The note editor shall remain locked until Start Visit is clicked or an approved exception workflow is used. |
| AN-FR-010 | Start Visit shall start timer, recording, transcription, autosave, and chart context loading. |
| AN-FR-011 | Stop Visit shall pause/stop recording and preserve draft state. |
| AN-FR-012 | Resume Visit shall restart timer and recording/transcription as appropriate. |
| AN-FR-013 | The editor shall autosave without requiring manual save. |
| AN-FR-014 | The editor shall support templates and dot phrases. |
| AN-FR-015 | The system shall support specialty, appointment-type, provider, and clinic-approved templates. |
| AN-FR-016 | Clinic administrators shall be able to create clinic-wide dot phrases. |
| AN-FR-017 | The transcript drawer shall show speaker-labeled transcript segments. |
| AN-FR-018 | The full transcript shall remain available after finalization for authorized users. |

## 45.3 Suggestion and selection requirements

| ID | Requirement |
| --- | --- |
| AN-FR-019 | The Suggestions panel shall support all first-release suggestion families. |
| AN-FR-020 | Each suggestion shall show confidence, rationale, evidence, and missing support. |
| AN-FR-021 | The system shall only refresh suggestions after meaningful change or configured triggers. |
| AN-FR-022 | Accepted suggestions shall become Visit Selections. |
| AN-FR-023 | Users shall be able to manually add Visit Selections. |
| AN-FR-024 | Manual Visit Selections shall be evaluated by AI/rules on the next analysis. |
| AN-FR-025 | A diagnosis selected below 75% confidence shall trigger warning and require override reason if kept as diagnosis. |
| AN-FR-026 | Low-confidence diagnosis overrides shall flag for coaching and billing review. |
| AN-FR-027 | Visit Selections shall support category filters and color-coded card families. |
| AN-FR-028 | Removed Visit Selections shall remain in unused/audit list. |

## 45.4 Compliance and History Gap requirements

| ID | Requirement |
| --- | --- |
| AN-FR-029 | Compliance and Quality Review shall display blockers and warnings. |
| AN-FR-030 | Configured blockers shall prevent final signing. |
| AN-FR-031 | Each alert shall show affected item, reason, evidence, missing evidence, owner, and required action. |
| AN-FR-032 | History Gap Review shall show questions that improve care, documentation, or selection confidence. |
| AN-FR-033 | Any History Gap question can be sent to MA for follow-up. |
| AN-FR-034 | Unresolved required History Gap questions shall block signing. |
| AN-FR-035 | MA answers that affect diagnosis, code, or plan shall require clinician review before signing. |
| AN-FR-036 | Closing a blocking History Gap shall require a reason. |

## 45.5 Finalization requirements

| ID | Requirement |
| --- | --- |
| AN-FR-037 | The Finalization Wizard shall include all six required steps. |
| AN-FR-038 | Step 1 shall require a decision on every active Visit Selection. |
| AN-FR-039 | Step 2 shall require review of final-pass suggestions above the configured threshold. |
| AN-FR-040 | Step 3 shall generate enhanced note and patient summary with progress phases. |
| AN-FR-041 | Step 3 shall include selected codes in payer-readable support section. |
| AN-FR-042 | Step 3 shall place services/tasks/plan items into the plan rather than payer support section. |
| AN-FR-043 | Step 4 shall provide side-by-side compare/edit. |
| AN-FR-044 | Step 4 shall provide re-beautify using current left-side original note. |
| AN-FR-045 | Step 4 shall require approval of final note and patient summary. |
| AN-FR-046 | Step 5 shall include draft claim preview, claim-readiness checks, and attestation. |
| AN-FR-047 | Step 6 shall sign and dispatch final artifacts. |
| AN-FR-048 | Final note shall be the accepted enhanced version. |

## 45.6 Patient summary and task requirements

| ID | Requirement |
| --- | --- |
| AN-FR-049 | The patient summary shall exclude internal revenue/coding/coaching logic. |
| AN-FR-050 | The patient summary shall require clinician approval before dispatch. |
| AN-FR-051 | Accepted plan items shall create staff tasks where the item requires staff work. |
| AN-FR-052 | Staff tasks shall include owner, due date, source selection, priority, and completion requirements. |
| AN-FR-053 | Finalized Notes shall show final note and patient summary in read-only view. |
| AN-FR-054 | Final note and patient summary shall be downloadable as PDFs. |

## 45.7 Billing and coaching requirements

| ID | Requirement |
| --- | --- |
| AN-FR-055 | The system shall generate a draft claim preview after finalization review. |
| AN-FR-056 | The draft claim preview shall not submit a claim. |
| AN-FR-057 | The draft claim preview shall show candidate items, evidence, missing documentation, duplicate risk, and holds. |
| AN-FR-058 | Charge candidates shall require human review before any future claim submission. |
| AN-FR-059 | The system shall capture coaching signals from transcript, final note, timing, selections, overrides, and blockers. |
| AN-FR-060 | Coaching outputs shall be visible only to the treating clinician and authorized admins unless policy expands access. |
| AN-FR-061 | Billing detail and transcripts shall be visible to treating clinicians, billing staff, and admins according to permissions. |
| AN-FR-062 | Staff shall be able to see patient summaries and final notes according to role policy. |

---

# 46. First-Release Analytics and Coaching

## 46.1 Core analytics in first release

The first release should include basic analytics even if premium coaching is a later paid unlock. Core analytics should show:

- Notes started.
- Notes finalized.
- Average time from appointment to Start Visit.
- Average visit recording duration.
- Average time in finalization wizard.
- Notes blocked by compliance.
- Notes blocked by History Gap questions.
- Number of MA follow-up tasks created.
- Suggestion acceptance rate.
- Low-confidence diagnosis override count.
- Draft claim preview holds.
- Patient summaries generated.
- Exports/downloads.
- Staff tasks created and completed.

## 46.2 Premium coaching capture

Coaching should be premium, but the system should capture signals from day one. The first release should store enough data to later produce:

- Documentation completeness.
- Billing optimization.
- Patient-voice fidelity.
- Communication clarity.
- Clinical reasoning.
- History-taking depth.
- E/M level justification.
- Override patterns.
- History Gap patterns.
- Suggestion acceptance/dismissal patterns.
- MA follow-up dependency patterns.
- Time saved/after-hours reduction.
- Denial-risk reduction proxies.

## 46.3 Coaching outputs for first release

Minimum desirable coaching outputs:

- Encounter-level coaching report stub.
- Clinician scorecard stub.
- Admin trend dashboard stub.
- Low-confidence override report.
- Missed opportunity report.
- Documentation blocker report.
- Time-to-close report.

## 46.4 Coaching privacy

- Treating clinician can see their own coaching.
- Admin/medical director can see organizational coaching.
- Billing staff cannot see coaching outputs unless also granted admin/quality role.
- Staff cannot see coaching outputs.
- Patients cannot see coaching outputs.

---

# 47. Edge Cases and Failure Modes

## 47.1 Schedule and note edge cases

- Appointment imported without patient match.
- Duplicate patient match.
- Patient ID entered incorrectly.
- Appointment rescheduled while note is active.
- Clinician starts wrong appointment.
- Two clinicians try to open same note.
- Appointment canceled after note started.
- No-show after partial documentation.
- Walk-in appointment created same day.

## 47.2 Recording/transcript edge cases

- Microphone unavailable.
- Browser permission denied.
- Patient declines recording.
- Recording starts but transcription fails.
- Transcript diarization wrong.
- Transcript delayed after finalization.
- Sensitive side conversation captured.
- Visit pauses and resumes multiple times.
- Telehealth recording not supported.

## 47.3 AI/suggestion edge cases

- AI suggests unsupported diagnosis.
- AI repeats same suggestion after dismissal.
- Suggestion confidence changes after new note text.
- Source evidence conflicts.
- AI cannot find source for a claim in enhanced note.
- Low-confidence diagnosis selected as diagnosis.
- Manual selection not supported by available data.
- Suggestion appears patient-sensitive and should not be in patient summary.

## 47.4 Finalization edge cases

- Clinician edits original note after enhanced note approval.
- Patient summary approved but note changed.
- Billing hold discovered in Step 5.
- MA follow-up returned during finalization.
- Re-beautify creates new issue.
- Final note export fails.
- User loses connection mid-wizard.
- User lacks permission to sign.

## 47.5 Billing edge cases

- Preventive + E/M conflict.
- Duplicate same-day service.
- TCM timing uncertain.
- CCM/APCM consent missing.
- Procedure documentation incomplete.
- Vaccine product/admin unclear.
- Telehealth payer caveat missing.
- Patient financial estimate unavailable.

## 47.6 Required fallback behavior

For each failure mode, the system should do one of the following rather than silently continuing:

- Show blocker.
- Show warning.
- Create task.
- Require override reason.
- Preserve draft and allow resume.
- Mark data stale or incomplete.
- Route to human review.
- Disable finalization until resolved.

---

# 48. First-Release Acceptance Test Scenarios

## 48.1 Core happy path

A clinician opens a scheduled chronic follow-up, clicks Start Visit, recording begins, transcript appears, suggestions populate, clinician selects diagnoses/services/plan items, clears blockers, enters wizard, reviews selections and suggestions, composes enhanced note and patient summary, approves both, completes Billing & Attest, signs, dispatches, and sees final note in Finalized Notes.

**Pass criteria:** final note, patient summary, transcript, draft claim preview, and staff tasks exist with correct permissions and audit events.

## 48.2 Medicare Advantage AWV plus chronic condition

Patient is due for AWV, diabetes monitoring, CKD labs, vaccine review, and chronic disease assessment. System suggests quality gaps, AWV support, chronic disease specificity prompts, and care-management possibilities.

**Pass criteria:** accepted items enter plan/payer support correctly; patient summary excludes revenue logic; draft claim preview shows AWV/chronic items as candidates with evidence.

## 48.3 TCM visit

Patient recently discharged. System surfaces discharge date, interactive contact need, medication reconciliation, pending tests, face-to-face timing, and care coordination tasks.

**Pass criteria:** missing TCM dates create blockers or billing holds; accepted tasks enter plan; unsupported TCM candidate is not finalized as ready.

## 48.4 Low-confidence diagnosis override

AI suggests a diagnosis at 68% confidence. Clinician adds it as diagnosis.

**Pass criteria:** warning appears; clinician must choose not add, add as differential, or override with reason; override flags for coaching and billing review.

## 48.5 MA History Gap follow-up

A kept Visit Selection requires an answer. Clinician sends question to MA after the patient visit.

**Pass criteria:** note signing is blocked until MA answer is returned and clinician adjudicates, or clinician closes/removes the dependent item with reason.

## 48.6 Patient summary safety

The clinician accepts a patient-facing instruction but also has internal revenue opportunities in Patient Opportunity Analysis.

**Pass criteria:** patient summary includes only patient-safe instructions; internal revenue opportunities never appear.

## 48.7 Recording exception

Patient declines recording. Clinician selects exception reason and documents manually.

**Pass criteria:** editor unlocks only after approved exception path; note is labeled no-recording exception; transcript-dependent coaching is marked unavailable; finalization still requires all other gates.

## 48.8 Draft claim preview hold

A procedure candidate lacks required documentation.

**Pass criteria:** Step 5 shows documentation hold with missing elements; clinician can add documentation, remove candidate, or assign review; claim preview is not marked clean until resolved.

## 48.9 Finalized note access

Staff member opens Finalized Notes.

**Pass criteria:** staff sees final note and patient summary according to policy but cannot view transcript, billing detail, or coaching unless permitted.

## 48.10 Re-beautify after edit

Clinician edits left-side original note after compose.

**Pass criteria:** system marks enhanced note stale and requires re-beautify before final approval.

---

# 49. Pilot Launch Checklist

## 49.1 Product readiness checklist

- Schedule Builder works with manual appointments.
- External schedule import path is represented even if not fully connected.
- Appointment creates note shell.
- Start Visit activates recording/transcription and editor.
- Draft Notes and Finalized Notes work.
- Suggestions populate with evidence.
- Visit Selections work with filters and color-coded cards.
- Low-confidence override works.
- Compliance panel blocks finalization.
- History Gap Review assigns to MA and blocks signing where required.
- Six-step wizard works end to end.
- Patient Opportunity Analysis works.
- Step 5 draft claim preview works.
- Sign & Dispatch works.
- PDF downloads work.
- Staff tasks are created.
- Transcript access is controlled.
- Coaching signals are captured.

## 49.2 Clinical/compliance readiness checklist

- Clinic leadership approves recording policy.
- Patient consent/notice language is approved.
- No-recording exception policy is approved.
- Role visibility matrix is approved.
- Compliance blocker catalog is approved.
- Patient summary exclusions are approved.
- Billing/attestation language is approved.
- Low-confidence diagnosis override policy is approved.
- MA follow-up policy is approved.
- Draft claim preview disclaimer is approved.
- Coaching privacy policy is approved.

## 49.3 Pilot success metrics

- Percent of scheduled visits with started notes.
- Percent of started notes finalized same day.
- Median time from visit end to signed note.
- Median finalization wizard time.
- Transcript availability rate.
- Compliance blocker rate.
- History Gap assignment and resolution rate.
- Suggestion acceptance rate.
- Low-confidence override count.
- Draft claim preview clean/readiness rate.
- Patient summary generation rate.
- Staff task completion rate.
- Clinician satisfaction.
- Billing team satisfaction.
- Coaching report usefulness.

---

# 50. First-Release Implementation Sequence for Planning

This is not a technical stack plan. It is the product order in which the release should be built and reviewed so each slice is usable.

## 50.1 Slice 1 - App shell, roles, demo data, and schedule

Build the shell, navigation, demo users, Schedule Builder, appointment cards, and note shell creation. Review in browser with synthetic patients.

## 50.2 Slice 2 - Draft Notes and Documentation workspace

Build Draft Notes, Start Visit, timer, recording placeholder, transcription placeholder, note editor, autosave, templates, and dot phrases.

## 50.3 Slice 3 - Chart context and live suggestions

Build chart context slices, Suggestions panel, AI/rule context packaging, suggestion card anatomy, and evidence display.

## 50.4 Slice 4 - Visit Selections and compliance blockers

Build Visit Selections, manual add, confidence updates, low-confidence override, Compliance & Quality Review, and History Gap Review.

## 50.5 Slice 5 - MA follow-up and staff tasks

Build MA assignment workflow, task worklist, status changes, blocking behavior, and clinician adjudication.

## 50.6 Slice 6 - Finalization Wizard Steps 1-3

Build selection review, suggestion review, compose progress, enhanced note generation, patient summary generation, payer-readable section, and no-fabrication validation.

## 50.7 Slice 7 - Finalization Wizard Steps 4-6

Build compare/edit, re-beautify, Patient Opportunity Analysis, AI Planning Assistant, Billing & Attest, draft claim preview, attestation, sign, dispatch, Finalized Notes, PDFs, and access controls.

## 50.8 Slice 8 - Analytics and coaching foundation

Build basic analytics, coaching signal capture, encounter-level coaching report stub, and admin visibility.

## 50.9 Slice 9 - Pilot hardening

Build edge-case handling, permission audits, transcript access audit, no-recording exception, export reliability, restored drafts, finalization recovery, and pilot dashboards.

---

# 51. Updated One-Page First-Release North Star

AURA Note v1 is the clinician's documentation and finalization companion inside the AURA ClinicOS ecosystem. It starts from the schedule, creates a note shell for every appointment, requires Start Visit before editing, records and transcribes by default, renders chart context in clinician-friendly slices, generates evidence-linked suggestions, lets clinicians build Visit Selections, blocks unsafe or incomplete signing, routes History Gap questions to MA follow-up, composes a payer-readable enhanced note and patient-safe summary, supports Patient Opportunity Analysis, presents a draft claim preview, requires billing and clinical attestation, signs and dispatches final artifacts, creates staff tasks, stores final notes and transcripts with role-based access, and captures premium coaching signals.

The first release should prove that AURA Note is more than a scribe: it is a closed-loop encounter engine for better documentation, better patient follow-through, stronger revenue integrity, lower denial risk, and continuous clinician improvement.
