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
  { slug: 'json-formatter', name: 'JSON Formatter', category: 'dev', glyph: '{ }', status: 'soon', desc: 'Pretty-print, minify and validate JSON.' },
  { slug: 'base64', name: 'Base64 Encoder', category: 'dev', glyph: '64', status: 'soon', desc: 'Encode and decode Base64 text and files.' },
  { slug: 'jwt-decoder', name: 'JWT Decoder', category: 'dev', glyph: 'JWT', status: 'soon', desc: 'Inspect JSON Web Token headers and claims.' },
  { slug: 'regex-tester', name: 'Regex Tester', category: 'dev', glyph: '.*', status: 'soon', desc: 'Test regular expressions with live matches.' },
  { slug: 'diff-checker', name: 'Diff Checker', category: 'dev', glyph: '±', status: 'soon', desc: 'Compare two texts side by side.' },
  { slug: 'hash-generator', name: 'Hash Generator', category: 'dev', glyph: '#', status: 'soon', desc: 'SHA-1, SHA-256 and more, computed locally.' },
  { slug: 'word-counter', name: 'Word Counter', category: 'text', glyph: 'Aa', status: 'soon', desc: 'Count words, characters and reading time.' },
  { slug: 'case-converter', name: 'Case Converter', category: 'text', glyph: 'aA', status: 'soon', desc: 'camelCase, snake_case, Title Case and more.' },
  { slug: 'image-compressor', name: 'Image Compressor', category: 'media', glyph: 'IMG', status: 'soon', desc: 'Shrink JPG, PNG and WebP without uploading.' },
  { slug: 'qr-generator', name: 'QR Code Generator', category: 'media', glyph: 'QR', status: 'soon', desc: 'Make QR codes for links, Wi-Fi and text.' },
  { slug: 'password-generator', name: 'Password Generator', category: 'everyday', glyph: '***', status: 'soon', desc: 'Strong random passwords, made on your device.' },
  { slug: 'timestamp-converter', name: 'Timestamp Converter', category: 'everyday', glyph: 'T', status: 'soon', desc: 'Unix time to human dates and back.' },
];

export const liveTools = tools.filter((t) => t.status === 'live');
export const getTool = (slug: string) => tools.find((t) => t.slug === slug)!;
export const byCategory = (id: CategoryId) => tools.filter((t) => t.category === id);
export const getCategory = (id: CategoryId) => categories.find((c) => c.id === id)!;
