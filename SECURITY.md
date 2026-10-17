# Shadow Play — Security

> **Single source of truth for keeping the repo and the deployed game safe.** `PRD.md` = what the game does, `ASSETS.md` = which files it uses, this file = how it stays safe. Claude Code must follow these rules in every milestone.

## What we are protecting

Shadow Play is a **static browser game**: HTML, JavaScript and asset files served by Vercel. There is **no server, no database, no login and no player data**. So the real risks are small and specific:

| Risk | What could happen | Rule that prevents it |
| --- | --- | --- |
| Leaked secret | An API key (for example from an AI tool) committed to the public repo gets stolen and abused | Rules 1–3 |
| Bad dependency | A compromised or vulnerable npm package ends up in the game | Rules 4–6 |
| Code injected into the page | A third-party script or unsafe code changes what players see | Rules 7–10 |
| Someone copies or reframes the site | The game is embedded inside another site pretending to be theirs | Rule 11 |
| Broken save data | Edited `localStorage` crashes the game | Rule 12 |
| Account takeover | Someone gets into the GitHub or Vercel account and replaces the game | Rules 13–15 |
| Disqualification | Plagiarised code or uncredited assets | Rules 16–17 |

## Rules

### Secrets

1. **The game needs no secrets.** Never put an API key, token or password in any file, including `config.js`, `.env`, or comments. Anything shipped to a browser is public anyway.
2. `.gitignore` must contain: `node_modules/`, `dist/`, `.env`, `.env.*`, `.vercel/`, `*.log`, `.DS_Store`.
3. **Before making the repo public**, run a secret check:
   - On GitHub: Settings → Code security → enable **Secret scanning** and **Push protection**.
   - Locally: `git log -p | grep -iE "api[_-]?key|secret|token|password"` should print nothing that is a real key. If a real key was ever committed, **revoke it at the provider first** (deleting the file does not remove it from history).

### Dependencies

4. Keep dependencies minimal: **`phaser` and `vite` only**. Don't add packages without a clear reason; every package is code you trust.
5. Commit `package-lock.json` so everyone (and Vercel) installs exactly the same versions. Use `npm ci` on a fresh clone.
6. Run `npm audit` at each milestone. Fix **high/critical** issues with `npm audit fix` (never `--force` without checking what it changes). Turn on **Dependabot alerts** in GitHub settings.

### Page safety

7. **No third-party scripts** (no CDN scripts, analytics, ads, chat widgets). Everything is bundled by Vite and served from our own domain. Google Fonts are downloaded into `public/assets/fonts/`, not linked from Google (see `ASSETS.md`).
8. **No `eval`, `new Function`, or `innerHTML` with dynamic text.** Phaser text objects are fine. For any HTML text, use `textContent`.
9. Never load levels, images or sounds from a URL that a player or query string can change. All asset paths come from `src/assets.js`.
10. Add security headers on Vercel with a `vercel.json` in the project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

After deploying, open the live game, press F12 → Console, and play through Act 1. If there are red "Content-Security-Policy" errors, the policy is blocking something the game needs: tell Claude Code the exact error and loosen **only that one directive**.

### Embedding

11. `frame-ancestors 'self'` (above) stops other sites from showing the game inside a frame. If the organizers ask to embed it (for example on itch.io), add their domain to that directive.

### Save data

12. The game saves **one small record** in the browser's `localStorage`: `{ version, highestAct, tutorialDone, tipsSeen, settings, stats }` (shape in PRD 4.10). Rules: read it once at boot inside `try/catch`; check `version`; clamp `highestAct` to 1–5; `tutorialDone` and assist flags must be booleans; volumes are numbers clamped to 0–10; `tipsSeen` may only contain known tip ids; stats are non-negative numbers. Anything else means starting a fresh record. Never store anything personal.
    - **Why not an httpOnly cookie?** httpOnly cookies can only be created and read by a **server**; JavaScript in the browser is not allowed to touch them. That protection is meant for secrets like login tokens. Shadow Play has no server (Vercel only serves static files) and this record holds no secrets: "tutorial done" being readable is harmless. Adding a server just for it would add cost, risk and things to break. If a server is ever added (PRD 7.13), the record can move there.
    - A plain JavaScript-set cookie would work too, but it gets sent with every request for no benefit, so `localStorage` is the better choice.

### Accounts

13. Turn on **two-factor authentication** for every teammate's GitHub and Vercel accounts.
14. Only the four teammates are collaborators on the repo. Don't give access to anyone else.
15. Vercel deploys only from the `main` branch of our repo. Don't connect other repos or give the Vercel project to anyone else.

### Jam rules (also "security" for your score)

16. All code is written by us with AI help, never copied from another game's source code.
17. Every asset is listed in `CREDITS.md` (see `ASSETS.md`).

## Pre-deploy checklist (run before making the repo public and before submitting)

- [ ] No secrets in the code or history (rule 3), secret scanning on
- [ ] `.gitignore` correct, no `node_modules/` or `dist/` committed
- [ ] `npm audit` shows no high/critical issues
- [ ] No external `<script>` tags in `index.html`
- [ ] `vercel.json` headers deployed; live game plays through with no console errors
- [ ] 2FA on both GitHub and Vercel accounts
- [ ] `CREDITS.md` complete
