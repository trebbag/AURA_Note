import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertCopyAllowed,
  auraNoteDesignTokens,
  getDesignToken,
  getReviewSurfaceBoundary,
  reviewSurfaceBoundaries
} from './index';

describe('AURA Note UI design-system foundation', () => {
  it('defines stable tokens for the current operational shell', () => {
    assert.equal(auraNoteDesignTokens.some((token) => token.cssVariable === '--aura-color-action-primary'), true);
    assert.equal(auraNoteDesignTokens.some((token) => token.category === 'radius' && token.value === '4px'), true);
    assert.equal(getDesignToken('--aura-color-warning')?.value, '#aa3d00');
  });

  it('records patient-facing and internal review boundaries for copy review', () => {
    const patientSummary = getReviewSurfaceBoundary('patient_summary');
    const billing = getReviewSurfaceBoundary('billing_and_attest');

    assert.equal(patientSummary.patientFacing, true);
    assert.equal(patientSummary.internalOnly, false);
    assert.equal(billing.patientFacing, false);
    assert.equal(billing.mustShowHumanReview, true);
    assert.equal(reviewSurfaceBoundaries.every((surface) => surface.mustShowHumanReview), true);
  });

  it('blocks prohibited copy claims by surface', () => {
    assert.equal(assertCopyAllowed('patient_summary', 'Your plan is ready for review.'), true);
    assert.equal(assertCopyAllowed('patient_summary', 'Internal revenue opportunity is hidden.'), false);
    assert.equal(assertCopyAllowed('billing_and_attest', 'Claim submitted automatically.'), false);
    assert.equal(assertCopyAllowed('clinical_documentation', 'Autonomous diagnosis completed.'), false);
  });
});
