/* Local-only point import. OCR dependencies are pinned and loaded on demand. */
(function (root) {
  'use strict';

  const RELEASE_TO_ALL = false; // Change only after the private beta is approved.
  const BETA_USER = 'b1fce5d4-9817-4795-ac91-ee731c8f149b';
  const MONTHS = [
    'janeiro',
    'fevereiro',
    'marco',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro'
  ];

  const normal = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const words = data => (data.blocks || []).flatMap(block =>
    (block.paragraphs || []).flatMap(paragraph =>
      (paragraph.lines || []).flatMap(line => line.words || [])
    )
  );

  function period(text) {
    const match = normal(text).match(
      /(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(?:[\/-]|de)?\s*(20\d{2})/
    );

    return match
      ? `${match[2]}-${String(MONTHS.indexOf(match[1]) + 1).padStart(2, '0')}`
      : '';
  }

  function headers(data) {
    const list = words(data);
    const dia = list.find(word => normal(word.text) === 'dia');
    const just = list.find(word => normal(word.text).startsWith('justificativa'));

    if (!dia || !just || Math.abs(dia.bbox.y0 - just.bbox.y0) > 25) {
      return null;
    }

    const h = dia.bbox.y1 - dia.bbox.y0;
    const row = list.filter(word => Math.abs(word.bbox.y0 - dia.bbox.y0) < h);
    const entries = row
      .filter(word => /ent.*saida/.test(normal(word.text)))
      .sort((a, b) => a.bbox.x0 - b.bbox.x0);
    const real = row.find(word => /^h[.,]?rea/.test(normal(word.text)));
    const saldo = row.find(word => normal(word.text).startsWith('saldo'));

    if (entries.length < 2 || !real || !saldo) return null;

    return { dia, just, entries, real, saldo, h };
  }

  function parse(data, month) {
    const hd = headers(data);

    if (!hd) {
      throw new Error(
        'Não localizei as colunas. Use um print nítido com o cabeçalho Dia, Ent/Saída, Justificativa e H.Real.'
      );
    }

    const center = word => (word.bbox.x0 + word.bbox.x1) / 2;
    const dateEnd = (center(hd.dia) + center(hd.entries[0])) / 2;
    const timeEnd = (center(hd.entries[1]) + center(hd.just)) / 2;
    const timeMiddle = (center(hd.entries[0]) + center(hd.entries[1])) / 2;
    const realStart = hd.real.bbox.x0 - hd.h;
    const saldoStart = hd.saldo.bbox.x0 - hd.h;
    const list = words(data).filter(word => word.bbox.y0 > hd.dia.bbox.y1);
    const lines = [];

    for (const word of list.sort((a, b) => a.bbox.y0 - b.bbox.y0)) {
      const cy = (word.bbox.y0 + word.bbox.y1) / 2;
      let line = lines.find(item => Math.abs(item.cy - cy) < hd.h * 0.7);

      if (!line) {
        line = { cy, words: [] };
        lines.push(line);
      }

      line.words.push(word);
    }

    return lines.flatMap(line => {
      const rowWords = line.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
      const join = items => items.map(word => word.text).join(' ');
      const dayWords = rowWords.filter(word => center(word) < dateEnd);
      const dayText = join(dayWords).trim();
      const timeWords = rowWords.filter(word =>
        center(word) >= dateEnd && center(word) < timeEnd
      );
      const timeText = join(timeWords);
      const label = join(
        rowWords.filter(word => center(word) >= timeEnd && center(word) < realStart)
      );

      if (/total/i.test(join(rowWords)) || (!dayText && !/\d\s*:\s*\d/.test(timeText))) {
        return [];
      }

      if (!dayText && !timeWords.length) return [];

      const dayClean = dayText.replace(/[oOdD]/g, '0').trim();
      const day = /^\d{1,2}$/.test(dayClean) && +dayClean >= 1 && +dayClean <= 31
        ? String(+dayClean).padStart(2, '0')
        : '';
      const extract = text => [
        ...text.matchAll(/(?<!\d)([0-2]\d)\s*:\s*([0-5]\d)(?!\d)/g)
      ].map(match => `${match[1]}:${match[2]}`);
      const firstPair = extract(join(timeWords.filter(word => center(word) < timeMiddle)));
      const secondPair = extract(join(timeWords.filter(word => center(word) >= timeMiddle)));
      const times = [...firstPair, ...secondPair];
      const totalText = join(
        rowWords.filter(word => center(word) >= realStart && center(word) < saldoStart)
      );
      const total = totalText.match(/\b([0-2]\d):([0-5]\d)\b/)?.[0] || '';
      const cleanLabel = normal(label);
      const pending = /\(\s*p\s*\)|pendente|incompleto/i.test(`${timeText} ${label}`);
      const weekend = /sabado|domingo/.test(cleanLabel);
      const empty = times.length > 0 && times.every(time => time === '00:00');
      const kind = weekend && empty
        ? 'skip'
        : /feriado/.test(cleanLabel) && empty
          ? 'holiday'
          : /ausencia/.test(cleanLabel) && empty
            ? 'absence'
            : 'work';

      return [{
        date: month && day ? `${month}-${day}` : '',
        day,
        dayText,
        kind,
        label,
        pending,
        entry: firstPair.length === 2 ? firstPair[0] : '',
        lunchOut: firstPair.length === 2 ? firstPair[1] : '',
        lunchBack: secondPair.length === 2 ? secondPair[0] : '',
        realExit: secondPair.length === 2 ? secondPair[1] : '',
        noLunch: false,
        portalTotal: total,
        source: join(rowWords),
        uncertain:
          dayText !== day ||
          [...dayWords, ...timeWords].some(word => word.confidence < 75),
        bbox: {
          left: Math.max(
            0,
            Math.floor((dayWords[0]?.bbox.x0 || hd.dia.bbox.x0) - hd.h * 0.2)
          ),
          top: Math.max(0, Math.floor(line.cy - hd.h * 0.5)),
          width: Math.ceil(
            (dayWords.at(-1)?.bbox.x1 || hd.dia.bbox.x1) -
            (dayWords[0]?.bbox.x0 || hd.dia.bbox.x0) +
            hd.h * 0.4
          ),
          height: Math.ceil(hd.h)
        }
      }];
    }).slice(0, 31);
  }

  function validate(row, today, existing, seen = new Set()) {
    if (row.kind === 'skip') {
      return 'Fim de semana sem marcações: não será importado.';
    }

    const dateParts = /^(20\d{2})-(\d{2})-(\d{2})$/.exec(row.date);

    if (!dateParts) return 'Confira a data.';

    const date = new Date(+dateParts[1], +dateParts[2] - 1, +dateParts[3]);

    if (
      date.getFullYear() !== +dateParts[1] ||
      date.getMonth() !== +dateParts[2] - 1 ||
      date.getDate() !== +dateParts[3] ||
      row.date > today
    ) {
      return 'Data inválida ou futura.';
    }

    if (existing.has(row.date)) {
      return 'Já existe no histórico: será preservado.';
    }

    if (seen.has(row.date)) {
      return 'Data repetida nesta importação.';
    }

    if (row.kind !== 'work') return '';

    const values = row.noLunch
      ? [row.entry, row.realExit]
      : [row.entry, row.lunchOut, row.lunchBack, row.realExit];

    if (values.some(value => !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))) {
      return 'Complete e confira os horários.';
    }

    const minutes = values.map(value => +value.slice(0, 2) * 60 + +value.slice(3));

    if (
      minutes.some((value, index) => index > 0 && value < minutes[index - 1]) ||
      minutes.at(-1) === minutes[0]
    ) {
      return 'Confira a sequência dos horários.';
    }

    return '';
  }

  function warnings(row) {
    const result = [];

    if (row.pending) {
      result.push('Marcação pendente no portal; o saldo pode mudar após a aprovação.');
    }

    if (row.uncertain) {
      result.push('A leitura teve baixa confiança; confira esta linha no print.');
    }

    if (row.kind === 'absence') {
      result.push('Ausência identificada; confirme se está correta.');
    }

    if (row.kind === 'work' && row.portalTotal) {
      const minutes = value => /^\d{2}:\d{2}$/.test(value)
        ? +value.slice(0, 2) * 60 + +value.slice(3)
        : NaN;
      const total = minutes(row.realExit) - minutes(row.entry) - (
        row.noLunch ? 0 : minutes(row.lunchBack) - minutes(row.lunchOut)
      );

      if (Number.isFinite(total) && total !== minutes(row.portalTotal)) {
        result.push(`O total calculado difere do portal (${row.portalTotal}).`);
      }
    }

    return result.join(' ');
  }

  function injectStyles() {
    if (document.getElementById('pointOcrUxStyles')) return;

    const style = document.createElement('style');
    style.id = 'pointOcrUxStyles';
    style.textContent = `
      .point-ocr-dialog.point-ocr-ux {
        width: min(1380px, calc(100% - 24px));
        max-width: none;
        max-height: calc(100dvh - 24px);
      }

      .point-ocr-dialog.point-ocr-ux .dialog-body {
        max-height: calc(100dvh - 24px);
        overflow: auto;
        overscroll-behavior: contain;
        padding: 24px;
        gap: 16px;
      }

      .point-ocr-ux .point-ocr-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .point-ocr-ux .point-ocr-heading h2 {
        margin: 0;
      }

      .point-ocr-upload-field {
        display: grid;
        gap: 8px;
        padding: 16px;
        border: 1px dashed color-mix(in srgb, var(--blue) 38%, var(--line));
        border-radius: 18px;
        background: color-mix(in srgb, var(--blue2) 54%, var(--card-solid));
      }

      .point-ocr-upload-field input[type="file"] {
        margin: 0;
        min-height: 46px;
        padding: 8px;
        border-style: solid;
        background: var(--card-solid);
      }

      .point-ocr-workspace {
        display: grid;
        grid-template-columns: minmax(360px, .92fr) minmax(0, 1.38fr);
        align-items: start;
        gap: 18px;
        margin-top: 2px;
      }

      .point-ocr-preview-pane {
        position: sticky;
        top: 0;
        align-self: start;
        min-width: 0;
      }

      .point-ocr-preview-card {
        display: block;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: color-mix(in srgb, var(--card-solid) 94%, transparent);
        box-shadow: var(--shadow-soft);
      }

      .point-ocr-preview-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 11px;
      }

      .point-ocr-preview-head strong {
        font-size: .92rem;
      }

      .point-ocr-preview-scroll {
        max-height: calc(100dvh - 185px);
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 13px;
        background: #fff;
        overscroll-behavior: contain;
      }

      .point-ocr-ux #pointOcrPreview {
        display: block;
        width: 100%;
        max-width: 100%;
        height: auto;
        max-height: calc(100dvh - 190px);
        object-fit: contain;
        background: #fff;
      }

      .point-ocr-preview-card.is-zoomed #pointOcrPreview {
        width: auto;
        max-width: none;
        max-height: none;
      }

      .point-ocr-preview-hint {
        margin: 9px 2px 0;
        color: var(--muted);
        font-size: .75rem;
        line-height: 1.4;
      }

      .point-ocr-review-pane {
        min-width: 0;
      }

      .point-ocr-month-field {
        display: block;
        margin-bottom: 14px;
      }

      .point-ocr-ux .point-ocr-review-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 2px;
      }

      .point-ocr-ux .point-ocr-review-head h3 {
        margin: 0;
        font-size: 1.12rem;
      }

      .point-ocr-ux #pointOcrSelect {
        display: none !important;
      }

      .point-ocr-summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin: 14px 0;
        padding: 15px 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: color-mix(in srgb, var(--card-solid) 88%, var(--blue2));
      }

      .point-ocr-summary-copy {
        display: grid;
        gap: 3px;
      }

      .point-ocr-summary-copy strong {
        font-size: 1rem;
      }

      .point-ocr-summary-copy span {
        color: var(--muted);
        font-size: .8rem;
      }

      .point-ocr-summary-chips {
        display: flex;
        justify-content: flex-end;
        gap: 7px;
        flex-wrap: wrap;
      }

      .point-ocr-summary-chip,
      .point-ocr-pill {
        padding: 6px 9px;
        border-radius: 999px;
        background: var(--bg-soft);
        color: var(--muted);
        font-size: .73rem;
        font-weight: 800;
        white-space: nowrap;
      }

      .point-ocr-summary-chip.ready,
      .point-ocr-pill.ready {
        background: var(--green2);
        color: var(--green);
      }

      .point-ocr-summary-chip.warning,
      .point-ocr-pill.warning {
        background: color-mix(in srgb, #ff9f0a 15%, var(--card-solid));
        color: color-mix(in srgb, #b86b00 84%, var(--text));
      }

      .point-ocr-summary-chip.error,
      .point-ocr-pill.error {
        background: var(--red2);
        color: var(--red);
      }

      #pointOcrRows {
        display: grid;
        gap: 10px;
      }

      .point-ocr-row {
        display: grid;
        gap: 12px;
        padding: 15px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: color-mix(in srgb, var(--card-solid) 92%, transparent);
        box-shadow: 0 1px 2px rgba(0, 0, 0, .025);
      }

      .point-ocr-row[data-state="ready"] {
        border-color: color-mix(in srgb, var(--green) 28%, var(--line));
      }

      .point-ocr-row[data-state="warning"] {
        border-color: color-mix(in srgb, #ff9f0a 45%, var(--line));
        background: color-mix(in srgb, #ff9f0a 4%, var(--card-solid));
      }

      .point-ocr-row[data-state="error"] {
        border-color: color-mix(in srgb, var(--red) 42%, var(--line));
        background: color-mix(in srgb, var(--red2) 44%, var(--card-solid));
      }

      .point-ocr-row[data-state="existing"],
      .point-ocr-row[data-state="ignored"] {
        opacity: .82;
        background: color-mix(in srgb, var(--bg-soft) 52%, var(--card-solid));
      }

      .point-ocr-row-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .point-ocr-row-title {
        display: grid;
        gap: 2px;
      }

      .point-ocr-row-title strong {
        font-size: .96rem;
      }

      .point-ocr-row-title small {
        color: var(--muted);
        font-size: .76rem;
        font-weight: 500;
      }

      .point-ocr-fields {
        display: grid;
        grid-template-columns: minmax(135px, 1.25fr) minmax(115px, .9fr) repeat(4, minmax(94px, 1fr));
        gap: 9px;
        align-items: end;
      }

      .point-ocr-row:not(.is-work) .point-ocr-fields {
        grid-template-columns: minmax(150px, 220px) minmax(140px, 210px);
      }

      .point-ocr-fields label {
        min-width: 0;
        color: var(--muted);
        font-size: .72rem;
        font-weight: 760;
      }

      .point-ocr-fields input,
      .point-ocr-fields select {
        width: 100%;
        min-height: 42px;
        margin-top: 5px;
        padding: 8px 10px;
        border: 1px solid var(--line);
        border-radius: 12px;
        outline: none;
        background: var(--input);
        color: var(--text);
        font: inherit;
      }

      .point-ocr-fields input:focus,
      .point-ocr-fields select:focus {
        border-color: color-mix(in srgb, var(--blue) 65%, transparent);
        background: var(--card-solid);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--blue) 14%, transparent);
      }

      .point-ocr-row-options {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .point-ocr-no-lunch {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--muted);
        font-size: .78rem;
        font-weight: 650;
        cursor: pointer;
      }

      .point-ocr-no-lunch input {
        width: 17px;
        min-height: 17px;
        height: 17px;
        margin: 0;
        padding: 0;
      }

      .point-ocr-row-action {
        min-width: 156px;
      }

      .point-ocr-row-action:disabled {
        cursor: default;
        opacity: .62;
        box-shadow: none;
      }

      .point-ocr-source-details {
        padding: 9px 11px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: color-mix(in srgb, var(--card-solid) 88%, transparent);
      }

      .point-ocr-source-details summary {
        cursor: pointer;
        color: var(--muted);
        font-size: .78rem;
        font-weight: 700;
      }

      .point-ocr-source {
        margin: 8px 0 0;
        padding: 9px 10px;
        border-radius: 11px;
        background: var(--bg-soft);
        color: var(--muted);
        font-size: .74rem;
        line-height: 1.4;
      }

      .point-ocr-notice {
        margin: 0;
        font-size: .79rem;
        font-weight: 680;
      }

      .point-ocr-notice.ready {
        color: var(--green);
      }

      .point-ocr-notice.warning {
        color: color-mix(in srgb, #b86b00 84%, var(--text));
      }

      .point-ocr-notice.error {
        color: var(--red);
      }

      .point-ocr-notice.muted {
        color: var(--muted);
      }

      .point-ocr-footer {
        position: sticky;
        bottom: -24px;
        z-index: 4;
        display: flex;
        justify-content: flex-end;
        margin: 0 -4px -4px;
        padding: 16px 4px 4px;
        background: linear-gradient(to bottom, transparent, var(--card-solid) 34%);
      }

      .point-ocr-footer #pointOcrSave {
        min-width: 285px;
      }

      @media (max-width: 1120px) {
        .point-ocr-workspace {
          grid-template-columns: minmax(330px, .82fr) minmax(0, 1.18fr);
        }

        .point-ocr-fields {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 880px) {
        .point-ocr-workspace {
          grid-template-columns: 1fr;
        }

        .point-ocr-preview-pane {
          position: relative;
          top: auto;
        }

        .point-ocr-preview-scroll,
        .point-ocr-ux #pointOcrPreview {
          max-height: 430px;
        }
      }

      @media (max-width: 620px) {
        .point-ocr-dialog.point-ocr-ux {
          width: calc(100% - 12px);
          max-height: calc(100dvh - 12px);
          border-radius: 20px;
        }

        .point-ocr-dialog.point-ocr-ux .dialog-body {
          max-height: calc(100dvh - 12px);
          padding: 17px;
        }

        .point-ocr-summary,
        .point-ocr-row-head,
        .point-ocr-row-options {
          align-items: flex-start;
          flex-direction: column;
        }

        .point-ocr-summary-chips {
          justify-content: flex-start;
        }

        .point-ocr-fields,
        .point-ocr-row:not(.is-work) .point-ocr-fields {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .point-ocr-row-action,
        .point-ocr-footer #pointOcrSave {
          width: 100%;
          min-width: 0;
        }

        .point-ocr-footer {
          bottom: -17px;
        }
      }

      @media (max-width: 420px) {
        .point-ocr-fields,
        .point-ocr-row:not(.is-work) .point-ocr-fields {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function mount(bridge) {
    const $ = id => document.getElementById(id);
    const dialog = $('pointOcrDialog');
    const card = $('pointOcrCard');
    const list = $('pointOcrRows');
    const status = $('pointOcrStatus');
    const review = $('pointOcrReview');
    const saveButton = $('pointOcrSave');
    const selectButton = $('pointOcrSelect');
    const fileInput = $('pointOcrFile');
    const monthInput = $('pointOcrMonth');
    const closeButton = $('pointOcrClose');
    const previewImage = $('pointOcrPreview');
    const previewCard = previewImage.closest('details');
    const monthField = monthInput.closest('label');
    const footer = saveButton.closest('.point-ocr-footer');

    let rows = [];
    let owner = null;
    let epoch = 0;
    let worker = null;
    let busy = false;
    let previewUrl = null;
    let scriptPromise = null;

    injectStyles();
    dialog.classList.add('point-ocr-ux');
    fileInput.closest('label')?.classList.add('point-ocr-upload-field');
    selectButton.classList.add('hidden');
    selectButton.hidden = true;

    const intro = dialog.querySelector('.point-ocr-heading + .muted');
    if (intro) {
      intro.textContent =
        'Envie o print, confira os horários com a imagem fixa ao lado e adicione cada dia separadamente — ou todos de uma vez.';
    }

    const reviewTitle = review.querySelector('h3');
    if (reviewTitle) reviewTitle.textContent = 'Horários reconhecidos';

    const reviewHint = review.querySelector('.hint');
    if (reviewHint) {
      reviewHint.textContent =
        'Cada linha tem seu próprio botão. Fins de semana vazios e datas que já existem no histórico são ignorados automaticamente.';
    }

    const summary = document.createElement('section');
    summary.id = 'pointOcrSummary';
    summary.className = 'point-ocr-summary';
    list.before(summary);

    const workspace = document.createElement('div');
    workspace.id = 'pointOcrWorkspace';
    workspace.className = 'point-ocr-workspace hidden';

    const previewPane = document.createElement('aside');
    previewPane.className = 'point-ocr-preview-pane';
    const reviewPane = document.createElement('section');
    reviewPane.className = 'point-ocr-review-pane';

    previewCard.parentNode.insertBefore(workspace, previewCard);
    workspace.append(previewPane, reviewPane);
    previewPane.appendChild(previewCard);
    reviewPane.append(monthField, review, footer);
    footer.classList.add('hidden');

    previewCard.className = 'point-ocr-preview-card';
    previewCard.open = true;
    const oldSummary = previewCard.querySelector('summary');
    const previewHead = document.createElement('div');
    previewHead.className = 'point-ocr-preview-head';
    const previewTitle = document.createElement('strong');
    previewTitle.textContent = 'Print enviado';
    const zoomButton = document.createElement('button');
    zoomButton.className = 'btn secondary small';
    zoomButton.type = 'button';
    zoomButton.textContent = 'Ampliar';
    previewHead.append(previewTitle, zoomButton);
    oldSummary?.replaceWith(previewHead);

    const previewScroll = document.createElement('div');
    previewScroll.className = 'point-ocr-preview-scroll';
    previewImage.before(previewScroll);
    previewScroll.appendChild(previewImage);

    const previewHint = document.createElement('p');
    previewHint.className = 'point-ocr-preview-hint';
    previewHint.textContent =
      'O print permanece fixo enquanto você percorre os dias. Use “Ampliar” para conferir os detalhes no tamanho original.';
    previewCard.appendChild(previewHint);
    monthField.classList.add('point-ocr-month-field');

    zoomButton.addEventListener('click', () => {
      const zoomed = previewCard.classList.toggle('is-zoomed');
      zoomButton.textContent = zoomed ? 'Ajustar' : 'Ampliar';

      if (!zoomed) {
        previewScroll.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    });

    const say = (text, error = false) => {
      status.textContent = text;
      status.className = `status${error ? ' error' : ''}`;
    };

    const eligible = id => Boolean(id) && (RELEASE_TO_ALL || id === BETA_USER);
    const allowed = () => eligible(bridge.userId());

    async function authorize() {
      const id = bridge.userId();

      if (!eligible(id)) {
        throw new Error('Esta função está em teste restrito.');
      }

      const user = await bridge.verifyUser();

      if (user?.id !== id || bridge.userId() !== id) {
        throw new Error('Sua sessão mudou. Entre novamente.');
      }

      return id;
    }

    function formatRowDate(row) {
      const match = /^(20\d{2})-(\d{2})-(\d{2})$/.exec(row.date || '');

      if (!match) {
        return row.day ? `Dia ${Number(row.day)}` : 'Dia não identificado';
      }

      const date = new Date(+match[1], +match[2] - 1, +match[3]);
      const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
        .format(date)
        .replace('.', '');

      return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${match[3]}/${match[2]}`;
    }

    function buildStates() {
      const existing = new Set(bridge.history().map(record => record.date));
      const seen = new Set();

      return rows.map(row => {
        if (row.kind === 'skip') {
          return {
            mode: 'ignored',
            tone: 'muted',
            label: 'Ignorado',
            message: 'Fim de semana sem marcações; nada será criado no calendário.'
          };
        }

        const problem = validate(row, bridge.today(), existing, seen);

        if (problem) {
          if (problem.startsWith('Já existe no histórico')) {
            return {
              mode: 'existing',
              tone: 'muted',
              label: 'Já adicionado',
              message: problem
            };
          }

          return {
            mode: 'error',
            tone: 'error',
            label: 'Ajuste necessário',
            message: problem
          };
        }

        seen.add(row.date);
        const warning = warnings(row);

        return {
          mode: 'ready',
          tone: warning ? 'warning' : 'ready',
          label: warning ? 'Vale conferir' : 'Pronto',
          message: warning || 'Pronto para adicionar ao calendário.'
        };
      });
    }

    function stateCounts(states) {
      return states.reduce((counts, state) => {
        if (state.mode === 'ready') counts.ready += 1;
        if (state.mode === 'error') counts.error += 1;
        if (state.mode === 'existing') counts.existing += 1;
        if (state.mode === 'ignored') counts.ignored += 1;
        if (state.tone === 'warning') counts.warning += 1;
        return counts;
      }, { ready: 0, error: 0, existing: 0, ignored: 0, warning: 0 });
    }

    function renderSummary(states) {
      const counts = stateCounts(states);
      const readyLabel = counts.ready === 1
        ? '1 dia disponível para adicionar'
        : `${counts.ready} dias disponíveis para adicionar`;
      const details = [];

      if (counts.warning) {
        details.push(
          `${counts.warning} ${counts.warning === 1 ? 'linha merece' : 'linhas merecem'} conferência`
        );
      }

      if (counts.error) {
        details.push(
          `${counts.error} ${counts.error === 1 ? 'ajuste pendente' : 'ajustes pendentes'}`
        );
      }

      if (counts.existing) {
        details.push(
          `${counts.existing} já ${counts.existing === 1 ? 'está' : 'estão'} no calendário`
        );
      }

      if (counts.ignored) {
        details.push(
          `${counts.ignored} ${counts.ignored === 1 ? 'linha ignorada' : 'linhas ignoradas'}`
        );
      }

      summary.replaceChildren();

      const copy = document.createElement('div');
      copy.className = 'point-ocr-summary-copy';
      const title = document.createElement('strong');
      title.textContent = readyLabel;
      const subtitle = document.createElement('span');
      subtitle.textContent = details.length
        ? details.join(' · ')
        : 'Tudo que apareceu no print já foi adicionado.';
      copy.append(title, subtitle);

      const chips = document.createElement('div');
      chips.className = 'point-ocr-summary-chips';

      const addChip = (text, tone) => {
        const chip = document.createElement('span');
        chip.className = `point-ocr-summary-chip ${tone}`;
        chip.textContent = text;
        chips.appendChild(chip);
      };

      if (counts.ready) addChip(`${counts.ready} para adicionar`, 'ready');
      if (counts.warning) addChip(`${counts.warning} conferir`, 'warning');
      if (counts.error) addChip(`${counts.error} corrigir`, 'error');
      if (counts.existing) addChip(`${counts.existing} adicionados`, '');

      summary.append(copy, chips);
      return counts;
    }

    function controls(states = buildStates()) {
      const counts = stateCounts(states);

      fileInput.disabled = busy;
      monthInput.disabled = busy;
      selectButton.disabled = true;
      saveButton.disabled = busy || counts.ready === 0;

      list.querySelectorAll('input, select').forEach(control => {
        control.disabled = busy;
      });

      list.querySelectorAll('.point-ocr-row-action').forEach(button => {
        button.disabled = busy || button.dataset.ready !== 'true';
      });

      if (busy) {
        saveButton.textContent = 'Salvando…';
      } else if (counts.ready === 1) {
        saveButton.textContent = 'Adicionar o dia pronto';
      } else if (counts.ready > 1) {
        saveButton.textContent = `Adicionar todos os ${counts.ready} dias prontos`;
      } else {
        saveButton.textContent = 'Todos os dias já foram tratados';
      }
    }

    async function saveRows(targetRows, successMessage) {
      if (busy || !targetRows.length) return false;

      const token = epoch;
      busy = true;
      controls();
      let finalMessage = '';
      let finalError = false;

      try {
        const id = await authorize();
        if (token !== epoch || owner !== id) return false;

        const existing = new Set(bridge.history().map(record => record.date));
        const seen = new Set();

        for (const row of targetRows) {
          const problem = validate(row, bridge.today(), existing, seen);

          if (problem) {
            throw new Error(`${row.date || 'Data não lida'}: ${problem}`);
          }

          seen.add(row.date);
        }

        await bridge.save(targetRows, id);
        if (token !== epoch) return false;

        finalMessage = successMessage;
        return true;
      } catch (error) {
        if (token === epoch) {
          finalMessage = error.message || 'Não foi possível adicionar ao calendário.';
          finalError = true;
        }
        return false;
      } finally {
        if (token === epoch) {
          busy = false;
          render();

          if (finalMessage) {
            say(finalMessage, finalError);
          }
        }
      }
    }

    function render() {
      list.replaceChildren();
      const states = buildStates();
      const counts = renderSummary(states);

      rows.forEach((row, index) => {
        const state = states[index];
        const section = document.createElement('article');
        section.className = `point-ocr-row${row.kind === 'work' ? ' is-work' : ''}`;
        section.dataset.state = state.tone === 'warning' ? 'warning' : state.mode;

        const head = document.createElement('div');
        head.className = 'point-ocr-row-head';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'point-ocr-row-title';
        const title = document.createElement('strong');
        title.textContent = formatRowDate(row);
        const subtitle = document.createElement('small');
        subtitle.textContent = row.label?.trim() || (
          row.kind === 'work' ? 'Dia trabalhado' : 'Linha reconhecida no print'
        );
        titleWrap.append(title, subtitle);

        const pill = document.createElement('span');
        pill.className = `point-ocr-pill ${state.tone}`;
        pill.textContent = state.label;
        head.append(titleWrap, pill);
        section.appendChild(head);

        const fields = document.createElement('div');
        fields.className = 'point-ocr-fields';

        const addInput = (field, label, type) => {
          const wrap = document.createElement('label');
          wrap.textContent = label;
          const input = document.createElement('input');
          input.type = type;
          input.value = row[field] || '';
          input.setAttribute('aria-label', `${label} da linha ${index + 1}`);

          if (type === 'date') input.max = bridge.today();

          input.addEventListener('change', () => {
            row[field] = input.value;

            if (field === 'date') {
              row.day = input.value.slice(8, 10);
            }

            row.uncertain = false;
            render();
          });

          wrap.appendChild(input);
          fields.appendChild(wrap);
        };

        addInput('date', 'Data', 'date');

        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Tipo';
        const typeSelect = document.createElement('select');
        typeSelect.setAttribute('aria-label', `Tipo da linha ${index + 1}`);

        [
          ['work', 'Trabalhado'],
          ['holiday', 'Feriado'],
          ['absence', 'Ausência'],
          ['skip', 'Ignorar']
        ].forEach(([value, label]) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          typeSelect.appendChild(option);
        });

        typeSelect.value = row.kind;
        typeSelect.addEventListener('change', () => {
          row.kind = typeSelect.value;
          row.noLunch = row.kind === 'work' ? row.noLunch : false;
          row.uncertain = false;
          render();
        });
        typeLabel.appendChild(typeSelect);
        fields.appendChild(typeLabel);

        if (row.kind === 'work') {
          addInput('entry', 'Entrada', 'time');

          if (!row.noLunch) {
            addInput('lunchOut', 'Saída almoço', 'time');
            addInput('lunchBack', 'Retorno', 'time');
          }

          addInput('realExit', 'Saída', 'time');
        }

        section.appendChild(fields);

        const notice = document.createElement('p');
        notice.className = `point-ocr-notice ${state.tone}`;
        notice.textContent = state.message;
        section.appendChild(notice);

        const options = document.createElement('div');
        options.className = 'point-ocr-row-options';

        if (row.kind === 'work') {
          const noLunchLabel = document.createElement('label');
          noLunchLabel.className = 'point-ocr-no-lunch';
          const noLunch = document.createElement('input');
          noLunch.type = 'checkbox';
          noLunch.checked = row.noLunch;
          noLunch.addEventListener('change', () => {
            row.noLunch = noLunch.checked;
            row.uncertain = false;
            render();
          });
          noLunchLabel.append(noLunch, document.createTextNode('Dia sem intervalo'));
          options.appendChild(noLunchLabel);
        } else {
          const spacer = document.createElement('span');
          spacer.setAttribute('aria-hidden', 'true');
          options.appendChild(spacer);
        }

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = `btn ${state.mode === 'ready' ? 'primary' : 'secondary'} small point-ocr-row-action`;
        addButton.dataset.ready = String(state.mode === 'ready');

        if (state.mode === 'ready') {
          addButton.textContent = 'Adicionar este dia';
          addButton.addEventListener('click', () => saveRows(
            [row],
            `${formatRowDate(row)} foi adicionado ao calendário.`
          ));
        } else if (state.mode === 'existing') {
          addButton.textContent = 'Já adicionado';
        } else if (state.mode === 'ignored') {
          addButton.textContent = 'Não será adicionado';
        } else {
          addButton.textContent = 'Corrija para adicionar';
        }

        addButton.disabled = busy || state.mode !== 'ready';
        options.appendChild(addButton);
        section.appendChild(options);

        const sourceDetails = document.createElement('details');
        sourceDetails.className = 'point-ocr-source-details';
        const sourceSummary = document.createElement('summary');
        sourceSummary.textContent = 'Ver texto lido nesta linha';
        const source = document.createElement('p');
        source.className = 'point-ocr-source';
        source.textContent = row.source || 'Nenhum texto bruto disponível.';
        sourceDetails.append(sourceSummary, source);
        section.appendChild(sourceDetails);

        list.appendChild(section);
      });

      workspace.classList.toggle('hidden', !previewUrl);
      review.hidden = rows.length === 0;
      footer.classList.toggle('hidden', rows.length === 0);
      controls(states);

      if (!busy && rows.length) {
        if (counts.ready) {
          const extra = counts.error
            ? ` ${counts.error} ${counts.error === 1 ? 'linha ainda precisa' : 'linhas ainda precisam'} de ajuste.`
            : '';
          say(
            `${counts.ready} ${counts.ready === 1 ? 'dia está pronto' : 'dias estão prontos'} para adicionar.${extra}`
          );
        } else if (counts.error) {
          say(
            `${counts.error} ${counts.error === 1 ? 'linha precisa' : 'linhas precisam'} de ajuste antes de adicionar.`
          );
        } else {
          say('Todos os dias válidos deste print já estão no calendário.');
        }
      }
    }

    function reset() {
      epoch += 1;
      owner = null;
      rows = [];
      list.replaceChildren();
      summary.replaceChildren();

      if (worker) {
        worker.terminate();
        worker = null;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      previewImage.removeAttribute('src');
      previewImage.hidden = true;
      previewCard.classList.remove('is-zoomed');
      zoomButton.textContent = 'Ampliar';
      fileInput.value = '';
      monthInput.value = '';
      workspace.classList.add('hidden');
      review.hidden = true;
      footer.classList.add('hidden');
      busy = false;
      say('');
      controls([]);

      if (dialog.open) dialog.close();
    }

    async function refresh() {
      reset();
      card.classList.add('hidden');

      if (!allowed()) return;

      const token = epoch;

      try {
        await authorize();

        if (token === epoch) {
          card.classList.remove('hidden');
        }
      } catch {
        // Fail closed during the private beta.
      }
    }

    function loadLibrary() {
      if (root.Tesseract) return Promise.resolve();
      if (scriptPromise) return scriptPromise;

      scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/tesseract.js@7.0.0/dist/tesseract.min.js';
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          scriptPromise = null;
          reject(new Error(
            'Não foi possível carregar o leitor. Confira a conexão e tente novamente.'
          ));
        };
        document.head.appendChild(script);
      });

      return scriptPromise;
    }

    function canvasFor(image, rect, enhance = false) {
      const region = rect || {
        left: 0,
        top: 0,
        width: image.width,
        height: image.height
      };
      const small = document.createElement('canvas');
      small.width = Math.ceil(region.width);
      small.height = Math.ceil(region.height);
      const context = small.getContext('2d', { willReadFrequently: true });
      context.fillStyle = '#fff';
      context.fillRect(0, 0, small.width, small.height);
      context.drawImage(
        image,
        region.left,
        region.top,
        region.width,
        region.height,
        0,
        0,
        small.width,
        small.height
      );

      if (enhance) {
        const pixels = context.getImageData(0, 0, small.width, small.height);
        const pixelData = pixels.data;
        const visited = new Uint8Array(small.width * small.height);
        const blue = index =>
          pixelData[index * 4] < 100 &&
          pixelData[index * 4 + 2] > 130 &&
          pixelData[index * 4 + 2] - pixelData[index * 4] > 60;

        for (let start = 0; start < visited.length; start += 1) {
          if (visited[start] || !blue(start)) continue;

          const stack = [start];
          visited[start] = 1;
          let x0 = small.width;
          let x1 = 0;
          let y0 = small.height;
          let y1 = 0;
          let count = 0;

          while (stack.length) {
            const index = stack.pop();
            const x = index % small.width;
            const y = Math.floor(index / small.width);
            count += 1;
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);

            const near = [];
            if (x > 0) near.push(index - 1);
            if (x + 1 < small.width) near.push(index + 1);
            if (y > 0) near.push(index - small.width);
            if (y + 1 < small.height) near.push(index + small.width);

            for (const neighbour of near) {
              if (!visited[neighbour] && blue(neighbour)) {
                visited[neighbour] = 1;
                stack.push(neighbour);
              }
            }
          }

          if (count > 100 && x1 - x0 > 30 && y1 - y0 > 6) {
            for (let y = y0; y <= y1; y += 1) {
              for (let x = x0; x <= x1; x += 1) {
                const index = (y * small.width + x) * 4;
                const value = 255 - pixelData[index];
                pixelData[index] = value;
                pixelData[index + 1] = value;
                pixelData[index + 2] = value;
              }
            }
          }
        }

        for (let index = 0; index < pixelData.length; index += 4) {
          const value = Math.min(
            pixelData[index],
            pixelData[index + 1],
            pixelData[index + 2]
          );
          const gray = value < 210 ? Math.round(value * 0.65) : 255;
          pixelData[index] = gray;
          pixelData[index + 1] = gray;
          pixelData[index + 2] = gray;
        }

        context.putImageData(pixels, 0, 0);
      }

      const scale = Math.min(
        enhance ? 3 : 2,
        4096 / small.width,
        4096 / small.height
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(small.width * scale);
      canvas.height = Math.round(small.height * scale);
      const output = canvas.getContext('2d');
      output.imageSmoothingQuality = 'high';
      output.drawImage(small, 0, 0, canvas.width, canvas.height);

      return { canvas, scale };
    }

    async function read(file) {
      if (busy) return;

      const token = ++epoch;
      busy = true;
      rows = [];
      list.replaceChildren();
      summary.replaceChildren();
      review.hidden = true;
      footer.classList.add('hidden');
      workspace.classList.add('hidden');
      controls([]);

      let localWorker = null;
      let image = null;
      let timer = null;

      try {
        owner = await authorize();
        if (token !== epoch) return;

        if (
          !file ||
          !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
          !file.size ||
          file.size > 12 * 1024 * 1024
        ) {
          throw new Error('Use uma imagem PNG, JPEG ou WebP de até 12 MB.');
        }

        say('Preparando o print…');
        image = await createImageBitmap(file);
        if (token !== epoch) return;

        if (
          image.width * image.height > 20000000 ||
          image.width < 200 ||
          image.height < 150
        ) {
          throw new Error('Use um print legível de até 20 megapixels.');
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(file);
        previewImage.src = previewUrl;
        previewImage.hidden = false;
        workspace.classList.remove('hidden');

        await loadLibrary();
        if (token !== epoch) return;

        say('Carregando o leitor local. A primeira leitura pode demorar um pouco…');

        const timeout = new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(
            'A leitura demorou demais. Recorte o print mantendo o período e o cabeçalho e tente novamente.'
          )), 120000);
        });

        const operation = (async () => {
          localWorker = await root.Tesseract.createWorker('por', 1, {
            workerPath: 'https://unpkg.com/tesseract.js@7.0.0/dist/worker.min.js',
            corePath: 'https://unpkg.com/tesseract.js-core@7.0.0',
            langPath: 'https://unpkg.com/@tesseract.js-data/por@1.0.0/4.0.0',
            logger: message => {
              if (token === epoch && message.status === 'recognizing text') {
                say(`Lendo o print… ${Math.round(message.progress * 100)}%`);
              }
            }
          });

          if (token !== epoch) {
            await localWorker.terminate();
            return;
          }

          worker = localWorker;
          const first = canvasFor(image);
          await localWorker.setParameters({ tessedit_pageseg_mode: '11' });
          const initial = (
            await localWorker.recognize(first.canvas, {}, { text: true, blocks: true })
          ).data;

          if (token !== epoch) return;

          const month = period(initial.text);
          monthInput.value = month;
          const hd = headers(initial);

          if (!hd) {
            throw new Error(
              'Não reconheci o cabeçalho da tabela. Envie um print com Dia, Ent/Saída, Justificativa e H.Real visíveis.'
            );
          }

          const left = Math.max(0, (hd.dia.bbox.x0 - hd.h * 3) / first.scale);
          const top = Math.max(0, (hd.dia.bbox.y0 - hd.h) / first.scale);
          const right = Math.min(
            image.width,
            (hd.saldo.bbox.x1 + hd.h * 5) / first.scale
          );
          const totals = words(initial).find(word =>
            normal(word.text) === 'total' && word.bbox.y0 > hd.dia.bbox.y1
          );
          const bottom = totals ? totals.bbox.y0 / first.scale : image.height;
          const table = canvasFor(
            image,
            { left, top, width: right - left, height: bottom - top },
            true
          );

          await localWorker.setParameters({ tessedit_pageseg_mode: '6' });
          const data = (
            await localWorker.recognize(table.canvas, {}, { text: true, blocks: true })
          ).data;

          if (token !== epoch) return;

          const parsed = parse(data, month);

          if (!parsed.length) {
            throw new Error('Nenhuma linha foi reconhecida. Tente um print mais nítido.');
          }

          await localWorker.setParameters({
            tessedit_pageseg_mode: '8',
            tessedit_char_whitelist: '0123456789'
          });

          for (const row of parsed.filter(item => !item.day || item.dayText !== item.day)) {
            if (token !== epoch) return;

            const cell = (
              await localWorker.recognize(
                table.canvas,
                { rectangle: row.bbox },
                { text: true }
              )
            ).data;
            const day = cell.text.trim();

            if (/^\d{1,2}$/.test(day) && +day > 0 && +day <= 31) {
              row.day = String(+day).padStart(2, '0');
              row.date = month ? `${month}-${row.day}` : '';
            }

            row.uncertain = true;
          }

          if (token !== epoch || bridge.userId() !== owner) return;

          rows = parsed;
          render();
        })();

        await Promise.race([operation, timeout]);
      } catch (error) {
        if (token === epoch) {
          rows = [];
          say(
            error.message || 'Não foi possível ler a imagem. Tente outro print.',
            true
          );
        }
      } finally {
        clearTimeout(timer);

        if (localWorker) {
          await localWorker.terminate().catch(() => {});
        }

        image?.close();

        if (token === epoch) {
          worker = null;
          busy = false;
          render();
        }
      }
    }

    $('pointOcrOpen').addEventListener('click', async () => {
      try {
        await authorize();
        if (!allowed()) return;
        owner = bridge.userId();
        say(
          'Envie o print completo, incluindo o período e o cabeçalho. Também dá para colar uma imagem aqui com Ctrl+V.'
        );
        dialog.showModal();
        fileInput.focus();
      } catch (error) {
        bridge.notify(error.message);
      }
    });

    closeButton.addEventListener('click', reset);
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      reset();
    });

    fileInput.addEventListener('change', event => read(event.target.files[0]));

    dialog.addEventListener('paste', event => {
      const item = [...(event.clipboardData?.items || [])]
        .find(candidate => candidate.type.startsWith('image/'));

      if (item) {
        event.preventDefault();
        read(item.getAsFile());
      }
    });

    monthInput.addEventListener('change', event => {
      const month = event.target.value;

      rows.forEach(row => {
        row.date = row.day && month ? `${month}-${row.day}` : '';
      });

      render();
    });

    saveButton.addEventListener('click', () => {
      const states = buildStates();
      const readyRows = rows.filter((row, index) => states[index].mode === 'ready');

      if (!readyRows.length) {
        say('Não há nenhum dia novo pronto para adicionar.', true);
        return;
      }

      saveRows(
        readyRows,
        `${readyRows.length} ${readyRows.length === 1 ? 'dia foi adicionado' : 'dias foram adicionados'} ao calendário.`
      );
    });

    return { refresh, reset };
  }

  root.PointOCR = {
    mount,
    parse,
    period,
    headers,
    validate,
    warnings,
    BETA_USER
  };

  if (typeof module !== 'undefined') {
    module.exports = root.PointOCR;
  }
})(typeof window !== 'undefined' ? window : globalThis);
