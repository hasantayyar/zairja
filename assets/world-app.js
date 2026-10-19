'use strict';
(function () {
    const W = WorldZairjaModel;
    let result = W.replay(), stage = 0, view = 'locator', visible = false, timer = null;
    const chordNodes = [], poemNodes = [];
    function stop() { if (timer !== null) clearInterval(timer); timer = null; $('world-play').textContent = 'Play the account'; }
    function setVisible(value) { visible = value; $('world-viewbar').hidden = !value; $('world-tapes').hidden = !value; if (!value) { $('world-source-image').hidden = true; stop(); } }
    function go(next) { stop(); stage = Math.max(0, Math.min(16, next)); renderStage(); renderPanel(); }
    function classify(event) { return event.kind === 'source-exception' ? 'exception' : ['table', 'surface', 'table+surface'].includes(event.kind) ? 'recorded' : 'computed'; }
    function renderLocator() {
        const art = baseDisk();
        for (let i = 0; i < 8; i++)art.append(svg('circle', { cx: 320, cy: 320, r: 280 - i * 24, fill: 'none', stroke: '#8fa088', 'stroke-width': .8 }));
        const selected = [2, 8, 10], signs = ['AR', 'TA', 'GE', 'CA', 'LE', 'VI', 'LI', 'SC', 'SA', 'CP', 'AQ', 'PI'];
        for (let i = 0; i < 12; i++) { const a = point(112, -i * 30), b = point(283, -i * 30), active = selected.includes(i); art.append(svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: active ? '#ac593b' : '#aab5a1', 'stroke-width': active ? 2.2 : .7 })); const label = point(299, -i * 30); art.append(svg('text', { x: label.x, y: label.y + 3, 'text-anchor': 'middle', style: `font:10px ui-monospace,monospace;fill:${active ? '#ac593b' : '#71816b'}` }, signs[i])); if (active) art.append(svg('circle', { cx: b.x, cy: b.y, r: 4, fill: '#ac593b' })); }
        art.append(svg('circle', { cx: 320, cy: 320, r: 106, fill: '#eeeee1', stroke: '#8fa088' })); art.append(svg('text', { x: 320, y: 276, class: 'svg-center-word', style: 'font-size:9px' }, 'WORLD-WHEEL'));
        art.append(svg('text', { x: 320, y: 336, class: 'svg-pair' }, stage === 0 ? '1°' : stage === 16 ? '47' : W.TITLES[stage - 1])); art.append(svg('text', { x: 320, y: 372, class: 'svg-label', style: 'font-size:8px' }, stage === 16 ? '24 + 23 / INTERLEAVE' : 'SAGITTARIUS / RANK 4'));
        $('wheel').setAttribute('aria-label', 'Modern locator with eight concentric circles and twelve rays. Sagittarius, Gemini, and Aquarius are the three selected chords. Source manuscripts are available in the adjacent view controls.');
    }
    function renderStage() {
        if (!visible) return;
        $('z-table-mount').hidden = true; $('world-source-image').hidden = view === 'locator'; $('wheel').hidden = view !== 'locator'; $('stage-label').textContent = 'Ibn Khaldūn / Zā’irjat al-ʿālam'; $('stage-badge').textContent = 'RECORDED WORLD-WHEEL CASE';
        for (const name of ['locator', 'front', 'reverse']) $('world-view-' + name).setAttribute('aria-pressed', String(view === name));
        if (view === 'locator') renderLocator(); else { const reverse = view === 'reverse', path = 'assets/world-' + (reverse ? 'reverse' : 'front') + '.jpeg'; $('world-image').src = path; $('world-source-full').href = path; $('world-image').alt = reverse ? 'The reverse table from MS Ahmet III 3042, folio 237, reproduced as Link’s figure 10.' : 'The world-wheel from MS Ahmet III 3042, folio 237, reproduced as Link’s figure 7.'; $('world-image-caption').textContent = reverse ? 'MS Ahmet III 3042, fol. 237. Reverse table, reproduced in Link, figure 10. Tap to inspect the extracted image.' : 'MS Ahmet III 3042, fol. 237. World-wheel, reproduced in Link, figure 7. The locator is a modern guide to its selected chords.'; }
        $('wheel-legend').replaceChildren(); for (const text of ['Eight rings / twelve rays', 'Selected chords / SA · GE · AQ']) $('wheel-legend').append(element('span', {}, text));
        const count = stage === 0 ? 0 : stage === 16 ? 47 : result.cycles[stage - 1].all.length; $('reading-label').textContent = 'Letters in cycle order'; $('reading-value').textContent = String(count); $('reading-detail').textContent = stage === 16 ? 'Final 24 + 23 transposition.' : 'Twelve cycles, followed by three results.';
        renderTapes();
    }
    function populateTape(root, letters, nodes) { if (nodes.length) return; letters.forEach((letter, i) => { const cell = element('span', { class: 'world-tape-cell', title: `Position ${i + 1}: ${letter}` }); cell.append(element('b', {}, letter), element('small', {}, String(i + 1))); root.append(cell); nodes.push(cell); }); }
    function renderTapes() {
        populateTape($('world-chords'), W.CHORDS, chordNodes); populateTape($('world-poem'), W.POEM, poemNodes);
        if (!$('world-question-letters').children.length) populateTape($('world-question-letters'), W.QUESTION, []);
        const snapshot = stage === 0 ? null : result.cycles[Math.min(stage - 1, 14)], focusedChord = new Set(), focusedPoem = new Set();
        if (stage > 0 && stage < 16) for (const event of snapshot.events) { if (event.kind === 'chord' || event.kind === 'source-exception') focusedChord.add(event.cell - 1); if (event.kind === 'poem') focusedPoem.add(event.cell - 1); }
        chordNodes.forEach((node, i) => node.className = 'world-tape-cell' + (snapshot?.used.includes(i) ? ' used' : '') + (snapshot?.dropped.includes(i) ? ' dropped' : '') + (focusedChord.has(i) ? ' focused' : '') + (stage >= 13 && !result.strictChords && i === 63 ? ' reused' : ''));
        poemNodes.forEach((node, i) => node.className = 'world-tape-cell' + (focusedPoem.has(i) ? ' focused' : ''));
    }
    function renderEvents(events) {
        const root = $('world-operations'); root.replaceChildren(); events.forEach(event => {
            const kind = classify(event), row = element('div', { class: 'world-op ' + kind }), name = event.kind === 'source-exception' ? 'REPORTED' : event.kind.toUpperCase(); row.append(element('span', { class: 'kind' }, name)); const text = element('div'), operation = element('div', { class: 'operation' }); let summary = '';
            if (event.kind === 'chord') summary = `C(${event.input}${event.continueAfter ? ', continue' : ''}) → cell ${event.cell}`;
            else if (event.kind === 'poem') summary = `P(${event.input}) → position ${event.cell}`;
            else if (event.kind === 'drop') summary = `Drop ${event.input}: cells ${event.cells.join(', ')}`;
            else if (event.kind === 'arithmetic') summary = `${event.input} = ${event.result}`;
            else if (event.kind === 'source-exception') summary = `C(${event.input}) reaches ${event.computed}; account reports ${event.letter}`;
            else if (event.kind === 'note') summary = 'P(' + event.input + ') is a comparison, not a new letter';
            else summary = `Recorded lookup at ${event.input}: ${Array.isArray(event.raw) ? event.raw.join(' and ') : event.raw}${event.expression ? ' / ' + event.expression : ''}`;
            operation.textContent = summary; text.append(operation, element('p', {}, event.note || '')); if (event.output && !event.matches) text.append(element('p', {}, `Recorded output at position ${event.output}: ${event.expected}. Strict selection gives ${event.letter}.`)); row.append(text, element('span', { class: 'result' }, event.letter || '')); root.append(row);
        });
    }
    function renderPanel() {
        $('world-progress').value = String(stage); $('world-prev').disabled = stage === 0; $('world-next').disabled = stage === 16; $('world-cycles').replaceChildren();
        ['SETUP', ...W.TITLES, 'FINAL'].forEach((name, i) => { const b = element('button', { 'aria-pressed': String(i === stage), 'aria-label': 'Go to ' + name }, name); b.onclick = () => go(i); $('world-cycles').append(b); });
        let letters = [];
        if (stage === 0) {
            $('world-current-label').textContent = 'INITIALIZATION'; $('world-current-title').textContent = 'Prepare the three artifacts.'; $('world-current-copy').textContent = 'Take the selected chord letters, append the recorded question letters, set the moment values, and establish the first cycle from the reported table search.'; $('world-operations').replaceChildren(); const p = result.principles; const init = element('div', { class: 'world-initial-formula' }, `73 + 20 = ${p.count}\n93 ÷ 12 = ${p.quotient}, remainder ${p.remainder}\n(1 + 1) × 4 = ${p.increment}\n1 + 4 = ${p.second}\nRecorded table search: 3 groups\n3 × 3 = ${p.first}`); $('world-operations').append(init, element('p', { class: 'world-explanation' }, 'The initial search through the reverse table is supplied by the text. Its three-group result is data; the square of three is computed.'));
        } else if (stage === 16) {
            $('world-current-label').textContent = 'FINAL REARRANGEMENT'; $('world-current-title').textContent = 'Interleave the two halves.'; $('world-current-copy').textContent = 'The operation has emitted 47 letters. Split after letter 24, then alternate the halves. This rearrangement is computed from the replay’s output.'; $('world-operations').replaceChildren(element('p', { class: 'world-explanation' }, 'A1, B1, A2, B2, …, A23, B23, A24. The original order and the interleaved order contain exactly the same 47 letters.')); letters = result.cycles[14].all;
        } else { const c = result.cycles[stage - 1]; $('world-current-label').textContent = (stage <= 12 ? 'PRINCIPAL CYCLE ' : 'RESULT CYCLE ') + c.title; $('world-current-title').textContent = `${c.title}: ${c.raw}${c.raw > 12 ? ' → ' + c.value : ''}`; $('world-current-copy').textContent = `This cycle adds ${c.letters.length} letters, bringing the running total to ${c.all.length}. Open the chord and poem tapes to inspect the selected positions.`; renderEvents(c.events); letters = c.all; }
        $('world-output-letters').replaceChildren(...letters.map(letter => { const cell = element('span', { class: classify(letter), title: letter.kind + ' / output ' + letter.output }, letter.letter); cell.append(element('small', {}, String(letter.output))); return cell; })); $('world-output-count').textContent = `${letters.length} / 47 letters. Border colors identify the origin of each letter.`;
        $('world-final').hidden = stage !== 16;
        if (stage === 16) { $('world-interleave').replaceChildren(...result.shuffled.map((x, i) => { const cell = element('span', {}, x.letter); cell.append(element('small', {}, (x.from < 24 ? 'A' : 'B') + (x.from < 24 ? x.from + 1 : x.from - 23))); return cell; })); const matches = result.text === result.expected; $('world-verse').textContent = matches ? W.VERSE_WORDS.slice(0, 5).join(' ') + '\n' + W.VERSE_WORDS.slice(5).join(' ') : result.text; $('world-verse-note').textContent = matches ? 'The computed sequence matches the recorded verse. Its interpretation attributes the art to Idrīs and describes an ascent to a high summit.' : 'Strict chord removal changes one letter. The app leaves that difference visible instead of silently restoring the recorded verse.'; }
        $('world-audit').textContent = result.strictChords ? `Strict chord removal: ${result.mismatches.length} output differs from the account, at position 41. There are ${result.recordedLookups.length} recorded reverse-table/surface outcomes. A strict comparison is not independent verification of those table lookups.` : `Source replay: all fifteen recorded cycle outputs match. Eighteen reverse-table/surface outcomes are supplied from the text. R1 preserves its reported repeated alif as an explicit exception. This is one recorded case, not a general answer generator.`;
    }
    function repaint() { renderPanel(); if (visible) renderStage(); }
    for (const name of ['locator', 'front', 'reverse']) $('world-view-' + name).onclick = () => { view = name; renderStage(); };
    $('world-prev').onclick = () => go(stage - 1); $('world-next').onclick = () => go(stage + 1); $('world-finish').onclick = () => go(16); $('world-progress').oninput = () => go(Number($('world-progress').value));
    $('world-play').onclick = () => { if (timer !== null) { stop(); return; } if (stage === 16) stage = 0; $('world-play').textContent = 'Pause'; repaint(); timer = setInterval(() => { if (!visible) { stop(); return; } stage++; repaint(); if (stage === 16) stop(); }, 1000); };
    $('world-strict').onchange = () => { stop(); result = W.replay({ strictChords: $('world-strict').checked }); repaint(); };
    $('world-export').onclick = () => download('ibn-khaldun-world-wheel-trace.json', JSON.stringify({ scope: 'Recorded worked example from Muqaddimah VI.28; supplied reverse-table data', source: W.SOURCE, reconstruction: W.RECONSTRUCTION, ...result }, null, 2), 'application/json');
    globalThis.WorldZairjaUI = { setVisible, renderStage }; renderPanel();
    if (globalThis.location?.hash === '#ibn-khaldun') { showInstrument('zairja'); ZairjaUI.setMode('world'); }
})();
