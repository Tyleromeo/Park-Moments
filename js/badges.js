// Rope Drop — Achievements / Badges
// Two badge families:
//   1. Park completion tiers (Bronze 50%, Silver 75%, Gold 100%) per park
//   2. Collection completion (100% of any pre-built or custom collection)
// Badges are derived entirely from existing checklist data — there's no
// separate "badge state" to maintain by hand. We just compute what's
// currently earned, diff it against what was earned last time we checked,
// and surface anything new as a celebration moment.

const PARK_BADGE_TIERS = [
  { id: 'bronze', label: 'Bronze', threshold: 50, emoji: '🥉' },
  { id: 'silver', label: 'Silver', threshold: 75, emoji: '🥈' },
  { id: 'gold', label: 'Gold', threshold: 100, emoji: '🏆' },
];

// Returns every park badge currently earned for the active trip, as
// { id, parkId, parkName, parkEmoji, tier, pct } — one entry per tier
// actually reached (so a park at 100% shows bronze, silver, AND gold,
// since all three thresholds were crossed along the way).
function getEarnedParkBadges() {
  const earned = [];
  PARKS.forEach(park => {
    const stats = Storage.getParkStats(park.id);
    if (stats.total === 0) return;
    PARK_BADGE_TIERS.forEach(tier => {
      if (stats.pct >= tier.threshold) {
        earned.push({
          id: `park_${park.id}_${tier.id}`,
          type: 'park',
          parkId: park.id,
          parkName: park.shortName,
          parkEmoji: park.emoji,
          tier: tier.id,
          tierLabel: tier.label,
          tierEmoji: tier.emoji,
          pct: stats.pct,
        });
      }
    });
  });
  return earned;
}

// Returns every collection badge currently earned for the active trip —
// any pre-built or custom collection sitting at 100% completion.
function getEarnedCollectionBadges() {
  const earned = [];
  const collections = getAllCollections();
  collections.forEach(col => {
    if (!col.itemIds || col.itemIds.length === 0) return;
    const progress = Storage.getCollectionProgress(col.itemIds);
    if (progress.pct === 100) {
      earned.push({
        id: `collection_${col.id}`,
        type: 'collection',
        collectionId: col.id,
        collectionName: col.name,
        collectionEmoji: col.emoji,
      });
    }
  });
  return earned;
}

function getAllEarnedBadges() {
  return [...getEarnedParkBadges(), ...getEarnedCollectionBadges()];
}

// Compares current badges against the set of badge IDs we've already
// shown a celebration for (stored in localStorage, per browser/device —
// intentionally not part of trip data since it's a "have I seen this"
// flag, not trip progress itself). Returns any badges that are newly
// earned since the last check, so the caller can pop a celebration.
const SEEN_BADGES_KEY = 'rd_seen_badges_v1';

function getSeenBadgeIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_BADGES_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function markBadgesSeen(badgeIds) {
  const seen = getSeenBadgeIds();
  badgeIds.forEach(id => seen.add(id));
  localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify([...seen]));
}

function getNewlyEarnedBadges() {
  const seen = getSeenBadgeIds();
  const current = getAllEarnedBadges();
  return current.filter(b => !seen.has(b.id));
}
