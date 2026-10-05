# Apollus Web v0.9 — GitHub Pages Edition

Apollus Web is a static web app designed to run directly in Chrome, including on a managed Chromebook, without Python, Node.js, or Linux.

## GitHub Pages

GitHub Pages can publish HTML, CSS and JavaScript directly from a repository.

Put the contents of this folder in your GitHub repository and enable:
Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

Your project site will normally be:
`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

## AI connection

GitHub Pages is static hosting. Do NOT put a Mistral API key inside `app.js`, `config.js`, or other public files.

The included `backend/worker.js` is an optional Cloudflare Worker backend.
Store the Mistral key as the Worker secret `MISTRAL_API_KEY`.

Then edit `config.js`:

```js
window.APOLLUS_API_BASE = "https://YOUR-WORKER.workers.dev";
```

Without a backend, the site still opens and the interface works in local/demo mode using browser storage for demo events.

## Apollus identity

The user-facing assistant is Apollus, created by Youssef.
The underlying AI provider is an implementation detail and is not presented in the chat UI.

## Security

Do not commit API keys to GitHub.
