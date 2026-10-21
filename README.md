# PassMeter — "How good is my password?"

A static, privacy-friendly password strength checker that shows how long a
password would take to crack on a **1990 machine** versus **today**, plus a
live breach check, a password generator and a topic cluster of SEO/GEO pages.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Main live checker (1990 vs today crack times) |
| `*.html` | Topic-cluster content pages (strength guide, crack time, entropy, breach checker, generator, top 10, etc.) |
| `styles.css` | Shared design system (light + dark theme) |
| `site.js` | Theme toggle, per-page window titles, visit counter rendering |
| `functions/api/stats.js` | Cloudflare Pages Function for the visit counter (KV backed) |
| `wrangler.toml` | Wrangler/Pages configuration |
| `sitemap.xml`, `robots.txt`, `llms.txt` | Crawl + AI-engine discovery |
| `package.json` | Optional: `npm run dev` / `npm run deploy` with Wrangler |

## Deploy (GitHub → Cloudflare Pages)

1. Push this folder to a GitHub repository.
2. In Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repo. Build command: *(leave empty)*. Output directory: `.`.
4. Deploy. The site is live at `https://<project>.pages.dev`.

### Optional: real visit counts

The counter under the tool works out of the box using a per-device fallback
(`localStorage`). For shared, all-time counts across visitors:

1. Create a KV namespace (`npx wrangler kv namespace create VISITS`).
2. In Cloudflare: **Settings → Functions → Bindings → Add → KV Namespace**,
   variable name `VISITS`, select the namespace.
3. Redeploy. `functions/api/stats.js` then returns real counts for
   **today / this week / all time**.

## Local preview

Cloudflare Pages Functions need the Wrangler dev server, or just open
`index.html` directly for the static UI (the counter then uses the local
fallback).

## How the crack-time math works

```
keyspace  = charsetSize ^ length
guesses   = keyspace / 2          (attacker reaches the answer halfway)
time_1990 = guesses / 1,000       (1990 workstation)
time_today = guesses / 10,000,000,000 (modern GPU cluster)
entropy   = log2(keyspace) bits
```

`charsetSize` counts only the character classes actually used:
26 lowercase + 26 uppercase + 10 digits + ~32 symbols.

## Privacy

- Strength scoring is 100% client-side. The password never leaves the page.
- The breach check uses k-anonymity: only a 5-character SHA-1 prefix is sent
  to the Have I Been Pwned range API.
- No analytics, no cookies, no tracking scripts.
