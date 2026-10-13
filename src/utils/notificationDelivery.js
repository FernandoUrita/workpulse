export function safeNotificationPath(link, origin) {
  if (!link || !link.startsWith('/') || link.startsWith('//')) return '/dashboard';
  try {
    const url = new URL(link, origin);
    return url.origin === origin ? url.pathname + url.search + url.hash : '/dashboard';
  } catch { return '/dashboard'; }
}

export function unseenLiveAlerts(rows, userId, seen) {
  return rows.filter(row => {
    if (!userId || row.user_id !== userId || seen.has(row.id)) return false;
    seen.add(row.id);
    return !row.read && !row.dismissed;
  });
}

export function createNotificationTracker(startedAt = Date.now()) {
  const seen = new Set();
  let initialized = false;
  const accept = row => {
    if (!row?.id || seen.has(row.id)) return false;
    seen.add(row.id);
    return !row.read && !row.dismissed;
  };
  return {
    insert(row) { return accept(row) ? [row] : []; },
    snapshot(rows) {
      if (!initialized) {
        initialized = true;
        rows.forEach(row => seen.add(row.id));
        return [];
      }
      return rows.filter(row => {
        if (seen.has(row.id)) return false;
        if (new Date(row.created_at).getTime() < startedAt) { seen.add(row.id); return false; }
        return accept(row);
      });
    },
  };
}
