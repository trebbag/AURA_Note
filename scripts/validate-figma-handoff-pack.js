#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function assertExists(relativePath) {
  if (!exists(relativePath)) {
    throw new Error(`Missing Figma handoff pack artifact: ${relativePath}`);
  }
}

function assertIncludes(relativePath, needles) {
  const content = read(relativePath);
  for (const needle of needles) {
    if (!content.includes(needle)) {
      throw new Error(`${relativePath} is missing required Figma handoff pack evidence: ${needle}`);
    }
  }
}

function assertNoForbiddenClaims(relativePath) {
  const content = read(relativePath).toLowerCase();
  const forbidden = [
    'hipaa certified',
    'live phi processing enabled',
    'autonomous diagnosis enabled',
    'code finalization enabled',
    'charge finalization enabled',
    'claim submission enabled',
    'medical necessity approved',
    'production launch approved',
    'claim submitted',
    'ehr writeback complete'
  ];

  for (const phrase of forbidden) {
    if (content.includes(phrase)) {
      throw new Error(`${relativePath} contains prohibited design-handoff claim: ${phrase}`);
    }
  }
}

const packFiles = [
  'docs/figma_handoff/README.md',
  'docs/figma_handoff/01_PRODUCT_AND_SAFETY_BRIEF.md',
  'docs/figma_handoff/02_INFORMATION_ARCHITECTURE_AND_ROUTE_MAP.md',
  'docs/figma_handoff/03_FRAME_BLUEPRINTS.md',
  'docs/figma_handoff/04_COMPONENT_LIBRARY_REQUEST.md',
  'docs/figma_handoff/05_WORKFLOW_PROTOTYPE_SCRIPT.md',
  'docs/figma_handoff/06_RESPONSIVE_ACCESSIBILITY_NOTES.md',
  'docs/figma_handoff/07_FIGMA_MAKE_PROMPT.md',
  'docs/figma_handoff/figma_frame_manifest.csv'
];

for (const file of packFiles) {
  assertExists(file);
  assertNoForbiddenClaims(file);
}

assertIncludes('docs/figma_handoff/README.md', [
  'AURA Note Figma Handoff Pack',
  'design handoff material only',
  'figma_frame_manifest.csv',
  'pnpm figma:handoff-pack-readiness'
]);

assertIncludes('docs/figma_handoff/01_PRODUCT_AND_SAFETY_BRIEF.md', [
  'standalone-first',
  'ClinicOS-Integrated Mode',
  'draft/candidate/human-review-required',
  'No raw PHI to external AI',
  'Production launch not approved'
]);

assertIncludes('docs/figma_handoff/02_INFORMATION_ARCHITECTURE_AND_ROUTE_MAP.md', [
  '/aura-note/schedule',
  '/aura-note/workspace/[appointmentId]',
  '/aura-note/finalization/[noteId]',
  '/aura-note/finalized/[noteId]',
  '/aura-note/operations',
  '/aura-note/integrations/clinicos',
  'typed API-backed',
  'ClinicOS-integrated'
]);

assertIncludes('docs/figma_handoff/03_FRAME_BLUEPRINTS.md', [
  'P0 Core Frames',
  'Documentation Workspace',
  'Finalization Wizard',
  'Finalized Note Viewer And Export',
  'editor must visibly lock',
  'submittedClaim=false'
]);

assertIncludes('docs/figma_handoff/04_COMPONENT_LIBRARY_REQUEST.md', [
  'State Variants Required Across Components',
  'empty',
  'loading',
  'ready',
  'saving',
  'blocked',
  'failed',
  'permission-denied',
  'read-only',
  'demo fixture'
]);

assertIncludes('docs/figma_handoff/05_WORKFLOW_PROTOTYPE_SCRIPT.md', [
  'Appointment To Final Artifact',
  'low-confidence override modal',
  'Compliance drawer blocking finalization',
  'draft claim preview',
  'submittedClaim=false',
  'support user sees metadata-only support state'
]);

assertIncludes('docs/figma_handoff/06_RESPONSIVE_ACCESSIBILITY_NOTES.md', [
  'Desktop',
  'Tablet',
  'Mobile',
  'Keyboard Requirements',
  'Screen Reader Requirements',
  'Sensitive Data Boundaries'
]);

assertIncludes('docs/figma_handoff/07_FIGMA_MAKE_PROMPT.md', [
  'Design a polished',
  'Core screens and routes',
  'typed API clients and persisted backend state',
  'No real PHI',
  'Prompt Guardrails'
]);

assertIncludes('docs/figma_handoff/figma_frame_manifest.csv', [
  'priority,figma_page,frame_name,route_or_surface',
  '/aura-note/schedule',
  '/aura-note/workspace/[appointmentId]',
  '/aura-note/finalization/[noteId]',
  '/aura-note/finalized/[noteId]',
  '/aura-note/operations',
  '/aura-note/support/status'
]);

assertIncludes('docs/FIGMA_HANDOFF_PLAN.md', [
  'docs/figma_handoff/README.md',
  'Figma Handoff Pack'
]);
assertIncludes('docs/FIGMA_HANDOFF_CHECKLIST.md', [
  'docs/figma_handoff/README.md',
  'pnpm figma:handoff-pack-readiness'
]);
assertIncludes('docs/TEST_PLAN.md', ['figma:handoff-pack-readiness']);
assertIncludes('RUN_LOG.md', ['Figma handoff pack']);
assertIncludes('package.json', ['"figma:handoff-pack-readiness"', 'validate-figma-handoff-pack.js']);

const manifest = read('docs/figma_handoff/figma_frame_manifest.csv')
  .trim()
  .split('\n');
if (manifest.length < 20) {
  throw new Error(`Figma frame manifest should include at least 20 frame rows; found ${manifest.length - 1}`);
}

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      gate: 'figma_handoff_pack_readiness',
      packFilesChecked: packFiles.length,
      manifestRowsChecked: manifest.length - 1,
      productionLaunchClaimed: false,
      livePhiOrVendorTouched: false
    },
    null,
    2
  )
);
