import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearUserChatSessions,
  consumePendingBookingIntent,
  GUEST_HISTORY_KEY,
  GUEST_OPEN_KEY,
  getUserHistoryKey,
  getUserOpenKey,
  isSafeRedirectPath,
  parseSafeMarkdownLines,
  PENDING_BOOKING_INTENT_KEY,
  promoteGuestSessionToUser,
  savePendingBookingIntent,
  type StorageLike,
  type StoredChatMessage,
} from '../../src/components/chat/aiChatUtils.ts';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    get length() {
      return map.size;
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
  };
}

describe('Customer AI Chat Pure Logic — Unit Tests', () => {
  describe('promoteGuestSessionToUser', () => {
    it('promotes guest messages containing user input to user scope when user history is empty', () => {
      const storage = createMemoryStorage();
      const guestMsgs: StoredChatMessage[] = [
        {
          id: 'w1',
          role: 'assistant',
          content: 'Chào Anh/Chị!',
          createdAt: '2026-11-21T10:00:00.000Z',
        },
        {
          id: 'u1',
          role: 'user',
          content: 'Xe phanh kêu két két',
          createdAt: '2026-11-21T10:01:00.000Z',
        },
      ];
      storage.setItem(GUEST_HISTORY_KEY, JSON.stringify(guestMsgs));
      storage.setItem(GUEST_OPEN_KEY, '1');

      const result = promoteGuestSessionToUser(storage, 101);

      assert.equal(result.promoted, true);
      assert.equal(result.messages.length, 2);
      assert.equal(storage.getItem(GUEST_HISTORY_KEY), null);
      assert.equal(storage.getItem(GUEST_OPEN_KEY), null);
      assert.ok(storage.getItem(getUserHistoryKey(101))?.includes('Xe phanh kêu két két'));
    });

    it('does not overwrite existing user history during login', () => {
      const storage = createMemoryStorage();
      storage.setItem(
        GUEST_HISTORY_KEY,
        JSON.stringify([{ id: 'u1', role: 'user', content: 'Guest msg', createdAt: '2026-11-21T10:00:00.000Z' }])
      );
      storage.setItem(
        getUserHistoryKey(101),
        JSON.stringify([{ id: 'u2', role: 'user', content: 'Existing user msg', createdAt: '2026-11-21T09:00:00.000Z' }])
      );

      const result = promoteGuestSessionToUser(storage, 101);

      assert.equal(result.promoted, false);
      assert.equal(result.messages[0].content, 'Existing user msg');
    });

    it('ignores guest session containing only welcome greeting without user input', () => {
      const storage = createMemoryStorage();
      storage.setItem(
        GUEST_HISTORY_KEY,
        JSON.stringify([{ id: 'w1', role: 'assistant', content: 'Welcome', createdAt: '2026-11-21T10:00:00.000Z' }])
      );

      const result = promoteGuestSessionToUser(storage, 101);
      assert.equal(result.promoted, false);
      assert.equal(result.messages.length, 0);
    });
  });

  describe('clearUserChatSessions', () => {
    it('wipes all user_* chat keys and pending booking intent while preserving unrelated keys', () => {
      const storage = createMemoryStorage();
      storage.setItem(getUserHistoryKey(101), '[]');
      storage.setItem(getUserOpenKey(101), '1');
      storage.setItem(getUserHistoryKey(202), '[]');
      storage.setItem(PENDING_BOOKING_INTENT_KEY, '{"notes":"test"}');
      storage.setItem('unrelated_ui_pref', 'keep-me');

      clearUserChatSessions(storage);

      assert.equal(storage.getItem(getUserHistoryKey(101)), null);
      assert.equal(storage.getItem(getUserOpenKey(101)), null);
      assert.equal(storage.getItem(getUserHistoryKey(202)), null);
      assert.equal(storage.getItem(PENDING_BOOKING_INTENT_KEY), null);
      assert.equal(storage.getItem('unrelated_ui_pref'), 'keep-me');
    });
  });

  describe('Pending Booking Intent round-trip', () => {
    it('saves and consumes pending booking intent exactly once', () => {
      const storage = createMemoryStorage();
      savePendingBookingIntent(storage, {
        preselectedServiceIds: [2],
        notes: 'Phanh kêu két két',
      });

      const first = consumePendingBookingIntent(storage);
      const second = consumePendingBookingIntent(storage);

      assert.deepEqual(first, {
        preselectedServiceIds: [2],
        notes: 'Phanh kêu két két',
      });
      assert.equal(second, null);
    });
  });

  describe('parseSafeMarkdownLines & isSafeRedirectPath', () => {
    it('parses bold segments and bullet lists cleanly without HTML injection', () => {
      const parsed = parseSafeMarkdownLines('Tổng tiền: **2.750.000 ₫**\n- Kiểm tra phanh\n\nHẹn gặp Anh/Chị');
      assert.equal(parsed.length, 4);
      assert.equal(parsed[0].kind, 'paragraph');
      assert.deepEqual(parsed[0].spans, [
        { type: 'text', value: 'Tổng tiền: ' },
        { type: 'bold', value: '2.750.000 ₫' },
      ]);
      assert.equal(parsed[1].kind, 'bullet');
      assert.equal(parsed[2].kind, 'spacer');
      assert.equal(parsed[3].kind, 'paragraph');
    });

    it('permits only safe relative /customer/* redirect paths', () => {
      assert.equal(isSafeRedirectPath('/customer/profile?tab=appointments&openBooking=1'), true);
      assert.equal(isSafeRedirectPath('/customer/tracking'), true);
      assert.equal(isSafeRedirectPath('//evil.com'), false);
      assert.equal(isSafeRedirectPath('https://evil.com/phish'), false);
      assert.equal(isSafeRedirectPath('javascript:alert(1)'), false);
      assert.equal(isSafeRedirectPath('/home'), false);
    });
  });
});
