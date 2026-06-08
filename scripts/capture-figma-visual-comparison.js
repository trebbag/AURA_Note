#!/usr/bin/env node
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('@playwright/test');
const { PNG } = require('pngjs');

const root = process.cwd();
const artifactsRoot = path.join(root, 'artifacts', 'figma-visual-comparison');
const design1Root = path.join(root, '.figma-make-reference', 'design-1-clinical-note-editor');
const design2Root = path.join(root, '.figma-make-reference', 'design-2-finalization-wizard');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const runDir = path.join(artifactsRoot, timestamp);
const latestDir = path.join(artifactsRoot, 'latest');
const strict = process.argv.includes('--strict') || process.env.AURA_NOTE_STRICT_VISUAL_COMPARE === '1';
const installReferences = process.argv.includes('--install-references') || process.env.AURA_NOTE_INSTALL_FIGMA_REFERENCES === '1';
const captureSettleMs = Number(process.env.AURA_NOTE_FIGMA_CAPTURE_SETTLE_MS ?? 1_800);

const ports = {
  design1: Number(process.env.AURA_NOTE_FIGMA_DESIGN1_PORT ?? 3461),
  design2: Number(process.env.AURA_NOTE_FIGMA_DESIGN2_PORT ?? 3462),
  api: Number(process.env.AURA_NOTE_FIGMA_COMPARE_API_PORT ?? 3463),
  web: Number(process.env.AURA_NOTE_FIGMA_COMPARE_WEB_PORT ?? 3464)
};

const viewport = { width: 1440, height: 900 };
const scenarios = [
  {
    id: 'dashboard',
    design: 'design1',
    referenceClicks: [],
    auraPath: '/aura-note',
    threshold: 0.06,
    notes: 'App shell, quick actions, command dashboard, schedule preview, activity/metric cards.'
  },
  {
    id: 'schedule',
    design: 'design1',
    referenceClicks: ['View Full Schedule'],
    auraPath: '/aura-note/schedule',
    threshold: 0.06,
    notes: 'Schedule and appointment-card visual structure; AURA uses safe IDs instead of prototype patient names.'
  },
  {
    id: 'drafts',
    design: 'design1',
    referenceClicks: ['View All Drafts'],
    auraPath: '/aura-note/drafts',
    threshold: 0.08,
    notes: 'Draft note list/card structure; AURA rows are backend summaries.'
  },
  {
    id: 'workspace',
    design: 'design1',
    referenceClicks: ['New Note'],
    auraPath: '/aura-note/workspace/{activeAppointmentId}',
    threshold: 0.1,
    notes: 'Clinical editor, selected codes, suggestions, timer/recording panels.'
  },
  {
    id: 'operations',
    design: 'design1',
    referenceClicks: ['View Analytics'],
    auraPath: '/aura-note/operations',
    threshold: 0.22,
    notes: 'Analytics/settings visual vocabulary; AURA keeps internal revenue and vendor state gated.'
  },
  {
    id: 'platform-settings',
    design: 'design1',
    referenceClicks: ['Admin Panel'],
    auraPath: '/aura-note/platform',
    threshold: 0.08,
    notes: 'Settings/control-center visual vocabulary; AURA platform route exposes production-control DTOs.'
  },
  {
    id: 'finalization',
    design: 'design2',
    referenceClicks: [],
    auraPath: '/aura-note/finalization/{activeNoteId}',
    threshold: 0.08,
    notes: 'Design 2 wizard visual structure mapped to AURA Note six-step finalization APIs.'
  }
];

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function ensureReferenceRoot(directory) {
  if (!fs.existsSync(path.join(directory, 'package.json'))) {
    throw new Error(`Missing Figma Make reference package at ${directory}`);
  }
}

function prepareReferencePackage(sourceDirectory, targetDirectory, rejectedDependencies = []) {
  fs.rmSync(targetDirectory, { recursive: true, force: true });
  fs.cpSync(sourceDirectory, targetDirectory, {
    recursive: true,
    filter(source) {
      return !source.includes(`${path.sep}node_modules${path.sep}`) && !source.endsWith(`${path.sep}node_modules`);
    }
  });

  const packageJsonPath = path.join(targetDirectory, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  for (const dependencyName of rejectedDependencies) {
    delete packageJson.dependencies?.[dependencyName];
    delete packageJson.devDependencies?.[dependencyName];
  }
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function installReferenceDependencies(directory) {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['install', '--lockfile=false'], {
      cwd: directory,
      stdio: 'inherit',
      shell: false
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`pnpm install failed in ${directory} with exit code ${code}`));
    });
  });
}

