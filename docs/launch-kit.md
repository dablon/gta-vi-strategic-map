# Launch Kit — Leonida Heist Atlas

Marketing pack for promoting the map. One rule above all: **be a community member first, promoter second.** Post once per community, answer every comment for 48 h, and never repost the same copy twice in the same place.

- Live map: https://dablon.github.io/gta-vi-strategic-map/
- Repo (open source): https://github.com/dablon/gta-vi-strategic-map
- Map data credit (mandatory everywhere): tiles & landmarks from gtadb.org, CC BY 4.0

## Product facts (use these, not adjectives)

- 380+ pins: vaults & stick-up spots, fences, escape routes (Pay 'n' Spray, marinas, airports), prep (Ammu-Nation, mod shops), liquidity (stores, liquor), plus transport and services.
- Three confidence tiers: curated / upstream-confirmed / auto-discovered (dotted, hidden by default).
- Community loop with no backend: "Proponer un pin" on the map → prefilled GitHub issue → a bot ingests open issues every 5 h and renders them as gold dotted pins.
- Route presets (vaults + escape, jewelry farm → Yasmani, compounds, low-risk stick-ups), search, visited-progress in localStorage, day/night visual mode, deep links per pin.
- Free, no ads, no login, no tracking. Open source (React + Vite + Leaflet), 31 tests, CI-validated data pipeline.
- Not affiliated with Rockstar. In-game use only.

---

## 0. Reddit — r/GTA6 (1.77 M subs): MODMAIL FIRST, never a cold post

Verified rule (2026-11): *"All off-site links are blocked"* except gtaforums.com, gta.wiki, gtadb.org, gtabase.com and map.stateofleonida.net; *"No self promotion is allowed unless already approved by the moderators."* A cold post with the map link = removal + ban strike. Route:

**Modmail draft (subject: Fan tool approval request — free open-source Leonida heist map):**
> Hi mod team — I built a free, open-source interactive heist map for GTA VI (no ads, no login): vaults, fences, escape routes and prep spots on the Leonida map, with confidence tiers for unverified pins and a propose-a-pin flow that turns GitHub issues into map pins. Map tiles and landmarks credit gtadb.org (CC BY 4.0), which I see is on your approved-links list.
> Links for review: https://dablon.github.io/gta-vi-strategic-map/ and https://github.com/dablon/gta-vi-strategic-map
> If you'd allow it, I'd post it as fan content with whichever flair you prefer, or as a comment wherever the community asks for map recommendations. If not, no hard feelings — I'll keep it off the sub.

Only after written mod approval, use the post copy below. Until then, r/GTA6 engagement = helpful comments **without links** when someone asks "is there a map for X?".

## 1. Reddit — r/GrandTheftAutoVI (first post, no restrictive rules)

Flair: *Fan Content* (or closest available). Check current rules in the sidebar before posting; if self-promo is restricted to a weekly thread, post there instead.

**Title (≤300 chars):**
> I built a free, open-source interactive heist map for GTA VI — 380+ vaults, fences and escape routes on the Leonida map, with a community pin-suggestion loop

**Body:**
> Hey all — after months of collecting payout guides and gtadb landmarks, I turned them into an interactive map and I'm sharing it free: https://dablon.github.io/gta-vi-strategic-map/
>
> What's in it:
> - **380+ pins** across Vice City, Ambrosia, Belville/Warning Sands, Grassrivers, Hamlet, Mount Kalaga and the Keys: bank vaults, stick-up spots, fences, Pay 'n' Spray & marinas for escapes, Ammu-Nation/mod shops for prep, plus stores for quick liquidity.
> - **Route presets**: vaults + escape, jewelry farm → Yasmani, compounds, low-risk stick-ups.
> - **Confidence tiers**: curated pins, gtadb-confirmed pins, and auto-discovered "possible" pins (dotted, hidden by default). I'd rather show you what's verified than pad the count.
> - **You can add pins from the map itself**: hit "Proponer un pin", click the spot, and it opens a prefilled GitHub issue. A bot ingests open issues every 5 hours and draws them as gold dotted pins until a human confirms them. No account, no backend, no database.
> - Day/night visual mode, search, per-pin deep links, and a visited-progress tracker saved locally in your browser.
>
> It's fully open source (React + Leaflet, CI-validated data pipeline): https://github.com/dablon/gta-vi-strategic-map — PRs and issue-reports welcome; the discovery bot that reads gtadb.org is plain Node if anyone wants to poke at it.
>
> Map tiles & landmarks courtesy of gtadb.org (CC BY 4.0). Not affiliated with Rockstar; for in-game planning only.
>
> Happy to add categories, payouts or routes people actually use — tell me what's missing and I'll wire it into the pipeline.

