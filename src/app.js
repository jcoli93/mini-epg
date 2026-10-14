'use strict';
const path = require('path');
const express = require('express');
const store = require('./epg/store');
const { search } = require('./epg/search');
const { getSchedule } = require('./epg/schedule');
const { nowPlaying } = require('./epg/nowPlaying');
const favorites = require('./users/favorites');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/channels', (req, res) => {
  res.json(store.getChannels());
});

app.get('/channels/:id/schedule', (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const schedule = getSchedule(req.params.id, date);
  if (!schedule) return res.status(404).json({ error: 'Channel not found' });
  res.json(schedule);
});

app.get('/now-playing', (req, res) => {
  const at = req.query.at ? new Date(req.query.at) : new Date();
  res.json(nowPlaying(at));
});

app.get('/search', (req, res) => {
  res.json(search(req.query.q || ''));
});

app.get('/users/:userId/favorites', (req, res) => {
  res.json({ favorites: favorites.list(req.params.userId) });
});

app.post('/users/:userId/favorites', (req, res) => {
  const { channelId } = req.body || {};
  if (!channelId || !store.getChannel(channelId)) {
    return res.status(400).json({ error: 'Unknown channelId' });
  }
  const result = favorites.add(req.params.userId, channelId);
  if (!result.ok) return res.status(409).json({ error: result.error });
  res.status(201).json({ favorites: result.favorites });
});

app.delete('/users/:userId/favorites/:channelId', (req, res) => {
  res.json(favorites.remove(req.params.userId, req.params.channelId));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
