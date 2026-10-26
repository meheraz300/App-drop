/**
 * Analytics tracking and metrics aggregation logic.
 */

import type { DownloadEvent, DownloadStat } from '../types';

/**
 * Creates a unique request ID for download URL issuance.
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Aggregates a new download event into daily download statistics.
 * Uses idempotency key / request ID to prevent duplicate counts from retries.
 */
export function recordDownloadEvent(
  stats: DownloadStat[],
  events: DownloadEvent[],
  appId: string,
  versionId: string,
  requestId: string,
  nowIso = new Date().toISOString()
): {
  updatedStats: DownloadStat[];
  updatedEvents: DownloadEvent[];
  isDuplicate: boolean;
} {
  // Check idempotency: if requestId already recorded, skip incrementing stats
  const existingEvent = events.find((e) => e.requestId === requestId);
  if (existingEvent) {
    return {
      updatedStats: stats,
      updatedEvents: events,
      isDuplicate: true,
    };
  }

  const todayDate = nowIso.slice(0, 10);
  const newEvent: DownloadEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    appId,
    versionId,
    eventType: 'download_url_issued',
    createdAt: nowIso,
    requestId,
  };

  const statIndex = stats.findIndex(
    (s) => s.date === todayDate && s.appId === appId && s.versionId === versionId
  );

  let updatedStats: DownloadStat[];
  if (statIndex >= 0) {
    updatedStats = stats.map((s, idx) =>
      idx === statIndex
        ? {
            ...s,
            requestCount: s.requestCount + 1,
            updatedAt: nowIso,
          }
        : s
    );
  } else {
    const newStat: DownloadStat = {
      id: `${todayDate}_${appId}_${versionId}`,
      date: todayDate,
      appId,
      versionId,
      requestCount: 1,
      updatedAt: nowIso,
    };
    updatedStats = [...stats, newStat];
  }

  return {
    updatedStats,
    updatedEvents: [newEvent, ...events],
    isDuplicate: false,
  };
}

/**
 * Computes dashboard aggregates from download stats.
 */
export function computeDownloadAggregates(stats: DownloadStat[]) {
  const totalDownloads = stats.reduce((sum, s) => sum + s.requestCount, 0);

  const byApp: Record<string, number> = {};
  const byVersion: Record<string, number> = {};
  const byDate: Record<string, number> = {};

  for (const s of stats) {
    byApp[s.appId] = (byApp[s.appId] || 0) + s.requestCount;
    const versionKey = `${s.appId}:${s.versionId}`;
    byVersion[versionKey] = (byVersion[versionKey] || 0) + s.requestCount;
    byDate[s.date] = (byDate[s.date] || 0) + s.requestCount;
  }

  // Sort dates chronologically
  const sortedDates = Object.keys(byDate).sort();
  const dailyTrends = sortedDates.map((date) => ({
    date,
    count: byDate[date],
  }));

  return {
    totalDownloads,
    byApp,
    byVersion,
    dailyTrends,
  };
}
