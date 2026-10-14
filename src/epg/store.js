'use strict';
// Loads the guide data once at startup. The nightly importer (src/legacy/importer.js)
// regenerates data/schedule.json in production.
const channels = require('../../data/channels.json');
const programmes = require('../../data/schedule.json');

function getChannels() {
  return channels.slice().sort((a, b) => a.number - b.number);
}

function getChannel(id) {
  return channels.find((c) => c.id === id) || null;
}

function getProgrammes() {
  return programmes;
}

module.exports = { getChannels, getChannel, getProgrammes };
