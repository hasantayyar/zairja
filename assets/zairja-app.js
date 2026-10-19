'use strict';
(function () {
    const Z = ZairjaModel;
    let mode = 'lane', run = Z.lane(53), position = 0, timer = null, calculation = null;
    const cells = [];
    function stop() { if (timer !== null) clearInterval(timer); timer = null; $('z-play').textContent = 'Play the route'; }
    function setMode(next) { stop(); mode = next; sync(); }
    function choose(start) { stop(); run = Z.lane(start); position = 0; renderStage(); }
    function renderBoard() {
        if (!cells.length) { for (let i = 0; i < 100; i++) { const b = element('button', { type: 'button' }); b.onclick = () => choose(i); $('z-table').append(b); cells.push(b); } }
        cells.forEach((b, i) => {
            const order = run.path.indexOf(i), visited = order >= 0 && order <= position;
            b.className = 'z-cell' + (visited ? ' visited' : '') + (i === run.path[position] ? ' current' : '') + (i === run.start ? ' start' : '') + (i === run.canonicalStart ? ' canonical' : '');
            b.textContent = Z.TABLE[i]; if (visited) b.append(element('span', { class: 'z-step-no' }, String(order + 1)));
            b.setAttribute('aria-label', `Row ${Math.floor(i / 10) + 1}, column ${i % 10 + 1}: ${Z.TABLE[i]}. Choose as starting square.`); b.setAttribute('aria-pressed', String(i === run.start));
        });
        const current = run.path[position], row = Math.floor(current / 10) + 1, column = current % 10 + 1;
        $('z-cell-location').textContent = `ROW ${row} / COL ${column}`;
        $('reading-label').textContent = 'Current table cell'; $('reading-value').textContent = Z.TABLE[current]; $('reading-detail').textContent = `Step ${position + 1} / 20 · cell ${current + 1}`;
    }
    function renderLane() {
        renderBoard(); $('z-answer').textContent = run.answer; $('z-collected').textContent = run.path.slice(0, position + 1).map(i => Z.TABLE[i]).join('');
        $('z-result-context').textContent = position === 19 ? `All twenty letters collected. Sentence order begins at cell ${run.canonicalStart + 1}: ${run.canonicalText}.` : `${position + 1} of 20 letters collected. The sentence is stored in the selected route; it is not generated from the question.`;
        $('z-progress').textContent = String(position + 1).padStart(2, '0') + ' / 20'; $('z-back').disabled = position === 0; $('z-forward').disabled = position === 19;
        $('z-lane-trace').replaceChildren(); run.path.forEach((cell, i) => { const b = element('button', { 'aria-pressed': String(i === position), 'aria-label': `Step ${i + 1}, cell ${cell + 1}, letter ${Z.TABLE[cell]}` }); b.append(element('small', {}, String(i + 1)), document.createTextNode(Z.TABLE[cell])); b.onclick = () => { stop(); position = i; renderStage(); }; $('z-lane-trace').append(b); });
        $('z-outcomes').replaceChildren(); Z.ANSWERS.forEach((answer, i) => { const row = element('div', { class: 'z-outcome' + (run.family === i ? ' active' : '') }); const text = element('span', {}, answer); text.append(element('small', {}, '20 of the 100 starting squares')); row.append(element('strong', {}, String(i + 1).padStart(2, '0')), text); $('z-outcomes').append(row); });
    }
    function updateArithmetic() {
        const a = Z.abjad($('z-abjad-input').value); $('z-abjad-values').replaceChildren(); a.letters.forEach(x => { const cell = element('span', { class: 'z-value' }); cell.append(element('b', {}, x.letter), element('small', {}, String(x.value))); $('z-abjad-values').append(cell); });
        $('z-abjad-count').textContent = String(a.letters.length); $('z-abjad-sum').textContent = a.unsupported.length ? 'Partial: ' + a.total : String(a.total); $('z-abjad-error').hidden = !a.unsupported.length; $('z-abjad-error').textContent = 'No value is assigned to: ' + a.unsupported.join(', ') + '. The displayed sum includes supported Arabic letters only.';
        try {
            calculation = Z.moments({ degree: Number($('z-degree').value), rank: 12 - Number($('z-sign').value), first: Number($('z-first').value), count: Number($('z-count').value) });
            const c = calculation; $('z-moment-error').hidden = true;
            $('z-moment-formula').textContent = `Reverse zodiac rank: ${c.rank}\nFirst moment: (${c.degree} + 1) × ${c.rank} = ${c.incrementRaw}; wrapped to 1–12: ${c.increment}\nSecond moment: ${c.degree} + ${c.rank} = ${c.second}\nFirst cycle: ${c.first} (manual table result)\nCombined count: ${c.count} ÷ 12 = ${c.quotient}, remainder ${c.remainder}`;
            $('z-cycle-values').replaceChildren(...c.cycles.map(x => { const cell = element('div', { class: 'z-cycle' }); cell.append(element('small', {}, 'CYCLE ' + x.cycle), element('strong', {}, String(x.value))); return cell; }));
            $('z-cycle-context').textContent = `Each new cycle adds ${c.increment}, then wraps to 1–12. The sequence repeats after ${c.period} cycle${c.period === 1 ? '' : 's'}. These numbers do not by themselves specify the letter lookups.`;
        } catch (e) { calculation = null; $('z-moment-error').hidden = false; $('z-moment-error').textContent = e.message; $('z-moment-formula').textContent = 'Enter valid integer inputs to calculate the moment values.'; $('z-cycle-values').replaceChildren(); $('z-cycle-context').textContent = ''; }
        if (instrument === 'zairja' && mode === 'medieval') renderMedievalStage();
    }
    function renderMedievalStage() {
        const art = baseDisk(), abjad = Z.abjad($('z-abjad-input').value), active = abjad.letters[0]?.letter;
        addRing(art, Z.WESTERN, 244, 287, 0, active, 'outer');
        for (let i = 0; i < 12; i++) { const p = point(215, i * 30), value = calculation?.cycles[i]?.value; art.append(svg('circle', { cx: p.x, cy: p.y, r: 19, fill: i === 0 ? '#263c34' : '#dce3d2', stroke: '#8b9b87' })); art.append(svg('text', { x: p.x, y: p.y + 6, 'text-anchor': 'middle', style: `font:22px Georgia;fill:${i === 0 ? '#f7f4ec' : '#263c34'}` }, value === undefined ? '?' : String(value))); }
        centerMark(art, 'ARITHMETIC VIEW', calculation ? String(calculation.increment) : '?', calculation ? 'CYCLE INCREMENT / MOD 12' : 'ENTER VALID INPUTS');
        $('reading-label').textContent = 'Computed cycle period'; $('reading-value').textContent = calculation ? String(calculation.period) : '?'; $('reading-detail').textContent = 'Modern plot of documented arithmetic.';
    }
    function renderStage() {
        if (globalThis.WorldZairjaUI) globalThis.WorldZairjaUI.setVisible(instrument === 'zairja' && mode === 'world');
        $('z-table-mount').hidden = instrument !== 'zairja' || mode !== 'lane'; $('wheel').hidden = instrument === 'zairja' && mode === 'lane';
        if (instrument !== 'zairja') return;
        if (mode === 'world') { if (globalThis.WorldZairjaUI) globalThis.WorldZairjaUI.renderStage(); return; }
        if (mode === 'lane') {
            $('stage-label').textContent = 'Zā’irja / Lane’s later Egyptian table'; $('stage-badge').textContent = '100 CELLS / 5 ROUTES';
            renderLane();
        } else if (mode === 'medieval') {
            $('stage-label').textContent = 'Zā’irja / Medieval arithmetic'; $('stage-badge').textContent = 'PARTIAL RECONSTRUCTION'; $('wheel').setAttribute('aria-label', 'Western abjad letters and twelve principal cycle values. A modern arithmetic diagram.'); renderMedievalStage();
        } else {
            $('stage-label').textContent = 'Zā’irja / The source guide'; $('stage-badge').textContent = 'GUIDED STUDY'; renderZairjaGuideWheel();
        }
        $('wheel-legend').replaceChildren(); const labels = mode === 'lane' ? ['Outlined square / chosen start', 'Arrow / sentence beginning'] : mode === 'medieval' ? ['Outer ring / Western abjad', 'Inner ring / twelve cycle values'] : ['Question letters / separated', 'Diagram / modern teaching aid'];
        labels.forEach((label, i) => { const item = element('span'); item.append(element('i', { class: 'legend-line' + (i ? ' accent' : '') }), document.createTextNode(label)); $('wheel-legend').append(item); });
    }
    function sync() {
        for (const name of ['lane', 'medieval', 'guide', 'world']) { $('z-' + name).hidden = name !== mode; $('z-mode-' + name).setAttribute('aria-pressed', String(name === mode)); }
        if (instrument !== 'zairja') stop(); renderStage();
    }
    for (const name of ['lane', 'medieval', 'guide', 'world']) $('z-mode-' + name).onclick = () => setMode(name);
    $('z-random').onclick = () => choose(Z.randomCell()); $('z-lane-example').onclick = () => choose(53);
    $('z-back').onclick = () => { stop(); position = Math.max(0, position - 1); renderStage(); }; $('z-forward').onclick = () => { stop(); position = Math.min(19, position + 1); renderStage(); }; $('z-show-all').onclick = () => { stop(); position = 19; renderStage(); };
    $('z-play').onclick = () => { if (timer !== null) { stop(); return; } if (position === 19) position = 0; renderStage(); $('z-play').textContent = 'Pause'; timer = setInterval(() => { if (instrument !== 'zairja' || mode !== 'lane') { stop(); return; } position = Math.min(19, position + 1); renderStage(); if (position === 19) stop(); }, 400); };
    $('z-export').onclick = () => { const result = { variant: 'Lane’s English translated Zairgeh table', source: Z.SOURCE_LANE, question: $('z-lane-question').value, questionAffectsCalculation: false, startCell: run.start + 1, step: 5, tableRows: Z.ROWS, collected: run.letters, canonical: run.canonicalText, sentence: run.answer, path: run.path.map((cell, i) => ({ step: i + 1, cell: cell + 1, row: Math.floor(cell / 10) + 1, column: cell % 10 + 1, letter: Z.TABLE[cell] })) }; download('zairja-run.json', JSON.stringify(result, null, 2), 'application/json'); };
    Z.SIGNS.forEach((name, i) => { const op = element('option', { value: i }, name + ' / rank ' + (12 - i)); op.selected = i === 8; $('z-sign').append(op); }); $('z-sign').value = '8';
    Array.from(Z.WESTERN).forEach((letter, i) => { const cell = element('span', { class: 'z-value' }); cell.append(element('b', {}, letter), element('small', {}, String(Z.VALUES[i]))); $('z-abjad-table').append(cell); });
    for (const id of ['z-abjad-input', 'z-sign', 'z-degree', 'z-first', 'z-count']) $(id).addEventListener('input', updateArithmetic);
    $('z-med-example').onclick = () => { $('z-sign').value = '8'; $('z-degree').value = '1'; $('z-first').value = '9'; $('z-count').value = '93'; updateArithmetic(); };
    globalThis.ZairjaUI = { renderStage, sync, setMode }; updateArithmetic(); sync();
    if (globalThis.location?.hash === '#zairja') showInstrument('zairja');
})();
