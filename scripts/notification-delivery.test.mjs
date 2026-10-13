import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNotificationPath, unseenLiveAlerts } from '../src/utils/notificationDelivery.js';

test('live alerts filter recipients, read/dismissed rows, and duplicates', () => {
  const seen = new Set();
  const rows = [
    { id: 'a', user_id: 'me' }, { id: 'a', user_id: 'me' },
    { id: 'b', user_id: 'other' }, { id: 'c', user_id: 'me', read: true },
    { id: 'd', user_id: 'me', dismissed: true },
  ];
  assert.deepEqual(unseenLiveAlerts(rows, 'me', seen).map(n => n.id), ['a']);
  assert.deepEqual(unseenLiveAlerts(rows, 'me', seen), []);
  assert.deepEqual(unseenLiveAlerts(rows, undefined, new Set()), []);
});

test('notification links retain internal routes and block external/backslash URLs', () => {
  const origin = 'https://workpulse.test';
  assert.equal(safeNotificationPath('/tasks?open=123#detail', origin), '/tasks?open=123#detail');
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', 'javascript:alert(1)', null]) {
    assert.equal(safeNotificationPath(value, origin), '/dashboard');
  }
});

test('fallback snapshots suppress initial history and deliver new rows once', async () => {
  const { createNotificationTracker } = await import('../src/utils/notificationDelivery.js');
  const tracker = createNotificationTracker(1000);
  const old = { id: 'old', created_at: new Date(0).toISOString() };
  const fresh = { id: 'fresh', created_at: new Date(2000).toISOString() };
  assert.deepEqual(tracker.snapshot([old]), []);
  assert.deepEqual(tracker.snapshot([fresh, old]), [fresh]);
  assert.deepEqual(tracker.insert(fresh), []);
  assert.deepEqual(tracker.snapshot([fresh, old]), []);
  const unreadOld = { id: 'archived', created_at: new Date(500).toISOString() };
  assert.deepEqual(tracker.snapshot([unreadOld, fresh, old]), []);
});

test('Realtime arriving before initial fetch is delivered without duplicates', async () => {
  const { createNotificationTracker } = await import('../src/utils/notificationDelivery.js');
  const tracker = createNotificationTracker(1000);
  const row = { id: 'new', created_at: new Date(2000).toISOString() };
  assert.deepEqual(tracker.insert(row), [row]);
  assert.deepEqual(tracker.snapshot([row]), []);
  assert.deepEqual(tracker.insert(row), []);
  assert.deepEqual(tracker.insert({ id: 'read', read: true }), []);
  assert.deepEqual(tracker.insert({ id: 'dismissed', dismissed: true }), []);
});
