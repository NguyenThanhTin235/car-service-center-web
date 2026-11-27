import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardPathByRole } from '../../src/utils/roleRedirect.ts';

describe('Internal Portal Pure Seams — Unit Tests', () => {
  describe('getDashboardPathByRole', () => {
    it('routes ADMIN, MANAGER, DESK STAFF, and SA to their internal workspaces', () => {
      assert.equal(getDashboardPathByRole(['ADMIN']), '/admin');
      assert.equal(getDashboardPathByRole(['MANAGER']), '/dashboard');
      assert.equal(getDashboardPathByRole(['DESK STAFF']), '/staff');
      assert.equal(getDashboardPathByRole(['SA']), '/advisor');
    });

    it('never routes to /home and falls back to /login for unknown or empty roles', () => {
      assert.equal(getDashboardPathByRole([]), '/login');
      assert.equal(getDashboardPathByRole(['CUSTOMER']), '/login');
      assert.equal(getDashboardPathByRole(['UNKNOWN_ROLE']), '/login');
    });
  });
});
