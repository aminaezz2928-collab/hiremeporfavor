// Shared by tools/build.js and the browser, so build-time and runtime markup stay identical.
const PLACEHOLDER = /\[(?:УТОЧНИТЬ|ЗАПОЛНИТЬ)(?::[^\]]*)?\]/g;

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// Short words (prepositions, conjunctions, particles) stick to the next word, so a line never ends on one.
const SHORT_WORD = /(?<=^|[\s(«„"])([а-яёА-ЯЁ]{1,2}|для|без|под|над|при|про|что|как|или|это|из-за|a|an|the|to|of|in|on|at|by|for|and|or)\s+(?=\S)/giu;

export function keepShortWords(value) {
  return String(value).replace(SHORT_WORD, '$1 ');
}

// Escapes first, then adds the two supported marks: **bold** and [УТОЧНИТЬ/ЗАПОЛНИТЬ] placeholders.
export function renderInline(value) {
  return escapeHtml(keepShortWords(value))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(PLACEHOLDER, '<mark class="placeholder">$&</mark>');
}
