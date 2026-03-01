import {
  loadSiteData,
  setTitle,
  escapeHtml,
  joinNonEmpty,
  prettyYearRange,
  fetchGithubRepos,
  pickFeaturedRepos,
  formatIsoDate,
  normalizeUrl,
  smoothScrollToHash
} from '../assets/common.js';

const THEME_KEY = 'portfolio_theme_v1';

function getTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch { return null; }
}
function setTheme(v) {
  try { localStorage.setItem(THEME_KEY, v); } catch { /* ignore */ }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (!theme) {
    root.removeAttribute('data-theme');
    return;
  }
  root.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || getTheme();
  const next = cur === 'light' ? 'dark' : 'light';
  applyTheme(next);
  setTheme(next);
}


function maybeEl(id) {
  return document.getElementById(id);
}

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node;
}

function setHref(id, url) {
  const a = el(id);
  if (!url) {
    a.setAttribute('href', '#');
    a.setAttribute('aria-disabled', 'true');
    a.style.opacity = '0.55';
    a.style.pointerEvents = 'none';
    return;
  }
  a.href = url;
}

function renderHighlights(list) {
  const ul = el('highlights');
  ul.innerHTML = '';
  for (const item of (list || [])) {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  }
}

function renderSkills(skillsObj) {
  const root = el('skills');
  root.innerHTML = '';

  const entries = Object.entries(skillsObj || {});
  if (!entries.length) {
    root.textContent = 'Add skills in data/site.json';
    return;
  }

  for (const [label, items] of entries) {
    const row = document.createElement('div');
    row.className = 'skill-row reveal';

    const lab = document.createElement('div');
    lab.className = 'label';
    lab.textContent = label;

    const it = document.createElement('div');
    it.className = 'items';
    for (const s of (items || [])) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = s;
      it.appendChild(chip);
    }

    row.appendChild(lab);
    row.appendChild(it);
    root.appendChild(row);
  }
}

function renderTimeline(list, targetId, kind) {
  const root = el(targetId);
  root.innerHTML = '';

  if (!Array.isArray(list) || !list.length) {
    root.textContent = `Add ${kind} in data/site.json`;
    return;
  }

  for (const item of list) {
    const entry = document.createElement('div');
    entry.className = 'entry reveal';

    const top = document.createElement('div');
    top.className = 'top';

    const title = document.createElement('div');
    title.className = 'title';

    const when = document.createElement('div');
    when.className = 'when';

    if (kind === 'experience') {
      title.textContent = `${item.role || ''}${item.org ? ` @ ${item.org}` : ''}`.trim();
      when.textContent = prettyYearRange(item.start, item.end);
    } else {
      title.textContent = `${item.degree || ''}${item.school ? ` — ${item.school}` : ''}`.trim();
      when.textContent = prettyYearRange(item.start, item.end);
    }

    top.appendChild(title);
    top.appendChild(when);

    const org = document.createElement('div');
    org.className = 'org';
    org.textContent = joinNonEmpty([item.location]).trim();

    entry.appendChild(top);
    if (org.textContent) entry.appendChild(org);

    if (kind === 'experience' && Array.isArray(item.bullets) && item.bullets.length) {
      const ul = document.createElement('ul');
      for (const b of item.bullets) {
        const li = document.createElement('li');
        li.textContent = b;
        ul.appendChild(li);
      }
      entry.appendChild(ul);
    }

    if (kind === 'education' && Array.isArray(item.details) && item.details.length) {
      const ul = document.createElement('ul');
      for (const d of item.details) {
        const li = document.createElement('li');
        li.textContent = d;
        ul.appendChild(li);
      }
      entry.appendChild(ul);
    }

    root.appendChild(entry);
  }
}

function card(title, sub, desc, tags, actions) {
  const c = document.createElement('article');
  c.className = 'card reveal';

  const t = document.createElement('div');
  t.className = 'title';
  t.textContent = title;

  const s = document.createElement('div');
  s.className = 'sub';
  s.textContent = sub;

  const d = document.createElement('div');
  d.className = 'desc';
  d.textContent = desc;

  c.appendChild(t);
  if (sub) c.appendChild(s);
  if (desc) c.appendChild(d);

  if (Array.isArray(tags) && tags.length) {
    const tagWrap = document.createElement('div');
    tagWrap.className = 'tags';
    for (const tag of tags) {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      tagWrap.appendChild(span);
    }
    c.appendChild(tagWrap);
  }

  if (Array.isArray(actions) && actions.length) {
    const aWrap = document.createElement('div');
    aWrap.className = 'actions';
    for (const a of actions) {
      const link = document.createElement('a');
      link.className = 'action';
      link.href = a.href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = a.label;
      aWrap.appendChild(link);
    }
    c.appendChild(aWrap);
  }

  return c;
}

