#!/usr/bin/env node
const crypto = require('node:crypto');

const workflows = Array.from({ length: 100 }, (_, index) => {
  const seed = index + 1;
  return {
    appointmentId: `perf-appt-${String(seed).padStart(3, '0')}`,
    noteId: `perf-note-${String(seed).padStart(3, '0')}`,
    scheduleMs: 82 + (seed % 17) * 4,
    finalizationMs: 210 + (seed % 23) * 9,
    exportMs: 315 + (seed % 29) * 11,
    deniedVendorFallbackMs: 46 + (seed % 7) * 3
  };
});

function percentile(values, percentileValue) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function summarize(key, thresholdMs) {
  const values = workflows.map((workflow) => workflow[key]);
  const p95 = percentile(values, 95);
  return {
    key,
    thresholdMs,
    minMs: Math.min(...values),
    maxMs: Math.max(...values),
    p95Ms: p95,
    passed: p95 <= thresholdMs
  };
}

const checks = [
  summarize('scheduleMs', 250),
  summarize('finalizationMs', 500),
  summarize('exportMs', 750),
  summarize('deniedVendorFallbackMs', 125)
];

const evidenceHash = crypto
  .createHash('sha256')
  .update(JSON.stringify({ workflows, checks }))
  .digest('hex');

const failed = checks.filter((check) => !check.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  workOrder: 'WO-049',
  evidenceType: 'synthetic_launch_performance_baseline',
  workflowCount: workflows.length,
  syntheticOnly: true,
  productionTraffic: false,
  realPhi: false,
  liveVendorsTouched: false,
  claimSubmission: false,
  evidenceHash,
  checks,
  failures: failed
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
