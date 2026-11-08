export type CategoryId = 'email' | 'dev' | 'text' | 'media' | 'everyday';

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
}

export interface Tool {
  slug: string;
  name: string;
  desc: string;
  category: CategoryId;
  glyph: string; // 1-4 chars shown on the tile
  status: 'live' | 'soon';
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
    slug: 'eml-viewer', name: 'EML Viewer', category: 'email', glyph: '.eml', status: 'live',
    desc: 'Open .eml files: read the message, headers and attachments.',
    keywords: ['email', 'rfc822', 'mime', 'open eml'],
    faq: [
      { q: 'Is my email uploaded anywhere?', a: 'No. The file is parsed in your browser by a local script. It never leaves your device.' },
      { q: 'Are remote images loaded?', a: 'Not by default. Remote images are blocked because they can track you; you can load them with one click.' },
      { q: 'Can I download attachments?', a: 'Yes. Attachments are listed on their own tab and can be saved individually.' },
    ],
  },
  {
    slug: 'msg-viewer', name: 'MSG Viewer', category: 'email', glyph: '.msg', status: 'live',
    desc: 'Open Outlook .msg files: read the message, headers and attachments.',
    keywords: ['outlook', 'email', 'open msg'],
    faq: [
      { q: 'Do I need Outlook installed?', a: 'No. The .msg format is read directly in your browser.' },
      { q: 'Is my email uploaded anywhere?', a: 'No. Everything is processed locally and nothing is sent to a server.' },
    ],
  },
  {
    slug: 'json-formatter', name: 'JSON Formatter', category: 'dev', glyph: '{ }', status: 'live', desc: 'Pretty-print, minify and validate JSON.',
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
    slug: 'image-compressor', name: 'Image Compressor', category: 'media', glyph: 'IMG', status: 'live', desc: 'Shrink JPG, PNG and WebP without uploading.',
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
];

export const liveTools = tools.filter((t) => t.status === 'live');
export const getTool = (slug: string) => tools.find((t) => t.slug === slug)!;
export const byCategory = (id: CategoryId) => tools.filter((t) => t.category === id);
export const getCategory = (id: CategoryId) => categories.find((c) => c.id === id)!;
