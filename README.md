# Dual-UI Portfolio 

This repo is a **static portfolio site** for:

- Resume / CV
- Papers & publications
- Research projects
- Implementation projects (optionally auto-loaded from GitHub)

The twist: it ships with **two different UIs**.

- **Retro UI**: `./retro/` (DOS/terminal vibes)
- **Modern UI**: `./modern/` (responsive, clean sections)

Visitors land on `index.html` and choose a UI.

---

## Quick start

1) **Edit your info** in:

- `data/site.json`

2) **Replace the placeholder PDFs**:

- `resume/CV.pdf`
- `papers/paper-1.pdf` (or change the links to your real files)

3) **Run locally** (recommended)

Because browsers block `fetch()` on `file://`, run a tiny local server:

### Option A (Python)

```bash
cd portfolio-dual-ui
python -m http.server 8000
```

Open:

- `http://localhost:8000/`

### Option B (Node)

```bash
npx serve .
```

---

## Deploy to GitHub Pages

1) Push this repo to GitHub.
2) Go to **Settings → Pages**.
3) Choose:

- Source: `Deploy from a branch`
- Branch: `main` (or `master`)
- Folder: `/ (root)`

Your site will appear at:

- `https://<username>.github.io/<repo>/`

---

## GitHub projects mode

By default, both UIs can auto-fetch repos from GitHub:

- Set `githubUsername` in `data/site.json`
- Optionally pin featured repos:

```json
"implementationProjects": {
  "mode": "github",
  "featuredRepos": ["my-best-repo", "another-repo"]
}
```

### Manual projects mode

If you want full curation (no GitHub API calls):

```json
"implementationProjects": {
  "mode": "manual",
  "manual": [
    {
      "name": "My project",
      "description": "What it does",
      "topics": ["ml", "systems"],
      "links": { "repo": "https://github.com/..." }
    }
  ]
}
```

---

## Where things live

- UI chooser: `index.html`
- Retro UI: `retro/index.html`
- Modern UI: `modern/index.html`
- Content (shared): `data/site.json`
- CV PDF: `resume/CV.pdf`
- Paper PDFs: `papers/*.pdf`

---

## Customization tips

- Change the color vibe:
  - Retro: `retro/retro.css`
  - Modern: `modern/modern.css`

- Change sections / wording:
  - Retro rendering: `retro/retro.js`
  - Modern rendering: `modern/modern.js`

---

## License

MIT (see `LICENSE`).
