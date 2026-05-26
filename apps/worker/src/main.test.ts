import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getWorkerStatus } from './main';

describe('worker scaffold', () => {
  it('keeps CP-0 worker verification explicit until job implementations begin', () => {
    const status = getWorkerStatus();

    assert.equal(status.status, 'scaffold_ready');
    assert.equal(status.checkpoint, 'CP-0');
    assert.deepEqual(status.jobsDeferredToWorkOrders.includes('retention'), true);
  });
});
