import assert from 'node:assert';
import { inviteOutcome } from './src/lib/afx/inviteFunnel';

assert.equal(inviteOutcome(null), 'new');
assert.equal(inviteOutcome({ redeemed_at: null }), 'already_invited');
assert.equal(inviteOutcome({ redeemed_at: '2026-06-10T00:00:00Z' }), 'already_producer');

console.log('INVITE_OUTCOME_OK');