function preflightReferenceDependencies(directory) {
  if (fs.existsSync(path.join(directory, 'node_modules'))) {
    return;
  }
  throw new Error(
    `Missing ignored Figma reference dependencies in ${directory}. Run: ` +
      `pnpm figma:visual-comparison -- --install-references`
  );
}

function spawnServer(label, command, args, cwd, logFile, env = {}) {
  const log = fs.createWriteStream(logFile, { flags: 'a' });
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    shell: false
  });

  child.stdout.on('data', (chunk) => log.write(`[${label}] ${chunk}`));
  child.stderr.on('data', (chunk) => log.write(`[${label}] ${chunk}`));

  return {
    label,
    child,
    stop() {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
      log.end();
    }
  };
}

function waitForUrl(url, timeoutMs = 120_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      request.on('error', retry);
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(attempt, 500);
    };
    attempt();
  });
}

function defaultPurposeForRole(role) {
  if (role === 'billing_staff') return 'payment';
  if (role === 'support') return 'support';
  if (role === 'authorized_admin' || role === 'admin') return 'operations';
  if (role === 'compliance_privacy_lead') return 'audit';
  return 'treatment';
}

async function apiRequest(apiBaseUrl, role, requestPath, method = 'GET', body, idempotencyKey) {
  const headers = {
    'content-type': 'application/json',
    'x-aura-role': role,
    'x-aura-user-id': `user-figma-visual-${role}`,
    'x-aura-session-id': `session-figma-visual-${role}`,
    'x-aura-tenant-id': 'tenant-synthetic-primary',
    'x-aura-site-id': 'site-synthetic-primary',
    'x-aura-purpose-of-use': defaultPurposeForRole(role),
    'x-aura-identity-provider': 'local_synthetic'
  };
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
  const response = await fetch(`${apiBaseUrl}${requestPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : method === 'GET' ? undefined : '{}'
  });
  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.message ?? payload?.error?.message ?? `${method} ${requestPath} failed with ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join('; ') : message);
  }
  return payload;
}

async function createVisualAppointment(apiBaseUrl, seedLabel) {
  const response = await apiRequest(
    apiBaseUrl,
    'ma',
    '/schedule/appointments',
    'POST',
    {
      safePatientId: `safe-patient-figma-${seedLabel}`,
      clinicianId: `clinician-figma-${seedLabel}`,
      visitType: seedLabel === 'finalized' ? 'AWV plus problem' : 'Chronic follow-up',
      startsAt: seedLabel === 'finalized' ? '2026-06-08T15:30:00.000Z' : '2026-06-08T14:00:00.000Z',
      durationMinutes: 30,
      modality: 'in_person',
      reasonForVisit: `Synthetic Figma visual comparison ${seedLabel} workflow`
    },
    `figma-visual-${seedLabel}`
  );
  return {
    appointmentId: response.data.appointment.appointmentId,
    noteId: response.data.note.noteId
  };
}

async function createRuntimeSeed(apiBaseUrl) {
  const active = await createVisualAppointment(apiBaseUrl, 'active');
  await apiRequest(apiBaseUrl, 'clinician', `/schedule/appointments/${active.appointmentId}/start-visit`, 'POST');
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${active.noteId}/visit-selections`, 'POST', {
    category: 'diagnosis',
    label: 'ICD-10 E11.9 candidate',
    confidence: 0.87
  });
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${active.noteId}/finalization/start`, 'POST');

  const finalized = await createVisualAppointment(apiBaseUrl, 'finalized');
  await apiRequest(apiBaseUrl, 'clinician', `/schedule/appointments/${finalized.appointmentId}/start-visit`, 'POST');
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/visit-selections`, 'POST', {
    category: 'cpt',
    label: 'CPT 99214 candidate',
    confidence: 0.82
  });
  const started = await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/finalization/start`, 'POST');
  const selection = started.data.finalizationSession.frozenSnapshot.visitSelections[0];
  if (!selection) {
    throw new Error('Figma visual comparison finalization seed did not create a selected item.');
  }
  await apiRequest(
    apiBaseUrl,
    'clinician',
    `/notes/${finalized.noteId}/finalization/code-review/selections/${selection.visitSelectionId}`,
    'POST',
    { decision: 'keep' }
  );
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/finalization/code-review/complete`, 'POST');
  for (const suggestionId of ['suggestion-demo-cpt-99214', 'suggestion-demo-icd10-e119', 'suggestion-demo-quality-bp']) {
    await apiRequest(
      apiBaseUrl,
      'clinician',
      `/notes/${finalized.noteId}/finalization/suggestion-review/suggestions/${suggestionId}`,
      'POST',
      { decision: 'remove', reason: 'Synthetic Figma visual comparison seed' }
    );
  }
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/finalization/suggestion-review/complete`, 'POST');
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/finalization/compose`, 'POST');
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/finalization/compare-edit/approve-note`, 'POST', {
    approved: true,
    attestation: 'Synthetic Figma visual comparison final note approval'
  });
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/finalization/compare-edit/approve-summary`, 'POST', {
    approved: true,
    attestation: 'Synthetic Figma visual comparison patient summary approval'
  });
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/finalization/billing-attest/draft-claim-preview`, 'POST');
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/finalization/billing-attest/complete`, 'POST', {
    acceptedStatements: [
      'I have reviewed and accepted the final note.',
      'I have reviewed and accepted the patient summary.',
      'I have reviewed selected codes/items and understand they remain my responsibility.',
      'I have resolved, closed, or assigned open history questions.',
      'I understand the draft claim preview is a support tool and not an automated claim submission.'
    ],
    estimateCaveatAcknowledged: true,
    routeToBillingReview: true
  });
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/finalization/sign-dispatch`, 'POST');
  await apiRequest(apiBaseUrl, 'clinician', `/notes/${finalized.noteId}/exports/final-note-pdf`, 'POST');

  return {
    activeAppointmentId: active.appointmentId,
    activeNoteId: active.noteId,
    finalizedAppointmentId: finalized.appointmentId,
    finalizedNoteId: finalized.noteId
  };
}

