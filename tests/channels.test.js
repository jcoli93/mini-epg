const request = require('supertest');
const app = require('../src/app');

describe('GET /channels', () => {
  it('returns the channel list', async () => {
    const res = await request(app).get('/channels');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns a schedule for a known channel', async () => {
    const res = await request(app).get('/channels/spesp/schedule?date=2026-10-20');
    expect(res.status).toBe(200);
  });
});
