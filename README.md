# Localkit

**Handy tools that never leave your browser.**

Free online tools for developers and everyday work. Open email files, format code and handle daily jobs
without sending anything to a server. No sign-up, no uploads, no limits.

🔒 Every tool runs locally in your browser. Files and text stay on your device.

## Tools

| Tool | Category | Status |
| :-- | :-- | :-- |
| EML Viewer | Email | Live |
| MSG Viewer | Email | Live |
| JSON Formatter, Base64, JWT Decoder, Regex Tester, Diff Checker, Hash Generator, URL Encoder, UUID Generator, CSV ↔ JSON, YAML ↔ JSON, Cron Explainer, Color Converter | Developer | Live |
| Word Counter, Case Converter, Lorem Ipsum Generator, Markdown Preview | Text | Live |
| Image Compressor, Image Converter, QR Code Generator, Merge PDF, Split & Edit PDF, Image to PDF, PDF to Images, SVG Optimizer, EXIF Viewer & Remover | Images & files | Live |
| Password Generator, Timestamp Converter | Everyday | Live |

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

[Astro](https://astro.build) with [Svelte](https://svelte.dev) for interactive tools. Email parsing runs in a Web Worker using
`postal-mime` (EML) and `@kenjiuno/msgreader` (MSG). Rendered email HTML is sanitized with DOMPurify and shown in a sandboxed iframe;
remote images are blocked until you choose to load them.

## Getting started

Requires Node 22+.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in ./dist
npm run preview  # serve the build locally
```

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
│   └── tools.ts         # tool + category registry (drives home, search, footer)
├── styles/
│   ├── tokens.css       # design tokens, light and dark
│   └── global.css       # fonts, primitives (.btn, .chip, .tile, .frame)
├── layouts/
│   ├── Base.astro       # page shell, theme bootstrap
│   └── ToolPage.astro   # template for every tool page
├── components/          # Header, Footer, ToolCard, Faq, MailViewer
├── lib/mail/            # EML/MSG parsing, rendering, worker
└── pages/               # index + one page per tool
```

## Adding a tool

1. Add or update its entry in [`src/data/tools.ts`](src/data/tools.ts) and set `status: 'live'`.
2. Create `src/pages/<slug>.astro` that wraps your component in `ToolPage`.
3. Keep it client-side: no network calls with user data.

The home page, search, category lists, footer and counts update automatically.

## Privacy

There is no backend. Tools process input with browser APIs and, where needed, Web Workers. Nothing is uploaded, logged or tracked.