function cardWithList(title, sub, items) {
  const c = document.createElement('article');
  c.className = 'card reveal';

  const t = document.createElement('div');
  t.className = 'title';
  t.textContent = title;
  c.appendChild(t);

  if (sub) {
    const s = document.createElement('div');
    s.className = 'sub';
    s.textContent = sub;
    c.appendChild(s);
  }

  if (Array.isArray(items) && items.length) {
    const ul = document.createElement('ul');
    for (const it of items) {
      const li = document.createElement('li');
      li.textContent = it;
      ul.appendChild(li);
    }
    c.appendChild(ul);
  }

  return c;
}


function renderResearch(items) {
  const root = maybeEl('researchCards');
  if (!root) return; 
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

function renderManualProjects(manual) {
  const root = el('projectCards');
  root.innerHTML = '';

  if (!Array.isArray(manual) || !manual.length) {
    root.appendChild(card('No projects yet', '', 'Add implementationProjects.manual or enable GitHub mode.', [], []));
    return;
  }

  for (const p of manual) {
    const title = p.name || 'Project';
    const sub = Array.isArray(p.topics) ? p.topics.join(' · ') : '';
    const desc = p.description || '';
    const tags = p.topics || [];
    const L = p.links || {};

    const actions = [];
    if (L.repo) actions.push({ label: 'Repo', href: normalizeUrl(L.repo) });
    if (L.demo) actions.push({ label: 'Demo', href: normalizeUrl(L.demo) });
    if (L.docs) actions.push({ label: 'Docs', href: normalizeUrl(L.docs) });

    root.appendChild(card(title, sub, desc, tags, actions));
  }
}

async function renderGithubProjects(username, featuredNames) {
  const root = el('projectCards');
  const note = el('ghNote');

  root.innerHTML = '';
  note.textContent = 'Loading from GitHub…';

  const { repos, note: ghNote } = await fetchGithubRepos(username);
  const featured = pickFeaturedRepos(repos, featuredNames);
  note.textContent = ghNote;

  if (!featured.length) {
    root.appendChild(card('GitHub projects not loaded', '', `Set githubUsername in data/site.json (current: ${username || 'empty'}).`, [], []));
    return;
  }

  for (const r of featured) {
    const title = r.name;
    const sub = joinNonEmpty([
      r.language,
      `★${r.stargazers_count || 0}`,
      `updated ${formatIsoDate(r.updated_at)}`
    ]);
    const desc = r.description || '';
    const tags = Array.isArray(r.topics) ? r.topics.slice(0, 6) : [];

    const actions = [{ label: 'Repo', href: r.html_url }];
    if (r.homepage) actions.push({ label: 'Live', href: normalizeUrl(r.homepage) });

    root.appendChild(card(title, sub, desc, tags, actions));
  }
}

function renderHonors(items) {
  const root = el('awardsList');
  root.innerHTML = '';
  const list = Array.isArray(items) ? items : [];

  if (!list.length) {
    const li = document.createElement('li');
    li.textContent = '—';
    root.appendChild(li);
    return;
  }

  for (const a of list) {
    const li = document.createElement('li');
    li.textContent = String(a);
    root.appendChild(li);
  }
}

function renderService(items) {
  const root = el('serviceList');
  root.innerHTML = '';
  const list = Array.isArray(items) ? items : [];

  if (!list.length) {
    const li = document.createElement('li');
    li.textContent = '—';
    root.appendChild(li);
    return;
  }

  for (const item of list) {
    const li = document.createElement('li');

    if (!item || typeof item === 'string') {
      li.textContent = String(item || '');
      root.appendChild(li);
      continue;
    }

    const text = item.text || '';
    li.appendChild(document.createTextNode(text));

    if (Array.isArray(item.links) && item.links.length) {
      li.appendChild(document.createTextNode(' ('));
      item.links.forEach((L, idx) => {
        if (idx) li.appendChild(document.createTextNode(' · '));
        const a = document.createElement('a');
        a.href = normalizeUrl(L.url || '');
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = L.label || L.url || 'link';
        li.appendChild(a);
      });
      li.appendChild(document.createTextNode(')'));
    }

    root.appendChild(li);
  }
}

function renderTeaching(groups) {
  const root = el('teachingCards');
  root.innerHTML = '';
  const list = Array.isArray(groups) ? groups : [];

  if (!list.length) {
    root.appendChild(card('No teaching listed', '', 'Add teachingExperience in data/site.json', [], []));
    return;
  }

  for (const g of list) {
    const org = g.org || 'Organization';
    const items = (g.items || []).map(x => {
      if (!x) return '';
      if (typeof x === 'string') return x;
      const course = x.course || '';
      const term = x.term || '';
      return [course, term].filter(Boolean).join(' — ');
    }).filter(Boolean);

    root.appendChild(cardWithList(org, '', items));
  }
}

function renderWorkshops(items) {
  const root = el('workshopsCards');
  root.innerHTML = '';
  const list = Array.isArray(items) ? items : [];

  if (!list.length) {
    root.appendChild(card('No workshops listed', '', 'Add conferencesWorkshops in data/site.json', [], []));
    return;
  }

  for (const w of list) {
    const title = w?.name || 'Event';
    const sub = joinNonEmpty([w?.host, w?.location]);
    const desc = w?.date || '';
    root.appendChild(card(title, sub, desc, [], []));
  }
}

function attachReveal() {
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('on');
        obs.unobserve(e.target);
      }
    }
  }, { threshold: 0.12 });

  for (const node of Array.from(document.querySelectorAll('.reveal'))) {
    obs.observe(node);
  }
}

