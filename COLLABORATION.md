# Collaboration & context management guide

For developers and AI agents working on this repo together. [AGENTS.md](AGENTS.md) lists the hard rules; this doc is about *how* to work — scoping context, and which tool/skill fits which task.

## Ground rule: read before you load

This is a small repo, but don't dump the whole tree into context out of habit:

- Know a symbol or file? Grep for it directly instead of reading unrelated files "just in case."
- Doing an open-ended search ("where does X happen", "what touches Y")? Use a search/explore agent rather than manually opening files one by one — it keeps the exploration out of the main context window and returns just the answer.
- Before changing `src/lib/xmlParser.ts` or `xmlNodeHelpers.ts`, actually read [AGENTS.md](AGENTS.md)'s invariants section — most bugs introduced here are invariant violations (accidentally naming a tag in the parser, letting field rendering depend on a name), not logic errors.
- New to this repo? Read [README.md](README.md) once, top to bottom, before your first change. It documents the design decisions (why the parser has no allowlist, why layout/field-rendering are split) — context you can't get from reading individual files.

## Task → skill/agent map

| Task in this repo | Use |
|---|---|
| Find where a component, type, or helper is defined/used, across the tree | `Explore` agent |
| Add or change a chart/graph/visualization | `dataviz` skill — read it before writing any chart code, even a small one |
| Reviewing your own diff before opening a PR | `/code-review` (or `/code-review ultra` for a multi-agent pass on a bigger change) |
| Reviewing someone else's PR | `/review` |
| Security-sensitive change (parsing untrusted XML, fetch handling, error states) | `/security-review` before merging |
| Verifying a UI change actually works, not just that tests pass | `/run` — launch the dev server and click through it; don't claim a UI fix works from a green test suite alone |
| Recurring/background task (e.g. watching a long CI run) | `/loop` or `Monitor`, not manual polling |
| Bootstrapping a new `AGENTS.md`/`CLAUDE.md` from scratch | `/init` |

If none of these match, that's fine — most changes here (parser tweaks, component edits) are direct edits, not skill-shaped.

## Working set per change type

Keep the following as your default "working set" — the files worth having open — for each kind of change, instead of re-scanning the repo each time:

- **Parser change** (`xmlParser.ts`): `xmlParser.types.ts`, the relevant `xmlParser.*.test.ts` file, and `fixtureIntegrity.test.ts` (to remember the fixture is untouchable).
- **New/changed field rendering** (`FieldGroup.tsx`, `xmlNodeToCleanJson.ts`, `ElementCard.tsx`): `xmlParser.types.ts` for the `XmlNode` shape, and `xmlNodeHelpers.ts` to check whether a name-based helper already does what you need before writing a new one.
- **Page/layout change** (`PageContent.tsx`, `Header.tsx`, `ScriptViewer.tsx`): the fixture excerpt for the section you're changing (not the whole `fixtures/script.xml`), plus the "Layout can know names" section of [AGENTS.md](AGENTS.md).
- **CI/workflow change** (`.github/workflows/ci.yml`): check current branch protection / required-status-check settings before renaming a job — a rename silently breaks any required check pointing at the old name.

## PR expectations

- CI (test + build) must pass — see `.github/workflows/ci.yml`.
- Don't hand-edit `data/script.json`; regenerate it with `npm run generate:json` if it needs to change, and let the freshness test catch drift.
- Keep PRs scoped to one change type from the table above where possible — it keeps review (human or `/review`) fast and makes it obvious which invariant to double-check.
