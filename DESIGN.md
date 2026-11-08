# Design system

Structure follows directory-style sites such as siteefy.com: search-led hero, category directory, short punchy copy, FAQ, rich footer.
Visual language: electric blue on white, hairline grid frame, near-square corners, mono uppercase labels.
Fonts follow functionize.com: **Space Grotesk** (display) + **Rubik** (body), with **Space Mono** for labels. All self-hosted via `@fontsource`, so no third-party requests.

## Principles
1. **Private by default.** Every page repeats the promise: files stay in the browser.
2. **Find fast.** Search first, categories second. Any tool is at most two clicks away.
3. **Quiet UI.** White, one blue, hairlines instead of shadows, no decoration that does not carry meaning.
4. **Short copy.** Headlines are brief and end with a period. Describe what the tool does in one sentence.

## Tokens (`src/styles/tokens.css`)
| Group | Tokens |
|---|---|
| Surface | `--bg` `--surface` `--surface-2` |
| Text | `--heading` (brand blue) `--text` (deep indigo) `--muted` |
| Lines | `--border` `--border-strong` |
| Brand | `--accent` `--accent-hover` `--accent-soft` `--on-accent` |
| Status | `--warn-bg` `--warn-text` `--danger` |
| Category hues | `--cat-{email,dev,text,media,everyday}-{bg,fg}` |
| Type | `--font-display` Space Grotesk, `--font-sans` Rubik, `--font-mono` Space Mono; `--text-xs … --text-hero` |
| Space | 4px base, `--s-1 … --s-9` |
| Shape | near-square: `--r-sm 2` `--r-md 3` `--r-lg 4` |
| Layout | `--container 1120px`, `--container-narrow 820px`, `--gutter` |

Dark mode follows `prefers-color-scheme`; all tokens are redefined, so components never hard-code colors.

## Primitives (`src/styles/global.css`)
`.container` `.section` `.frame` (hairline guides) `.mono` `.eyebrow` `.btn` / `.btn.primary` (mono caps, optional `↵` key box) `.chip` `.tile` + `.cat-*`.

## Components (`src/components`)
- `Header` sticky nav: brand, Tools, Categories, search shortcut.
- `Footer` brand blurb + link columns + privacy line.
- `ToolCard` tile glyph, name, one-line description. `soon` tools render muted, unlinked, with a badge.
- `Faq` native `<details>` list.

## Content model (`src/data/tools.ts`)
Add a tool = add one object (`status: 'soon'` until its page exists). The home page, footer, counts, search,
category sections and sitemap-style lists all derive from it. Rename the site in `src/data/site.ts`.

## Page templates
- **Home**: hero + search, stats band, popular tools, categories directory, how it works, FAQ.
- **Tool page** (`layouts/ToolPage.astro`): breadcrumb, H1 + one-liner, the tool, privacy note, FAQ, related tools.

## Adding a tool
1. Set the tool's `status: 'live'` in `tools.ts`.
2. Create `src/pages/<slug>.astro` using `ToolPage`.
