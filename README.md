# Localkit

**Handy tools that never leave your browser.**

Free online tools for developers and everyday work: 38 of them, from email viewers and PDF editors to JSON, images and
calculators. No sign-up, no uploads, no limits.

🔒 Every tool runs locally in your browser. Files and text stay on your device.

## Tools

| Category | Tools |
| :-- | :-- |
| **Email** (5) | EML Viewer, MSG Viewer, Email Header Analyzer, EML ↔ MSG Converter, Email Signature Generator |
| **Developer** (12) | JSON Formatter, Base64, JWT Decoder, Regex Tester, Diff Checker, Hash Generator, URL Encoder, UUID Generator, CSV ↔ JSON, YAML ↔ JSON, Cron Explainer, Color Converter |
| **Text** (5) | Word Counter, Case Converter, Lorem Ipsum Generator, Markdown Preview, Text Sorter |
| **Images & files** (9) | Image Compressor, Image Converter, QR Code Generator, Merge PDF, Split & Edit PDF, Image to PDF, PDF to Images, SVG Optimizer, EXIF Viewer & Remover |
| **Everyday** (7) | Password Generator, Timestamp Converter, Unit Converter, Percentage & Tip Calculator, Date & Age Calculator, Time Zone Converter, Random Picker |

The full list lives in [`src/data/tools.ts`](src/data/tools.ts).

## Brand

- **Name:** Localkit
- **Tagline:** Handy tools that never leave your browser.
- **Voice:** short, plain, upbeat. Headlines are brief and end with a period ("Ready to use.", "Coming next.").
- **Look:** electric blue (`#1a1af0`) on white, hairline grid, near-square corners, uppercase mono labels. Dark mode is a soft navy.
- **Fonts:** Space Grotesk (headings), Rubik (body), Space Mono (labels). Self-hosted through `@fontsource`, so the site makes no third-party requests.
- **Themes:** follows the OS by default, with a manual light/dark toggle in the header.

Full details, tokens and components are in [DESIGN.md](DESIGN.md). The site name is a single value in
[`src/data/site.ts`](src/data/site.ts).

## Stack

[Astro](https://astro.build) (static output) with [Svelte 5](https://svelte.dev) for the interactive tools. There is no server, so
every dependency below runs in the browser.

| Area | Libraries |
| :-- | :-- |
| Email | `postal-mime` (EML), `@kenjiuno/msgreader` (MSG), a small OLE writer for `.msg` output. Parsing runs in a Web Worker. Email HTML is sanitized with DOMPurify and shown in a sandboxed iframe, with remote images blocked until you allow them. |
| Images | Canvas for the Browser engine. [jSquash](https://github.com/jamsinclair/jSquash) WASM codecs (MozJPEG, libwebp, OxiPNG, AVIF) in a Web Worker for the Advanced engine, loaded on demand. `exifr` reads metadata. |
| PDF | `pdf-lib` to merge, split, rotate and build PDFs. `pdfjs-dist` to render pages. |
| Other | `svgo` (SVG), `yaml`, `marked` + DOMPurify (Markdown), `qrcode-generator`. Hashes use WebCrypto plus a small MD5. |

The WASM and worker files are bundled into `dist/`, so the deployed site makes no third-party requests.

## Getting started

Requires Node 22+.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in ./dist
npm run preview  # serve the build locally
```

To keep a dev server running in the background, use `astro dev --background` (manage it with `astro dev stop`, `status` and `logs`).

## SEO

The site URL (canonical URLs, `og:url`, social image URLs, the sitemap and the `Sitemap:` line in `robots.txt`) defaults to `https://localkit-3gv.pages.dev`. When a custom domain goes live, set `SITE_URL` in the build settings, or change the default in `astro.config.mjs`.

```bash
SITE_URL=https://your-domain.example npm run build   # override the default
```

Every tool page gets a unique title and description, Open Graph and Twitter tags, and JSON-LD (`WebApplication`, `BreadcrumbList`, `FAQPage`). The default social image is `public/og.png`; regenerate it with `node scripts/og.mjs`.

## Project structure

```text
src/
├── data/
│   ├── site.ts          # name, tagline, description
│   └── tools.ts         # tool + category registry, badges (drives home, search, footer, SEO)
├── styles/
│   ├── tokens.css       # design tokens, light and dark
│   └── global.css       # fonts, primitives (.btn, .chip, .tile) and shared tool controls (.tk)
├── layouts/
│   ├── Base.astro       # page shell, meta tags, theme bootstrap
│   └── ToolPage.astro   # template for every tool page (breadcrumbs, FAQ, JSON-LD)
├── components/
│   ├── tools/           # one Svelte component per tool
│   └── …                # Header, Footer, ToolCard, Badges, Faq, MailViewer
├── lib/
│   ├── mail/            # EML/MSG parsing and building, header analysis, worker
│   ├── image/           # compression engines and encode worker
│   ├── pdf/             # pdf.js helper, page-range parsing
│   └── tools/           # pure logic: csv, cron, color, units, time zones, zip, …
└── pages/               # index, 404, robots.txt, and one page per tool
scripts/og.mjs           # renders public/og.png
```

## Adding a tool

1. Add or update its entry in [`src/data/tools.ts`](src/data/tools.ts) and set `status: 'live'`.
2. Create `src/pages/<slug>.astro` that wraps your component in `ToolPage`.
3. Keep it client-side: no network calls with user data.
4. Optionally add `badges: ['featured' | 'hot' | 'new']` to highlight it. Badges show on cards and the tool page, featured tools get a strip on the home page, and the home page can filter by badge.

The home page, search, category lists, footer and counts update automatically.

## Privacy

There is no backend. Tools process input with browser APIs and, where needed, Web Workers. Nothing is uploaded, logged or tracked.
