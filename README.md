# PassMeter — "How good is my password?"

A privacy-friendly password strength checker that shows how long a password
would take to crack on a **1990 machine** versus **today**, plus a live breach
check, a password generator and a topic cluster of SEO/GEO pages.

Deployed as a **Cloudflare Worker with static assets**, so the default
`npx wrangler deploy` command works from a Git-connected project.

## Structure

| Path | Purpose |
| --- | --- |
| `src/worker.js` | Worker entry point: static assets + `/api/stats` + dynamic `sitemap.xml`, `robots.txt`, `llms.txt` |
| `public/` | The site (13 HTML pages, CSS, JS, 404 page, `_headers`) |
| `public/index.html` | Main live checker (1990 vs today crack times) |
| `public/*.html` | Topic-cluster content pages (strength guide, crack time, entropy, breach checker, generator, top 10, …) |
| `public/styles.css` | Shared design system (light + dark theme) |
| `public/site.js` | Theme toggle, per-page window titles, absolute SEO URLs, visit counter rendering |
| `public/404.html` | Not-found page (`not_found_handling = "404-page"`) |
| `wrangler.toml` | Worker + assets config, optional KV binding |
| `package.json` | Pins Wrangler v4 so the build uses a current CLI |

## Deploy (GitHub → Cloudflare)

1. Push this folder to a GitHub repository.
2. Cloudflare dashboard → **Workers & Pages → Create → Connect to Git** → pick the repo.

Build settings:

| Setting | Value |
| --- | --- |
| Build command | *(leave empty)* |
| Deploy command | `npx wrangler deploy` |
| Root directory | *(repo root)* |

> The Worker name in the dashboard must match `name` in `wrangler.toml`
> (`password-checker`). Change both if you want a different name.

> Because the build command is empty, `node_modules` is never installed.
> `npx` therefore downloads Wrangler on the fly for the deploy step — no
> `npm install` step is required, but the first deploy takes a little longer.
> If your build environment prompts for the download, use
> `npx --yes wrangler deploy` instead.

The site is served from `https://password-checker.<your-subdomain>.workers.dev`.
Add a custom domain under **Settings → Domains & Routes**.

### Optional: real visit counts

The counter under the tool works out of the box using a per-device fallback
(`localStorage`). For shared, all-time counts across all visitors:

1. `npx wrangler kv namespace create VISITS`
2. Put the printed id under `[[kv_namespaces]]` in `wrangler.toml` (or add the
   binding in the dashboard: **Settings → Bindings → KV Namespace**, variable
   `VISITS`).
3. Redeploy. `src/worker.js` then returns real counts for
   **today / this week / all time**.

`/api/health` reports whether the KV binding is active.

## Local development

Requires Node.js:

```sh
npm install
npm run dev     # http://localhost:8787
npm run deploy  # publish the Worker
```

## How the crack-time math works

```
keyspace   = charsetSize ^ length
guesses    = keyspace / 2            (attacker reaches the answer halfway)
time_1990  = guesses / 1,000         (1990 workstation)
time_today = guesses / 10,000,000,000 (modern GPU cluster)
entropy    = log2(keyspace) bits
```

`charsetSize` counts only the character classes actually used:
26 lowercase + 26 uppercase + 10 digits + ~32 symbols.

## Privacy

- Strength scoring is 100% client-side. The password never leaves the page.
- The breach check uses k-anonymity: only a 5-character SHA-1 prefix is sent
  to the Have I Been Pwned range API.
- No analytics, no cookies, no tracking scripts.
- The visit counter stores only IP-derived daily-unique keys and counters in KV.
