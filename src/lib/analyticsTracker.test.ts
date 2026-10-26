import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRequestId,
  recordDownloadEvent,
  computeDownloadAggregates,
} from './analyticsTracker';
import type { DownloadEvent, DownloadStat } from '../types';

test('generateRequestId returns unique prefixed string', () => {
  const id1 = generateRequestId();
  const id2 = generateRequestId();
  assert.match(id1, /^req_/);
  assert.notEqual(id1, id2);
});

test('recordDownloadEvent increments stats and logs event', () => {
  const stats: DownloadStat[] = [];
  const events: DownloadEvent[] = [];

  const res1 = recordDownloadEvent(stats, events, 'app_1', 'ver_1', 'req_abc', '2026-10-21T10:00:00Z');
  assert.equal(res1.isDuplicate, false);
  assert.equal(res1.updatedStats.length, 1);
  assert.equal(res1.updatedStats[0].requestCount, 1);
  assert.equal(res1.updatedEvents.length, 1);

  // Duplicate request ID should be ignored (idempotency)
  const res2 = recordDownloadEvent(
    res1.updatedStats,
    res1.updatedEvents,
    'app_1',
    'ver_1',
    'req_abc',
    '2026-10-21T10:01:00Z'
  );
  assert.equal(res2.isDuplicate, true);
  assert.equal(res2.updatedStats[0].requestCount, 1); // not incremented
  assert.equal(res2.updatedEvents.length, 1);

  // Different request ID on same day should increment count
  const res3 = recordDownloadEvent(
    res2.updatedStats,
    res2.updatedEvents,
    'app_1',
    'ver_1',
    'req_xyz',
    '2026-10-21T10:05:00Z'
  );
  assert.equal(res3.isDuplicate, false);
  assert.equal(res3.updatedStats[0].requestCount, 2);
  assert.equal(res3.updatedEvents.length, 2);
});

test('computeDownloadAggregates calculates totals, app totals, and date trends', () => {
  const stats: DownloadStat[] = [
    {
      id: 'stat_1',
      date: '2026-10-20',
      appId: 'app_1',
      versionId: 'ver_1',
      requestCount: 15,
      updatedAt: '2026-10-20T23:59:00Z',
    },
    {
      id: 'stat_2',
      date: '2026-10-21',
      appId: 'app_1',
      versionId: 'ver_2',
      requestCount: 25,
      updatedAt: '2026-10-21T23:59:00Z',
    },
    {
      id: 'stat_3',
      date: '2026-10-21',
      appId: 'app_2',
      versionId: 'ver_1',
      requestCount: 10,
      updatedAt: '2026-10-21T23:59:00Z',
    },
  ];

  const agg = computeDownloadAggregates(stats);
  assert.equal(agg.totalDownloads, 50);
  assert.equal(agg.byApp['app_1'], 40);
  assert.equal(agg.byApp['app_2'], 10);
  assert.equal(agg.dailyTrends.length, 2);
  assert.equal(agg.dailyTrends.find((d) => d.date === '2026-10-21')?.count, 35);
});