function resolveAuraPath(auraPath, runtimeSeed) {
  return auraPath
    .replace('{activeAppointmentId}', runtimeSeed.activeAppointmentId)
    .replace('{activeNoteId}', runtimeSeed.activeNoteId)
    .replace('{finalizedAppointmentId}', runtimeSeed.finalizedAppointmentId)
    .replace('{finalizedNoteId}', runtimeSeed.finalizedNoteId);
}

async function disableAnimations(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: -1ms !important;
        animation-duration: 1ms !important;
        caret-color: transparent !important;
        transition-delay: 0ms !important;
        transition-duration: 0ms !important;
      }
    `
  });
}

async function openAndCapture(page, url, screenshotPath, clicks = []) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await disableAnimations(page);
  await page.waitForTimeout(captureSettleMs);
  for (const clickText of clicks) {
    const locator = page.getByText(clickText, { exact: true }).first();
    await locator.click({ timeout: 8_000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await disableAnimations(page);
    await page.waitForTimeout(captureSettleMs);
  }
  await page.screenshot({ path: screenshotPath, fullPage: false });
}

function comparePng(referencePath, auraPath, diffPath, pixelmatch) {
  const reference = PNG.sync.read(fs.readFileSync(referencePath));
  const aura = PNG.sync.read(fs.readFileSync(auraPath));
  const width = Math.min(reference.width, aura.width);
  const height = Math.min(reference.height, aura.height);
  const referenceCropped = new PNG({ width, height });
  const auraCropped = new PNG({ width, height });
  PNG.bitblt(reference, referenceCropped, 0, 0, width, height, 0, 0);
  PNG.bitblt(aura, auraCropped, 0, 0, width, height, 0, 0);
  const diff = new PNG({ width, height });
  const mismatchedPixels = pixelmatch(referenceCropped.data, auraCropped.data, diff.data, width, height, {
    threshold: 0.2,
    includeAA: false
  });
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return {
    width,
    height,
    mismatchedPixels,
    comparedPixels: width * height,
    diffRatio: Number((mismatchedPixels / (width * height)).toFixed(6))
  };
}

function writeLatestCopy(sourceDirectory, targetDirectory) {
  fs.rmSync(targetDirectory, { recursive: true, force: true });
  fs.cpSync(sourceDirectory, targetDirectory, { recursive: true });
}

function writeMarkdownReport(report, filePath) {
  const lines = [
    '# Figma Visual Comparison Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Viewport: ${report.viewport.width}x${report.viewport.height}`,
    `Strict mode: ${String(report.strict)}`,
    '',
    'This report compares ignored local Figma Make reference screenshots against the backend-backed AURA Note routes. Figma reference screenshots are not committed because the Make exports include prototype-local hardcoded demo literals.',
    '',
    '| Scenario | Status | Diff ratio | Threshold | AURA route | Notes |',
    '| --- | --- | ---: | ---: | --- | --- |',
    ...report.scenarios.map((scenario) =>
      `| ${scenario.id} | ${scenario.status} | ${scenario.diffRatio} | ${scenario.threshold} | ${scenario.auraPath} | ${scenario.notes} |`
    ),
    '',
    'Formal founder/designer visual approval is still required before claiming exact Figma parity.'
  ];
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

