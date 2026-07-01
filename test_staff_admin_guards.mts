import assert from 'node:assert';
import { requireAdmin, validateEmail, canRemove } from './src/lib/afx/staffAdminGuards';

const admin = { userId: 'admin-1', role: 'admin' as const };
const reviewer = { userId: 'rev-1', role: 'reviewer' as const };

// requireAdmin
assert.equal(requireAdmin(admin).ok, true, 'admin passes');
assert.equal(requireAdmin(reviewer).ok, false, 'reviewer rejected');
assert.equal(requireAdmin(null).ok, false, 'non-staff rejected');
assert.equal(requireAdmin(reviewer).error, 'Not authorized');

// validateEmail
assert.equal(validateEmail('a@b.com').ok, true, 'non-empty ok');
assert.equal(validateEmail('   ').ok, false, 'blank rejected');
assert.equal(validateEmail('').error, 'Enter an email.');

// canRemove
assert.equal(canRemove(admin, 'admin-1', 'admin').ok, false, 'self blocked');
assert.equal(canRemove(admin, 'admin-1', 'admin').error, "You can't remove yourself.");
assert.equal(canRemove(admin, 'other-admin', 'admin').ok, false, 'admin protected');
assert.equal(canRemove(admin, 'other-admin', 'admin').error, "Admins can't be removed here.");
assert.equal(canRemove(admin, 'ghost', null).ok, false, 'missing row rejected');
assert.equal(canRemove(admin, 'ghost', null).error, 'Not on the team.');
assert.equal(canRemove(admin, 'rev-1', 'reviewer').ok, true, 'reviewer removable');

console.log('GUARDS_OK');
