# Anser Script Viewer

Parses a phone-script XML export into JSON and renders it as a readable, navigable web page — without ever hard-coding or reformatting the source data.

## Quick start

```bash
npm install
npm run dev        
```

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app (parses the fixture live, in the browser) |
| `npm test` | Runs the full test suite (21 tests) |
| `npm run build` | Type-checks and produces a production build |
| `npm run generate:json` | Regenerates `data/script.json` from the fixture |

## What this does

The project is given one input, `fixtures/script.xml` — an XML export of a phone script (client info, script/version metadata, and a series of pages with their own elements, prompts, and logic). The pipeline:

1. **Parse** — `src/lib/xmlParser.ts` reads the XML with a real DOM parser and walks it generically, converting every element, attribute, text node, comment, and CDATA section into a plain JSON tree (`XmlNode`), preserving namespaces, parent-child relationships, and sibling order exactly.
2. **Produce reviewable JSON** — `scripts/generate-json.ts` runs that same parser and writes the committed, diffable `data/script.json`, kept honest by a test that re-parses the fixture fresh and compares.
3. **Render** — the frontend fetches the raw XML fixture and parses it *live, in the browser*, using the exact same parser module — not a copy, and not the committed JSON file. The UI is provably driven by parsing, not by duplicated data.

## How it's built

### The `XmlNode` schema

```ts
type XmlNode =
  | { kind: "element"; name; namespacePrefix?; namespaceURI?; attributes: XmlAttribute[]; children: XmlNode[] }
  | { kind: "text"; value }
  | { kind: "comment"; value }
  | { kind: "cdata"; value };
```

Nodes are classified by their DOM **node type** (element/text/comment/CDATA — a small, fixed set defined by the XML spec itself), never by tag or attribute *name*. That's what makes the parser genuinely generic: an element or attribute the parser has never seen before is retained automatically, with no code change, because nothing in the parser branches on names.

There's no `document`/declaration wrapper — `parseXmlString()` returns the root element directly. The XML declaration (`version`/`encoding`) is intentionally not captured; see **Known limitations**.

### One parser, three consumers

`src/lib/xmlParser.ts` is used, unmodified, in three places:
- The test suite (`src/lib/*.test.ts`, `scripts/generate-json.test.ts`)
- `scripts/generate-json.ts` (produces the committed JSON)
- The browser, live, via `src/hooks/useParsedScript.ts`

Using one implementation everywhere means the tests exercise the exact code path that renders the UI, not a similar-but-different parser.

### Layout can know names; field rendering can't

This is the key design decision behind the frontend. The "no allowlist" rule applies to the *parser* (a new element or attribute must be retained without changing it) — it isn't a ban on ever referencing a known name anywhere in the codebase. So the UI splits cleanly in two:

- **Layout** (`ScriptViewer.tsx`, `Header.tsx`, `PageContent.tsx`) is allowed to look for well-known top-level names (`Client`, `Script`, `Pages`...) to decide *where* things go on the page — that's what organizing the page around the client, script, version, and pages actually requires.
- **Field-level rendering**, inside every section, is fully generic (`FieldGroup.tsx`) — driven only by node *shape* (does it have child elements, or just text?), never by name. A field nobody anticipated renders automatically, with no component changes — the same way `FutureVendorSetting` (a real, pre-existing "unknown vendor field" already present in the fixture) renders correctly today.
- Anything that doesn't match a known layout slot still renders, in an explicit fallback section — nothing is silently dropped.

### Folder structure

```
fixtures/script.xml           # supplied fixture - read-only, never modified
data/script.json              # committed, reviewer-inspectable parse output
scripts/
  generate-json.ts            # regenerates data/script.json
src/
  lib/
    xmlParser.ts               # the generic parser
    xmlParser.types.ts          # XmlNode / XmlAttribute / XmlParseError
    xmlNodeHelpers.ts           # name-based lookups - UI layout only, not the parser
    *.test.ts                   # parser test suite
  hooks/
    useParsedScript.ts          # fetches + parses the fixture live, in the browser
  components/                   # ScriptViewer, Header, PageNav, PageContent,
                                 # ElementCard, FieldGroup, AttributeBadges,
                                 # RawJsonToggle, ErrorState
.github/workflows/ci.yml        # checkout -> install -> test -> build
```

