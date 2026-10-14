'use strict';
const store = require('./store');

const SAO_PAULO_OFFSET_HOURS = -3;

// Wall-clock "today" in São Paulo as YYYY-MM-DD.
function saoPauloDate(now) {
  const local = new Date(now.getTime() + SAO_PAULO_OFFSET_HOURS * 60 * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

// What is on air on every channel at `now` (defaults to the current time).
function nowPlaying(now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const result = [];
  for (const channel of store.getChannels()) {
    const current = store
      .getProgrammes()
      .filter((p) => p.channelId === channel.id)
      .filter((p) => p.start.slice(0, 10) === today)
      .find((p) => new Date(p.start) <= now && now < new Date(p.end));
    result.push({ channel, programme: current || null });
  }
  return result;
}

module.exports = { nowPlaying, saoPauloDate };
