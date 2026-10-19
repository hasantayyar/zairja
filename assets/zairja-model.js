/* Historical Zairja variants. The Lane table is a complete method;
 * the medieval arithmetic deliberately stops before undocumented lookups. */
(function (root) {
    'use strict';
    const ROWS = ['dwwawohabh', 'ioisotdttw', 'woaaaienii', 'tsdnthiaae', 'ottntuwtdh', 'tiaesflinu', 'elnjcadtoc', 'rohyeowype', 'frwedioiae', 'lnsctlgheh'];
    const TABLE = ROWS.join('');
    const ANSWERS = ['Do it without fear of ill.', 'Who does it will do wrong.', 'Wait and attain thy wish.', 'Abstain, and enjoy peace.', 'Who waiteth succeedeth.'];
    const SOURCE_LANE = 'https://www.gutenberg.org/cache/epub/70796/pg70796-images.html#Page_239';
    const SOURCE_LINK = 'https://d13.documenta.de/research/assets/Uploads/DavidLinkScramblingTruth2010100dpi.pdf';
    const WESTERN = 'ابجدهوزحطيكلمنصعفضقرستثخذظغش';
    const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const mod = (n, m) => ((n % m) + m) % m;
    const mod12 = n => mod(n - 1, 12) + 1;
    function lane(start) {
        if (!Number.isInteger(start) || start < 0 || start >= 100) throw Error('Choose a cell from 1 to 100.');
        const path = [], visited = new Set(); let at = start;
        while (!visited.has(at)) { visited.add(at); path.push(at); at = (at + 5) % 100; }
        const canonicalStart = Math.min(...path), canonical = Array.from({ length: path.length }, (_, i) => (canonicalStart + 5 * i) % 100);
        return { start, path, letters: path.map(i => TABLE[i]).join(''), canonicalStart, canonical, canonicalText: canonical.map(i => TABLE[i]).join(''), family: start % 5, answer: ANSWERS[start % 5], returnTo: at };
    }
    function randomCell() {
        if (root.crypto?.getRandomValues) { const a = new Uint32Array(1), limit = Math.floor(4294967296 / 100) * 100; do { root.crypto.getRandomValues(a); } while (a[0] >= limit); return a[0] % 100; }
        return Math.floor(Math.random() * 100);
    }
    function abjad(text) {
        const policy = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ؤ': 'و', 'ئ': 'ي', 'ى': 'ي', 'ة': 'ت' };
        const letters = [], unsupported = [], changes = []; let total = 0;
        for (const original of String(text).normalize('NFKC')) {
            if (/\p{M}|\p{Z}|\p{P}|\p{N}/u.test(original) || original === 'ـ') continue;
            const normalized = policy[original] || original;
            if (normalized !== original) changes.push(original + ' → ' + normalized);
            const at = WESTERN.indexOf(normalized);
            if (at < 0) { if (/\p{L}/u.test(original)) unsupported.push(original); continue; }
            const value = VALUES[at]; total += value; letters.push({ original, letter: normalized, value });
        }
        return { letters, total, text: letters.map(x => x.letter).join(''), unsupported: [...new Set(unsupported)], changes: [...new Set(changes)] };
    }
    function gcd(a, b) { while (b) { const next = a % b; a = b; b = next; } return Math.abs(a); }
    function moments({ degree = 1, rank = 4, first = 9, count = 93 } = {}) {
        for (const [name, v, max] of [['Degree', degree, 30], ['Reverse zodiac rank', rank, 12], ['First cycle', first, 12], ['Combined letter count', count, 10000]]) if (!Number.isInteger(v) || v < 1 || v > max) throw Error(name + ' must be an integer between 1 and ' + max + '.');
        const incrementRaw = (degree + 1) * rank, increment = mod12(incrementRaw), second = degree + rank, cycles = []; let value = first;
        for (let i = 0; i < 12; i++) { const raw = i === 0 ? first : value + increment; value = mod12(raw); cycles.push({ cycle: i + 1, raw, value }); }
        return { degree, rank, first, count, incrementRaw, increment, second, cycles, period: 12 / gcd(increment, 12), quotient: Math.floor(count / 12), remainder: count % 12 };
    }
    const api = { ROWS, TABLE, ANSWERS, WESTERN, VALUES, SIGNS, SOURCE_LANE, SOURCE_LINK, lane, randomCell, abjad, moments };
    if (typeof module === 'object' && module.exports) module.exports = api; root.ZairjaModel = api;
})(typeof globalThis === 'object' ? globalThis : this);
