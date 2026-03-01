function el(id) { return document.getElementById(id); }

function normalizeUrl(u) {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return 'https://' + u.replace(/^\/\//, '');
}

function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}
function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

async function loadSiteData(path) {
  const r = await fetch(path, { cache: 'no-store' });
  if (!r.ok) throw new Error('Failed to load ' + path);
  return r.json();
}

function joinNonEmpty(parts) {
  return parts.filter(Boolean).join(' • ');
}

function badge(label) {
  const b = document.createElement('span');
  b.className = 'badge';
  b.textContent = label;
  return b;
}

function card(title, sub, desc, tags = [], actions = []) {
  const c = document.createElement('article');
  c.className = 'card reveal';

  const h = document.createElement('div');
  h.className = 'card-head';

  const t = document.createElement('div');
  t.className = 'card-title';
  t.textContent = title;

  const s = document.createElement('div');
  s.className = 'card-sub';
  s.textContent = sub || '';

  h.appendChild(t);
  if (sub) h.appendChild(s);

  const p = document.createElement('p');
  p.className = 'card-desc';
  p.textContent = desc || '';

  const meta = document.createElement('div');
  meta.className = 'card-meta';

  const tagWrap = document.createElement('div');
  tagWrap.className = 'tags';
  for (const tg of (tags || [])) tagWrap.appendChild(badge(tg));

  const actWrap = document.createElement('div');
  actWrap.className = 'actions';
  for (const a of (actions || [])) {
    const link = document.createElement('a');
    link.className = 'smalllink';
    link.href = a.href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = a.label + ' →';
    actWrap.appendChild(link);
  }

  meta.appendChild(tagWrap);
  meta.appendChild(actWrap);

  c.appendChild(h);
  c.appendChild(p);
  c.appendChild(meta);

  return c;
}

function renderResearch(items) {
  const root = el('researchCards');
  root.innerHTML = '';

  if (!Array.isArray(items) || !items.length) {
    root.appendChild(card('No research projects yet', '', 'Add researchProjects in data/site.json', [], []));
    return;
  }

  for (const r of items) {
    const title = r.title || 'Untitled project';
    const sub = joinNonEmpty([r.when, r.role]);
    const desc = r.summary || '';
    const tags = r.stack || [];
    const L = r.links || {};

    const actions = [];
    if (L.projectPage) actions.push({ label: 'Project', href: normalizeUrl(L.projectPage) });
    if (L.paper) actions.push({ label: 'Paper', href: normalizeUrl(L.paper) });
    if (L.code) actions.push({ label: 'Code', href: normalizeUrl(L.code) });

    root.appendChild(card(title, sub, desc, tags, actions));
  }
}

function renderPublications(pubs) {
  const ul = el('pubList');
  ul.innerHTML = '';

  if (!Array.isArray(pubs) || !pubs.length) {
    const li = document.createElement('li');
    li.textContent = 'No publications listed yet.';
    ul.appendChild(li);
    return;
  }

  for (const p of pubs) {
    const li = document.createElement('li');

    const title = p.title || 'Untitled';
    const venue = p.venue || p.where || '';
    const year = p.year || '';
    const note = joinNonEmpty([venue, year]);

    if (p.url) {
      const a = document.createElement('a');
      a.href = normalizeUrl(p.url);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = title;
      li.appendChild(a);
    } else {
      const strong = document.createElement('span');
      strong.textContent = title;
      li.appendChild(strong);
    }

    if (note) {
      const span = document.createElement('span');
      span.textContent = ' — ' + note;
      li.appendChild(span);
    }

    if (p.status) {
      const em = document.createElement('span');
      em.textContent = ' (' + p.status + ')';
      li.appendChild(em);
    }

    ul.appendChild(li);
  }
}

function uniqueTags(items) {
  const s = new Set();
  for (const it of (items || [])) {
    for (const t of (it.stack || [])) s.add(t);
  }
  return Array.from(s).sort((a,b)=>a.localeCompare(b));
}

function filterItems(items, q, tag) {
  const qq = (q || '').trim().toLowerCase();
  const tg = (tag || '').trim().toLowerCase();

  return (items || []).filter(it => {
    const hay = [
      it.title, it.role, it.when, it.summary,
      ...(it.stack || []),
      ...(it.highlights || [])
    ].filter(Boolean).join(' ').toLowerCase();

    const okQ = !qq || hay.includes(qq);
    const okT = !tg || (it.stack || []).some(x => String(x).toLowerCase() === tg);
    return okQ && okT;
  });
}

function setupReveal() {
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.classList.add('in');
    }
  }, { threshold: 0.12 });

  for (const node of Array.from(document.querySelectorAll('.reveal'))) {
    obs.observe(node);
  }
}

async function init() {
  applyTheme(getTheme());
  el('themeToggle').addEventListener('click', toggleTheme);

  const site = await loadSiteData('../../data/site.json');
  el('brandName').textContent = site?.name || 'Portfolio';

  const all = site?.researchProjects || [];
  const pubs = site?.publications || [];
  renderPublications(pubs);

  const tagSel = el('tag');
  for (const t of uniqueTags(all)) {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    tagSel.appendChild(opt);
  }

  const q = el('q');
  const rerender = () => {
    const filtered = filterItems(all, q.value, tagSel.value);
    renderResearch(filtered);
    setupReveal();
  };

  q.addEventListener('input', rerender);
  tagSel.addEventListener('change', rerender);

  rerender();
}

init().catch(err => {
  console.error(err);
  const root = el('researchCards');
  if (root) root.textContent = 'Failed to load data/site.json. Check paths and deployment.';
});
