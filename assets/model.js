/* The guide's alphabets and reversible disk substitutions. No network or dependencies. */
(function (root) {
    'use strict';
    const OUTER = 'ABCDEFGILMNOPQRSTVXZ1234';
    const INNER = 'gklnprtvz&xysomqihfdbace';
    const LETTERS = 'BCDEFGHIK';
    const GROUPS = [
        { name: 'Absolute principles', terms: ['Goodness', 'Greatness', 'Eternity / duration', 'Power', 'Wisdom', 'Will', 'Virtue', 'Truth', 'Glory'] },
        { name: 'Relative principles', terms: ['Difference', 'Conformity', 'Opposition', 'Beginning', 'Middle', 'End', 'Superiority', 'Equity', 'Minority'] },
        { name: 'Questions', terms: ['If', 'What', 'From what', 'Why', 'How much', 'Of which kind', 'When', 'Where', 'How and with what'] },
        { name: 'Subjects', terms: ['God', 'Angel', 'Heaven', 'Man', 'Imaginative', 'Sensitive', 'Vegetative', 'Elemental', 'Instrumental'] },
        { name: 'Virtues', terms: ['Justice', 'Prudence', 'Fortitude', 'Temperance', 'Faith', 'Hope', 'Charity', 'Patience', 'Pity'] },
        { name: 'Vices', terms: ['Avarice', 'Gluttony', 'Luxury', 'Pride', 'Sloth', 'Envy', 'Anger', 'Falsehood', 'Inconstancy'] }
    ];
    const mod = (n, m) => ((n % m) + m) % m;
    function offset(reference, index) { const a = OUTER.indexOf(reference), b = INNER.indexOf(index); if (a < 0 || a > 19 || b < 0) throw Error('Choose an uppercase reference and a symbol from the inner disk.'); return mod(a - b, 24); }
    function normalize(text) { const letters = String(text).normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/J/g, 'I').replace(/U/g, 'V'); let normalized = '', unsupported = []; for (const c of letters) { if (OUTER.includes(c)) normalized += c; else if (/\p{L}|\p{N}/u.test(c)) unsupported.push(c); } return { text: normalized, unsupported: [...new Set(unsupported)] }; }
    function encode(text, reference = 'B', index = 'k') { const n = normalize(text), d = offset(reference, index), steps = []; if (n.unsupported.length) return { text: '', normalized: n.text, steps, unsupported: n.unsupported }; for (const plain of n.text) { const cipher = INNER[mod(OUTER.indexOf(plain) - d, 24)]; steps.push({ plain, cipher, offset: d, reference, index }); } return { text: n.text ? reference + index + steps.map(x => x.cipher).join('') : '', normalized: n.text, steps, unsupported: [] }; }
    function decode(text) { let d = null, reference = null, index = null, out = '', steps = [], markers = [], errors = []; for (let i = 0; i < text.length;) { const c = text[i]; if (/\s/u.test(c)) { i++; continue; } if (OUTER.slice(0, 20).includes(c)) { const b = text[i + 1]; if (!b || !INNER.includes(b)) { errors.push(`At position ${i + 1}, reference ${c} needs an inner-disk symbol immediately after it.`); break; } reference = c; index = b; d = offset(c, b); markers.push({ reference: c, index: b, position: i, after: steps.length, offset: d }); i += 2; continue; } if (!INNER.includes(c)) { errors.push(`Unrecognized cipher symbol at position ${i + 1}: ${c}`); break; } if (d === null) { errors.push('Start with a key marker, such as Bk.'); break; } const plain = OUTER[mod(INNER.indexOf(c) + d, 24)]; out += plain; steps.push({ plain, cipher: c, reference, index, offset: d }); i++; } return { text: out, steps, markers, errors }; }
    function encodeSegments(segments) { let text = '', normalized = '', steps = [], errors = []; segments.forEach((segment, i) => { const r = encode(segment.text, segment.reference, segment.index); if (r.unsupported.length) errors.push(`Segment ${i + 1}: unsupported letters ${r.unsupported.join(', ')}.`); text += r.text; normalized += r.normalized; steps.push(...r.steps.map(s => ({ ...s, segment: i }))); }); return { text, normalized, steps, errors }; }
    function llullReading(anchor, middle, inner, groups = [0, 0, 0]) { const indices = [mod(anchor, 9), mod(anchor - middle, 9), mod(anchor - inner, 9)]; return indices.map((n, i) => ({ letter: LETTERS[n], term: GROUPS[groups[i]].terms[n], group: GROUPS[groups[i]].name })); }
    function fragment(text) { return Array.from(String(text).normalize('NFC')).filter(c => /\p{L}/u.test(c)); }
    const api = { OUTER, INNER, LETTERS, GROUPS, mod, offset, normalize, encode, decode, encodeSegments, llullReading, fragment };
    if (typeof module === 'object' && module.exports) module.exports = api; root.WheelModel = api;
})(typeof globalThis === 'object' ? globalThis : this);