## 2. Reddit — r/GrandTheftAutoVI and r/GTA

Shorter variant (these subs prefer concise posts):

**Title:**
> Free open-source GTA VI heist map: 380+ vaults, fences and escape routes, plus a "propose a pin" flow that turns GitHub issues into map pins

**Body:**
> Live: https://dablon.github.io/gta-vi-strategic-map/ — source: https://github.com/dablon/gta-vi-strategic-map
>
> - 380+ pins with confidence tiers (curated / gtadb-confirmed / auto-discovered, hidden by default).
> - Route presets for vaults+escape, jewelry farm, compounds and low-risk stick-ups.
> - Suggest pins from the map UI; open GitHub issues render as gold dotted pins within 5 h.
> - No ads, no login, no tracking. Map data: gtadb.org (CC BY 4.0). Not Rockstar-affiliated.
>
> Feedback welcome — missing categories get wired into the data pipeline, not into a wishlist.

Cadence: r/GrandTheftAutoVI day 1, r/SideProject day 2 (dev angle below), r/opensource day 4–5, GTAForums day 3. One post per sub, ever, unless mods invite an update post.

## 2b. Reddit — dev angle: r/SideProject + r/opensource (+ r/github megathread comment)

**r/SideProject title:**
> I built a fan map for GTA VI where the community adds pins through GitHub issues — no backend, no database, just a bot that ingests open issues every 5 hours

**r/SideProject body:**
> Context: GTA VI's Leonida map has a community-maintained landmark dataset (gtadb.org, CC BY 4.0). I wanted a heist-planning layer on top of it, so I built https://dablon.github.io/gta-vi-strategic-map/ (source: https://github.com/dablon/gta-vi-strategic-map).
>
> The part I'm proud of is the data pipeline, not the map itself:
> - One zod schema validates every layer: curated seeds, generated landmark pins, the bot's discoveries and community suggestions. CI fails PRs on schema violations.
> - A discovery bot classifies upstream landmarks by confirmed hashtags, name patterns and building type into confidence tiers (high/medium/low). Low-confidence pins render dotted and stay hidden by default — I'd rather ship 273 honest pins than 400 guesses.
> - Community contributions need zero backend: the map's "propose a pin" mode captures a click, opens a prefilled GitHub issue with world coordinates, and a cron turns open issues into gold dotted pins. A human promotes them to curated data via PR.
> - The bot only rewrites its JSON feed when pins actually change, so the 5-hour cron doesn't produce empty commits or empty deploys.
>
> Stack: React 19 + Vite + Leaflet + Tailwind, GitHub Pages, 31 vitest tests. Happy to go deep on any piece — the issue-to-pin parser taught me more about regex escaping than ten years of JS.

**r/opensource:** same body, title: `Open-source GTA VI heist map: zod-validated data pipeline, confidence tiers and a GitHub-issues-as-backend community loop (CC BY 4.0 upstream)`.

**r/github:** do NOT create a post; comment in the pinned "promote your projects" megathread with two lines: what it is + the two links.

## 3. GTAForums — GTA VI section

Thread title: `Leonida Heist Atlas — free interactive heist/fence/escape map (open source)`

> Posting a side project I've been building on top of the community map data: an interactive heist-planning map for GTA VI.
>
> Live (no install, no login): https://dablon.github.io/gta-vi-strategic-map/
> Source: https://github.com/dablon/gta-vi-strategic-map
>
> Features: 380+ pins (vaults, fences, escapes, prep, liquidity), route presets, confidence tiers for unverified spots, day/night view, search and deep links, and a propose-a-pin flow where GitHub issues become map pins automatically.
>
> Tiles and landmarks from gtadb.org (CC BY 4.0) — huge thanks to that community; corrections made upstream flow into this map automatically.
>
> Feedback, missing locations and wrong payouts all welcome; the data pipeline is scriptable so fixes land fast.

## 4b. Facebook — ejecución real (2026-11-19, cuenta Nicolas Alcaraz)

Estado de la campaña (todos los posts revisados y con copy **variado**, nunca el mismo texto calcado):

