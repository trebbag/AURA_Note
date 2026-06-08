#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertExists(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Missing Figma visual readiness artifact: ${relativePath}`);
  }
}

function assertIncludes(relativePath, needles) {
  const content = read(relativePath);
  for (const needle of needles) {
    if (!content.includes(needle)) {
      throw new Error(`${relativePath} is missing required visual readiness evidence: ${needle}`);
    }
  }
}

function assertNoCommittedReferenceScreenshots() {
  const prohibitedRoots = [
    path.join(root, '.figma-make-reference'),
    path.join(root, 'artifacts', 'figma-visual-comparison')
  ];
  for (const prohibitedRoot of prohibitedRoots) {
    if (!fs.existsSync(prohibitedRoot)) {
      continue;
    }
    const relative = path.relative(root, prohibitedRoot);
    const ignoreFile = read('.gitignore');
    if (!ignoreFile.includes(`${relative}/`) && !ignoreFile.includes(`${relative}`)) {
      throw new Error(`${relative} must remain ignored because it contains local reference/prototype artifacts`);
    }
  }
}

assertExists('playwright.visual.config.ts');
assertExists('apps/web/visual/aura-note-visual-regression.spec.ts');
assertExists('scripts/capture-figma-visual-comparison.js');
assertExists('docs/FIGMA_VISUAL_BASELINE_AND_SIGNOFF.md');

assertIncludes('package.json', [
  'frontend:visual-regression',
  'frontend:visual-regression:update',
  'figma:visual-comparison',
  'figma:visual-readiness'
]);

assertIncludes('apps/web/visual/aura-note-visual-regression.spec.ts', [
  '/aura-note',
  '/aura-note/schedule',
  'createAuraNoteApiClient',
  'seedActiveFinalization',
  'seedFinalizedNote',
  'routePath: (seed) => `/aura-note/workspace/${seed.activeAppointmentId}`',
  'routePath: (seed) => `/aura-note/finalization/${seed.activeNoteId}`',
  '/aura-note/support/status',
  'toHaveScreenshot'
]);

assertIncludes('scripts/capture-figma-visual-comparison.js', [
  'design-1-clinical-note-editor',
  'design-2-finalization-wizard',
  'pixelmatch',
  'needs_visual_tightening_or_signoff',
  'Formal founder/designer visual approval is still required'
]);

assertIncludes('docs/FIGMA_VISUAL_BASELINE_AND_SIGNOFF.md', [
  'Figma Visual Baseline And Signoff',
  'frontend:visual-regression',
  'figma:visual-comparison',
  'Founder/designer signoff',
  'not production launch approval'
]);

assertNoCommittedReferenceScreenshots();

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      gate: 'figma_visual_readiness',
      visualRegressionConfigPresent: true,
      auraScreenshotRegressionPresent: true,
      figmaComparisonScriptPresent: true,
      signoffDocPresent: true,
      referenceArtifactsIgnored: true,
      productionLaunchClaimed: false
    },
    null,
    2
  )
);
