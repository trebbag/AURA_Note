# AI, PHI, and Governance

## AI allowed actions

AI may:

- summarize;
- draft;
- suggest;
- score confidence;
- explain rationale;
- identify missing evidence;
- create candidate codes/items;
- create candidate plan tasks;
- draft patient summaries;
- draft payer-readable justifications;
- create coaching feedback;
- route items for human review.

## AI prohibited actions

AI must not independently:

- diagnose;
- finalize diagnoses;
- finalize codes;
- finalize charges;
- submit claims;
- determine medical necessity;
- place orders;
- deny care;
- override compliance or safety protocols;
- create final patient financial conclusions.

## PHI boundary

No raw PHI may be sent to external AI. AI-bound context must be scrubbed or transformed by `packages/ai-gateway`.

## AI request package

AI requests should include structured, minimized context:

- de-identified visit type;
- de-identified clinical facts;
- relevant note text after PHI scrub;
- transcript-derived content after PHI scrub;
- source references without raw identifiers;
- current selections;
- allowed code families;
- rules/policy summaries;
- output schema;
- safety instructions.

## AI response validation

AI responses must be rejected if they:

- fail schema validation;
- contain unsupported final determinations;
- invent facts not present in sources;
- include prohibited raw PHI;
- exceed allowed action scope;
- do not include required rationale/confidence for high-impact suggestions.

## Governance events

AI invocation, output generation, review, approval, rejection, prompt version changes, and model configuration changes must emit audit-safe governance events.

## WO-013 hardening posture

`WO-013` adds explicit default-off feature flags for external AI and production analytics. Structured logs use request ID and trace ID correlation and redact forbidden PHI keys plus obvious PHI-like text before log payloads are considered safe. Audit exports are redacted metadata-only bundles with `includePhi = false`; they do not deliver downloadable files or expose raw clinical payloads in CP-4.

## Post-WO-032 production AI governance rails

`WO-033` preserves external AI as disabled and re-sequences production AI work into `WO-046`. That future work order must add prompt registry/versioning, model configuration records, evaluation harnesses, PHI scrubber/de-identification hardening, output schema validation, source-linked evidence, durable AI governance events, and regression tests proving no raw PHI is sent to external AI.

Live external AI with PHI remains blocked until private/BAA model pathway, privacy/security review, tenant policy, source freshness rules, monitoring, and incident response are approved and implemented. AI outputs remain draft/candidate/suggestion-only.
