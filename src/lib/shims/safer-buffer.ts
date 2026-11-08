// iconv-lite (a dependency of @kenjiuno/msgreader) expects Node's Buffer via safer-buffer.
// Browsers have no Buffer, so we back it with the `buffer` polyfill instead.
import { Buffer } from 'buffer';

(globalThis as { Buffer?: typeof Buffer }).Buffer ??= Buffer;

export { Buffer };
export default { Buffer };
