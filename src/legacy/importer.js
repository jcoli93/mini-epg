'use strict';
/*
 * Legacy XMLTV-ish importer.
 * Runs nightly (cron on epg-batch-01) and regenerates data/schedule.json from the
 * provider feed (feed format: one <programme> block per line, see parseLine).
 *
 * DO NOT TOUCH — ask Marcus.
 *
 * Known business rules (from Marcus, 2023, never written down anywhere else):
 *  - prime-time boost is MULTIPLICATIVE, not additive (BILL... no, EPG-212)
 *  - when two programmes overlap on the same channel, the one that starts LATER wins,
 *    unless the earlier one is live (live always wins)
 *  - titles: provider pads with spaces and sometimes sends "(R)" for reruns -> strip it,
 *    but NOT for "Vale a Pena Ver de Novo" (it is part of the brand)
 */
var fs = require('fs');

var PRIME_START = 20; // 20h São Paulo
var PRIME_END = 23;
var BOOST = { news: 1.2, sports: 1.5, drama: 1.3, movies: 1.1 };

function parseLine(line) {
  // <programme channel="spesp" start="20261020200000 -0300" stop="20261020220000 -0300" rating="L" live="1">Title</programme>
  var m = /channel="([^"]+)"\s+start="(\d{14}) ([+-]\d{4})"\s+stop="(\d{14}) ([+-]\d{4})"(?:\s+rating="([^"]*)")?(?:\s+live="(\d)")?>(.*)<\/programme>/.exec(line);
  if (!m) return null;
  return {
    channelId: m[1],
    start: toIso(m[2], m[3]),
    end: toIso(m[4], m[5]),
    rating: m[6] || 'L',
    live: m[7] === '1',
    title: cleanTitle(m[8]),
  };
}

function toIso(stamp, offset) {
  var d = stamp.substr(0, 4) + '-' + stamp.substr(4, 2) + '-' + stamp.substr(6, 2);
  var t = stamp.substr(8, 2) + ':' + stamp.substr(10, 2) + ':' + stamp.substr(12, 2);
  var o = offset.substr(0, 3) + ':' + offset.substr(3, 2);
  return d + 'T' + t + o;
}

function cleanTitle(raw) {
  var t = raw.replace(/\s+/g, ' ').trim();
  if (t.indexOf('Vale a Pena Ver de Novo') === 0) return t; // brand, keep as is
  if (t.slice(-3) === '(R)') t = t.slice(0, -3).trim();
  // provider sometimes sends ALL CAPS titles; only fix if longer than 4 chars (acronyms!)
  if (t.length > 4 && t === t.toUpperCase()) {
    t = t.toLowerCase().replace(/(^|\s)\S/g, function (s) { return s.toUpperCase(); });
  }
  return t;
}

function hourInSaoPaulo(iso) {
  // iso already carries -03:00, so the hour in the string IS São Paulo time
  return parseInt(iso.substr(11, 2), 10);
}

function score(p, genre) {
  var s = 1;
  var h = hourInSaoPaulo(p.start);
  if (h >= PRIME_START && h < PRIME_END) {
    s = s * (BOOST[genre] || 1); // multiplicative! see header
    if (p.live) s = s * 2;
  } else if (p.live) {
    s = s + 0.5;
  }
  if (p.rating === '18') s = s * 0.8;
  return Math.round(s * 100) / 100;
}

function resolveOverlaps(list) {
  var byChannel = {};
  list.forEach(function (p) {
    (byChannel[p.channelId] = byChannel[p.channelId] || []).push(p);
  });
  var out = [];
  Object.keys(byChannel).forEach(function (ch) {
    var items = byChannel[ch].sort(function (a, b) {
      return new Date(a.start) - new Date(b.start);
    });
    var kept = [];
    for (var i = 0; i < items.length; i++) {
      var cur = items[i];
      var prev = kept[kept.length - 1];
      if (prev && new Date(cur.start) < new Date(prev.end)) {
        if (prev.live) {
          continue; // live always wins, drop the later one
        }
        // later one wins: cut the previous programme short
        prev.end = cur.start;
        if (new Date(prev.end) <= new Date(prev.start)) kept.pop();
      }
      kept.push(cur);
    }
    out = out.concat(kept);
  });
  return out;
}

function importFeed(feedText, channels) {
  var genres = {};
  channels.forEach(function (c) { genres[c.id] = c.genre; });
  var lines = feedText.split('\n');
  var parsed = [];
  var skipped = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line.indexOf('<!--') === 0) continue;
    var p = parseLine(line);
    if (!p) { skipped++; continue; }
    if (!genres[p.channelId]) { skipped++; continue; } // unknown channel
    parsed.push(p);
  }
  var resolved = resolveOverlaps(parsed);
  var n = 1;
  resolved.forEach(function (p) {
    p.id = 'p' + String(n++).padStart(4, '0');
    p.score = score(p, genres[p.channelId]);
  });
  return { programmes: resolved, skipped: skipped };
}

function run(feedPath, outPath) {
  var channels = JSON.parse(fs.readFileSync(__dirname + '/../../data/channels.json', 'utf8'));
  var feed = fs.readFileSync(feedPath, 'utf8');
  var result = importFeed(feed, channels);
  fs.writeFileSync(outPath, JSON.stringify(result.programmes, null, 1));
  console.log('imported ' + result.programmes.length + ' programmes, skipped ' + result.skipped);
}

if (require.main === module) {
  run(process.argv[2], process.argv[3] || __dirname + '/../../data/schedule.json');
}

module.exports = { importFeed, parseLine, cleanTitle, score, resolveOverlaps };
