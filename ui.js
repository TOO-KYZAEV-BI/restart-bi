// RESTART BI · ui.js — форматы, таблицы, графики (SVG без библиотек), модальные окна.
(function(){
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
  const N = x => nf0.format(Math.round(x || 0)).replace(/ /g, ' ');
  const N2 = x => nf2.format(x || 0).replace(/ /g, ' ');
  const M = x => { const a = Math.abs(x || 0); if (a >= 1e9) return nf1.format(x / 1e9) + ' млрд'; if (a >= 1e6) return nf1.format(x / 1e6) + ' млн'; if (a >= 1e4) return nf0.format(x / 1e3) + ' тыс'; return N(x); };
  const S = x => N(x) + ' с';                // полная сумма в сомах
  const MS = x => M(x) + ' с';               // кратко
  const P = (x, d = 1) => (isFinite(x) ? nf1.format(x * 100).replace(/,0$/, '') : '—') + ' %';
  const MON = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const MONF = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const D = window.RS_DATA;
  const dt = i => { const s = D.iso(i); return s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4); };
  const dts = i => { const s = D.iso(i); return s.slice(8, 10) + '.' + s.slice(5, 7); };
  const mName = m => MON[m % 12] + ' ' + String(2025 + Math.floor(m / 12)).slice(2);
  const plural = (n, a, b, c) => { const k = Math.abs(n) % 100, k1 = k % 10; return k > 10 && k < 20 ? c : k1 > 1 && k1 < 5 ? b : k1 === 1 ? a : c; };
  const DIRC = { RA: 'var(--d-ra)', KM: 'var(--d-km)', IB: 'var(--d-ib)', 'Общие': 'var(--fg-3)' };
  const dirName = id => (D.DIRS.find(d => d.id === id) || { name: id }).name;
  const chip = id => `<span class="dchip" style="--dc:${DIRC[id] || 'var(--fg-3)'}">${esc(dirName(id))}</span>`;
  const STC = { 'Новый': 'info', 'Согласование': 'info', 'Счёт выставлен': 'info', 'Частично оплачен': 'warn', 'Оплачен': 'good', 'Комплектация': 'warn', 'Отгружен': 'warn', 'Завершён': 'good', 'Отменён': 'mute', 'Возврат': 'bad',
    'Заявка': 'info', 'Заказ поставщику': 'info', 'Оплата': 'warn', 'Доставка': 'warn', 'Приёмка': 'warn', 'Закрыт': 'good', 'КП': 'info', 'Договор': 'info', 'Закупка': 'warn', 'Поставка': 'warn', 'Монтаж': 'warn', 'Сдан': 'good', 'активен': 'good', 'проведено': 'good', 'сторно': 'mute', 'отклонено': 'bad' };
  const pill = (t, k) => `<span class="pill p-${k || STC[t] || 'mute'}">${esc(t)}</span>`;

  // ---------- таблица: поиск, сортировка, страницы, итоги, экспорт ----------
  const TS = {};   // состояние таблиц по id
  const TBL = {};  // последние данные таблиц для экспорта
  function table(o){
    const st = TS[o.id] = TS[o.id] || { q: '', sort: o.sort || null, dir: o.sortDir || -1, page: 0 };
    let rows = o.rows;
    if (st.q){ const q = st.q.toLowerCase(); rows = rows.filter(r => o.cols.some(c => String(c.v ? c.v(r) : r[c.k] == null ? '' : r[c.k]).toLowerCase().includes(q))); }
    if (st.sort){ const c = o.cols.find(x => x.k === st.sort); if (c){ const g = c.v || (r => r[c.k]); rows = rows.slice().sort((a, b) => { const x = g(a), y = g(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ru')) * st.dir; }); } }
    TBL[o.id] = { o, rows };
    const ps = o.pageSize || 25, pages = Math.max(1, Math.ceil(rows.length / ps)); if (st.page >= pages) st.page = pages - 1;
    const view = o.all ? rows : rows.slice(st.page * ps, st.page * ps + ps);
    const head = o.cols.map(c => `<th class="${c.num ? 'num' : ''}" ${c.nosort ? '' : `data-sort="${c.k}" aria-sort="${st.sort === c.k ? (st.dir > 0 ? 'ascending' : 'descending') : 'none'}"`}>${esc(c.t)}</th>`).join('');
    const cell = (c, r) => { const v = c.v ? c.v(r) : r[c.k]; const h = c.h ? c.h(r) : c.f ? c.f(v) : (c.num ? N(v) : esc(v)); return `<td class="${c.num ? 'num' : ''}${c.cls ? ' ' + c.cls : ''}">${h}</td>`; };
    const body = view.map((r, j) => `<tr${o.onRow ? ` class="rowlink" tabindex="0" data-row="${esc(o.onRow(r))}"` : ''}>${o.cols.map(c => cell(c, r)).join('')}</tr>`).join('');
    let foot = '';
    if (o.total !== false && o.cols.some(c => c.sum)){
      foot = `<tfoot><tr class="total">${o.cols.map((c, k) => { if (k === 0) return `<td>Итого · ${N(rows.length)}</td>`; if (!c.sum) return '<td></td>'; const s = typeof c.sum === 'function' ? c.sum(rows) : rows.reduce((a, r) => a + (+(c.v ? c.v(r) : r[c.k]) || 0), 0); return `<td class="num">${c.sf ? c.sf(s) : c.f ? c.f(s) : N(s)}</td>`; }).join('')}</tr></tfoot>`;
    }
    const tools = `<div class="tbar">${o.search === false ? '' : `<label class="tsearch"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="ts-${o.id}" data-tsearch="${o.id}" value="${esc(st.q)}" placeholder="${esc(o.ph || 'Поиск в таблице')}" aria-label="Поиск в таблице"></label>`}<span class="tcount">${N(rows.length)} ${plural(rows.length, 'строка', 'строки', 'строк')}</span>${o.extra || ''}<button type="button" class="btn-q" data-export="${o.id}" title="Скачать таблицу для Excel">⤓ Excel</button></div>`;
    const pager = !o.all && pages > 1 ? `<div class="pager"><button type="button" class="btn-q" data-page="${o.id}:-1" ${st.page ? '' : 'disabled'}>‹ Назад</button><span>${st.page + 1} из ${pages}</span><button type="button" class="btn-q" data-page="${o.id}:1" ${st.page < pages - 1 ? '' : 'disabled'}>Вперёд ›</button></div>` : '';
    return `${tools}<div class="tw"><table data-tid="${o.id}" class="tbl${o.cls ? ' ' + o.cls : ''}"><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${o.cols.length}" class="empty">${esc(o.empty || 'Нет строк для выбранных фильтров')}</td></tr>`}</tbody>${foot}</table></div>${pager}`;
  }
  function csvOf(id){
    const t = TBL[id]; if (!t) return '';
    const cols = t.o.cols; const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const lines = [cols.map(c => q(c.t)).join(';')];
    for (const r of t.rows) lines.push(cols.map(c => { const v = c.v ? c.v(r) : r[c.k]; return typeof v === 'number' ? String(Math.round(v * 100) / 100).replace('.', ',') : q(c.x ? c.x(r) : v); }).join(';'));
    return '﻿' + lines.join('\r\n');
  }

  // ---------- графики ----------
  const W = 480;
  const niceMax = v => { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))); const m = v / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e; };
  // столбцы с накоплением: labels[], series:[{name, color, vals[]}], line опционально {name, color, vals[]} (на той же шкале)
  function bars(o){
    const H = o.h || 250, pl = 50, pr = 10, pt = 14, pb = 28, n = o.labels.length;
    const tot = o.labels.map((_, k) => o.series.reduce((a, s) => a + Math.max(0, s.vals[k] || 0), 0));
    let mx = Math.max(...tot, ...(o.line ? o.line.vals : [0]), ...(o.line2 ? o.line2.vals : [0])); mx = niceMax(mx * 1.05);
    const cw = (W - pl - pr) / n, bw = Math.max(4, Math.min(34, cw * 0.62));
    const y = v => pt + (H - pt - pb) * (1 - v / mx);
    let g = '';
    for (let k = 0; k <= 4; k++){ const v = mx * k / 4, yy = y(v); g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="grid"/><text x="${pl - 6}" y="${yy + 4}" class="ax" text-anchor="end">${M(v)}</text>`; }
    let b = '';
    o.labels.forEach((lb, k) => {
      let acc = 0; const x = pl + cw * k + (cw - bw) / 2;
      o.series.forEach(s => { const v = Math.max(0, s.vals[k] || 0); if (!v) return; const y0 = y(acc), y1 = y(acc + v); b += `<rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5, y0 - y1).toFixed(1)}" fill="${s.color}" rx="2"><title>${esc(lb)} · ${esc(s.name)}: ${S(v)}</title></rect>`; acc += v; });
      if (o.click) b += `<rect x="${(pl + cw * k).toFixed(1)}" y="${pt}" width="${cw.toFixed(1)}" height="${H - pt - pb}" fill="transparent" class="hit" data-go="${esc(o.click(k))}"><title>${esc(lb)}: ${S(tot[k])} — открыть операции</title></rect>`;
      if (n <= 8 || k % Math.ceil(n / 6) === 0 || k === n - 1) b += `<text x="${(pl + cw * k + cw / 2).toFixed(1)}" y="${H - 9}" class="ax" text-anchor="middle">${esc(lb)}</text>`;
    });
    const pathOf = (vals) => vals.map((v, k) => `${k ? 'L' : 'M'}${(pl + cw * k + cw / 2).toFixed(1)},${y(v).toFixed(1)}`).join('');
    let l = '';
    if (o.line){ l += `<path d="${pathOf(o.line.vals)}" fill="none" stroke="${o.line.color}" stroke-width="2.2" ${o.line.dash ? 'stroke-dasharray="5 4"' : ''}/>`; o.line.vals.forEach((v, k) => { l += `<circle cx="${(pl + cw * k + cw / 2).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${k === n - 1 ? 4 : 2.4}" fill="${o.line.color}"><title>${esc(o.labels[k])} · ${esc(o.line.name)}: ${S(v)}</title></circle>`; }); }
    if (o.line2){ l += `<path d="${pathOf(o.line2.vals)}" fill="none" stroke="${o.line2.color}" stroke-width="2" stroke-dasharray="5 4"/>`; }
    const leg = [...o.series, ...(o.line ? [o.line] : []), ...(o.line2 ? [o.line2] : [])].map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || 'график')}">${g}${b}${l}</svg><div class="legend">${leg}</div>`;
  }
  // линия с заливкой
  function area(o){
    const H = o.h || 240, pl = 50, pr = 12, pt = 14, pb = 28, n = o.labels.length;
    const all = o.series.flatMap(s => s.vals); let mx = niceMax(Math.max(...all) * 1.08); const mn = Math.min(0, ...all);
    const y = v => pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn));
    const x = k => pl + (W - pl - pr) * (n === 1 ? 0.5 : k / (n - 1));
    let g = ''; for (let k = 0; k <= 4; k++){ const v = mn + (mx - mn) * k / 4; g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${M(v)}</text>`; }
    if (mn < 0) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" class="zero"/>`;
    let p = '';
    o.series.forEach((s, j) => {
      const d = s.vals.map((v, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)},${y(v).toFixed(1)}`).join('');
      if (j === 0 && o.fill !== false) p += `<path d="${d}L${x(n - 1).toFixed(1)},${y(Math.max(0, mn)).toFixed(1)}L${x(0).toFixed(1)},${y(Math.max(0, mn)).toFixed(1)}Z" fill="${s.color}" opacity=".12"/>`;
      p += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.2" ${s.dash ? 'stroke-dasharray="5 4"' : ''}/>`;
      s.vals.forEach((v, k) => { p += `<circle cx="${x(k).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${k === n - 1 ? 4 : 2.2}" fill="${s.color}"><title>${esc(o.labels[k])} · ${esc(s.name)}: ${S(v)}</title></circle>`; });
      const lv = s.vals[n - 1]; if (j === 0) p += `<text x="${x(n - 1) - 6}" y="${y(lv) - 9}" class="ax strong" text-anchor="end">${M(lv)}</text>`;
    });
    o.labels.forEach((lb, k) => { if (n <= 8 || k % Math.ceil(n / 6) === 0 || k === n - 1) p += `<text x="${x(k).toFixed(1)}" y="${H - 9}" class="ax" text-anchor="middle">${esc(lb)}</text>`; });
    const leg = o.series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || 'график')}">${g}${p}</svg>${o.series.length > 1 ? `<div class="legend">${leg}</div>` : ''}`;
  }
  function donut(items, o = {}){
    const tot = items.reduce((a, x) => a + Math.max(0, x.v), 0) || 1; let a0 = -Math.PI / 2; const R = 60, r = 38, c = 70;
    let s = '';
    for (const it of items){ const v = Math.max(0, it.v); if (!v) continue; const a1 = a0 + 2 * Math.PI * v / tot; const big = a1 - a0 > Math.PI ? 1 : 0;
      const p = (rad, ang) => `${(c + rad * Math.cos(ang)).toFixed(2)},${(c + rad * Math.sin(ang)).toFixed(2)}`;
      const full = v / tot > 0.9999;
      s += full ? `<circle cx="${c}" cy="${c}" r="${(R + r) / 2}" fill="none" stroke="${it.c}" stroke-width="${R - r}"/>` : `<path d="M${p(R, a0)}A${R},${R} 0 ${big} 1 ${p(R, a1)}L${p(r, a1)}A${r},${r} 0 ${big} 0 ${p(r, a0)}Z" fill="${it.c}" ${it.go ? `data-go="${esc(it.go)}" class="hit"` : ''}><title>${esc(it.n)}: ${S(v)} (${P(v / tot)})</title></path>`;
      a0 = a1; }
    const leg = items.map(it => `<div ${it.go ? `class="lnkrow" data-go="${esc(it.go)}" tabindex="0"` : ''}><i style="background:${it.c}"></i><span title="${esc(it.n)}">${esc(it.n)}</span><b>${M(it.v)}<small>${P(it.v / tot)}</small></b></div>`).join('');
    return `<div class="donut"><svg viewBox="0 0 140 140" role="img" aria-label="${esc(o.aria || 'структура')}">${s}<text x="70" y="66" text-anchor="middle" class="ax">${esc(o.center || 'всего')}</text><text x="70" y="84" text-anchor="middle" class="dv">${M(tot)}</text></svg><div class="dl">${leg}</div></div>`;
  }
  function hbars(items, o = {}){
    const mx = Math.max(...items.map(x => Math.abs(x.v)), 1);
    return `<div class="hbars">${items.map(it => `<div ${it.go ? `class="lnkrow" data-go="${esc(it.go)}" tabindex="0"` : ''}><span class="n" title="${esc(it.n)}">${esc(it.n)}</span><span class="b"><i style="width:${(Math.abs(it.v) / mx * 100).toFixed(1)}%;background:${it.c || 'var(--accent)'}"></i></span><span class="v">${o.f ? o.f(it.v) : M(it.v)}${it.s ? `<small>${esc(it.s)}</small>` : ''}</span></div>`).join('')}</div>`;
  }
  function spark(vals, color){
    const n = vals.length; if (n < 2) return ''; const mx = Math.max(...vals), mn = Math.min(...vals, 0); const w = 120, h = 30;
    const d = vals.map((v, k) => `${k ? 'L' : 'M'}${(k / (n - 1) * w).toFixed(1)},${(h - 2 - (v - mn) / ((mx - mn) || 1) * (h - 6)).toFixed(1)}`).join('');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}L${w},${h}L0,${h}Z" fill="${color}" opacity=".12"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.6"/></svg>`;
  }

  // ---------- модальное окно ----------
  const stack = [];
  function modal(title, html, o = {}){
    const m = $('#modal'); stack.push({ title, html, o });
    $('#mTitle').textContent = title; $('#mBody').innerHTML = html; $('#mBack').hidden = stack.length < 2;
    m.querySelector('.mbox').classList.toggle('wide', !!o.wide); m.hidden = false; $('#mClose').focus();
    if (o.after) o.after($('#mBody'));
    return $('#mBody');
  }
  function closeModal(){ stack.length = 0; $('#modal').hidden = true; }
  function backModal(){ stack.pop(); const t = stack.pop(); if (t) modal(t.title, t.html, t.o); else closeModal(); }
  function toast(msg, kind){ const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 4200); }

  window.RS_UI = { $, $$, esc, N, N2, M, S, MS, P, MON, MONF, dt, dts, mName, plural, DIRC, dirName, chip, pill, STC, table, TS, TBL, csvOf, bars, area, donut, hbars, spark, modal, closeModal, backModal, toast };
})();
