'use strict';
const store = require('./store');

// Returns the programmes of a channel for a given São Paulo calendar day (YYYY-MM-DD).
function getSchedule(channelId, date) {
  const channel = store.getChannel(channelId);
  if (!channel) return null;

  const [year, month, day] = date.split('-').map(Number);
  const dayStart = new Date(Date.UTC(year, month - 1, day, 3, 0, 0)); // 00:00 in São Paulo (UTC-3)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  if (isNaN(dayStart.getTime())) {
    throw new Error('Invalid date: ' + date);
  }

  const programmes = store
    .getProgrammes()
    .filter((p) => p.channelId === channelId)
    .filter((p) => new Date(p.start) < dayEnd && new Date(p.end) > dayStart)
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  return { channel, date, programmes };
}

module.exports = { getSchedule };
