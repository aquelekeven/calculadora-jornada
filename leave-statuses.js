/* Férias, folgas e menu compacto de justificativas do calendário. */
(function (root) {
  'use strict';

  const ADDON_VERSION = '2.14.0';
  const STATUS_KINDS = new Set(['vacation', 'dayoff']);
  const OCR_KIND_OVERRIDES = new Map();
  let selectedDate = '';
  let bootAttempts = 0;

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function ready() {
    return (
      typeof DAY_STATUS !== 'undefined' &&
      typeof renderHistory === 'function' &&
      typeof calendarMissingCell === 'function' &&
      typeof sanitizeImportedRecord === 'function'
    );
  }

  function injectStyles() {
    if (document.getElementById('jfbLeaveStatusesStyles')) return;

    const style = document.createElement('style');
    style.id = 'jfbLeaveStatusesStyles';
    style.textContent = `
      .calendar-missing-actions.compact-reason-action {
        display: block;
      }

      .day-status-trigger {
        width: 100%;
        min-height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border: 1px solid color-mix(in srgb, var(--blue) 28%, var(--line));
        border-radius: 11px;
        padding: 7px 10px;
        background: color-mix(in srgb, var(--blue2) 70%, var(--card-solid));
        color: var(--blue);
        font-size: .76rem;
        font-weight: 780;
        cursor: pointer;
      }

      .day-status-trigger:hover {
        border-color: color-mix(in srgb, var(--blue) 48%, var(--line));
        background: var(--blue2);
      }

      .day-status-trigger svg {
        width: 15px;
        height: 15px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .day-status-dialog {
        width: min(540px, calc(100% - 24px));
        max-width: none;
        border: 0;
        border-radius: 24px;
        padding: 0;
        background: var(--card-solid);
        color: var(--text);
        box-shadow: 0 28px 90px rgba(0, 0, 0, .34);
      }

      .day-status-dialog::backdrop {
        background: var(--overlay);
        backdrop-filter: blur(5px);
      }

      .day-status-dialog-body {
        display: grid;
        gap: 17px;
        padding: 24px;
      }

      .day-status-dialog-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .day-status-dialog-head h2,
      .day-status-dialog-head p {
        margin: 0;
      }

      .day-status-dialog-head h2 {
        margin-top: 3px;
        font-size: 1.25rem;
        letter-spacing: -.025em;
      }

      .day-status-dialog-close {
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--card-solid);
        color: var(--muted);
        font-size: 1.25rem;
        cursor: pointer;
      }

      .day-status-options {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .day-status-choice {
        min-height: 92px;
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        border: 1px solid var(--line);
        border-radius: 17px;
        padding: 13px;
        background: color-mix(in srgb, var(--card-solid) 92%, var(--bg-soft));
        color: var(--text);
        text-align: left;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(0, 0, 0, .025);
      }

      .day-status-choice:hover {
        transform: translateY(-1px);
        border-color: color-mix(in srgb, var(--choice-color, var(--blue)) 42%, var(--line));
        background: color-mix(in srgb, var(--choice-color, var(--blue)) 7%, var(--card-solid));
      }

      .day-status-choice-icon {
        width: 42px;
        height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 13px;
        background: color-mix(in srgb, var(--choice-color, var(--blue)) 14%, var(--card-solid));
        color: var(--choice-color, var(--blue));
        font-size: 1.15rem;
        font-weight: 850;
      }

      .day-status-choice-copy {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .day-status-choice-copy strong {
        font-size: .92rem;
      }

      .day-status-choice-copy small {
        color: var(--muted);
        font-size: .74rem;
        line-height: 1.35;
        font-weight: 500;
      }

      .day-status-choice.vacation { --choice-color: #0796a5; }
      .day-status-choice.dayoff { --choice-color: #8060c9; }
      .day-status-choice.holiday { --choice-color: #c78a16; }
      .day-status-choice.medical { --choice-color: #3d8ad9; }
      .day-status-choice.absence {
        --choice-color: var(--red);
        grid-column: 1 / -1;
        min-height: 76px;
      }

      .day-status-dialog-note {
        margin: 0;
        padding: 11px 12px;
        border-radius: 13px;
        background: var(--bg-soft);
        color: var(--muted);
        font-size: .76rem;
        line-height: 1.45;
      }

      .history-calendar-day.status.vacation {
        border-color: color-mix(in srgb, #0796a5 30%, var(--line));
        background: color-mix(in srgb, #0796a5 6%, var(--card-solid));
      }

      .history-calendar-day.status.dayoff {
        border-color: color-mix(in srgb, #8060c9 30%, var(--line));
        background: color-mix(in srgb, #8060c9 6%, var(--card-solid));
      }

      .calendar-status-badge.vacation {
        background: color-mix(in srgb, #0796a5 14%, var(--card-solid));
        color: color-mix(in srgb, #0796a5 88%, var(--text));
      }

      .calendar-status-badge.dayoff {
        background: color-mix(in srgb, #8060c9 14%, var(--card-solid));
        color: color-mix(in srgb, #8060c9 88%, var(--text));
      }

      .legend-dot.vacation { background: #0796a5; }
      .legend-dot.dayoff { background: #8060c9; }

      @media (max-width: 520px) {
        .day-status-dialog-body {
          padding: 18px;
        }

        .day-status-options {
          grid-template-columns: 1fr;
        }

        .day-status-choice.absence {
          grid-column: auto;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function dialogMarkup() {
    return `
      <div class="day-status-dialog-body">
        <header class="day-status-dialog-head">
          <div>
            <p class="eyebrow">Classificar dia</p>
            <h2 id="dayStatusDialogTitle">O que aconteceu neste dia?</h2>
          </div>
          <button class="day-status-dialog-close" type="button" aria-label="Fechar">×</button>
        </header>

        <div class="day-status-options">
          <button class="day-status-choice vacation" data-status-kind="vacation" type="button">
            <span class="day-status-choice-icon" aria-hidden="true">☀</span>
            <span class="day-status-choice-copy">
              <strong>Férias</strong>
              <small>Dia de férias, sem gerar saldo positivo ou negativo.</small>
            </span>
          </button>

          <button class="day-status-choice dayoff" data-status-kind="dayoff" type="button">
            <span class="day-status-choice-icon" aria-hidden="true">◷</span>
            <span class="day-status-choice-copy">
              <strong>Folga</strong>
              <small>Folga, recesso ou compensação de banco de horas.</small>
            </span>
          </button>

          <button class="day-status-choice holiday" data-status-kind="holiday" type="button">
            <span class="day-status-choice-icon" aria-hidden="true">✦</span>
            <span class="day-status-choice-copy">
              <strong>Feriado</strong>
              <small>Feriado oficial, sem jornada esperada no dia.</small>
            </span>
          </button>

          <button class="day-status-choice medical" data-status-kind="medical" type="button">
            <span class="day-status-choice-icon" aria-hidden="true">+</span>
            <span class="day-status-choice-copy">
              <strong>Atestado</strong>
              <small>Ausência justificada por atestado, sem desconto de horas.</small>
            </span>
          </button>

          <button class="day-status-choice absence" data-status-kind="absence" type="button">
            <span class="day-status-choice-icon" aria-hidden="true">!</span>
            <span class="day-status-choice-copy">
              <strong>Falta</strong>
              <small>Ausência não abonada. O dia entra com saldo de −8 horas.</small>
            </span>
          </button>
        </div>

        <p class="day-status-dialog-note">
          Férias, folga, feriado e atestado classificam o dia com saldo zerado. Apenas “Falta” gera débito de 8 horas.
        </p>
      </div>
    `;
  }

  function ensureDialog() {
    let dialog = document.getElementById('dayStatusDialog');
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.id = 'dayStatusDialog';
    dialog.className = 'day-status-dialog';
    dialog.setAttribute('aria-labelledby', 'dayStatusDialogTitle');
    dialog.innerHTML = dialogMarkup();
    document.body.appendChild(dialog);

    const close = () => {
      selectedDate = '';
      if (dialog.open) dialog.close();
    };

    dialog.querySelector('.day-status-dialog-close')?.addEventListener('click', close);
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      close();
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) close();
    });

    dialog.querySelectorAll('[data-status-kind]').forEach(button => {
      button.addEventListener('click', () => {
        const date = selectedDate;
        const kind = button.dataset.statusKind;
        if (!date || !kind) return;

        if (kind === 'absence') {
          const confirmed = window.confirm(
            `Marcar ${dateBR(date)} como FALTA? Isso descontará 8 horas do saldo líquido.`
          );
          if (!confirmed) return;
        }

        if (dialog.open) dialog.close();
        selectedDate = '';
        applyStatus(date, kind);
      });
    });

    return dialog;
  }

  function openDialog(date) {
    if (!date || date > today()) return;

    selectedDate = date;
    const dialog = ensureDialog();
    const title = dialog.querySelector('#dayStatusDialogTitle');
    if (title) title.textContent = `O que aconteceu em ${dateBR(date)}?`;

    try {
      dialog.showModal();
    } catch (_error) {
      dialog.setAttribute('open', '');
    }
  }

  function applyStatus(date, kind) {
    const status = DAY_STATUS[kind];
    if (!status) return;

    const allAccounts = accounts();
    const user = allAccounts[currentUser];
    if (!user) return;

    const history = Array.isArray(user.history) ? user.history : [];
    const item = createStatusRecord(date, kind);
    if (!item) return;

    const existingIndex = history.findIndex(record => record.date === date);
    if (existingIndex >= 0) {
      const previous = history[existingIndex];
      item.note = typeof previous?.note === 'string'
        ? previous.note.slice(0, 500)
        : '';
      history[existingIndex] = item;
    } else {
      history.push(item);
    }

    user.history = history;
    allAccounts[currentUser] = user;
    saveAccounts(allAccounts);
    historyMonthKey = date.slice(0, 7);
    renderHistory();
    evaluateAchievements({ source: 'classificação do calendário' });
    renderAchievements();
    toast(`${status.label} registrado em ${dateBR(date)}.`);
  }

  function missingCell(item) {
    return `
      <article class="history-calendar-day missing">
        <header class="calendar-cell-head">
          <strong>${Number(item.date.slice(-2))}</strong>
          <span class="calendar-status-badge missing">Pendente</span>
        </header>

        <div class="calendar-cell-body">
          <span class="calendar-status-title">${item.label}</span>
          <small>Informe o motivo do dia sem registro.</small>
        </div>

        <footer class="calendar-missing-actions compact-reason-action">
          <button
            class="day-status-trigger"
            data-date="${item.date}"
            type="button"
          >
            <span>Definir motivo</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>
          </button>
        </footer>
      </article>
    `;
  }

  function enhanceHistoryUi() {
    const historyRoot = document.getElementById('historyList');
    if (!historyRoot) return;

    const legend = historyRoot.querySelector('.history-calendar-legend');
    if (legend && !legend.querySelector('.legend-dot.vacation')) {
      const vacation = document.createElement('span');
      vacation.innerHTML = '<i class="legend-dot vacation"></i> Férias';
      const dayoff = document.createElement('span');
      dayoff.innerHTML = '<i class="legend-dot dayoff"></i> Folga';
      const weekend = legend.querySelector('.legend-dot.weekend')?.closest('span');

      if (weekend) {
        weekend.before(vacation, dayoff);
      } else {
        legend.append(vacation, dayoff);
      }
    }

    const compensationHint = historyRoot.querySelector('.compensation-card > small');
    if (compensationHint) {
      compensationHint.textContent =
        'O automático considera os dias úteis futuros ainda não registrados. Férias, folgas, feriados, atestados e faltas já classificados deixam de ser considerados pendentes.';
    }
  }

  function sanitizeLeaveRecord(record, index, seenDates) {
    if (!isPlainObject(record)) {
      throw new Error(`O registro ${index + 1} não possui um formato válido.`);
    }

    const date = String(record.date || '');
    if (!validBackupDate(date)) {
      throw new Error(`O registro ${index + 1} possui uma data inválida ou futura.`);
    }
    if (seenDates.has(date)) {
      throw new Error(`O backup possui mais de um registro para ${dateBR(date)}.`);
    }
    seenDates.add(date);

    const kind = String(record.kind || '');
    const status = DAY_STATUS[kind];
    const note = sanitizeBackupText(record.note, 500);

    return {
      id: backupUuid(),
      date,
      kind,
      note,
      label: status?.label || 'Dia classificado',
      total: 0,
      balance: 0,
      savedAt: new Date().toISOString()
    };
  }

  function installOcrStatusOptions() {
    const container = document.getElementById('pointOcrRows');
    if (!container || container.dataset.leaveStatusObserver === 'true') return;

    container.dataset.leaveStatusObserver = 'true';

    const enhanceRows = () => {
      const rows = [...container.querySelectorAll('.point-ocr-row')];

      rows.forEach((row, index) => {
        const select = row.querySelector('.point-ocr-fields select');
        if (!select) return;

        [
          ['vacation', 'Férias'],
          ['dayoff', 'Folga']
        ].forEach(([value, label]) => {
          if (select.querySelector(`option[value="${value}"]`)) return;
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          select.appendChild(option);
        });

        const override = OCR_KIND_OVERRIDES.get(index);
        if (override) {
          select.value = override;
          return;
        }

        const text = normalizeText(row.textContent);
        let inferred = '';

        if (/\bferias\b/.test(text)) {
          inferred = 'vacation';
        } else if (/\b(folga|recesso|compensacao|descanso)\b/.test(text) || /banco\s+de\s+horas/.test(text)) {
          inferred = 'dayoff';
        }

        if (inferred && (select.value === 'work' || !select.value)) {
          OCR_KIND_OVERRIDES.set(index, inferred);
          select.value = inferred;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    };

    const observer = new MutationObserver(() => {
      window.queueMicrotask(enhanceRows);
    });
    observer.observe(container, { childList: true, subtree: true });

    document.addEventListener('change', event => {
      const select = event.target.closest?.('#pointOcrRows .point-ocr-fields select');
      if (!select) return;

      const row = select.closest('.point-ocr-row');
      const index = [...container.querySelectorAll('.point-ocr-row')].indexOf(row);
      if (index < 0) return;

      if (STATUS_KINDS.has(select.value)) {
        OCR_KIND_OVERRIDES.set(index, select.value);
      } else {
        OCR_KIND_OVERRIDES.delete(index);
      }
    }, true);

    document.getElementById('pointOcrFile')?.addEventListener('change', () => {
      OCR_KIND_OVERRIDES.clear();
    });

    document.getElementById('pointOcrClose')?.addEventListener('click', () => {
      OCR_KIND_OVERRIDES.clear();
    });

    enhanceRows();
  }

  function install() {
    if (root.__JFB_LEAVE_STATUSES_INSTALLED__) return;

    if (!ready()) {
      bootAttempts += 1;
      if (bootAttempts < 120) {
        window.setTimeout(install, 50);
      }
      return;
    }

    root.__JFB_LEAVE_STATUSES_INSTALLED__ = ADDON_VERSION;

    DAY_STATUS.vacation = {
      label: 'Férias',
      description: 'Dia de férias sem contabilizar horas',
      balance: 0
    };
    DAY_STATUS.dayoff = {
      label: 'Folga',
      description: 'Folga, recesso ou compensação sem contabilizar horas',
      balance: 0
    };

    const originalSanitizeImportedRecord = sanitizeImportedRecord;
    sanitizeImportedRecord = function (record, index, seenDates) {
      if (STATUS_KINDS.has(String(record?.kind || ''))) {
        return sanitizeLeaveRecord(record, index, seenDates);
      }
      return originalSanitizeImportedRecord(record, index, seenDates);
    };

    calendarMissingCell = missingCell;

    const originalRenderHistory = renderHistory;
    renderHistory = function (...args) {
      const result = originalRenderHistory.apply(this, args);
      enhanceHistoryUi();
      return result;
    };

    injectStyles();
    ensureDialog();
    installOcrStatusOptions();

    document.addEventListener('click', event => {
      const trigger = event.target.closest?.('.day-status-trigger');
      if (!trigger) return;
      openDialog(trigger.dataset.date);
    });

    if (typeof currentUser !== 'undefined' && currentUser) {
      renderHistory();
    }
  }

  install();
})(window);
