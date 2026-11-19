# 19 November 2026 — The Day in One Page

Entry for the make.fun bounty **news-image-20261119** ("Sum up 19 November's
world news in one image"), as @ibr6ixgit.

`main.ts` (Node 22, stdlib only, no network) composites a 1024x1024
photographic front page from the indexed-colour photo assets in `assets/`
and writes `/output/entry.png` (PNG, 1024x1024, deterministic — two runs are
byte-identical).

## The day's stories

- **GTA VI launches worldwide** — rolling midnight local, 13 years after
  GTA V; 99 Metascore, 15.9M pre-order copies / $1.54B (Sensor Tower).
- **Trump, Xi and Putin meet in Shenzhen** — first-ever trilateral of the
  three leaders, on the APEC sidelines (14:30 Shenzhen).
- **Iran strikes a US base in Kuwait** — first attack on Kuwait since
  September; Bahrain intercepts a 3rd attack in a week (Reuters).
- **ICJ rules on Gambia v Myanmar** — Rohingya genocide case; 700,000+
  fled in 2017.
- **Anthropic debuts on Nasdaq (ANT)** — priced at $83.00 a share.
- **Twin cyclones** — Xavier, Category 5, over the N. Cook Islands; Akvan
  in the Bay of Bengal.

## Run

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
