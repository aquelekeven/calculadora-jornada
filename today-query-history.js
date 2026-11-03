/* Histórico diário das consultas da tela "Hora de sair". */
(function (root) {
  'use strict';

  const VERSION = '2.15.0';
  const FIELD = 'todayExitQueryHistory';
  const MAX_ITEMS = 10;
  const EDIT_WINDOW = 45000;
  const JOURNEY = 480;
  const TOLERANCE = 10;

  let timer = null;
  let statusTimer = null;
  let restoring = false;
  let attempts = 0;

  const $ = id => document.getElementById(id);
  const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));

  function ready() {
    return Boolean(
      $('todayPanel') &&
      $('todayResult') &&
      $('todayEntry') &&
      $('todayLunchOut') &&
      $('todayLunchBack') &&
      typeof accounts === 'function' &&
      typeof saveAccounts === 'function' &&
      typeof today === 'function' &&
      typeof toMinutes === 'function' &&
      typeof clock === 'function'
    );
  }

  function account() {
    if (typeof currentUser === 'undefined' || !currentUser) return null;
    return accounts()?.[currentUser] || null;
  }

  function newId() {
    return root.crypto?.randomUUID
      ? root.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clean(item) {
    if (!item || typeof item !== 'object') return null;

    const values = {
      entry: String(item.entry || ''),
      lunchOut: String(item.lunchOut || ''),
      lunchBack: String(item.lunchBack || ''),
      minimumExit: String(item.minimumExit || ''),
      exactExit: String(item.exactExit || ''),
      maximumExit: String(item.maximumExit || '')
    };
    const saved = new Date(item.savedAt);

    if (!Object.values(values).every(validTime) || Number.isNaN(saved.getTime())) {
      return null;
    }

    return {
      id: String(item.id || newId()).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 120) || newId(),
      savedAt: saved.toISOString(),
      ...values
    };
  }

  function emptyStore() {
    return { date: today(), items: [] };
  }

  function readStore() {
    const source = account()?.[FIELD];
    if (!source || typeof source !== 'object' || source.date !== today()) {
      return emptyStore();
    }

    const items = Array.isArray(source.items)
      ? source.items.map(clean).filter(Boolean).slice(0, MAX_ITEMS)
      : [];

    items.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    return { date: today(), items };
  }

  function writeStore(store) {
    const user = account();
    if (!user || typeof currentUser === 'undefined' || !currentUser) return false;

    const all = accounts();
    user[FIELD] = {
      date: today(),
      items: store.items.map(clean).filter(Boolean).slice(0, MAX_ITEMS)
    };
    all[currentUser] = user;
    saveAccounts(all);
    return true;
  }

  function currentSnapshot() {
    const entry = $('todayEntry').value;
    const lunchOut = $('todayLunchOut').value;
    const lunchBack = $('todayLunchBack').value;

    if (![entry, lunchOut, lunchBack].every(validTime)) return null;

    const start = toMinutes(entry);
    const lunchStart = toMinutes(lunchOut);
    const lunchEnd = toMinutes(lunchBack);

    if (
      [start, lunchStart, lunchEnd].some(value => value === null) ||
      lunchStart < start ||
      lunchEnd < lunchStart
    ) {
      return null;
    }

    const exactMinutes = lunchEnd + (JOURNEY - (lunchStart - start));

    return {
      id: newId(),
      savedAt: new Date().toISOString(),
      entry,
      lunchOut,
      lunchBack,
      minimumExit: clock(exactMinutes - TOLERANCE),
      exactExit: clock(exactMinutes),
      maximumExit: clock(exactMinutes + TOLERANCE)
    };
  }

  function signature(item) {
    return `${item.entry}|${item.lunchOut}|${item.lunchBack}`;
  }

  function formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : new Intl.DateTimeFormat('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
  }

  function status(message, tone = 'neutral') {
    const target = $('todayQueryHistoryStatus');
    if (!target) return;

    clearTimeout(statusTimer);
    target.textContent = message;
    target.dataset.tone = tone;

    statusTimer = window.setTimeout(() => {
      if (!target.isConnected) return;
      target.textContent = 'As consultas válidas são salvas automaticamente na sua conta.';
      target.dataset.tone = 'neutral';
    }, 3500);
  }

  function saveCurrent() {
    if (restoring) return;

    const snapshot = currentSnapshot();
    if (!snapshot) return;

    const store = readStore();
    const duplicateIndex = store.items.findIndex(item => signature(item) === signature(snapshot));

    if (duplicateIndex >= 0) {
      const previous = store.items.splice(duplicateIndex, 1)[0];
      store.items.unshift({ ...snapshot, id: previous.id });
    } else {
      const latest = store.items[0];
      const latestTime = latest ? new Date(latest.savedAt).getTime() : 0;

      if (latest && Date.now() - latestTime <= EDIT_WINDOW) {
        store.items[0] = { ...snapshot, id: latest.id };
      } else {
        store.items.unshift(snapshot);
      }
    }

    store.items = store.items.slice(0, MAX_ITEMS);
    if (!writeStore(store)) return;

    render();
    status(`Consulta salva às ${formatTime(snapshot.savedAt)}.`, 'success');
  }

  function scheduleSave(delay = 700) {
    if (restoring) return;
    clearTimeout(timer);
    timer = window.setTimeout(saveCurrent, delay);
  }

  function restore(item) {
    restoring = true;
    clearTimeout(timer);

    $('todayEntry').value = item.entry;
    $('todayLunchOut').value = item.lunchOut;
    $('todayLunchBack').value = item.lunchBack;

    if (typeof calculateToday === 'function') {
      calculateToday();
    } else {
      ['todayEntry', 'todayLunchOut', 'todayLunchBack'].forEach(id => {
        $(id)?.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    window.setTimeout(() => {
      restoring = false;
    }, 900);

    status(`Consulta das ${formatTime(item.savedAt)} carregada nos campos.`, 'success');
    $('todayResult')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function remove(id) {
    const store = readStore();
    const next = store.items.filter(item => item.id !== id);
    if (next.length === store.items.length) return;

    store.items = next;
    writeStore(store);
    render();
    status('Consulta removida.');
  }

  function clearAll() {
    const store = readStore();
    if (!store.items.length) return;
    if (!window.confirm('Limpar todas as consultas salvas de hoje?')) return;

    writeStore(emptyStore());
    render();
    status('Histórico de hoje limpo.');
  }

  function row(item, index) {
    const element = document.createElement('li');
    element.className = 'today-query-history-item';

    const heading = document.createElement('div');
    heading.className = 'today-query-history-item-head';

    const captured = document.createElement('span');
    captured.textContent = `Consulta das ${formatTime(item.savedAt)}`;
    heading.appendChild(captured);

    if (index === 0) {
      const latest = document.createElement('b');
      latest.textContent = 'Mais recente';
      heading.appendChild(latest);
    }

    const result = document.createElement('div');
    result.className = 'today-query-history-result';
    result.innerHTML = `
      <span>Pode sair a partir de</span>
      <strong>${item.minimumExit}</strong>
    `;

    const details = document.createElement('div');
    details.className = 'today-query-history-details';
    details.innerHTML = `
      <span><small>8h exatas</small><strong>${item.exactExit}</strong></span>
      <span><small>Limite sem hora extra</small><strong>${item.maximumExit}</strong></span>
    `;

    const source = document.createElement('p');
    source.textContent = `Entrada ${item.entry} · almoço ${item.lunchOut}–${item.lunchBack}`;

    const actions = document.createElement('div');
    actions.className = 'today-query-history-actions';

    const use = document.createElement('button');
    use.type = 'button';
    use.className = 'btn secondary small';
    use.textContent = 'Usar esta consulta';
    use.addEventListener('click', () => restore(item));

    const trash = document.createElement('button');
    trash.type = 'button';
    trash.className = 'today-query-history-delete';
    trash.setAttribute('aria-label', 'Excluir esta consulta');
    trash.title = 'Excluir esta consulta';
    trash.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M9 7V4h6v3M7.5 7l.7 12h7.6l.7-12M10 10.5v5M14 10.5v5"/>
      </svg>
    `;
    trash.addEventListener('click', () => remove(item.id));

    actions.append(use, trash);
    element.append(heading, result, details, source, actions);
    return element;
  }

  function render() {
    const list = $('todayQueryHistoryList');
    const empty = $('todayQueryHistoryEmpty');
    const count = $('todayQueryHistoryCount');
    const clear = $('todayQueryHistoryClear');
    if (!list || !empty || !count || !clear) return;

    const store = readStore();
    list.replaceChildren(...store.items.map(row));
    list.classList.toggle('hidden', !store.items.length);
    empty.classList.toggle('hidden', Boolean(store.items.length));
    clear.classList.toggle('hidden', !store.items.length);
    clear.disabled = !store.items.length;
    count.textContent = store.items.length
      ? `${store.items.length} ${store.items.length === 1 ? 'consulta' : 'consultas'}`
      : 'Nenhuma consulta';
  }

  function injectStyles() {
    if ($('todayQueryHistoryStyles')) return;

    const style = document.createElement('style');
    style.id = 'todayQueryHistoryStyles';
    style.textContent = `
      .today-query-history-card{display:grid;gap:16px;margin-top:16px;padding:22px}
      .today-query-history-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
      .today-query-history-head h2,.today-query-history-head p{margin:0}.today-query-history-head h2{margin-top:3px}
      .today-query-history-head .muted{margin-top:7px;max-width:700px}
      .today-query-history-count{flex:0 0 auto;padding:7px 10px;border-radius:999px;background:var(--blue2);color:var(--blue);font-size:.75rem;font-weight:800;white-space:nowrap}
      .today-query-history-empty{display:grid;place-items:center;min-height:130px;border:1px dashed color-mix(in srgb,var(--blue) 25%,var(--line));border-radius:18px;padding:24px;background:color-mix(in srgb,var(--blue2) 35%,var(--card-solid));text-align:center}
      .today-query-history-empty strong{font-size:.96rem}.today-query-history-empty span{max-width:520px;margin-top:5px;color:var(--muted);font-size:.82rem;line-height:1.45}
      .today-query-history-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}
      .today-query-history-item{display:grid;grid-template-columns:minmax(150px,.8fr) minmax(220px,1.3fr) minmax(190px,1fr) auto;align-items:center;gap:12px 18px;padding:16px;border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--card-solid) 94%,var(--bg-soft));box-shadow:0 1px 2px rgba(0,0,0,.025)}
      .today-query-history-item:first-child{border-color:color-mix(in srgb,var(--blue) 32%,var(--line));background:color-mix(in srgb,var(--blue2) 30%,var(--card-solid))}
      .today-query-history-item-head{display:flex;align-items:center;gap:8px;grid-column:1/-1;color:var(--muted);font-size:.76rem;font-weight:730}
      .today-query-history-item-head b{padding:4px 7px;border-radius:999px;background:var(--green2);color:var(--green);font-size:.68rem;font-weight:820}
      .today-query-history-result{display:grid;gap:3px}.today-query-history-result span,.today-query-history-details small{color:var(--muted);font-size:.73rem;font-weight:650}
      .today-query-history-result strong{color:var(--blue);font-size:1.65rem;letter-spacing:-.04em}
      .today-query-history-details{display:flex;gap:18px;flex-wrap:wrap}.today-query-history-details>span{display:grid;gap:3px}.today-query-history-details strong{font-size:.94rem}
      .today-query-history-item>p{margin:0;color:var(--muted);font-size:.78rem}
      .today-query-history-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px}
      .today-query-history-delete{width:38px;height:38px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:12px;background:var(--card-solid);color:var(--red);cursor:pointer}
      .today-query-history-delete:hover{background:var(--red2);border-color:color-mix(in srgb,var(--red) 35%,var(--line))}
      .today-query-history-delete svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
      .today-query-history-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-top:2px}
      .today-query-history-status{color:var(--muted);font-size:.76rem;line-height:1.4}.today-query-history-status[data-tone="success"]{color:var(--green)}
      @media(max-width:900px){.today-query-history-item{grid-template-columns:1fr 1fr}.today-query-history-item-head{grid-column:1/-1}.today-query-history-actions{justify-content:flex-start}.today-query-history-item>p{align-self:center}}
      @media(max-width:620px){.today-query-history-card{padding:18px}.today-query-history-head,.today-query-history-footer{align-items:flex-start;flex-direction:column}.today-query-history-item{grid-template-columns:1fr}.today-query-history-item-head{grid-column:1}.today-query-history-actions{width:100%}.today-query-history-actions .btn{flex:1}.today-query-history-clear{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function buildCard() {
    if ($('todayQueryHistoryCard')) return;

    const card = document.createElement('section');
    card.id = 'todayQueryHistoryCard';
    card.className = 'card today-query-history-card';
    card.innerHTML = `
      <header class="today-query-history-head">
        <div>
          <p class="eyebrow">Memória do dia</p>
          <h2>Consultas de hoje</h2>
          <p class="muted">A calculadora guarda os horários consultados hoje para você não precisar abrir o Portal SAP novamente.</p>
        </div>
        <span id="todayQueryHistoryCount" class="today-query-history-count">Nenhuma consulta</span>
      </header>
      <div id="todayQueryHistoryEmpty" class="today-query-history-empty">
        <strong>Nenhuma consulta salva hoje.</strong>
        <span>Preencha entrada, saída para almoço e volta do almoço. Assim que a conta estiver válida, ela fica salva automaticamente.</span>
      </div>
      <ol id="todayQueryHistoryList" class="today-query-history-list hidden"></ol>
      <footer class="today-query-history-footer">
        <span id="todayQueryHistoryStatus" class="today-query-history-status" data-tone="neutral">As consultas válidas são salvas automaticamente na sua conta.</span>
        <button id="todayQueryHistoryClear" class="btn secondary small today-query-history-clear hidden" type="button">Limpar consultas de hoje</button>
      </footer>
    `;

    $('todayResult').insertAdjacentElement('afterend', card);
    $('todayQueryHistoryClear').addEventListener('click', clearAll);
  }

  function bind() {
    ['todayEntry', 'todayLunchOut', 'todayLunchBack'].forEach(id => {
      const input = $(id);
      if (!input || input.dataset.todayHistoryBound === 'true') return;
      input.dataset.todayHistoryBound = 'true';
      input.addEventListener('input', () => scheduleSave(850));
      input.addEventListener('change', () => scheduleSave(250));
    });

    const parse = $('parseTodayText');
    if (parse && parse.dataset.todayHistoryBound !== 'true') {
      parse.dataset.todayHistoryBound = 'true';
      parse.addEventListener('click', () => scheduleSave(300));
    }

    const clear = $('clearToday');
    if (clear && clear.dataset.todayHistoryBound !== 'true') {
      clear.dataset.todayHistoryBound = 'true';
      clear.addEventListener('click', () => {
        clearTimeout(timer);
        window.setTimeout(render, 0);
      });
    }
  }

  function watchAccount() {
    const app = $('appView');
    if (!app || app.dataset.todayHistoryObserved === 'true') return;

    app.dataset.todayHistoryObserved = 'true';
    new MutationObserver(() => {
      if (!app.classList.contains('hidden')) window.queueMicrotask(render);
    }).observe(app, { attributes: true, attributeFilter: ['class'] });

    if (typeof openApp === 'function' && !root.__JFB_TODAY_HISTORY_OPEN_APP_PATCHED__) {
      root.__JFB_TODAY_HISTORY_OPEN_APP_PATCHED__ = true;
      const original = openApp;
      openApp = function (...args) {
        const output = original.apply(this, args);
        window.queueMicrotask(render);
        return output;
      };
    }
  }

  function install() {
    if (root.__JFB_TODAY_QUERY_HISTORY_INSTALLED__) return;

    if (!ready()) {
      attempts += 1;
      if (attempts < 160) window.setTimeout(install, 50);
      return;
    }

    root.__JFB_TODAY_QUERY_HISTORY_INSTALLED__ = VERSION;
    injectStyles();
    buildCard();
    bind();
    watchAccount();
    render();
  }

  install();
})(window);