async function init() {
  applyTheme(getTheme());
  el('themeToggle').addEventListener('click', toggleTheme);

  const site = await loadSiteData('../data/site.json');
  setTitle(site?.name || 'Portfolio', 'Modern');

  el('brandName').textContent = site?.name || 'Portfolio';
  el('name').textContent = site?.name || 'YOUR NAME';
  el('tagline').textContent = site?.tagline || '';
  el('summary').textContent = site?.summary || '';
  el('bio').textContent = site?.summary || '';

  renderHighlights(site?.highlights || []);

  const metaLine = joinNonEmpty([
    site?.location,
    site?.email
  ]);
  el('metaLine').textContent = metaLine;

  setHref('btnGithub', normalizeUrl(site?.links?.github || ''));
  setHref('btnLinkedIn', normalizeUrl(site?.links?.linkedin || ''));
  setHref('btnCV', site?.links?.cvPdf || '../resume/CV.pdf');

  el('contactPitch').textContent = site?.contact?.pitch || '';
  setHref('mailBtn', site?.email ? `mailto:${site.email}` : '');
  el('loc').textContent = site?.location || '—';
  el('tz').textContent = site?.contact?.timezone || '—';

  setHref('gh', normalizeUrl(site?.links?.github || ''));
  el('gh').textContent = site?.githubUsername ? site.githubUsername : '—';

  setHref('li', normalizeUrl(site?.links?.linkedin || ''));
  el('li').textContent = site?.links?.linkedin ? 'LinkedIn profile' : '—';

  renderSkills(site?.skills || {});
  renderTimeline(site?.education || [], 'educationTimeline', 'education');
  renderTimeline(site?.experience || [], 'experienceTimeline', 'experience');

  renderTeaching(site?.teachingExperience || []);
  renderService(site?.academicServices || []);
  renderHonors(site?.honorsAwards || []);
  renderWorkshops(site?.conferencesWorkshops || []);

 

  const impl = site?.implementationProjects || { mode: 'github' };
  setHref('ghProfile', normalizeUrl(site?.links?.github || ''));

  if (impl.mode === 'manual') {
    el('ghNote').textContent = 'Manual mode (projects are curated in data/site.json).';
    renderManualProjects(impl.manual || []);
  } else {
    await renderGithubProjects(site?.githubUsername, impl.featuredRepos || []);
  }

  attachReveal();
  smoothScrollToHash();
}

init().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="padding:20px">Modern UI failed to load.\n\n${escapeHtml(String(err))}</pre>`;
});