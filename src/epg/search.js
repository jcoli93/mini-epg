'use strict';
const store = require('./store');

const MAX_RESULTS = 20;

// Searches channel names and programme titles.
function search(query) {
  if (!query || !query.trim()) return { channels: [], programmes: [] };
  const q = query.trim();

  const channels = store
    .getChannels()
    .filter((c) => c.name.includes(q));

  const programmes = store
    .getProgrammes()
    .filter((p) => p.title.includes(q))
    .slice(0, MAX_RESULTS);

  return { channels, programmes };
}

module.exports = { search, MAX_RESULTS };
