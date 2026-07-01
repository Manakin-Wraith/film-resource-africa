import assert from 'node:assert';
import { toInviteRow, sortInvites, type InviteRow } from './src/lib/afx/inviteFunnel';

// pending → nulls, status pending
const pending = toInviteRow({ id: 'i1', email: 'a@x.com', created_at: '2026-06-01T00:00:00Z', redeemed_at: null, redeemed_by: null }, null, null);
assert.equal(pending.status, 'pending');
assert.equal(pending.activatedAt, null);
assert.equal(pending.producerName, null);
assert.equal(pending.company, null);
assert.equal(pending.lastActiveAt, null);
assert.equal(pending.invitedAt, '2026-06-01T00:00:00Z');

// activated with producer + last active
const act = toInviteRow(
  { id: 'i2', email: 'b@x.com', created_at: '2026-06-02T00:00:00Z', redeemed_at: '2026-06-10T00:00:00Z', redeemed_by: 'u2' },
  { name: 'Bee Films', company: 'Bee Ltd' }, '2026-06-30T00:00:00Z');
assert.equal(act.status, 'activated');
assert.equal(act.activatedAt, '2026-06-10T00:00:00Z');
assert.equal(act.producerName, 'Bee Films');
assert.equal(act.company, 'Bee Ltd');
assert.equal(act.lastActiveAt, '2026-06-30T00:00:00Z');

// activated but producer row missing → nulls, still activated
const actNoProd = toInviteRow(
  { id: 'i3', email: 'c@x.com', created_at: '2026-06-03T00:00:00Z', redeemed_at: '2026-06-11T00:00:00Z', redeemed_by: 'u3' }, null, null);
assert.equal(actNoProd.status, 'activated');
assert.equal(actNoProd.producerName, null);
assert.equal(actNoProd.lastActiveAt, null);

// sort: pending first (oldest invite first); then activated (most recently activated first)
const rows: InviteRow[] = [
  { id: 'p-new', email: '', status: 'pending', invitedAt: '2026-06-05T00:00:00Z', activatedAt: null, producerName: null, company: null, lastActiveAt: null },
  { id: 'a-old', email: '', status: 'activated', invitedAt: '2026-05-01T00:00:00Z', activatedAt: '2026-06-01T00:00:00Z', producerName: null, company: null, lastActiveAt: null },
  { id: 'p-old', email: '', status: 'pending', invitedAt: '2026-06-01T00:00:00Z', activatedAt: null, producerName: null, company: null, lastActiveAt: null },
  { id: 'a-new', email: '', status: 'activated', invitedAt: '2026-05-02T00:00:00Z', activatedAt: '2026-06-20T00:00:00Z', producerName: null, company: null, lastActiveAt: null },
];
assert.deepEqual(sortInvites(rows).map((r) => r.id), ['p-old', 'p-new', 'a-new', 'a-old']);

// sort does not mutate input
const before = rows.map((r) => r.id);
sortInvites(rows);
assert.deepEqual(rows.map((r) => r.id), before);

console.log('INVITE_FUNNEL_OK');
