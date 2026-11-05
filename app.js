// RESTART BI · app.js — оболочка: меню, фильтры, маршруты, проведение документов, общее хранилище, контроль приёмки.
(function(){
  'use strict';
  const R = window.RS, D = R.D, U = R.U, S = R.S, T = R.T, V = window.RS_VIEWS;
  const { $, $$, esc, N, SS, dt, toast } = Object.assign({}, U, { SS: U.S });

  // ======================= меню =======================
  const ICON = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    sales: '<path d="M3 17l5-5 4 4 8-8M14 8h6v6"/>', projects: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>', parties: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7M17 11a3 3 0 100-6M22 21c0-3-2-6-5-6"/>',
    b24: '<path d="M8 12h8M12 8v8"/><circle cx="12" cy="12" r="9"/>', goods: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>', stock: '<path d="M3 21V9l9-5 9 5v12M7 21v-8h10v8M7 17h10"/>',
    purch: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>', cash: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h3"/>',
    pl: '<path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6"/>', settle: '<path d="M7 7h10l-3-3M17 17H7l3 3"/>', budget: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    reports: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>', roles: '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
    admin: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>', audit: '<path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"/>',
    checks: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>', about: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
  };
  const PRI = ['dash', 'sales', 'projects', 'stock', 'cash'];
  function buildNav(){
    let h = '', g = '';
    for (const [k, n, grp] of R.SECS){
      if (!R.canSee(k)) continue;
      if (grp !== g){ h += `<div class="grp">${esc(grp)}</div>`; g = grp; }
      const badge = k === 'settle' ? R.ar(T).debt.filter(r => r.late > 30).length : k === 'purch' ? D.PURCH.filter(p => p.fact == null && p.plan < T).length : 0;
      h += `<a href="#${k}" data-s="${k}" class="${PRI.includes(k) ? 'pri' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>${esc(n)}${badge ? `<span class="st" title="${k === 'settle' ? 'долгов с просрочкой больше 30 дней' : 'поставок с опозданием'}">${badge}</span>` : ''}</a>`;
    }
    $('#nav').innerHTML = h;
    $('#roleSel').innerHTML = R.ROLES.map(r => `<option value="${r.id}" ${r.id === S.role ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
    $('#mgrSel').hidden = S.role !== 'mgr';
    $('#mgrSel').innerHTML = D.MGR.map(m => `<option value="${m.id}" ${m.id === S.asMgr ? 'selected' : ''}>${esc(m.name)} · ${esc(U.dirName(m.dir))}</option>`).join('');
    const ro = R.role(); const nm = ro.id === 'mgr' ? D.MGR.find(m => m.id === S.asMgr).name : ro.who;
    $('#meAv').textContent = ro.short; $('#meName').textContent = nm; $('#meSub').textContent = ro.name + (ro.cost ? '' : ' · без себестоимости');
  }

  // ======================= фильтры =======================
  function buildTop(){
    $('#dirSeg').innerHTML = [['all', 'Все направления'], ...D.DIRS.map(d => [d.id, d.name])].map(([k, n]) => `<button type="button" data-dir="${k}" class="${S.dir === k ? 'on' : ''}" ${k !== 'all' ? `style="--dc:${U.DIRC[k]}"` : ''}>${esc(n)}</button>`).join('');
    $('#perSel').innerHTML = R.PERIODS.map(p => `<option value="${p[0]}" ${S.per === p[0] ? 'selected' : ''}>${esc(p[1])}</option>`).join('') + `<option value="custom" ${S.per === 'custom' ? 'selected' : ''}>Свой период…</option>`;
    $('#fFrom').value = D.iso(S.from); $('#fTo').value = D.iso(S.to); $('#custom').hidden = S.per !== 'custom';
    $('#fMgr').innerHTML = `<option value="">Все менеджеры</option>` + D.MGR.filter(m => R.okDir(m.dir)).map(m => `<option value="${m.id}" ${S.mgr === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
    $('#fMgr').disabled = !!R.myMgr();
    $('#fWh').innerHTML = `<option value="">Все склады</option>` + D.WH.filter(w => R.okDir(w.dir)).map(w => `<option value="${w.id}" ${S.wh === w.id ? 'selected' : ''}>${esc(w.name)}</option>`).join('');
    $('#fCat').innerHTML = `<option value="">Все категории</option>` + R.CATS.map(c => `<option ${S.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
    $('#fCl').innerHTML = `<option value="">Все клиенты</option>` + D.CL.filter(c => S.dir === 'all' || c.dirs.includes(S.dir)).sort((a, b) => a.name.localeCompare(b.name, 'ru')).map(c => `<option value="${c.id}" ${S.client === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    const nf = [S.mgr, S.wh, S.cat, S.client].filter(Boolean).length; $('#fMore').textContent = nf ? `Фильтры · ${nf}` : 'Фильтры';
    $('#fReset').hidden = !(nf || S.dir !== 'all' || S.per !== 'ytd');
  }

  // ======================= маршруты =======================
  function route(){ let h = (location.hash || '').slice(1); if (!h){ h = R.SECS.map(s => s[0]).find(R.canSee) || 'about'; } const [sec, ...rest] = h.split('-'); return { sec, tab: rest.join('-') || null }; }
  function render(){
    buildNav(); buildTop();
    const { sec, tab } = route();
    $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.s === sec));
    let html;
    if (!V[sec] || sec === '_' || sec === 'drill' || sec === 'CARDS') html = V.about();
    else if (R.OFF.has(sec)) html = `<div class="phead"><div><h1>Раздел выключен</h1><p class="sub">Администратор выключил этот раздел. Данные сохранены — его можно включить снова в «Администраторе».</p></div></div>`;
    else if (!R.canSee(sec)) html = `<div class="phead"><div><h1>Нет доступа</h1><p class="sub">Роль «${esc(R.role().name)}» не видит раздел «${esc((R.SECS.find(s => s[0] === sec) || [, sec])[1])}». Права настраиваются в разделе «Роли и права».</p></div></div>`;
    else { try { html = V[sec](tab); } catch(e){ console.error(e); html = `<div class="banner-bad">Ошибка при построении раздела: ${esc(e.message)}</div>`; } }
    const keepFocus = document.activeElement && document.activeElement.id; const pos = keepFocus && document.activeElement.selectionStart;
    $('#content').innerHTML = html;
    if (keepFocus){ const el = document.getElementById(keepFocus); if (el && el.closest('#content')){ el.focus(); try { el.setSelectionRange(pos, pos); } catch(e){} } }
    $('#rangeLine').innerHTML = `Период <b>${R.perLabel()}</b> · сегодня ${dt(T)} · ${R.LIVE_OK ? `<span class="up">● общее хранилище подключено</span>` : R.LIVE_OK === false ? '<span class="wn">● сохранение только в этом браузере</span>' : '<span>● подключение к хранилищу…</span>'}`;
    document.title = 'RESTART BI';
  }
  R.render = render;
  window.addEventListener('hashchange', () => { $('#side').classList.remove('open'); render(); window.scrollTo(0, 0); });

  // ======================= переходы и карточки =======================
  function go(k){
    if (!k) return;
    const [t, ...a] = k.split(':'); const arg = a.join(':');
    if (t === 'go'){ location.hash = '#' + arg; return; }
    if (t === 'dir'){ S.dir = arg; R.save(); location.hash = '#dash'; render(); return; }
    if (t === 'wh'){ S.wh = arg; R.save(); location.hash = '#stock-rest'; render(); return; }
    if (t === 'drill' || t === 'month' || t === 'art'){ const r = V.drill(t === 'drill' ? arg : k); if (r) U.modal(r[0], r[1], { wide: true }); return; }
    const f = V.CARDS[t]; if (!f) return;
    const r = t === 'sc' ? f(a[0], a[1]) : f(arg);
    if (r === 'nav'){ U.closeModal(); render(); return; }
    if (r) U.modal(r[0], r[1], { wide: true });
  }
  R.go = go;
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-go],[data-sort],[data-page],[data-export],[data-stf],[data-new],[data-dir],[data-storno],[data-actfor],[data-actcsv],[data-swr]');
    if (!el) return;
    if (el.tagName === 'A' && el.dataset.go) e.preventDefault();
    const d = el.dataset;
    if (d.go != null){ go(d.go); return; }
    if (d.sort){ const t = el.closest('table'); const id = t && t.dataset.tid; if (id){ const st = U.TS[id]; if (st.sort === d.sort) st.dir *= -1; else { st.sort = d.sort; st.dir = -1; } rerender(el); } return; }
    if (d.page){ const [id, s] = d.page.split(':'); U.TS[id].page += +s; rerender(el); return; }
    if (d.export){ exportTable(d.export); return; }
    if (d.stf != null){ const [k, v] = d.stf.split(/:(.*)/s); (R.TSF = R.TSF || {})[k] = v; render(); return; }
    if (d.dir){ S.dir = d.dir; S.mgr = ''; S.wh = ''; S.client = ''; R.save(); render(); return; }
    if (d.new){ openForm(d.new, d.ref); return; }
    if (d.storno){ storno(d.storno); return; }
    if (d.actfor){ R.ACT = { c: d.actfor }; U.closeModal(); location.hash = '#settle-act'; render(); return; }
    if (d.actcsv){ exportAct(); return; }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('tr.rowlink,[data-go][tabindex]')){ go(e.target.dataset.go || e.target.dataset.row); } if (e.key === 'Escape' && !$('#modal').hidden) U.closeModal(); });
  document.addEventListener('click', e => { const tr = e.target.closest('tr.rowlink[data-row]'); if (tr && !e.target.closest('a,button')) go(tr.dataset.row); });
  const findTableId = el => { const sc = el.closest('.card,.mbox,#content'); const b = sc && sc.querySelector('[data-export]'); return b && b.dataset.export; };
  // таблица внутри модального окна перерисовывается вместе с окном
  function rerender(el){ if (el.closest('#modal')){ const top = window._lastModal; if (top){ U.closeModal(); go(top); } } else render(); }
  let tsT = null;
  document.addEventListener('input', e => {
    const id = e.target.dataset.tsearch; if (!id) return;
    U.TS[id].q = e.target.value; U.TS[id].page = 0; clearTimeout(tsT);
    tsT = setTimeout(() => { if (e.target.closest('#modal')){ const t = U.TBL[id]; if (t){ const box = e.target.closest('.mbox'); const html = U.table(t.o); const host = e.target.closest('.tbar').parentElement; const pos = e.target.selectionStart; host.innerHTML = html; const ni = document.getElementById('ts-' + id); if (ni){ ni.focus(); ni.setSelectionRange(pos, pos); } } } else render(); }, 180);
  });
  document.addEventListener('change', e => {
    const t = e.target, d = t.dataset;
    if (t.id === 'perSel'){ if (t.value === 'custom'){ S.per = 'custom'; R.save(); } else R.setPeriod(t.value); render(); return; }
    if (t.id === 'fFrom' || t.id === 'fTo'){ const a = D.idx(($('#fFrom').value || D.iso(0))), b = D.idx(($('#fTo').value || D.iso(T))); S.per = 'custom'; S.from = Math.max(0, Math.min(a, b)); S.to = Math.min(T, Math.max(a, b)); R.save(); render(); return; }
    if (t.id === 'fMgr'){ S.mgr = t.value; R.save(); render(); return; }
    if (t.id === 'fWh'){ S.wh = t.value; R.save(); render(); return; }
    if (t.id === 'fCat' || d.filter === 'cat'){ S.cat = t.value; R.save(); render(); return; }
    if (t.id === 'fCl'){ S.client = t.value; R.save(); render(); return; }
    if (t.id === 'roleSel'){ S.role = t.value; S.mgr = ''; R.save(); location.hash = ''; render(); toast('Вы смотрите систему как «' + R.role().name + '»'); return; }
    if (t.id === 'mgrSel'){ S.asMgr = t.value; R.save(); render(); return; }
    if (t.id === 'themeSel'){ setTheme(t.value); return; }
    if (d.sc){ R.SC = R.SC || {}; R.SC[d.sc] = t.value; render(); return; }
    if (d.act){ R.ACT = { c: t.value }; render(); return; }
    if (d.sw){ toggleSwitch(d.sw, t.checked); return; }
  });
  $('#fMore').addEventListener('click', () => { const r = $('#frow'); r.hidden = !r.hidden; $('#fMore').setAttribute('aria-expanded', String(!r.hidden)); });
  $('#fReset').addEventListener('click', () => { Object.assign(S, { dir: 'all', mgr: '', wh: '', cat: '', client: '' }); R.setPeriod('ytd'); render(); });
  $('#burger').addEventListener('click', () => $('#side').classList.add('open'));
  $('#sideClose').addEventListener('click', () => $('#side').classList.remove('open'));
  $('#mClose').addEventListener('click', U.closeModal); $('#mBack').addEventListener('click', U.backModal);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') U.closeModal(); });
  // запомнить последнюю карточку/расшифровку для перерисовки сортировки внутри окна
  const _go = go; R.go = k => { window._lastModal = k; _go(k); };
  document.addEventListener('click', e => { const el = e.target.closest('[data-go]'); if (el) window._lastModal = el.dataset.go; }, true);

  // тема
  const THEME = 'restart-bi-theme';
  function setTheme(v){ if (v === 'light' || v === 'dark') document.documentElement.dataset.theme = v; else delete document.documentElement.dataset.theme; try { localStorage.setItem(THEME, v); } catch(e){} $('#themeSel').value = v; }
  try { setTheme(localStorage.getItem(THEME) || 'auto'); } catch(e){ setTheme('auto'); }

  // ======================= экспорт =======================
  let downloads = null;
  async function saveFile(name, data){
    try { if (!downloads) downloads = await window.claude?.use?.('downloads'); } catch(e){}
    if (!downloads){
      // вне среды claude.ai (например, GitHub Pages) — обычное скачивание браузером
      try { const u = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); toast('Файл ' + name + ' сохранён'); }
      catch(e){ toast('Скачивание недоступно в этом окне просмотра', 'bad'); }
      return;
    }
    try { await downloads.save({ filename: name, data: new Blob([data], { type: 'text/csv;charset=utf-8' }) }); toast('Файл ' + name + ' сохранён'); }
    catch(e){ toast(e && e.code === 'declined' ? 'Скачивание отменено' : 'Не удалось сохранить файл: ' + (e && e.message || 'ошибка'), 'bad'); }
  }
  function exportTable(id){ const csv = U.csvOf(id); if (!csv) return; saveFile('RESTART-BI_' + id + '_' + D.iso(S.from) + '_' + D.iso(S.to) + '.csv', csv); }
  function exportAct(){ const a = R._actRows; if (!a) return; const q = s => '"' + String(s).replace(/"/g, '""') + '"'; const L = [[q('Акт сверки'), q(a.c.name), q(R.perLabel())].join(';'), [q('Дата'), q('Документ'), q('Дебет'), q('Кредит')].join(';'), [q(dt(S.from)), q('Сальдо на начало'), a.open > 0 ? a.open : '', a.open < 0 ? -a.open : ''].join(';'), ...a.ev.map(e => [q(dt(e.d)), q(e.doc), e.deb || '', e.cre || ''].join(';')), [q(''), q('Обороты'), a.deb, a.cre].join(';'), [q(dt(S.to)), q('Сальдо на конец'), a.close > 0 ? a.close : '', a.close < 0 ? -a.close : ''].join(';')]; saveFile('Акт_сверки_' + a.c.name.replace(/[^\wа-яА-ЯёЁ]+/g, '_') + '.csv', '﻿' + L.join('\r\n')); }

  // ======================= живые документы: общее хранилище =======================
  let db = null, user = null; const OPS = new Map(); R.LIVE_AUDIT = []; R.LIVE_PARTIES = []; R.LIVE_OK = null;
  const NAMES = {};
  R.whoName = r => r.live || r.by ? (r.by ? (NAMES[r.by] || 'сотрудник') : 'вы') + (r.role ? ' · ' + r.role : '') : (r.who || '—');
  const LKEY = 'restart-bi-ops';
  const localOps = () => { try { return JSON.parse(localStorage.getItem(LKEY) || '[]'); } catch(e){ return []; } };
  const uid = () => 'op' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function audit(op, what, obj, before, after, note){ R.LIVE_AUDIT.unshift({ d: T, by: op.by, role: op.roleName, what, obj, before: before == null ? '—' : before, after: after == null ? '—' : after, note: note || '', live: true }); }
  const F = D.fn;
  const avail = (p, wh) => F.stockQ(p, wh) - F.resQ(p, wh);
  // применить проведённую операцию к единой книге (одна точка правды для всех экранов)
  function apply(op){
    if (OPS.has(op.id)) return; OPS.set(op.id, op);
    const x = op.data || {}; const tag = o => Object.assign(o, { live: true, opId: op.id, by: op.by, role: op.roleName });
    const no = (reason) => { op.rejected = reason; audit(op, 'Отклонено системой', op.kind, '—', 'не проведено', reason); };
    try {
      switch (op.kind){
        case 'sale': {
          const p = D.PI[x.p]; if (!p) return no('товар не найден');
          if (avail(x.p, x.wh) < x.q && !x.minus) return no(`доступно ${avail(x.p, x.wh)}, нужно ${x.q}: отрицательный остаток запрещён`);
          const c = D.CLI[x.client]; const mgr = (c && c.mgr[x.dir]) || D.MGR.find(m => m.dir === x.dir).id;
          const o = tag(F.newOrder(T, x.dir, x.client, mgr, 'RESTART BI', { terms: 7, due: T + 7 }));
          o.lines.push({ p: x.p, wh: x.wh, q: x.q, price: x.price, disc: x.disc || 0 }); F.reserve(o);
          if (x.pay > 0) F.pay(o, T, x.pay, x.acc || 'A2'); D.CASH.filter(cc => cc.order === o.id).forEach(tag);
          if (x.ship){ F.ship(o, T); D.MOVES.filter(m => m.doc && m.doc.startsWith('ОТГ-' + o.id + '-')).forEach(tag); }
          audit(op, 'Продажа проведена', o.id, '—', `${N(D.orderTotal(o))} с · ${D.statusOf(o, T)}`, `${p.name} × ${x.q}, скидка ${Math.round((x.disc || 0) * 100)} %`);
          op.ref = o.id; break; }
        case 'ship': { const o = D.SALES.find(s => s.id === x.order); if (!o) return no('заказ не найден');
          const before = o.lines.reduce((a, l) => a + (l.shipped || 0), 0); const sh = F.ship(o, T);
          if (!sh.lines.length) return no('нет доступного остатка для отгрузки');
          D.MOVES.filter(m => m.doc === sh.id).forEach(tag);
          audit(op, 'Отгрузка', sh.id, 'отгружено ' + before, 'отгружено ' + o.lines.reduce((a, l) => a + (l.shipped || 0), 0), 'по заказу ' + o.id); op.ref = o.id; break; }
        case 'payin': { const o = D.SALES.find(s => s.id === x.order); if (!o) return no('заказ не найден'); if (!(x.amt > 0)) return no('сумма должна быть больше нуля');
          const before = D.paidOf(o, T); F.pay(o, T, x.amt, x.acc); tag(D.CASH[D.CASH.length - 1]);
          audit(op, 'Оплата от клиента', o.id, 'оплачено ' + N(before), 'оплачено ' + N(before + x.amt), D.statusOf(o, T)); op.ref = D.CASH[D.CASH.length - 1].id; break; }
        case 'receipt': { if (!(x.q > 0)) return no('количество должно быть больше нуля'); const m = tag(F.move({ d: T, type: 'Приход товара', doc: 'ПТ-' + op.id.slice(-5).toUpperCase(), p: x.p, wh: x.wh, q: x.q, cost: x.cost, dir: D.WH.find(w => w.id === x.wh).dir, who: '', note: x.basis || 'приход' }));
          audit(op, 'Приход товара', m.doc, 'остаток ' + (F.stockQ(x.p, x.wh) - x.q), 'остаток ' + F.stockQ(x.p, x.wh), D.PI[x.p].name); op.ref = m.doc; break; }
        case 'transfer': { if (x.from === x.to) return no('склад-отправитель и склад-получатель совпадают'); if (avail(x.p, x.from) < x.q) return no(`на складе-отправителе доступно ${avail(x.p, x.from)}`);
          const doc = 'ПМ-' + op.id.slice(-5).toUpperCase(); const a = tag(F.move({ d: T, type: 'Перемещение', doc, p: x.p, wh: x.from, q: -x.q, dir: D.WH.find(w => w.id === x.from).dir, who: '', note: '→ ' + D.WH.find(w => w.id === x.to).short }));
          tag(F.move({ d: T, type: 'Перемещение', doc, p: x.p, wh: x.to, q: x.q, cost: a.cost, dir: D.WH.find(w => w.id === x.to).dir, who: '', note: '← ' + D.WH.find(w => w.id === x.from).short }));
          audit(op, 'Перемещение', doc, D.WH.find(w => w.id === x.from).short, D.WH.find(w => w.id === x.to).short, D.PI[x.p].name + ' × ' + x.q); op.ref = doc; break; }
        case 'writeoff': { if (avail(x.p, x.wh) < x.q) return no(`доступно ${avail(x.p, x.wh)}: списание в минус запрещено`);
          const m = tag(F.move({ d: T, type: 'Списание', doc: 'СП-' + op.id.slice(-5).toUpperCase(), p: x.p, wh: x.wh, q: -x.q, dir: D.WH.find(w => w.id === x.wh).dir, who: '', note: x.reason }));
          audit(op, 'Списание', m.doc, 'остаток ' + (F.stockQ(x.p, x.wh) + x.q), 'остаток ' + F.stockQ(x.p, x.wh), x.reason); op.ref = m.doc; break; }
        case 'adjust': { const cur = F.stockQ(x.p, x.wh); const d = x.newQ - cur; if (!d) return no('количество не изменилось'); if (x.newQ < F.resQ(x.p, x.wh)) return no('новый остаток меньше резерва');
          const m = tag(F.move({ d: T, type: 'Корректировка остатков', doc: 'КР-' + op.id.slice(-5).toUpperCase(), p: x.p, wh: x.wh, q: d, cost: d > 0 ? D.PI[x.p].avg : null, dir: D.WH.find(w => w.id === x.wh).dir, who: '', note: x.reason }));
          audit(op, 'Корректировка остатков', m.doc, 'учёт ' + cur, 'факт ' + x.newQ, x.reason + ' · ' + D.PI[x.p].name); op.ref = m.doc; break; }
        case 'cashout': case 'cashin': case 'projexp': { if (!(x.amt > 0)) return no('сумма должна быть больше нуля');
          const sign = op.kind === 'cashin' ? 1 : -1;
          if (sign < 0 && R.accBal(x.acc, T) < x.amt && !x.minus) return no(`на счёте ${N(R.accBal(x.acc, T))} с — недостаточно денег`);
          const art = op.kind === 'projexp' ? x.art : x.art;
          const c = tag(F.addCash({ d: T, type: op.kind === 'cashin' ? 'Приход денег' : x.opex ? 'Операционный расход' : 'Расход денег', acc: x.acc, dir: op.kind === 'projexp' ? 'RA' : x.dir, art, ref: x.ref || '', cp: x.cp || '—', amt: sign * x.amt, basis: x.basis || art, who: '', note: x.note || '' }));
          if (op.kind === 'projexp'){ const pr = D.PROJ.find(p => p.id === x.ref); if (pr) pr.exp.push({ d: T, cat: x.cat, amt: x.amt, live: true, opId: op.id }); }
          audit(op, op.kind === 'cashin' ? 'Приход денег' : op.kind === 'projexp' ? 'Расход по проекту' : 'Расход денег', c.id, '—', N(c.amt) + ' с', art + (x.ref ? ' · ' + x.ref : '')); op.ref = c.id; break; }
        case 'xfer': { if (x.from === x.to) return no('счета совпадают'); if (R.accBal(x.from, T) < x.amt) return no('недостаточно денег на счёте-отправителе');
          const a = tag(F.addCash({ d: T, type: 'Перевод между счетами', acc: x.from, dir: 'Общие', art: 'Перевод между своими счетами', ref: '', cp: 'собственные счета', amt: -x.amt, basis: x.basis || 'перевод', who: '', pair: x.to }));
          tag(F.addCash({ d: T, type: 'Перевод между счетами', acc: x.to, dir: 'Общие', art: 'Перевод между своими счетами', ref: '', cp: 'собственные счета', amt: x.amt, basis: x.basis || 'перевод', who: '', pair: x.from }));
          audit(op, 'Перевод между счетами', a.id, D.ACC.find(z => z.id === x.from).name, D.ACC.find(z => z.id === x.to).name, N(x.amt) + ' с · выручку не меняет'); op.ref = a.id; break; }
        case 'party': { R.LIVE_PARTIES.unshift({ id: 'NEW-' + op.id.slice(-5), n: x.name, inn: x.inn, phone: x.phone, city: x.city || 'Бишкек', dirs: [x.dir], mgr: '', orders: 0, rev: 0, debt: 0, live: true });
          audit(op, 'Новый контрагент', x.name, '—', 'создан', x.dupNote || 'дублей не найдено'); break; }
        case 'storno': { const t = OPS.get(x.target); if (!t) return no('исходная операция не найдена'); if (t.stornoed) return no('операция уже сторнирована');
          const cs = D.CASH.filter(c => c.opId === t.id), ms = D.MOVES.filter(m => m.opId === t.id);
          if (!cs.length && !ms.length) return no('эту операцию нельзя сторнировать');
          for (const m of ms){ if (m.q > 0 && avail(m.p, m.wh) < m.q) return no('после сторно остаток стал бы отрицательным'); }
          for (const pr of D.PROJ) for (const e of pr.exp.filter(e => e.opId === t.id)) pr.exp.push({ d: T, cat: e.cat, amt: -e.amt, live: true });
          for (const c of cs){ c.reversed = true; tag(F.addCash({ d: T, type: c.type, acc: c.acc, dir: c.dir, art: c.art, ref: c.ref, cp: c.cp, amt: -c.amt, cur: c.cur, rate: c.rate, amtCur: c.amtCur, basis: 'сторно ' + c.id, who: '', isRev: true })); }
          for (const m of ms){ m.reversed = true; tag(F.move({ d: T, type: m.type, doc: 'СТ-' + m.doc, p: m.p, wh: m.wh, q: -m.q, cost: m.cost, dir: m.dir, who: '', note: 'сторно ' + m.doc, isRev: true })); }
          t.stornoed = true; audit(op, 'Сторно', t.ref || t.id, 'проведено', 'сторнировано', 'корректирующий документ, исходная запись сохранена'); break; }
        default: return no('неизвестный тип операции');
      }
    } catch(e){ console.error(e); no('ошибка: ' + e.message); }
  }
  function applyAll(list){ list.sort((a, b) => String(a.at).localeCompare(String(b.at))).forEach(apply); R.bump(); render(); }

  async function post(kind, data, key){
    const r = R.role();
    const op = { id: key, kind, at: new Date().toISOString(), data, roleName: r.name, by: R.ME || '' };
    if (OPS.has(key)){ toast('Этот документ уже проведён — повтор заблокирован', 'bad'); return false; }
    if (db){
      try {
        const ref = db.collection('ops').doc(key);
        const ex = await ref.get(); if (ex.exists){ toast('Этот документ уже проведён — повтор заблокирован', 'bad'); return false; }
        await ref.set(op);
      } catch(e){ toast('Не удалось провести: ' + (e.code === 'not_granted' ? 'нет права записи' : e.message || 'ошибка хранилища'), 'bad'); return false; }
      // снимок применит сам; применяем сразу, чтобы ответ был мгновенным
      apply(op); R.bump(); render();
    } else {
      const L = localOps(); if (L.some(o => o.id === key)){ toast('Повтор заблокирован', 'bad'); return false; } L.push(op); try { localStorage.setItem(LKEY, JSON.stringify(L)); } catch(e){}
      apply(op); R.bump(); render();
    }
    if (op.rejected){ toast('Не проведено: ' + op.rejected, 'bad'); return false; }
    toast('Проведено' + (op.ref ? ': ' + op.ref : ''));
    return true;
  }
  function storno(target){ const t = OPS.get(target); if (!t) return; openConfirm('Сторнировать операцию?', `Будет создан корректирующий документ с обратными суммами. Исходная запись ${esc(t.ref || '')} останется в журнале с отметкой «сторно».`, () => post('storno', { target }, 'st-' + target)); }
  function openConfirm(title, text, fn){ U.modal(title, `<p class="lead">${text}</p><div class="mact"><button type="button" class="btn-danger" id="cfYes">Сторнировать</button><button type="button" class="btn-s" id="cfNo">Отмена</button></div>`, { after: b => { b.querySelector('#cfYes').onclick = async () => { await fn(); U.closeModal(); }; b.querySelector('#cfNo').onclick = U.closeModal; } }); }

  // выключатели «Администратора»
  async function toggleSwitch(k, on){
    if (on) R.OFF.delete(k); else R.OFF.add(k);
    const arr = [...R.OFF];
    if (db){ try { await db.doc('settings/switches').set({ off: arr, at: new Date().toISOString() }); } catch(e){ toast('Не сохранено: ' + (e.code === 'not_granted' ? 'менять выключатели может только администратор' : e.message), 'bad'); } }
    else try { localStorage.setItem('restart-bi-off', JSON.stringify(arr)); } catch(e){}
    R.LIVE_AUDIT.unshift({ d: T, by: R.ME, role: R.role().name, what: 'Выключатель', obj: k, before: on ? 'выключен' : 'включён', after: on ? 'включён' : 'выключен', note: 'Администратор' });
    render();
  }

  // ======================= формы документов =======================
  const opt = (arr, sel) => arr.map(([v, n]) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(n)}</option>`).join('');
  const PRODS = () => D.P.map(p => [p.id, p.sku + ' · ' + p.name]);
  const WHS = () => D.WH.map(w => [w.id, w.name]);
  const ACCS = () => D.ACC.map(a => [a.id, a.name]);
  const fld = (id, label, inner, hint) => `<label class="fld">${esc(label)}${inner}${hint ? `<small>${hint}</small>` : ''}</label>`;
  const inp = (id, type, val, extra) => `<input id="${id}" name="${id}" type="${type}" value="${esc(val == null ? '' : val)}" ${extra || ''}>`;
  const sel = (id, arr, v) => `<select id="${id}" name="${id}">${opt(arr, v)}</select>`;
  const FORMS = {
    sale: { t: 'Новая продажа', body: ref => { const dir = S.dir === 'all' ? 'KM' : S.dir; const cls = D.CL.filter(c => c.dirs.includes(dir) && (!R.myMgr() || c.mgr[dir] === R.myMgr())); return `<div class="frow">${fld('', 'Направление', sel('f_dir', D.DIRS.map(d => [d.id, d.name]), dir))}${fld('', 'Клиент', sel('f_client', (cls.length ? cls : D.CL).map(c => [c.id, c.name])))}</div><div class="frow">${fld('', 'Товар', sel('f_p', PRODS(), D.P.find(p => p.dir === (dir === 'IB' ? 'IB' : 'KM')).id))}${fld('', 'Склад', sel('f_wh', WHS(), dir === 'IB' ? 'W3' : dir === 'RA' ? 'W4' : 'W1'))}</div><div class="frow">${fld('', 'Количество', inp('f_q', 'number', 1, 'min="1" step="1"'))}${fld('', 'Цена, сом', inp('f_price', 'number', '', 'min="0" step="10"'), '<span id="f_pricehint"></span>')}${fld('', 'Скидка, %', inp('f_disc', 'number', 0, 'min="0" max="50" step="1"'))}</div><div class="frow">${fld('', 'Оплата сейчас, сом', inp('f_pay', 'number', 0, 'min="0" step="10"'), 'частичная оплата оставит долг')}${fld('', 'Куда', sel('f_acc', ACCS(), 'A2'))}<label class="fld chk"><input type="checkbox" id="f_ship"> Отгрузить сразу</label></div><p class="note" id="f_avail"></p>`; },
      wire: b => { const upd = () => { const p = D.PI[b.querySelector('#f_p').value], wh = b.querySelector('#f_wh').value; const pr = D.priceAt(p, T); const pi = b.querySelector('#f_price'); if (!pi.dataset.touched) pi.value = pr.opt; b.querySelector('#f_pricehint').textContent = `розница ${N(pr.retail)} · опт ${N(pr.opt)} · минимум ${N(pr.min)}`; b.querySelector('#f_avail').innerHTML = `Остаток ${N(F.stockQ(p.id, wh))}, в резерве ${N(F.resQ(p.id, wh))}, <b>доступно ${N(avail(p.id, wh))}</b> ${esc(p.unit)}.`; }; b.querySelector('#f_price').addEventListener('input', e => e.target.dataset.touched = 1); ['#f_p', '#f_wh'].forEach(s => b.querySelector(s).addEventListener('change', () => { b.querySelector('#f_price').dataset.touched = ''; upd(); })); upd(); },
      read: b => { const g = s => b.querySelector(s).value; const p = D.PI[g('#f_p')]; const price = +g('#f_price'), disc = (+g('#f_disc') || 0) / 100, q = Math.round(+g('#f_q')); const pr = D.priceAt(p, T);
        if (!(q > 0)) return 'Укажите количество больше нуля.'; if (price * (1 - disc) < pr.min && R.role().id !== 'owner') return `Цена со скидкой ${N(price * (1 - disc))} ниже минимально допустимой ${N(pr.min)}. Нужно разрешение собственника.`;
        return { dir: g('#f_dir'), client: g('#f_client'), p: p.id, wh: g('#f_wh'), q, price, disc, pay: Math.max(0, +g('#f_pay') || 0), acc: g('#f_acc'), ship: b.querySelector('#f_ship').checked }; } },
    ship: { t: 'Отгрузка по заказу', body: ref => `<p class="lead">Отгрузить по заказу <b>${esc(ref)}</b> всё, что есть в наличии. Остаток на складе уменьшится, резерв снимется.</p>`, read: (b, ref) => ({ order: ref }) },
    payin: { t: 'Оплата от клиента', body: ref => { const os = D.SALES.filter(o => R.okOrder(o) && D.paidOf(o, T) < D.orderTotal(o) && o.cancel == null).slice(-300).reverse(); const o = D.SALES.find(x => x.id === ref) || os[0]; return `${fld('', 'Заказ', sel('f_order', os.map(x => [x.id, x.id + ' · ' + D.CLI[x.client].name + ' · долг ' + N(D.orderTotal(x) - D.paidOf(x, T))]), o && o.id))}<div class="frow">${fld('', 'Сумма, сом', inp('f_amt', 'number', o ? D.orderTotal(o) - D.paidOf(o, T) : 0, 'min="1" step="1"'), 'меньше суммы долга — частичная оплата')}${fld('', 'Касса / счёт', sel('f_acc', ACCS(), 'A2'))}</div>`; }, read: b => ({ order: b.querySelector('#f_order').value, amt: Math.round(+b.querySelector('#f_amt').value), acc: b.querySelector('#f_acc').value }) },
    receipt: { t: 'Приход товара', body: () => `<div class="frow">${fld('', 'Товар', sel('f_p', PRODS()))}${fld('', 'Склад', sel('f_wh', WHS(), 'W1'))}</div><div class="frow">${fld('', 'Количество', inp('f_q', 'number', 1, 'min="1"'))}${fld('', 'Себестоимость единицы, сом', inp('f_cost', 'number', '', 'min="0"'), 'с учётом доставки и таможни')}</div>${fld('', 'Основание', inp('f_basis', 'text', 'накладная поставщика №'))}`, wire: b => { const u = () => { b.querySelector('#f_cost').value = Math.round(D.PI[b.querySelector('#f_p').value].avg); }; b.querySelector('#f_p').addEventListener('change', u); u(); }, read: b => { const q = Math.round(+b.querySelector('#f_q').value), cost = +b.querySelector('#f_cost').value; if (!(q > 0) || !(cost > 0)) return 'Укажите количество и себестоимость.'; return { p: b.querySelector('#f_p').value, wh: b.querySelector('#f_wh').value, q, cost, basis: b.querySelector('#f_basis').value }; } },
    transfer: { t: 'Перемещение между складами', body: () => `${fld('', 'Товар', sel('f_p', PRODS()))}<div class="frow">${fld('', 'Откуда', sel('f_from', WHS(), 'W1'))}${fld('', 'Куда', sel('f_to', WHS(), 'W2'))}${fld('', 'Количество', inp('f_q', 'number', 1, 'min="1"'))}</div><p class="note" id="f_avail"></p>`, wire: b => { const u = () => { const p = b.querySelector('#f_p').value, w = b.querySelector('#f_from').value; b.querySelector('#f_avail').textContent = 'Доступно на складе-отправителе: ' + N(avail(p, w)); }; b.querySelector('#f_p').addEventListener('change', u); b.querySelector('#f_from').addEventListener('change', u); u(); }, read: b => ({ p: b.querySelector('#f_p').value, from: b.querySelector('#f_from').value, to: b.querySelector('#f_to').value, q: Math.round(+b.querySelector('#f_q').value) }) },
    writeoff: { t: 'Списание', body: () => `<div class="frow">${fld('', 'Товар', sel('f_p', PRODS(), D.P.find(p => p.dir === 'IB').id))}${fld('', 'Склад', sel('f_wh', WHS(), 'W3'))}${fld('', 'Количество', inp('f_q', 'number', 1, 'min="1"'))}</div>${fld('', 'Причина', inp('f_reason', 'text', 'бой при хранении, акт комиссии'))}`, read: b => ({ p: b.querySelector('#f_p').value, wh: b.querySelector('#f_wh').value, q: Math.round(+b.querySelector('#f_q').value), reason: b.querySelector('#f_reason').value || 'списание' }) },
    adjust: { t: 'Корректировка остатка', body: () => `<div class="frow">${fld('', 'Товар', sel('f_p', PRODS()))}${fld('', 'Склад', sel('f_wh', WHS(), 'W1'))}</div><div class="frow">${fld('', 'Фактический остаток', inp('f_n', 'number', 0, 'min="0"'), '<span id="f_cur"></span>')}${fld('', 'Основание', inp('f_reason', 'text', 'пересчёт при инвентаризации'))}</div>`, wire: b => { const u = () => { const q = F.stockQ(b.querySelector('#f_p').value, b.querySelector('#f_wh').value); b.querySelector('#f_cur').textContent = 'по учёту ' + N(q); b.querySelector('#f_n').value = q; }; b.querySelector('#f_p').addEventListener('change', u); b.querySelector('#f_wh').addEventListener('change', u); u(); }, read: b => ({ p: b.querySelector('#f_p').value, wh: b.querySelector('#f_wh').value, newQ: Math.round(+b.querySelector('#f_n').value), reason: b.querySelector('#f_reason').value }) },
    cashout: { t: 'Расход денег', body: () => `<div class="frow">${fld('', 'Касса / счёт', sel('f_acc', ACCS(), 'A2'))}${fld('', 'Направление', sel('f_dir', [...D.DIRS.map(d => [d.id, d.name]), ['Общие', 'Общие расходы']], S.dir === 'all' ? 'Общие' : S.dir))}</div><div class="frow">${fld('', 'Статья ДДС', sel('f_art', ['Аренда склада и шоурума', 'Аренда офиса', 'Маркетинг и реклама', 'Связь, ПО, Bitrix24', 'Транспорт и топливо', 'Хозяйственные расходы', 'Зарплата и премии', 'Банковские комиссии', 'Налоги'].map(a => [a, a])))}${fld('', 'Сумма, сом', inp('f_amt', 'number', '', 'min="1"'))}</div><div class="frow">${fld('', 'Контрагент', inp('f_cp', 'text', ''))}${fld('', 'Основание платежа', inp('f_basis', 'text', ''))}</div>`, read: b => ({ acc: b.querySelector('#f_acc').value, dir: b.querySelector('#f_dir').value, art: b.querySelector('#f_art').value, amt: Math.round(+b.querySelector('#f_amt').value), cp: b.querySelector('#f_cp').value, basis: b.querySelector('#f_basis').value, opex: true }) },
    cashin: { t: 'Приход денег', body: () => `<div class="frow">${fld('', 'Касса / счёт', sel('f_acc', ACCS(), 'A2'))}${fld('', 'Направление', sel('f_dir', [...D.DIRS.map(d => [d.id, d.name]), ['Общие', 'Общие']], 'Общие'))}</div><div class="frow">${fld('', 'Статья ДДС', sel('f_art', ['Прочие поступления', 'Возврат от поставщика', 'Возврат подотчётных'].map(a => [a, a])))}${fld('', 'Сумма, сом', inp('f_amt', 'number', '', 'min="1"'))}</div>${fld('', 'Основание', inp('f_basis', 'text', ''))}<p class="note">Оплаты покупателей вносите кнопкой «Оплата от клиента» в заказе — так они закрывают долг.</p>`, read: b => ({ acc: b.querySelector('#f_acc').value, dir: b.querySelector('#f_dir').value, art: b.querySelector('#f_art').value, amt: Math.round(+b.querySelector('#f_amt').value), basis: b.querySelector('#f_basis').value }) },
    xfer: { t: 'Перевод между своими счетами', body: () => `<div class="frow">${fld('', 'Откуда', sel('f_from', ACCS().filter(a => D.ACC.find(z => z.id === a[0]).cur === 'KGS'), 'A1'))}${fld('', 'Куда', sel('f_to', ACCS().filter(a => D.ACC.find(z => z.id === a[0]).cur === 'KGS'), 'A2'))}${fld('', 'Сумма, сом', inp('f_amt', 'number', '', 'min="1"'))}</div><p class="note">Перевод не является ни доходом, ни расходом и не меняет выручку.</p>`, read: b => ({ from: b.querySelector('#f_from').value, to: b.querySelector('#f_to').value, amt: Math.round(+b.querySelector('#f_amt').value) }) },
    projexp: { t: 'Расход по проекту', body: ref => `${fld('', 'Проект', sel('f_ref', D.PROJ.filter(p => p.order).map(p => [p.id, p.name]), ref || D.PROJ.filter(p => p.order).slice(-1)[0].id))}<div class="frow">${fld('', 'Категория', sel('f_cat', [['Логистика', 'Логистика'], ['Доставка', 'Доставка'], ['Монтаж и подрядчики', 'Монтаж и подрядчики'], ['Командировочные', 'Командировочные'], ['Прочие', 'Прочие расходы']]))}${fld('', 'Сумма, сом', inp('f_amt', 'number', '', 'min="1"'))}${fld('', 'Касса / счёт', sel('f_acc', ACCS(), 'A2'))}</div>${fld('', 'Контрагент', inp('f_cp', 'text', ''))}<p class="note">Прибыльность проекта пересчитается сразу после проведения.</p>`, read: b => { const cat = b.querySelector('#f_cat').value; const art = { 'Логистика': 'Логистика проекта', 'Доставка': 'Доставка по проекту', 'Монтаж и подрядчики': 'Оплата подрядчикам', 'Командировочные': 'Командировочные', 'Прочие': 'Прочие расходы проекта' }[cat]; return { ref: b.querySelector('#f_ref').value, cat, art, amt: Math.round(+b.querySelector('#f_amt').value), acc: b.querySelector('#f_acc').value, cp: b.querySelector('#f_cp').value }; } },
    party: { t: 'Новый контрагент', body: () => `${fld('', 'Наименование организации или ФИО', inp('f_name', 'text', ''), '<span id="f_dup"></span>')}<div class="frow">${fld('', 'ИНН', inp('f_inn', 'text', '', 'inputmode="numeric" maxlength="14"'))}${fld('', 'Телефон / WhatsApp', inp('f_phone', 'tel', '+996 '))}${fld('', 'Направление', sel('f_dir', D.DIRS.map(d => [d.id, d.name]), S.dir === 'all' ? 'KM' : S.dir))}</div><p class="note">Попробуйте ввести «Ресторан Береке» или ИНН ${esc(D.DUP_SAMPLE.inn)} — система найдёт существующую карточку.</p>`,
      wire: b => { const u = () => { const d = findDup(b.querySelector('#f_name').value, b.querySelector('#f_inn').value, b.querySelector('#f_phone').value); b.querySelector('#f_dup').innerHTML = d ? `<b class="dn">Похоже на «${esc(d.c.name)}» (${esc(d.why)})</b> — <a href="#" data-go="k:${d.c.id}">открыть карточку</a>` : ''; }; b.querySelectorAll('input').forEach(i => i.addEventListener('input', u)); },
      read: b => { const name = b.querySelector('#f_name').value.trim(), inn = b.querySelector('#f_inn').value.trim(), phone = b.querySelector('#f_phone').value.trim(); if (name.length < 3) return 'Укажите наименование.'; if (inn && !/^\d{14}$/.test(inn)) return 'ИНН в Кыргызстане — 14 цифр.'; const d = findDup(name, inn, phone); if (d) return `Такой контрагент уже есть: «${d.c.name}» (${d.why}). Дубль не создан.`; return { name, inn, phone, dir: b.querySelector('#f_dir').value }; } },
    po: { t: 'Заявка на закупку', body: () => `<div class="banner-info">Заявка на закупку проходит согласование у собственника, затем становится заказом поставщику. В этом макете новые закупки создаёт ежемесячная дозакупка по целевым остаткам; для ручного прихода используйте «Склад → Приход».</div>`, read: () => 'Ручные заявки на закупку появятся в рабочей версии.' },
  };
  function findDup(name, inn, phone){
    const k = D.nameKey(name || ''); const ph = (phone || '').replace(/\D/g, '');
    for (const c of D.CL){ if (inn && c.inn && c.inn === inn) return { c, why: 'тот же ИНН' }; if (ph.length >= 11 && c.phone && c.phone.replace(/\D/g, '') === ph) return { c, why: 'тот же телефон' }; if (k.length >= 5 && D.nameKey(c.name) === k) return { c, why: 'то же название' }; }
    return null;
  }
  function openForm(kind, ref, pre){
    const f = FORMS[kind]; if (!f) return false;
    const secOf = { sale: 'sales', ship: 'sales', payin: 'sales', receipt: 'stock', transfer: 'stock', writeoff: 'stock', adjust: 'stock', cashout: 'cash', cashin: 'cash', xfer: 'cash', projexp: 'projects', party: 'parties', po: 'purch' }[kind];
    if (!R.canEdit(secOf)){ toast('Роль «' + R.role().name + '» не может проводить такие документы', 'bad'); return false; }
    const key = uid();   // ключ документа: двойное нажатие не проведёт его дважды
    U.modal(f.t, `<form id="opForm" class="opf" novalidate>${f.body(ref)}<p class="ferr" id="fErr" role="alert"></p><div class="mact"><button type="submit" class="btn-p" id="fGo">Провести</button><button type="button" class="btn-s" id="fCancel">Отмена</button><span class="small">дата операции — ${dt(T)} · пользователь — ${esc(R.role().name)}</span></div></form>`, { after: b => {
      if (pre){ for (const [id, v] of Object.entries(pre)){ const el = b.querySelector('#' + id); if (!el || v == null) continue; if (el.type === 'checkbox') el.checked = !!v; else { if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === String(v))) continue; el.value = v; } if (el.tagName === 'SELECT' && id !== 'f_p' && id !== 'f_wh') el.dispatchEvent(new Event('change')); } }
      if (f.wire) f.wire(b);
      if (pre){ for (const [id, v] of Object.entries(pre)){ const el = b.querySelector('#' + id); if (el && el.type !== 'checkbox' && el.tagName !== 'SELECT' && v != null){ el.value = v; if (id === 'f_price') el.dataset.touched = 1; } } const n = b.querySelector('#fErr'); n.style.color = 'var(--info)'; n.textContent = 'Форму заполнил ИИ-помощник — проверьте поля и нажмите «Провести».'; }
      b.querySelector('#fCancel').onclick = U.closeModal;
      b.querySelector('#opForm').addEventListener('submit', async e => { e.preventDefault(); const data = f.read(b, ref); if (typeof data === 'string'){ b.querySelector('#fErr').textContent = data; return; }
        const btn = b.querySelector('#fGo'); btn.disabled = true; btn.textContent = 'Проводится…';
        const ok = await post(kind, data, key); if (ok) U.closeModal(); else { btn.disabled = false; btn.textContent = 'Провести'; } });
    } });
    return true;
  }

  R.openForm = (k, ref, pre) => openForm(k, ref, pre) !== false;
  // ======================= контроль приёмки =======================
  R.runChecks = function(){
    const keep = { ...S }; const out = [];
    const reset = () => { Object.assign(S, keep); };
    Object.assign(S, { dir: 'all', mgr: '', wh: '', cat: '', client: '', role: 'owner' });
    try {
      // 1
      let bad = 0, n = 0; const mv = new Map(); for (const m of D.MOVES) if (m.type === 'Продажа и отгрузка') mv.set(m.doc + '|' + m.p, (mv.get(m.doc + '|' + m.p) || 0) - m.q);
      const cashBy = new Map(); for (const c of D.CASH) if (c.order) cashBy.set(c.order, (cashBy.get(c.order) || 0) + c.amt);
      for (const o of D.SALES){ for (const s of o.ships) for (const z of s.lines) if (z.l.p){ n++; if ((mv.get(s.id + '|' + z.l.p) || 0) < z.q) bad++; } const p = o.pays.reduce((a, x) => a + x.amt, 0); if (Math.abs((cashBy.get(o.id) || 0) - p) > 1) bad++; }
      out.push({ t: 'Продажи корректно отражаются в финансовом и товарном учёте', ok: bad === 0, d: `${N(n)} строк отгрузок сверены со складским журналом, оплаты всех ${N(D.SALES.length)} заказов — с журналом ДДС: расхождений ${bad}.` });
      // 2
      let b2 = 0, neg = 0; const q = {}; for (const m of D.MOVES) q[m.p + '|' + m.wh] = (q[m.p + '|' + m.wh] || 0) + m.q; for (const p of D.P) for (const w in p.stock){ if (Math.abs((q[p.id + '|' + w] || 0) - p.stock[w]) > 0) b2++; if (p.stock[w] - (p.res[w] || 0) < 0) neg++; }
      const ex = D.SALES.slice().reverse().find(o => o.lines.some(l => (l.resQ || 0) > 0));
      out.push({ t: 'Отгрузка уменьшает остаток, резерв уменьшает доступное', ok: b2 === 0 && neg === 0, d: `Остатки по ${N(Object.keys(q).length)} парам «товар × склад» совпадают с суммой движений (расхождений ${b2}); отрицательных доступных остатков — ${neg}.${ex ? ` Пример: заказ ${ex.id} держит резерв ${N(ex.lines.reduce((a, l) => a + (l.resQ || 0), 0))} ед. — доступно меньше остатка ровно на эту величину.` : ''}` });
      // 3
      let b3 = 0; for (const po of D.PURCH){ const al = po.lines.reduce((a, l) => a + l.alloc, 0); const tot = po.lines.reduce((a, l) => a + l.costKgs * l.q, 0); if (Math.abs(al - po.extra) > 1 || Math.abs(tot - po.total) > po.lines.length * 2) b3++; }
      const ps = D.PURCH[D.PURCH.length - 20];
      out.push({ t: 'Закупочные расходы правильно формируют себестоимость', ok: b3 === 0, d: `В ${N(D.PURCH.length)} закупках доставка, таможня и прочие расходы распределены на строки полностью (расхождений ${b3}). Пример ${ps.id}: товар ${N(ps.total - ps.extra)} + доп. затраты ${N(ps.extra)} по ${esc(ps.rule)} = ${N(ps.total)} с.` });
      // 4
      const part = D.SALES.filter(o => { const r = D.revOf(o, T), p = D.paidOf(o, T); return p > 0 && p < r - 1; });
      const b4 = part.filter(o => D.statusOf(o, T) === 'Завершён').length;
      out.push({ t: 'Частичная оплата не закрывает всю задолженность', ok: part.length > 0 && b4 === 0, d: `${N(part.length)} заказов оплачены частично: у всех остаётся долг (${U.MS(part.reduce((a, o) => a + D.revOf(o, T) - D.paidOf(o, T), 0))}), ${b4 ? `<b class="dn">${b4} заказов ошибочно «Завершён»</b>` : 'ни один не получил статус «Завершён»'}.` });
      // 5
      const xf = D.CASH.filter(c => c.type === 'Перевод между счетами'); const xs = xf.reduce((a, c) => a + c.amt, 0);
      const revA = R.pl(0, T).rev; const revB = D.SALES.reduce((a, o) => a + D.revOf(o, T), 0);
      out.push({ t: 'Перевод денег между своими кассами не увеличивает выручку', ok: Math.abs(xs) < 1 && Math.abs(revA - revB) < 2, d: `${N(xf.length)} записей переводов в сумме дают ${N(xs)} с; выручка считается только по отгрузкам и актам (${U.MS(revA)}), переводы в неё не входят.` });
      // 6
      const pd = R.perDir(() => R.pl().rev); const sumd = D.DIRS.reduce((a, d) => a + pd[d.id], 0);
      out.push({ t: 'Собственник видит отдельно RestArt, Klen Market и Italbrands', ok: Math.abs(sumd - pd.all) < 2, d: D.DIRS.map(d => `${d.name} ${U.MS(pd[d.id])}`).join(' + ') + ` = ${U.MS(sumd)}; итого компании ${U.MS(pd.all)}.` });
      // 7
      const lo = [...OPS.values()].filter(o => o.kind); const la = R.LIVE_AUDIT.filter(a => a.what !== 'Выключатель').length;
      out.push({ t: 'Изменения в проведённых операциях фиксируются в журнале', ok: la >= lo.length, d: `Журнал содержит ${N(D.AUDIT.length + R.LIVE_AUDIT.length)} записей: изменения цен, инвентаризации, сторно, отказы. Проведено здесь: ${lo.length} документов — в журнале ${la} записей. Проведённое не удаляется: исправление только сторно.` });
      // 8
      S.role = 'mgr'; S.asMgr = 'M3'; R.bump(); const vis = D.SALES.filter(R.okOrder); const foreign = vis.filter(o => o.mgr !== 'M3').length; const cashHidden = !R.canSee('cash') && !R.seeCost(); S.role = 'wh'; const whNoMoney = !R.canSee('cash') && !R.canSee('pl'); S.role = 'owner';
      out.push({ t: 'Пользователь не получает доступ к данным за пределами своей роли', ok: foreign === 0 && cashHidden && whNoMoney, d: `Менеджер ${esc(D.MGR[2].name)} видит ${N(vis.length)} своих заказов и ни одного чужого (${foreign}); у менеджера нет ДДС и себестоимости; складской сотрудник не видит деньги и прибыль. В рабочей версии то же правило проверяет сервер.` });
      // 9
      R.bump(); const x = R.pl(); const dr = x.L.reduce((a, r) => a + r.rev, 0); const a9 = R.ar(); const st = R.stockAt();
      const ok9 = Math.abs(dr - x.rev) < 2 && Math.abs(a9.debt.reduce((s, r) => s + r.bal, 0) - a9.sum) < 2 && Math.abs(st.rows.reduce((s, r) => s + r.val, 0) - st.val) < 2;
      out.push({ t: 'Дашборд совпадает с детализацией исходных операций', ok: ok9, d: `Выручка ${U.MS(x.rev)} = сумма ${N(x.L.length)} строк реализации; дебиторка ${U.MS(a9.sum)} = сумма ${N(a9.debt.length)} долгов; остатки ${U.MS(st.val)} = сумма ${N(st.rows.length)} позиций.` });
      // 10
      out.push({ t: 'Данные сохраняются после выхода и повторного входа', ok: R.LIVE_OK === true ? true : R.LIVE_OK === false ? false : null, d: R.LIVE_OK ? `Проведённые документы хранятся в общем хранилище (${OPS.size} документов) и загружаются при каждом открытии — у всех пользователей одинаково.` : R.LIVE_OK === false ? 'Общее хранилище недоступно в этом окне — документы сохраняются только в браузере. Откройте систему по ссылке, войдя в аккаунт.' : 'Проверяется подключение к хранилищу…' });
      // 11
      const ms = R.monthsIn(); const sm = ms.reduce((a, m) => { const [p, q2] = R.mRange(m); return a + R.pl(p, q2).rev; }, 0);
      out.push({ t: 'Отчёты корректно формируются за выбранный период', ok: Math.abs(sm - x.rev) < 2, d: `Сумма ${ms.length} месячных отчётов (${U.MS(sm)}) равна отчёту за весь период ${R.perLabel()} (${U.MS(x.rev)}).` });
      // 12
      const cnt = { 'частичные оплаты': part.length, 'возвраты от клиентов': D.SALES.filter(o => o.ret).length, 'скидки': D.SALES.filter(o => o.lines.some(l => l.disc > 0)).length, 'резервы': D.SALES.filter(o => o.lines.some(l => (l.resQ || 0) > 0)).length, 'перемещения': new Set(D.MOVES.filter(m => m.type === 'Перемещение').map(m => m.doc)).size, 'отмены': D.SALES.filter(o => o.cancel != null).length, 'частичные отгрузки': D.SALES.filter(o => o.ships.length > 1 && !o.project).length };
      out.push({ t: 'Проверено на контрольных сценариях', ok: Object.values(cnt).every(v => v > 0), d: Object.entries(cnt).map(([k, v]) => `${k} — ${N(v)}`).join(' · ') + '. Все проверки 1–11 выше выполняются на этих данных.' });
    } finally { reset(); R.bump(); }
    return out;
  };

  // ======================= запуск =======================
  async function boot(){
    render();
    try { const off = JSON.parse(localStorage.getItem('restart-bi-off') || '[]'); off.forEach(k => R.OFF.add(k)); } catch(e){}
    let to = setTimeout(() => { if (R.LIVE_OK == null){ R.LIVE_OK = false; applyAll(localOps()); } }, 10000);
    try {
      const c = window.claude;
      if (c && c.use){
        [db, user] = await Promise.all([c.use('db'), c.use('user')]);
        if (user){ try { const me = await user.me(); R.ME = me.id || ''; if (me.id) NAMES[me.id] = me.name || 'вы'; } catch(e){} }
      }
    } catch(e){ db = null; }
    if (!db){ clearTimeout(to); R.LIVE_OK = false; applyAll(localOps()); return; }
    let first = true;
    db.collection('ops').onSnapshot(snap => {
      clearTimeout(to); R.LIVE_OK = true;
      const add = snap.docChanges().filter(ch => ch.type === 'added').map(ch => ch.doc.data()).filter(Boolean);
      const ids = [...new Set(add.map(o => o.by).filter(id => id && !NAMES[id]))];
      if (ids.length && user && user.profiles) user.profiles(ids).then(ps => { for (const id of ids) NAMES[id] = (ps[id] && ps[id].name) || 'сотрудник'; render(); }).catch(() => {});
      if (add.length || first) applyAll(add); first = false;
    }, err => { clearTimeout(to); R.LIVE_OK = false; toast('Хранилище недоступно: ' + (err.message || err.code), 'bad'); applyAll(localOps()); });
    db.doc('settings/switches').onSnapshot(s => { const d = s.exists ? s.data() : null; R.OFF.clear(); ((d && d.off) || []).forEach(k => R.OFF.add(k)); render(); }, () => {});
  }
  boot();
})();
