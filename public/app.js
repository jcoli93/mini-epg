/* Minimal guide UI. No framework on purpose. */
const USER_ID = 'demo-user';
const TODAY = '2026-10-20'; // demo data covers 2026-10-20 and 2026-10-21

async function api(path, options) {
  const res = await fetch(path, options);
  return res.json();
}

function fmt(iso) {
  return iso.slice(11, 16);
}

async function loadChannels() {
  const [channels, fav] = await Promise.all([api('/channels'), api(`/users/${USER_ID}/favorites`)]);
  const list = document.getElementById('channels');
  list.innerHTML = '';
  for (const ch of channels) {
    const li = document.createElement('li');
    li.dataset.channelId = ch.id;
    const isFav = fav.favorites.includes(ch.id);
    li.innerHTML = `<span>${ch.number} · ${ch.name}</span>
      <button class="star ${isFav ? 'on' : ''}" aria-label="Favoritar ${ch.name}">★</button>`;
    li.querySelector('span').addEventListener('click', () => loadSchedule(ch.id, li));
    li.querySelector('.star').addEventListener('click', (e) => toggleFavorite(ch.id, e.target));
    list.appendChild(li);
  }
}

async function loadSchedule(channelId, li) {
  document.querySelectorAll('#channels li').forEach((el) => el.classList.remove('active'));
  li.classList.add('active');
  const data = await api(`/channels/${channelId}/schedule?date=${TODAY}`);
  const grid = document.getElementById('grid');
  grid.innerHTML = `<h2>${data.channel.name}</h2>` + data.programmes
    .map((p) => `<div class="prog"><span class="time">${fmt(p.start)}–${fmt(p.end)}</span>${p.title}<span class="rating">${p.rating}</span></div>`)
    .join('');
}

async function toggleFavorite(channelId, button) {
  if (button.classList.contains('on')) {
    await api(`/users/${USER_ID}/favorites/${channelId}`, { method: 'DELETE' });
    button.classList.remove('on');
  } else {
    await api(`/users/${USER_ID}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });
    button.classList.add('on');
  }
}

let timer;
document.getElementById('search').addEventListener('input', (e) => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const q = e.target.value;
    const out = document.getElementById('results');
    if (!q) { out.textContent = ''; return; }
    const r = await api(`/search?q=${encodeURIComponent(q)}`);
    out.textContent = `${r.channels.length} canais, ${r.programmes.length} programas: ` +
      [...r.channels.map((c) => c.name), ...r.programmes.map((p) => p.title)].slice(0, 8).join(', ');
  }, 250);
});

loadChannels();