async function main() {
  ensureReferenceRoot(design1Root);
  ensureReferenceRoot(design2Root);
  ensureDirectory(runDir);
  ensureDirectory(path.join(runDir, 'reference'));
  ensureDirectory(path.join(runDir, 'aura'));
  ensureDirectory(path.join(runDir, 'diff'));

  const preparedDesign2Root = path.join(runDir, 'prepared-design-2-finalization-wizard');
  prepareReferencePackage(design2Root, preparedDesign2Root, [
    '@jsr/supabase__supabase-js@2.49.8',
    'hono'
  ]);

  if (installReferences) {
    await installReferenceDependencies(design1Root);
    await installReferenceDependencies(preparedDesign2Root);
  }

  preflightReferenceDependencies(design1Root);
  preflightReferenceDependencies(preparedDesign2Root);

  const servers = [];
  const serverLog = path.join(runDir, 'servers.log');
  try {
    servers.push(
      spawnServer('figma-design-1', 'pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', String(ports.design1)], design1Root, serverLog),
      spawnServer('figma-design-2', 'pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', String(ports.design2)], preparedDesign2Root, serverLog),
      spawnServer('aura-api', 'pnpm', ['--filter', '@aura-note/api', 'exec', 'tsx', 'src/main.ts'], root, serverLog, {
        AURA_NOTE_AUTH_MODE: 'local_demo',
        PORT: String(ports.api)
      }),
      spawnServer('aura-web', 'pnpm', ['--filter', '@aura-note/web', 'exec', 'next', 'dev', '-p', String(ports.web), '-H', '127.0.0.1'], root, serverLog, {
        AURA_NOTE_API_BASE_URL: `http://127.0.0.1:${ports.api}/api/v1`,
        NEXT_PUBLIC_AURA_NOTE_API_BASE_URL: `http://127.0.0.1:${ports.api}/api/v1`
      })
    );

    await Promise.all([
      waitForUrl(`http://127.0.0.1:${ports.design1}/`),
      waitForUrl(`http://127.0.0.1:${ports.design2}/`),
      waitForUrl(`http://127.0.0.1:${ports.api}/api/v1/health`),
      waitForUrl(`http://127.0.0.1:${ports.web}/status`)
    ]);

    const runtimeSeed = await createRuntimeSeed(`http://127.0.0.1:${ports.api}/api/v1`);
    const pixelmatch = (await import('pixelmatch')).default;
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport });
    const results = [];

    for (const scenario of scenarios) {
      const referenceUrl = scenario.design === 'design1' ? `http://127.0.0.1:${ports.design1}/` : `http://127.0.0.1:${ports.design2}/`;
      const resolvedAuraPath = resolveAuraPath(scenario.auraPath, runtimeSeed);
      const auraUrl = `http://127.0.0.1:${ports.web}${resolvedAuraPath}`;
      const referencePath = path.join(runDir, 'reference', `${scenario.id}.png`);
      const auraPath = path.join(runDir, 'aura', `${scenario.id}.png`);
      const diffPath = path.join(runDir, 'diff', `${scenario.id}.png`);

      await openAndCapture(page, referenceUrl, referencePath, scenario.referenceClicks);
      await openAndCapture(page, auraUrl, auraPath);
      const comparison = comparePng(referencePath, auraPath, diffPath, pixelmatch);
      const status = comparison.diffRatio <= scenario.threshold ? 'within_threshold' : 'needs_visual_tightening_or_signoff';
      results.push({
        id: scenario.id,
        design: scenario.design,
        auraPath: resolvedAuraPath,
        referenceClicks: scenario.referenceClicks,
        threshold: scenario.threshold,
        notes: scenario.notes,
        referenceScreenshot: path.relative(root, referencePath),
        auraScreenshot: path.relative(root, auraPath),
        diffScreenshot: path.relative(root, diffPath),
        status,
        ...comparison
      });
    }

    await browser.close();

    const report = {
      generatedAt: new Date().toISOString(),
      strict,
      viewport,
      artifactDirectory: path.relative(root, runDir),
      scenarios: results
    };
    fs.writeFileSync(path.join(runDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
    writeMarkdownReport(report, path.join(runDir, 'report.md'));
    writeLatestCopy(runDir, latestDir);

    const failures = results.filter((result) => result.status !== 'within_threshold');
    console.log(JSON.stringify(report, null, 2));

    if (strict && failures.length > 0) {
      throw new Error(`Strict Figma visual comparison failed for: ${failures.map((failure) => failure.id).join(', ')}`);
    }
  } finally {
    for (const server of servers.reverse()) {
      server.stop();
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
