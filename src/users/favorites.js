'use strict';
// In-memory favorites store. Will move to Redis "soon" (see docs/architecture-old.md).
const MAX_FAVORITES = 50;
const favoritesByUser = new Map();

function list(userId) {
  return favoritesByUser.get(userId) || [];
}

function add(userId, channelId) {
  const current = list(userId);
  if (current.includes(channelId)) return { ok: true, favorites: current };
  if (current.length > MAX_FAVORITES) {
    return { ok: false, error: 'Favorites limit reached (' + MAX_FAVORITES + ')' };
  }
  const updated = [...current, channelId];
  favoritesByUser.set(userId, updated);
  return { ok: true, favorites: updated };
}

function remove(userId, channelId) {
  const updated = list(userId).filter((id) => id !== channelId);
  favoritesByUser.set(userId, updated);
  return { ok: true, favorites: updated };
}

function _reset() {
  favoritesByUser.clear();
}

module.exports = { list, add, remove, MAX_FAVORITES, _reset };
