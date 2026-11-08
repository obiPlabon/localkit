export type CategoryId = 'email' | 'dev' | 'text' | 'media' | 'everyday';

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
}

/** Highlights shown as small badges on cards and tool pages. Order here is display order. */
export type Badge = 'featured' | 'hot' | 'new';
export const badgeInfo: Record<Badge, { label: string; title: string }> = {
  featured: { label: 'Featured', title: 'Hand-picked' },
  hot: { label: 'Hot', title: 'Popular right now' },
  new: { label: 'New', title: 'Recently added' },
};
export const badgeOrder: Badge[] = ['featured', 'hot', 'new'];

export interface Tool {
  slug: string;
  name: string;
  desc: string;
  category: CategoryId;
  glyph: string; // 1-4 chars shown on the tile
  status: 'live' | 'soon';
  badges?: Badge[];
  keywords?: string[];
  faq?: { q: string; a: string }[];
}

export const categories: Category[] = [
  { id: 'email', name: 'Email', blurb: 'Open and inspect email files.' },
  { id: 'dev', name: 'Developer', blurb: 'Format, decode, encode, compare.' },
  { id: 'text', name: 'Text', blurb: 'Count, convert and clean up text.' },
  { id: 'media', name: 'Images & files', blurb: 'Resize, compress and convert.' },
  { id: 'everyday', name: 'Everyday', blurb: 'Small helpers for daily tasks.' },
];

