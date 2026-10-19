/* Ibn Khaldun VI.28: executable replay of the recorded question, not a
 * general answer generator. Full reverse-table lookup values remain source data. */
(function (root) {
    'use strict';
    const CHORDS = 'ص ط د ط ه ن ث ك ه م ض ص و ن ث ه س ا ب ل م ن ص ع ف ض ق ر س ي ك ل م ن ص ع ف ق ر س ت ث خ ذ ظ غ ش ط ك ن ع ح ص ز و ح ل ص ك ل م ن ص ا ب ج د ه و ز ح ط ي'.split(' ');
    const POEM = 'س و ا ل ع ظ ي م ا ل خ ل ق ح ز ت ف ص ن ا ذ ن غ ر ا ي ب ش ك ض ب ط ه ا ل ج د م ث ل ا'.split(' ');
    const QUESTION = 'ا ل ز ي ر ج ت ع ل م م ح د ث ا م ق د ي م'.split(' ');
    const GROUPS = ['ت و', 'ن و ا', 'ق س ب ز', 'ر ا ا ر س ا', 'ت ق ب', 'ا ر', 'ق ا', 'ع ا ر ح', 'ر ح ل', 'د ا ر', 'س ه ل', 'د ي ف س ر', 'ا ه م', 'ت ا ل', 'ل'].map(s => s.split(' '));
    const TITLES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'R1', 'R2', 'R3'];
    const RAW_NUMBERS = [9, 17, 13, 9, 17, 13, 9, 17, 13, 9, 17, 13, 9, 17, 13];
    const VERSE_WORDS = ['تروحن', 'روح', 'القدس', 'ابرز', 'سرها', 'لادريس', 'فاسترقا', 'بها', 'مرتقا', 'العلا'];
    const SOURCE = 'https://www.muslimphilosophy.com/ik/Muqaddimah/Chapter6/Ch_6_28.htm';
    const RECONSTRUCTION = 'https://d13.documenta.de/research/assets/Uploads/DavidLinkScramblingTruth2010100dpi.pdf#page=42';
    function calculate(expression) {
        const text = String(expression).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        if (/[^\d\s+*/().-]/.test(text)) throw Error('Only arithmetic is accepted.');
        const tokens = text.match(/\d+(?:\.\d+)?|[+*/().-]/g) || []; let at = 0;
        function atom() { const token = tokens[at++]; if (token === '(') { const value = sum(); if (tokens[at++] !== ')') throw Error('Unclosed arithmetic group.'); return value; } if (token === '-') return -atom(); if (token === undefined || !/^\d/.test(token)) throw Error('Expected a number.'); return Number(token); }
        function product() { let value = atom(); while (tokens[at] === '*' || tokens[at] === '/') { const op = tokens[at++], right = atom(); value = op === '*' ? value * right : value / right; } return value; }
        function sum() { let value = product(); while (tokens[at] === '+' || tokens[at] === '-') { const op = tokens[at++], right = product(); value = op === '+' ? value + right : value - right; } return value; }
        const value = sum(); if (at !== tokens.length || !Number.isFinite(value)) throw Error('Invalid arithmetic expression.'); return value;
    }
    function interleave(letters) { if (!Array.isArray(letters)) throw Error('A letter sequence is required.'); const split = Math.ceil(letters.length / 2), a = letters.slice(0, split), b = letters.slice(split), out = []; for (let i = 0; i < a.length; i++) { out.push({ letter: a[i], from: i }); if (i < b.length) out.push({ letter: b[i], from: split + i }); } return out; }
    function replay({ strictChords = false } = {}) {
        const Z = root.ZairjaModel || (typeof require === 'function' ? require('./zairja-model.js') : null);
        if (!Z) throw Error('ZairjaModel is required.');
        const principles = Z.moments({ degree: 1, rank: 4, first: calculate('3 * 3'), count: CHORDS.length + QUESTION.length });
        let remaining = CHORDS.map((letter, i) => ({ id: i, letter })), last = -1, all = [], events = [], used = [], dropped = [], cycles = [], expectedIndex = 0, current = 0;
        const fixture = GROUPS.flat();
        function log(event) { events.push({ ...event, cycle: current }); }
        function emit(letter, kind, input, extra = {}) { const expected = fixture[expectedIndex]; const result = { letter, kind, input, expected, output: expectedIndex + 1, matches: letter === expected, ...extra }; all.push(result); log(result); expectedIndex++; return letter; }
        function chord(n, { continueAfter = false, reuse = false } = {}) {
            const candidates = remaining.filter(x => !continueAfter || x.id > last), hit = candidates[n - 1]; if (!hit) throw Error('Chord lookup outside remaining tape.');
            if (reuse && !strictChords) { const prior = CHORDS.findIndex((x, i) => i === 63 && x === 'ا'); emit('ا', 'source-exception', n, { computed: hit.letter, cell: prior + 1, candidateCell: hit.id + 1, note: 'The account reports alif again. Strict removal reaches bāʾ. This replay repeats the already-used alif at cell 64 and leaves the candidate bāʾ available.' }); return 'ا'; }
            remaining = remaining.filter(x => x.id !== hit.id); last = hit.id; used.push(hit.id); return emit(hit.letter, 'chord', n, { cell: hit.id + 1, continueAfter, note: continueAfter ? 'Continue from the previous chord selection.' : 'Count through unremoved letters from the start.' });
        }
        function drop(n) { const removed = remaining.splice(0, n); dropped.push(...removed.map(x => x.id)); log({ kind: 'drop', input: n, cells: removed.map(x => x.id + 1), result: removed.map(x => x.letter).join(''), note: 'Remove the first remaining letters without adding them to the output.' }); }
        function poem(n) { const letter = POEM[n - 1]; if (!letter) throw Error('Poem lookup outside the recorded 41 letters.'); return emit(letter, 'poem', n, { cell: n, note: 'Look up the specified position in the fixed key poem.' }); }
        function numeric(kind, input, raw, expectedNumber, { expression, note, calculation } = {}) {
            const number = calculation ? calculate(calculation) : Array.isArray(raw) ? raw.reduce((a, b) => a + b, 0) : raw;
            if (number !== expectedNumber) throw Error('Recorded numeric conversion disagrees with its calculation.');
            const at = Z.VALUES.indexOf(number); if (at < 0) throw Error('Result is not a Western abjad letter value: ' + number);
            return emit(Z.WESTERN[at], kind, input, { raw, number, expression: expression || String(number), calculation, note: note || 'The raw lookup is recorded in the account. Its arithmetic conversion is shown separately.' });
        }
        function arithmetic(expression, expectedResult) { const result = calculate(expression); if (result !== expectedResult) throw Error('Arithmetic disagrees with the recorded result.'); log({ kind: 'arithmetic', input: expression, result, note: 'Computed arithmetic in the recorded worked example.' }); }
        function phase(n, fn) { current = n; events = []; const before = all.length; fn(); const raw = n < 12 ? principles.cycles[n].raw : n === 12 ? principles.remainder : n === 13 ? principles.remainder + principles.increment : ((principles.remainder + principles.increment - 1) % 12) + 1 + principles.increment; if (raw !== RAW_NUMBERS[n]) throw Error('Cycle number disagrees with the source example.'); cycles.push({ title: TITLES[n], raw, value: ((raw - 1) % 12) + 1, events: events.slice(), letters: all.slice(before), all: all.slice(), remaining: remaining.map(x => x.id), used: used.slice(), dropped: dropped.slice() }); }
        phase(0, () => { numeric('table', 9, 400, 400); arithmetic('9 + 4', 13); chord(13); });
        phase(1, () => { arithmetic('9 + 8', 17); numeric('table', 22, 500, 50, { expression: '500 → 50 (tens scale)', calculation: '500 / 10' }); numeric('table+surface', 5, [5, 1], 6, { expression: '5 + 1 = 6' }); arithmetic('4 + 8 + 5', 17); chord(17); drop(3); });
        phase(2, () => { poem(13); chord(13); chord(1, { continueAfter: true }); numeric('surface', 13, 3, 7, { expression: '3 × 2 + 1 = 7', calculation: '3 * 2 + 1' }); });
        phase(3, () => { drop(2); poem(24); numeric('surface', 9, 1, 1); poem(34); drop(1); arithmetic('9 × 2', 18); chord(18); chord(18); numeric('surface', 11, 1, 1); });
        phase(4, () => { drop(2); arithmetic('5 × 2 + 17', 27); chord(27); arithmetic('17 − 2', 15); chord(15); numeric('table', 26, 2, 2); });
        phase(5, () => { drop(2); arithmetic('1 + 4 + 13', 18); numeric('surface', 18, 1, 1); drop(2); arithmetic('18 + 2', 20); chord(20); });
        phase(6, () => { drop(2); numeric('table', 10, 500, 100, { expression: '500 → 50; 50 × 2 = 100', calculation: '500 / 10 * 2' }); arithmetic('52 − 2 − 9', 41); chord(41); log({ kind: 'note', input: 41, result: POEM[40], note: 'The poem is also consulted at 41. Its alif is a comparison or scale, not another emitted letter in the 47-letter transcript.' }); });
        phase(7, () => { drop(2); poem(5); numeric('surface', 5, 1, 1); arithmetic('48 − 1 + 5', 52); numeric('table', 52, 2, 200, { expression: '2 → 200 (hundreds scale)', calculation: '2 * 100' }); arithmetic('(24 + 5 − 1) ÷ 2', 14); poem(14); });
        phase(8, () => { arithmetic('13 × 4', 52); numeric('table', 52, 2, 200, { expression: '2 → 200 (hundreds scale)', calculation: '2 * 100' }); poem(14); arithmetic('14 − 7', 7); drop(2); chord(7); });
        phase(9, () => { arithmetic('9 × 4', 36); numeric('table', 36, 4, 4); poem(9); arithmetic('9 × 3 − 1', 26); numeric('table', 26, 200, 200); });
        phase(10, () => { drop(2); poem(1); arithmetic('17 × 2 − 1 + 4', 37); chord(37); poem(10); });
        phase(11, () => { drop(2); numeric('table', 1, 8, 4, { expression: '8 ÷ 2 = 4', calculation: '8 / 2' }); numeric('surface', 1, 5, 10, { expression: '5 + 5 = 10', calculation: '5 + 5' }); chord(7); chord(8); poem(24); });
        phase(12, () => { drop(2); arithmetic('9 × 3 + 1', 28); chord(28, { reuse: true }); arithmetic('3 × 9 + 7 − 1', 33); poem(33); arithmetic('9 × 2', 18); chord(1); });
        phase(13, () => { drop(2); arithmetic('5 × 3 + 1', 16); poem(16); numeric('surface', 9, 1, 1, { note: 'The account contains conflicting intermediate totals here. The recorded lookup result is alif; no general rule for this table entry is asserted.' }); numeric('table', 9, 30, 30); });
        phase(14, () => { arithmetic('13 + 3 + 1 + 1', 18); chord(18); });
        const letters = all.map(x => x.letter), shuffled = interleave(letters);
        return { strictChords, principles, question: QUESTION.slice(), chords: CHORDS.slice(), poem: POEM.slice(), cycles, letters, shuffled, raw: letters.join(''), text: shuffled.map(x => x.letter).join(''), expected: VERSE_WORDS.join(''), mismatches: all.filter(x => !x.matches), sourceExceptions: all.filter(x => x.kind === 'source-exception'), recordedLookups: all.filter(x => ['table', 'surface', 'table+surface'].includes(x.kind)), chordSelections: all.filter(x => x.kind === 'chord' || x.kind === 'source-exception').length, poemSelections: all.filter(x => x.kind === 'poem').length, dropped: dropped.length };
    }
    const api = { CHORDS, POEM, QUESTION, GROUPS, TITLES, RAW_NUMBERS, VERSE_WORDS, SOURCE, RECONSTRUCTION, calculate, interleave, replay };
    if (typeof module === 'object' && module.exports) module.exports = api; root.WorldZairjaModel = api;
})(typeof globalThis === 'object' ? globalThis : this);