| Grupo | Miembros | Estado | Ángulo del post |
|---|---|---|---|
| Claude Code en Español | 552 K | **PUBLICADO** | "construido con Claude Code: el pipeline es lo difícil" |
| GTA 6 (Grand Theft Auto VI) LATAM | 104 K | listo para publicar | mapa interactivo de GTA 6,ES, promo + función proponer pin |
| Claude AI - Colombia 🇨🇴 | 8.5 K | listo para publicar | pipeline de datos, zod, CI, tiers de confianza |
| Desarrolladores y Programadores en Colombia | 97 K | listo para publicar | proyecto open source local, invitación a auditar payouts |

Grupos con alcance y baja competencia, para la próxima oleada (unirse con moderación, un post cada 2-3 días): Claude Code | Comunidad Hispana (23 K) · Claude Code México (75 K) · Claude Code EN (230 K) · Inteligencia Artificial - Español (193 K) · Desarrolladores/Programadores en Medellín (11 K) · Grand Theft Auto VI COLOMBIA (7.9 K) · GTA 6 LATINOAMÉRICA (16 K).

**Reglas de ruegla (aprendidas a la brava):**
- Un post por grupo, con contexto real. Facebook penaliza el texto repetido: variants > copy-paste.
- Unirse sí notifica a los admins: 2-3 uniones por semana, no 20 de golpe.
- Nada de "mira mi página" vacío: el cuerpo del post es el pitch.
- El copy va en español para grupos LatAm y en inglés para los EN.

**El asset que falta: una Página de Facebook para el proyecto.** Un post en grupo se muere en 24 h; una página es un canal propio, indexable y permanente ("Leonida Heist Atlas", categoría Software/Videojuegos, con el link del mapa en la sección de contacto). Es la jugada que convierteDiv like en activo.

## 4c. Reddit — lo que ya se verificó (no adivinar)

| Sub | Tamaño | Veredicto |
|---|---|---|
| r/GTA6 | 1.77 M | **Prohibido publicar enlaces externos** salvo whitelist (gtadb, gtaforums, gta.wiki, gtabase, stateofleonida). Solo con modmail aprobado. |
| r/GrandTheftAutoVI | 1.7 K | Sin reglas restrictivas, pero "post request" (pasa por moderación). |
| r/GTA | 3.6 M | Prohibido: "No promoting or advertising" + "NO SPAM!" |
| r/GTAVI | 51 K | Prohibido: "No spam or self-promotion" |
| r/SideProject | 909 K | Sin reglas restrictivas → ideal para el ángulo open source |
| r/opensource | 403 K | Self-promo moderado → segundo post dev |
| r/webdev | 3.3 M | Prohibido: "No self-promotion" |
| r/github | 221 K | Solo comentario en el megathread de proyectos |



Groups to target (search in-app, join, read pinned rules): "GTA 6 / VI Fans", "Grand Theft Auto VI – GTA 6", "GTA VI News, Leaks & Updates", "GTA 6 España / Latinoamérica", "Gamers Colombia / Medellín gamers" (local angle works).

**ES copy:**
> 🗺️ Mapa interactivo GRATIS de golpes para GTA VI (Leonida Heist Atlas): más de 380 pines entre bóvedas, fences, rutas de escape (Pay 'n' Spray, marinas), preparación (Ammu-Nation, mod shops) y liquidez rápida. Presets de rutas, modo día/noche, búsqueda y una función para proponer pines desde el propio mapa.
> Sin publicidad, sin registro, sin tracking. Código abierto: github.com/dablon/gta-vi-strategic-map
> Mapa y landmarks de gtadb.org (CC BY 4.0). No es oficial de Rockstar.
> Enlace: https://dablon.github.io/gta-vi-strategic-map/

**EN copy:** same structure as the r/GTA6 body, shortened to the first two bullets + links.

Attach a screenshot of the map at night mode when the group allows images — visuals outperform walls of text 3:1 on Facebook.

## 5. Extras that cost nothing

- gtadb.org: comment/credit thread linking back (they are the upstream; being a good citizen there is the best referral source).
- Repo: add topics (`gta6`, `gta-vi`, `interactive-map`, `leaflet`, `heist`) + the access link in About so GitHub search does marketing for you.
- Answer every "is X on the map?" comment with a deep link (`#pin-id`) — each answer is a demo.

## Anti-patterns (how accounts get banned)

- Same copy pasted across subs in one hour → spam filters + mod removal.
- Posting without reading each sub's self-promo rule → ban, and mods talk to each other.
- Link-only posts with zero context → removed as spam in most GTA subs.
- Buying upvotes or asking Discord friends to mass-upvote → shadowban territory.