export const tools: Tool[] = [
  {
    slug: 'eml-viewer', name: 'EML Viewer', category: 'email', glyph: '.eml', status: 'live', badges: ['featured'],
    desc: 'Open .eml files: read the message, headers and attachments.',
    keywords: ['email', 'rfc822', 'mime', 'open eml'],
    faq: [
      { q: 'Is my email uploaded anywhere?', a: 'No. The file is parsed in your browser by a local script. It never leaves your device.' },
      { q: 'Are remote images loaded?', a: 'Not by default. Remote images are blocked because they can track you; you can load them with one click.' },
      { q: 'Can I download attachments?', a: 'Yes. Attachments are listed on their own tab and can be saved individually.' },
    ],
  },
  {
    slug: 'msg-viewer', name: 'MSG Viewer', category: 'email', glyph: '.msg', status: 'live', badges: ['featured'],
    desc: 'Open Outlook .msg files: read the message, headers and attachments.',
    keywords: ['outlook', 'email', 'open msg'],
    faq: [
      { q: 'Do I need Outlook installed?', a: 'No. The .msg format is read directly in your browser.' },
      { q: 'Is my email uploaded anywhere?', a: 'No. Everything is processed locally and nothing is sent to a server.' },
    ],
  },
  {
    slug: 'json-formatter', name: 'JSON Formatter', category: 'dev', glyph: '{ }', status: 'live', badges: ['hot'], desc: 'Pretty-print, minify and validate JSON.',
    keywords: ['json beautifier', 'json validator', 'minify json'],
    faq: [
      { q: "Is my JSON uploaded?", a: "No. It is parsed and formatted in your browser." },
      { q: "Does it accept comments or trailing commas?", a: "No. It validates strict JSON, and shows the line and column of the first error." },
    ],
  },
  {
    slug: 'base64', name: 'Base64 Encoder', category: 'dev', glyph: '64', status: 'live', desc: 'Encode and decode Base64 text and files.',
    keywords: ['base64 decode', 'data uri', 'btoa'],
    faq: [
      { q: "Does it handle Unicode?", a: "Yes. Text is encoded as UTF-8, so emoji and non-Latin scripts round-trip correctly." },
      { q: "What is URL-safe Base64?", a: "It swaps + and / for - and _ and drops padding, so the result is safe in URLs and JWTs." },
    ],
  },
  {
    slug: 'jwt-decoder', name: 'JWT Decoder', category: 'dev', glyph: 'JWT', status: 'live', desc: 'Inspect JSON Web Token headers and claims.',
    keywords: ['jwt', 'token', 'claims'],
    faq: [
      { q: "Is my token sent anywhere?", a: "No. It is decoded locally and never leaves your browser." },
      { q: "Does it verify the signature?", a: "No. It only decodes the header and payload. Verification needs the secret or public key." },
    ],
  },
  {
    slug: 'regex-tester', name: 'Regex Tester', category: 'dev', glyph: '.*', status: 'live', desc: 'Test regular expressions with live matches.',
    keywords: ['regexp', 'regular expression'],
    faq: [
      { q: "Which regex flavor is used?", a: "JavaScript (ECMAScript), the same engine your browser runs." },
      { q: "Why do I always see the g flag?", a: "Matches are listed with global matching on, so every hit is shown." },
    ],
  },
  {
    slug: 'diff-checker', name: 'Diff Checker', category: 'dev', glyph: '±', status: 'live', desc: 'Compare two texts side by side.',
    keywords: ['compare text', 'text diff'],
    faq: [
      { q: "Is my text uploaded?", a: "No. The comparison runs in your browser." },
      { q: "How are changes found?", a: "Line by line, using a longest-common-subsequence diff." },
    ],
  },
  {
    slug: 'hash-generator', name: 'Hash Generator', category: 'dev', glyph: '#', status: 'live', desc: 'SHA-1, SHA-256 and more, computed locally.',
    keywords: ['md5', 'sha256', 'checksum'],
    faq: [
      { q: "Is MD5 or SHA-1 safe?", a: "Not for security. Use them only for checksums. Prefer SHA-256 or stronger." },
      { q: "Can I hash large files?", a: "Yes, within your browser's memory. Files are read locally, never uploaded." },
    ],
  },
  {
    slug: 'word-counter', name: 'Word Counter', category: 'text', glyph: 'Aa', status: 'live', desc: 'Count words, characters and reading time.',
    keywords: ['character count', 'reading time'],
    faq: [
      { q: "How is reading time worked out?", a: "About 238 words per minute for reading and 140 for speaking." },
      { q: "Is my text stored?", a: "No. Nothing is saved or sent anywhere." },
    ],
  },
  {
    slug: 'case-converter', name: 'Case Converter', category: 'text', glyph: 'aA', status: 'live', desc: 'camelCase, snake_case, Title Case and more.',
    keywords: ['camelcase', 'snake case', 'title case'],
    faq: [
      { q: "Which cases are supported?", a: "Upper, lower, title, sentence, camel, Pascal, snake, CONSTANT, kebab, dot, alternating and inverted." },
    ],
  },
  {
    slug: 'image-compressor', name: 'Image Compressor', category: 'media', glyph: 'IMG', status: 'live', badges: ['hot'], desc: 'Shrink JPG, PNG and WebP without uploading.',
    keywords: ['compress jpg', 'webp', 'resize image'],
    faq: [
      { q: "Are my images uploaded?", a: "No. They are compressed with your browser's canvas, on your device." },
      { q: "Which engine should I use?", a: "Browser is instant and fine for everyday use. Advanced is slower but makes smaller files, and adds PNG and AVIF. Its encoders download once, then run on your device." },
      { q: "Is metadata kept?", a: "No. Re-encoding drops EXIF data such as location." },
    ],
  },
  {
    slug: 'qr-generator', name: 'QR Code Generator', category: 'media', glyph: 'QR', status: 'live', desc: 'Make QR codes for links, Wi-Fi and text.',
    keywords: ['qr code', 'wifi qr'],
    faq: [
      { q: "Do the codes expire?", a: "No. A QR code is just encoded text, so it works forever and never depends on a server." },
      { q: "Which error correction should I use?", a: "Medium is fine for most uses. Pick High if you will print it small or add a logo." },
    ],
  },
  {
    slug: 'password-generator', name: 'Password Generator', category: 'everyday', glyph: '***', status: 'live', desc: 'Strong random passwords, made on your device.',
    keywords: ['random password'],
    faq: [
      { q: "Are passwords stored or sent?", a: "No. They are made with your browser's secure random generator and never leave the page." },
    ],
  },
  {
    slug: 'timestamp-converter', name: 'Timestamp Converter', category: 'everyday', glyph: 'T', status: 'live', desc: 'Unix time to human dates and back.',
    keywords: ['unix time', 'epoch'],
    faq: [
      { q: "Seconds or milliseconds?", a: "Both are detected automatically from the size of the number." },
      { q: "Which timezone is used?", a: "Your local zone, with UTC shown alongside." },
    ],
  },
  {
    slug: 'url-encoder', name: 'URL Encoder', category: 'dev', glyph: '%20', status: 'live', desc: 'Encode, decode and break down URLs.',
    keywords: ['urlencode', 'percent encoding', 'query string'],
    faq: [
      { q: "Component or full URL?", a: "Use Component for a single value such as a query parameter. Use Full URL to keep characters like : / ? & intact." },
      { q: "What happens to a plus sign?", a: "When decoding, + is treated as a space, as in form-encoded query strings." },
    ],
  },
  {
    slug: 'uuid-generator', name: 'UUID Generator', category: 'dev', glyph: 'ID', status: 'live', desc: 'UUID v4, v7 and ULID, in bulk.',
    keywords: ['guid', 'ulid', 'uuid v7'],
    faq: [
      { q: "Are the IDs truly random?", a: "They use your browser's cryptographically secure random generator." },
      { q: "v4 or v7?", a: "v4 is fully random. v7 starts with a timestamp, so IDs sort by creation time, which is friendlier to database indexes." },
    ],
  },
  {
    slug: 'csv-json', name: 'CSV ↔ JSON', category: 'dev', glyph: 'CSV', status: 'live', desc: 'Convert CSV to JSON and back.',
    keywords: ['csv to json', 'json to csv', 'tsv'],
    faq: [
      { q: "Is my data uploaded?", a: "No. Files are read and converted in your browser." },
      { q: "Are quoted fields supported?", a: "Yes. Quotes, escaped quotes and line breaks inside fields follow RFC 4180." },
      { q: "What about nested JSON?", a: "Nested objects and arrays are written into the cell as JSON text." },
    ],
  },
  {
    slug: 'yaml-json', name: 'YAML ↔ JSON', category: 'dev', glyph: 'YML', status: 'live', desc: 'Convert YAML to JSON and back.',
    keywords: ['yaml to json', 'json to yaml', 'yaml validator'],
    faq: [
      { q: "Does it support multiple documents?", a: "Yes. A file with several --- documents is returned as a JSON array." },
      { q: "Are comments kept?", a: "No. JSON has no comments, so they are dropped when converting." },
    ],
  },
  {
    slug: 'cron-explainer', name: 'Cron Explainer', category: 'dev', glyph: '* * *', status: 'live', desc: 'Cron expressions in plain English, with next runs.',
    keywords: ['crontab', 'cron expression', 'cron schedule'],
    faq: [
      { q: "Which format is supported?", a: "Standard 5-field cron (minute hour day-of-month month day-of-week), month and day names, and shortcuts like @daily." },
      { q: "When both day fields are set?", a: "As in classic cron, the job runs when either the day of month or the day of week matches." },
    ],
  },
  {
    slug: 'color-converter', name: 'Color Converter', category: 'dev', glyph: '#fff', status: 'live', desc: 'HEX, RGB, HSL, OKLCH and contrast checks.',
    keywords: ['hex to rgb', 'oklch', 'wcag contrast'],
    faq: [
      { q: "What contrast ratio do I need?", a: "WCAG AA asks for 4.5:1 for normal text and 3:1 for large text. AAA asks for 7:1 and 4.5:1." },
      { q: "Is alpha supported?", a: "Yes. 8-digit HEX and rgb()/hsl() with an alpha value are parsed and shown." },
    ],
  },
  {
    slug: 'lorem-ipsum', name: 'Lorem Ipsum Generator', category: 'text', glyph: 'Lo', status: 'live', desc: 'Placeholder text by paragraph, sentence or word.',
    keywords: ['dummy text', 'placeholder text'],
    faq: [
      { q: "Can I keep the classic opening line?", a: "Yes. Leave 'Start with Lorem ipsum' ticked, or untick it for fully random text." },
    ],
  },
  {
    slug: 'markdown-preview', name: 'Markdown Preview', category: 'text', glyph: 'MD', status: 'live', desc: 'Live Markdown preview with HTML export.',
    keywords: ['markdown editor', 'markdown to html'],
    faq: [
      { q: "Is the HTML safe?", a: "Output is sanitized, so scripts and unsafe attributes are stripped from the preview and the exported HTML." },
      { q: "Which flavor is supported?", a: "GitHub-flavored Markdown: tables, task lists, strikethrough and fenced code." },
    ],
  },
  {
    slug: 'image-converter', name: 'Image Converter', category: 'media', glyph: 'PNG', status: 'live', badges: ['new'], desc: 'Convert and resize JPG, PNG, WebP and AVIF.',
    keywords: ['convert image', 'resize image', 'png to jpg', 'webp to png', 'avif'],
    faq: [
      { q: "Are my images uploaded?", a: "No. Conversion and resizing happen on your device." },
      { q: "Which formats can I convert to?", a: "JPEG, WebP, PNG and AVIF. The Browser engine offers JPEG and WebP, and the Advanced engine adds PNG and AVIF." },
      { q: "What happens to transparency?", a: "PNG, WebP and AVIF keep it. JPEG has no transparency, so it is flattened onto white." },
    ],
  },
  {
    slug: 'pdf-merge', name: 'Merge PDF', category: 'media', glyph: 'PDF+', status: 'live', badges: ['hot', 'new'], desc: 'Combine several PDFs into one.',
    keywords: ['combine pdf', 'join pdf', 'merge pdf files'],
    faq: [
      { q: "Are my PDFs uploaded?", a: "No. Files are merged in your browser and never leave your device." },
      { q: "Can I change the order?", a: "Yes. Use the arrows to move files up or down before merging." },
      { q: "Why can't it open my PDF?", a: "Password-protected and damaged files cannot be read. Remove the password first." },
    ],
  },
  {
    slug: 'pdf-split', name: 'Split & Edit PDF', category: 'media', glyph: 'PDF', status: 'live', badges: ['new'], desc: 'Split, extract, delete, reorder and rotate pages.',
    keywords: ['split pdf', 'extract pdf pages', 'rotate pdf', 'delete pdf pages', 'reorder pdf'],
    faq: [
      { q: "How do I reorder pages?", a: "Choose Extract / reorder and type the pages in the order you want, for example 3, 1, 2." },
      { q: "Is my PDF uploaded?", a: "No. Everything runs in your browser." },
      { q: "What do I get when I split?", a: "A ZIP with one PDF per page, or per group of pages if you split every N." },
    ],
  },
  {
    slug: 'image-to-pdf', name: 'Image to PDF', category: 'media', glyph: 'IMG→', status: 'live', badges: ['new'], desc: 'Turn images into a PDF.',
    keywords: ['jpg to pdf', 'png to pdf', 'photos to pdf'],
    faq: [
      { q: "Are my images uploaded?", a: "No. The PDF is built on your device." },
      { q: "Do phone photos come out upright?", a: "Yes. Photos are decoded first, so their rotation is applied correctly." },
      { q: "Can I put several images in one PDF?", a: "Yes. Each image gets its own page, in the order shown. Use the arrows to reorder." },
    ],
  },
  {
    slug: 'pdf-to-images', name: 'PDF to Images', category: 'media', glyph: '→IMG', status: 'live', badges: ['new'], desc: 'Turn PDF pages into PNG, JPG or WebP.',
    keywords: ['pdf to jpg', 'pdf to png', 'convert pdf'],
    faq: [
      { q: "Is my PDF uploaded?", a: "No. Pages are drawn in your browser." },
      { q: "Which resolution should I pick?", a: "72 dpi suits screens, 150 dpi is a good default, and 300 dpi is for printing. Higher values make larger files." },
    ],
  },
  {
    slug: 'svg-optimizer', name: 'SVG Optimizer', category: 'media', glyph: 'SVG', status: 'live', badges: ['new'], desc: 'Shrink SVG files with SVGO.',
    keywords: ['svgo', 'minify svg', 'compress svg'],
    faq: [
      { q: "Will my SVG look different?", a: "Normally not. The preview shows before and after so you can check. Lower the precision only if the result looks off." },
      { q: "Why keep the viewBox?", a: "The viewBox lets the image scale. It is kept by default, because removing it stops scaling working." },
    ],
  },
  {
    slug: 'exif-tool', name: 'EXIF Viewer & Remover', category: 'media', glyph: 'EXIF', status: 'live', badges: ['new'], desc: 'See and strip hidden photo metadata.',
    keywords: ['exif', 'photo metadata', 'remove gps', 'strip metadata'],
    faq: [
      { q: "What is hidden in a photo?", a: "Often the camera model, the time it was taken, and the GPS location. Sharing the original file shares all of it." },
      { q: "Does removing metadata reduce quality?", a: "Not for JPEG and PNG. Those are cleaned without re-encoding, so the pixels stay identical." },
      { q: "Is my photo uploaded?", a: "No. It is read and cleaned on your device." },
    ],
  },
];

export const liveTools = tools.filter((t) => t.status === 'live');
export const withBadge = (b: Badge) => liveTools.filter((t) => t.badges?.includes(b));
export const getTool = (slug: string) => tools.find((t) => t.slug === slug)!;
export const byCategory = (id: CategoryId) => tools.filter((t) => t.category === id);
export const getCategory = (id: CategoryId) => categories.find((c) => c.id === id)!;