## Proving nothing is lost

`src/lib/xmlParser.newElementSurvival.test.ts` splices a brand-new element and attribute — never present in the original fixture — into an in-memory copy, then proves the new element's name, its attribute's name and value, its own parent-child relationship, and its position among real siblings all survive conversion, with no parser change.

The wider suite (21 tests, `npm test`) backs this up further:
- A full parse → serialize → re-parse round trip against the **entire real fixture** — if anything were silently lost, the two parses would diverge.
- Explicit checks for attribute order, sibling order (including repeated tag names), namespaced elements/attributes, comments, and CDATA.

## Fixture protection

`fixtures/script.xml` is supplied, read-only data and is never modified, reformatted, or rewritten by any part of this project:
- Nothing in the codebase ever opens it for writing — only `readFileSync`/`fetch`.
- `src/lib/fixtureIntegrity.test.ts` hashes its raw bytes (SHA-256) and compares against a value hardcoded in the test itself. Any change to the file — even whitespace — fails this test immediately.

Any test that needs a "modified" or "new" version of the XML (like the survival test above) does so on a string held only in memory; the file on disk is never touched.

## CI

`.github/workflows/ci.yml` runs on every push: checkout → install (`npm ci`) → test (`npm test`) → build (`npm run build`), on a clean machine. Check the **Actions** tab on the repository for status.

## Requirements coverage

| Requirement | Where it's satisfied |
|---|---|
| Fixture kept unchanged | Fixture protection, above; `fixtureIntegrity.test.ts` |
| Parsed programmatically, not hand-rewritten | `xmlParser.ts` — generic DOM walk |
| Valid, inspectable JSON produced | `data/script.json`, freshness-tested |
| Every element/attribute/text/namespace/relationship/order preserved | Parser test suite, especially the full-fixture round-trip test |
| No allowlist — new names survive without parser changes | Node-type-based dispatch; `xmlParser.newElementSurvival.test.ts` |
| UI renders from parsed data, not duplicated hardcoded content | `useParsedScript.ts` — live in-browser parsing |
| All supplied info presented and organized | `ScriptViewer`/`Header`/`PageContent`/`ElementCard` |
| Readable, intentional interface (not just a JSON dump) | Component design above; raw JSON is an opt-in supplement, not the default view |
| Invalid XML / parsing failures handled clearly | `ErrorState.tsx`; 5 dedicated invalid-XML tests |
| Automated parser tests | 21 tests, `npm test` |
| GitHub Actions CI, clean checkout | `.github/workflows/ci.yml` |
| Easy for another developer/AI tool to understand, run, test, extend | This README + folder structure |

## Known limitations

- The real fixture contains no XML comments or CDATA sections, so those parser code paths are covered by unit tests on small hand-written snippets, not by the real fixture itself.
- The XML declaration (`<?xml version="1.0" encoding="utf-8"?>`) isn't captured in the parsed output — it's parser/encoding metadata, not script content.
- There's no "paste/upload your own XML" feature in the UI. It would be a natural way to demo the parser's genericity or the error states live, but it's real feature scope beyond what's asked, so it's left out deliberately.
- Cross-references within the data — `FieldRef`'s `elementId`, an element's `NavScreen` pointing at another page's `pageId`, a style referenced by name rather than ID — are fully present and viewable (including via the raw JSON toggle), but not automatically resolved into clickable links.

## What's next

- Resolve `FieldRef` / `NavScreen` / style-name references into clickable in-app links.
- A "paste XML to test" mode, if live-demoing the generic parser or error states becomes a real need.
