// RESTART BI · views.js — экраны разделов. Каждый экран — функция (tab) → HTML, все цифры берутся из RS (core.js).
(function(){
  'use strict';
  const R = window.RS, D = R.D, U = R.U, S = R.S, T = R.T;
  const { esc, N, M, S: SS, MS, P, dt, dts, chip, pill, table } = U;
  const V = {};
  const head = (t, sub, right) => `<div class="phead"><div><h1>${esc(t)}</h1><p class="sub">${sub}</p></div>${right ? `<div class="pact">${right}</div>` : ''}</div>`;
  const per = () => `${R.perLabel()}${R.filterLabel() ? ' · ' + esc(R.filterLabel()) : ''}`;
  const tile = (o) => `<button type="button" class="tile${o.dark ? ' dark' : ''}${o.go ? ' lnk' : ''}" ${o.go ? `data-go="${esc(o.go)}"` : 'disabled'} style="${o.c ? `--stripe:${o.c}` : ''}"><span class="t">${esc(o.t)}</span><span class="v">${o.v}</span>${o.d ? `<span class="d">${o.d}</span>` : ''}${o.sp || ''}</button>`;
  const card = (t, body, o = {}) => `<section class="card${o.cls ? ' ' + o.cls : ''}"><div class="chd"><h2>${t}</h2>${o.meta ? `<span class="cmeta">${o.meta}</span>` : ''}</div>${body}</section>`;
  const tabs = (base, cur, items) => `<nav class="tabs" aria-label="Вкладки">${items.map(([k, t]) => `<a href="#${base}${k ? '-' + k : ''}" class="${cur === k ? 'on' : ''}">${esc(t)}</a>`).join('')}</nav>`;
  const delta = (a, b) => { if (!b) return ''; const d = (a - b) / Math.abs(b); return `<b class="${d >= 0 ? 'up' : 'dn'}">${d >= 0 ? '▲' : '▼'} ${P(Math.abs(d))}</b>`; };
  const prevRange = () => { const len = S.to - S.from + 1; return [S.from - len, S.from - 1]; };
  const noCost = () => `<span class="lock" title="Себестоимость и маржа скрыты для роли «${esc(R.role().name)}»">скрыто</span>`;
  const money = v => R.seeCost() ? SS(v) : noCost();
  const linkSo = id => `<a class="doc" href="#" data-go="so:${esc(id)}">${esc(id)}</a>`;
  const clName = id => esc((D.CLI[id] || {}).name || id);
  const mgrName = id => esc((D.MGR.find(m => m.id === id) || {}).name || '—');
  V._ = { head, per, tile, card, tabs, delta, money, noCost, linkSo, clName, mgrName };

  // ======================= ДАШБОРД =======================
  V.dash = function(){
    const x = R.pl(), [pa, pb] = prevRange(), xp = R.pl(pa, pb);
    const cash = R.cashTotal(), arx = R.ar(), apx = R.ap(), st = R.stockAt();
    const act = D.PROJ.filter(pr => R.projVisible(pr) && pr.order && !['Закрыт'].includes(R.projStats(pr).status) && pr.d0 <= S.to);
    const sumSales = (a, b) => R.saleLines(a, b).reduce((s, r) => s + r.rev, 0);
    const dDay = sumSales(S.to, S.to), dWeek = sumSales(S.to - 6, S.to), dMonth = sumSales(D.monthStart(D.mOf(S.to)), S.to);
    const plan = R.planOf(), pf = plan ? x.rev / plan : NaN;
    const ms = R.monthsIn(Math.max(0, S.to - 330), S.to);
    const mrev = ms.map(m => R.saleLines(D.monthStart(m), Math.min(S.to, D.monthStart(m + 1) - 1)).reduce((s, r) => s + r.rev, 0));
    const cost = R.seeCost(), prof = R.seeProfit();
    let h = head('Дашборд', `${per()} · данные на ${dt(S.to)} · нажмите на показатель, чтобы открыть операции`);
    h += `<div class="tiles k12">`;
    h += tile({ t: 'Общая выручка', v: MS(x.rev), d: `${delta(x.rev, xp.rev)} к прошлому периоду · без НДС`, go: 'drill:rev', dark: true, sp: U.spark(mrev, 'var(--spark)') });
    h += cost ? tile({ t: 'Валовая прибыль', v: MS(x.gross), d: `${delta(x.gross, xp.gross)} · выручка − себестоимость товаров и услуг`, go: 'drill:gross', c: 'var(--good)' }) : tile({ t: 'Валовая прибыль', v: noCost(), d: 'доступна уполномоченным ролям' });
    h += cost ? tile({ t: 'Валовая рентабельность', v: P(x.gm), d: `наценка ${P(x.markup)} · прошлый период ${P(xp.gm)}`, go: 'drill:gross' }) : '';
    h += prof ? tile({ t: 'Операционные расходы', v: MS(x.opex), d: `${P(x.opex / x.rev)} выручки${S.dir !== 'all' ? ' · с долей общих расходов' : ''}`, go: 'drill:opex', c: 'var(--warn)' }) : '';
    h += prof ? tile({ t: 'Операционная прибыль', v: MS(x.op), d: `рентабельность ${P(x.om)} · ${delta(x.op, xp.op)}`, go: 'drill:op', c: x.op >= 0 ? 'var(--good)' : 'var(--bad)' }) : '';
    h += R.role().money ? tile({ t: 'Деньги на счетах и в кассах', v: MS(cash), d: `${D.ACC.length} счетов и касс · на ${dt(S.to)}`, go: 'drill:cash' }) : '';
    h += tile({ t: 'Дебиторская задолженность', v: MS(arx.sum), d: `просрочено <b class="dn">${MS(arx.overdue)}</b> · авансы клиентов ${MS(arx.advSum)}`, go: 'drill:ar', c: 'var(--bad)' });
    h += R.role().money ? tile({ t: 'Кредиторская задолженность', v: MS(apx.sum), d: `поставщикам · авансы выданы ${MS(apx.advSum)}`, go: 'drill:ap' }) : '';
    h += cost ? tile({ t: 'Стоимость товарных остатков', v: MS(st.val), d: `${N(st.qty)} ед. на ${new Set(st.rows.map(r => r.wh.id)).size} складах · по себестоимости`, go: 'drill:inv' }) : '';
    h += tile({ t: 'Активные проекты RestArt', v: String(act.length), d: `договоров на ${MS(act.reduce((s, p) => s + (p.contract || 0), 0))}`, go: 'go:projects' });
    h += tile({ t: 'Продажи: день · неделя · месяц', v: `<span class="trio"><span>${M(dDay)}</span><span>${M(dWeek)}</span><span>${M(dMonth)}</span></span>`, d: `на ${dt(S.to)} · 7 дней · ${U.MONF[D.mOf(S.to) % 12]}`, go: 'drill:day' });
    h += tile({ t: 'План / факт продаж', v: P(pf), d: `факт ${MS(x.rev)} из плана ${MS(plan)}`, go: 'go:budget', c: pf >= 1 ? 'var(--good)' : 'var(--warn)' });
    h += `</div>`;
    // разрез по направлениям
    const pd = R.perDir(() => ({ x: R.pl(), pds: R.pds().sum, plan: R.planOf(), ar: R.ar().sum }));
    const rows = [...D.DIRS.map(d => ({ id: d.id, n: d.name, ...pd[d.id] })), { id: 'all', n: 'Итого по компании', ...pd.all }];
    h += card('Направления бизнеса <small>раздельная аналитика, общая база</small>', `<div class="tw"><table class="tbl dirt"><thead><tr><th>Направление</th><th class="num">Выручка</th><th class="num">ПДС</th><th class="num">План</th><th class="num">План/факт</th>${cost ? '<th class="num">Валовая прибыль</th><th class="num">Маржа</th>' : ''}${R.seeProfit() ? '<th class="num">Опер. прибыль</th>' : ''}<th class="num">Дебиторка</th></tr></thead><tbody>${rows.map(r => `<tr class="${r.id === 'all' ? 'total' : 'rowlink'}" ${r.id !== 'all' ? `data-go="dir:${r.id}" tabindex="0"` : ''}><td>${r.id === 'all' ? '<b>Итого</b>' : chip(r.id)}</td><td class="num">${N(r.x.rev)}</td><td class="num">${N(r.pds)}</td><td class="num">${N(r.plan)}</td><td class="num"><span class="${r.x.rev >= r.plan ? 'up' : 'dn'}">${P(r.plan ? r.x.rev / r.plan : NaN)}</span></td>${cost ? `<td class="num">${N(r.x.gross)}</td><td class="num">${P(r.x.gm)}</td>` : ''}${R.seeProfit() ? `<td class="num">${N(r.x.op)}</td>` : ''}<td class="num">${N(r.ar)}</td></tr>`).join('')}</tbody></table></div><p class="note">ПДС — поступление денег от покупателей за тот же период. Операционная прибыль направления включает долю общих расходов пропорционально выручке.</p>`, { meta: 'сом · ' + R.perLabel() });
    // графики
    const m12 = R.monthsIn(Math.max(0, D.monthStart(D.mOf(S.to) - 11)), S.to);
    const byDirMonth = R.perDir(() => m12.map(m => R.saleLines(D.monthStart(m), Math.min(S.to, D.monthStart(m + 1) - 1)).reduce((s, r) => s + r.rev, 0)));
    const ser = (S.dir === 'all' ? D.DIRS : D.DIRS.filter(d => d.id === S.dir)).map(d => ({ name: d.name, color: U.DIRC[d.id], vals: byDirMonth[d.id] }));
    const labels = m12.map(U.mName);
    h += `<div class="two">`;
    h += card('Выручка по месяцам', U.bars({ labels, series: ser, click: k => 'month:' + m12[k], aria: 'выручка по месяцам' }), { meta: '12 месяцев · по направлениям' });
    if (cost){ const g = m12.map(m => R.pl(D.monthStart(m), Math.min(S.to, D.monthStart(m + 1) - 1))); h += card('Динамика валовой прибыли', U.area({ labels, series: [{ name: 'Валовая прибыль', color: 'var(--good)', vals: g.map(z => z.gross) }, ...(R.seeProfit() ? [{ name: 'Операционная прибыль', color: 'var(--accent)', vals: g.map(z => z.op), dash: true }] : [])] }), { meta: 'по месяцам' }); }
    h += card('Продажи по направлениям', U.donut(D.DIRS.map(d => ({ n: d.name, v: pd[d.id].x.rev, c: U.DIRC[d.id], go: 'dir:' + d.id })), { center: 'выручка' }), { meta: R.perLabel() });
    const pfm = m12.map(m => { const [a, b] = [D.monthStart(m), Math.min(S.to, D.monthStart(m + 1) - 1)]; return { f: R.saleLines(a, b).reduce((s, r) => s + r.rev, 0), p: R.planOf(a, b) }; });
    h += card('План / факт продаж', U.bars({ labels, series: [{ name: 'Факт', color: 'var(--accent)', vals: pfm.map(z => z.f) }], line: { name: 'План', color: 'var(--fg-2)', vals: pfm.map(z => z.p), dash: true }, click: k => 'month:' + m12[k] }), { meta: 'по месяцам' });
    if (R.seeProfit()){ const by = {}; for (const r of x.ox) by[r.c.art] = (by[r.c.art] || 0) - r.c.amt * r.share; if (x.proj) by['Прямые затраты проектов'] = x.proj; const it = Object.entries(by).sort((a, b) => b[1] - a[1]); const col = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)', 'var(--fg-3)'];
      h += card('Структура расходов', U.donut(it.map(([n, v], k) => ({ n, v, c: col[Math.min(k, 7)], go: 'art:' + n })), { center: 'расходы' }), { meta: R.perLabel() }); }
    const tp = {}; for (const r of x.L) if (r.l.p){ tp[r.l.p] = tp[r.l.p] || { rev: 0, q: 0, gp: 0 }; tp[r.l.p].rev += r.rev; tp[r.l.p].q += r.q; tp[r.l.p].gp += r.rev - r.cost; }
    h += card('Топ-10 товаров', U.hbars(Object.entries(tp).sort((a, b) => b[1].rev - a[1].rev).slice(0, 10).map(([p, v]) => ({ n: D.PI[p].name, v: v.rev, s: cost ? ' · маржа ' + P(v.gp / v.rev) : ' · ' + N(v.q) + ' ' + D.PI[p].unit, go: 'p:' + p, c: U.DIRC[D.PI[p].dir] }))), { meta: 'по выручке' });
    const tc = {}; for (const r of x.L){ tc[r.o.client] = (tc[r.o.client] || 0) + r.rev; }
    h += card('Топ-10 клиентов', U.hbars(Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, v]) => ({ n: D.CLI[c].name, v, go: 'k:' + c, c: 'var(--c1)' }))), { meta: 'по выручке' });
    const arm = m12.map(m => R.ar(Math.min(S.to, D.monthStart(m + 1) - 1)));
    h += card('Динамика дебиторской задолженности', U.area({ labels, series: [{ name: 'Дебиторка', color: 'var(--bad)', vals: arm.map(z => z.sum) }, { name: 'в т. ч. просрочено', color: 'var(--warn)', vals: arm.map(z => z.overdue), dash: true }] }), { meta: 'на конец месяца' });
    h += `</div>`;
    return h;
  };

  // ======================= ПРОДАЖИ =======================
  const STATUSES = ['Новый', 'Согласование', 'Счёт выставлен', 'Частично оплачен', 'Оплачен', 'Комплектация', 'Отгружен', 'Завершён', 'Отменён', 'Возврат'];
  function orderRow(o){
    const tot = D.orderTotal(o), paid = D.paidOf(o, T), st = D.statusOf(o, T);
    const cost = o.ships.reduce((x, s) => x + s.lines.reduce((y, z) => y + z.q * z.cost, 0), 0) - (o.ret ? o.ret.q * o.ret.cost : 0);
    const rev = D.revOf(o, T); const disc = o.lines.reduce((x, l) => x + Math.round(l.q * l.price * l.disc), 0);
    const qAll = o.lines.reduce((x, l) => x + l.q, 0), qSh = o.lines.reduce((x, l) => x + (l.shipped || 0), 0);
    return { id: o.id, o, d: o.d, dir: o.dir, client: D.CLI[o.client].name, mgr: (D.MGR.find(m => m.id === o.mgr) || {}).name, src: o.src, tot, disc, paid, debt: Math.max(0, rev - paid), adv: Math.max(0, paid - rev), st, gp: rev - cost, cost, rev, part: qSh > 0 && qSh < qAll };
  }
  V.sales = function(tab){
    const rows = D.SALES.filter(o => R.okOrder(o) && R.inPer(o.d) && (!S.wh && !S.cat || o.lines.some(R.okLine))).map(orderRow);
    const stf = R.TSF = R.TSF || {}; const f = stf.sales || '';
    const view = f ? rows.filter(r => r.st === f) : rows;
    const x = R.pl(), pd = R.pds(), plan = R.planOf();
    let h = head('Продажи', `заказы покупателей со склада и под заказ · ${per()}`, R.canEdit('sales') ? `<button type="button" class="btn-p" data-new="sale">+ Новая продажа</button><button type="button" class="btn-s" data-new="payin">+ Оплата от клиента</button>` : '');
    h += `<div class="tiles k4">${tile({ t: 'Продажи (выручка)', v: MS(x.rev), d: `скидки ${MS(x.disc)} · ${N(rows.length)} заказов`, go: 'drill:rev', dark: true })}${tile({ t: 'ПДС — поступления денег', v: MS(pd.sum), d: `${P(x.rev ? pd.sum / x.rev : NaN)} от продаж · авансы учитываются отдельно`, go: 'drill:pds' })}${tile({ t: 'План / факт', v: P(plan ? x.rev / plan : NaN), d: `план ${MS(plan)}`, go: 'go:budget', c: x.rev >= plan ? 'var(--good)' : 'var(--warn)' })}${R.seeCost() ? tile({ t: 'Валовая прибыль продаж', v: MS(x.gross), d: `маржа ${P(x.gm)} · наценка ${P(x.markup)}`, go: 'drill:gross', c: 'var(--good)' }) : tile({ t: 'Средний чек', v: MS(rows.length ? rows.reduce((s, r) => s + r.tot, 0) / rows.length : 0), d: 'по заказам периода' })}</div>`;
    const cnt = {}; for (const r of rows) cnt[r.st] = (cnt[r.st] || 0) + 1;
    h += `<div class="funnel" role="group" aria-label="Статусы заказов"><button type="button" class="${!f ? 'on' : ''}" data-stf="sales:">Все <b>${N(rows.length)}</b></button>${STATUSES.map((s, k) => `<button type="button" class="${f === s ? 'on' : ''}" data-stf="sales:${esc(s)}">${k < 8 ? `<i>${k + 1}</i>` : ''}${esc(s)} <b>${N(cnt[s] || 0)}</b></button>`).join('')}</div>`;
    const cols = [
      { k: 'id', t: 'Заказ', h: r => `<span class="doc">${esc(r.id)}</span>${r.o.live ? ' <span class="pill p-info">новый</span>' : ''}` },
      { k: 'd', t: 'Дата', f: dt }, { k: 'dir', t: 'Направление', h: r => chip(r.dir) }, { k: 'client', t: 'Клиент' }, { k: 'mgr', t: 'Менеджер' }, { k: 'src', t: 'Источник', cls: 'lo' },
      { k: 'tot', t: 'Сумма', num: 1, sum: 1 }, { k: 'disc', t: 'Скидка', num: 1, sum: 1, cls: 'lo' },
      ...(R.seeCost() ? [{ k: 'gp', t: 'Вал. прибыль', num: 1, sum: 1 }] : []),
      { k: 'paid', t: 'Оплачено', num: 1, sum: 1 }, { k: 'debt', t: 'Долг клиента', num: 1, sum: 1, h: r => r.debt ? `<b class="dn">${N(r.debt)}</b>` : '—' },
      { k: 'st', t: 'Статус', h: r => pill(r.st) + (r.part ? ' <span class="pill p-warn">частично отгружен</span>' : '') },
    ];
    h += card('Заказы покупателей', table({ id: 'sales', rows: view, cols, sort: 'd', onRow: r => 'so:' + r.id, ph: 'Номер, клиент, менеджер…' }), { meta: 'Новый → Согласование → Счёт выставлен → Частично оплачен → Оплачен → Комплектация → Отгружен → Завершён' });
    return h;
  };

  // ======================= ПРОЕКТЫ RESTART =======================
  V.projects = function(){
    const list = D.PROJ.filter(R.projVisible).filter(pr => pr.d0 <= S.to);
    let h = head('Проекты RestArt', `комплексное оснащение объектов HoReCa · состояние на ${dt(S.to)}${R.myMgr() ? ' · только мои проекты' : ''}`, R.canEdit('projects') ? `<button type="button" class="btn-s" data-new="projexp">+ Расход по проекту</button>` : '');
    const st = list.map(pr => ({ pr, s: R.projStats(pr) }));
    const sum = k => st.reduce((x, z) => x + (z.s[k] || 0), 0);
    h += `<div class="tiles k4">${tile({ t: 'Проектов', v: String(list.length), d: `активных ${st.filter(z => z.s.status !== 'Закрыт').length} · закрыто ${st.filter(z => z.s.status === 'Закрыт').length}`, dark: true })}${tile({ t: 'Стоимость договоров', v: MS(list.reduce((x, p) => x + (p.contract || 0), 0)), d: `получено оплат ${MS(sum('paid'))}` })}${tile({ t: 'Авансы, не ставшие выручкой', v: MS(sum('adv')), d: 'деньги получены, работы не сданы — это обязательство, не доход', c: 'var(--warn)' })}${R.seeCost() ? tile({ t: 'Итоговая прибыль по факту', v: MS(sum('profit')), d: `план ${MS(st.reduce((x, z) => x + z.s.planProfit, 0))} · выручка ${MS(sum('rev'))}`, c: 'var(--good)' }) : ''}</div>`;
    h += `<div class="objs">`;
    for (const { pr, s } of st.sort((a, b) => b.pr.d0 - a.pr.d0)){
      const stepIdx = D.PSTAT.indexOf(s.status);
      h += `<button type="button" class="obj lnk" data-go="pr:${pr.id}"><span class="hd"><b>${esc(pr.name)}</b>${pill(s.status)}</span><span class="cust">${clName(pr.client)} · ${mgrName(pr.mgr)}</span>
      <span class="steps">${D.PSTAT.map((x, k) => `<i class="${k < stepIdx ? 'ok' : k === stepIdx ? 'now' : ''}" title="${esc(x)}"></i>`).join('')}</span>
      <span class="rows"><span><span>Договор</span><span>${N(pr.contract)}</span></span><span><span>Оплачено · остаток</span><span>${N(s.paid)} · ${N(Math.max(0, s.rest))}</span></span>${R.seeCost() ? `<span><span>План. / факт. себестоимость</span><span>${N(pr.planCost)} / ${N(s.factCost)}</span></span><span><span>Прибыль по факту</span><span class="${s.profit >= 0 ? 'up' : 'dn'}">${N(s.profit)}${s.rev ? ' · ' + P(s.pm) : ''}</span></span>` : ''}<span><span>Сроки</span><span>${dt(pr.d0)} → ${dt(pr.end)}</span></span></span></button>`;
    }
    h += `</div>`;
    if (!list.length) h += `<div class="empty">Нет проектов для выбранных фильтров. Проекты ведёт только направление RestArt.</div>`;
    return h;
  };

  // ======================= ТОВАРЫ =======================
  function prodRow(p){
    const st = Object.values(p.stock).reduce((x, y) => x + y, 0), res = Object.values(p.res).reduce((x, y) => x + y, 0);
    const pr = D.priceAt(p, S.to); const s = D.SUP.find(x => x.id === p.sup);
    const buyK = p.buy * D.fx(p.cur, S.to); const cost = p.avg || buyK * 1.15; const extra = Math.max(0, cost - buyK);
    return { id: p.id, p, sku: p.sku, ean: p.ean, name: p.name, brand: p.brand, cat: p.cat, sub: p.sub, unit: p.unit, buyK, extra, cost, opt: pr.opt, retail: pr.retail, min: pr.min, mk: (pr.retail - cost) / cost, gm: (pr.retail - cost) / pr.retail, st, res, avail: st - res, sup: s.name, war: p.war, status: p.status, dir: p.dir };
  }
  V.goods = function(tab){
    tab = tab || 'list';
    const rows = D.P.filter(p => R.okDir(p.dir) || (S.dir === 'RA' && p.dir === 'KM')).filter(p => !S.cat || p.cat === S.cat).map(prodRow);
    let h = head('Товары и номенклатура', `единый справочник для всех направлений · ${N(rows.length)} позиций · цены на ${dt(S.to)}`);
    h += tabs('goods', tab, [['list', 'Справочник'], ['prices', 'Прайс-листы'], ['hist', 'История цен']]);
    if (tab === 'prices'){
      h += card('Прайс-листы', table({ id: 'prices', rows, cols: [{ k: 'sku', t: 'Артикул', h: r => `<span class="doc">${esc(r.sku)}</span>` }, { k: 'name', t: 'Наименование' }, { k: 'cat', t: 'Категория', cls: 'lo' }, ...(R.seeCost() ? [{ k: 'cost', t: 'Себестоимость', num: 1 }] : []), { k: 'opt', t: 'Оптовая', num: 1 }, { k: 'retail', t: 'Розничная', num: 1 }, { k: 'min', t: 'Минимальная', num: 1 }, ...(R.seeCost() ? [{ k: 'mk', t: 'Наценка', num: 1, f: P }] : [])], sort: 'name', sortDir: 1, onRow: r => 'p:' + r.id }), { meta: 'розничный · оптовый · минимально допустимая цена (ниже — только с разрешения)' });
      return h;
    }
    if (tab === 'hist'){
      const hr = []; for (const p of D.P) p.priceHist.forEach((x, j) => { if (j && (R.okDir(p.dir) || S.dir === 'RA')) hr.push({ d: x.from, sku: p.sku, name: p.name, was: p.priceHist[j - 1].retail, now: x.retail, ch: x.retail / p.priceHist[j - 1].retail - 1, who: x.who, reason: x.reason, id: p.id }); });
      h += card('История изменения цен', table({ id: 'phist', rows: hr, cols: [{ k: 'd', t: 'Дата', f: dt }, { k: 'sku', t: 'Артикул' }, { k: 'name', t: 'Товар' }, { k: 'was', t: 'Было', num: 1 }, { k: 'now', t: 'Стало', num: 1 }, { k: 'ch', t: 'Изменение', num: 1, f: P }, { k: 'who', t: 'Кто' }, { k: 'reason', t: 'Основание' }], sort: 'd', onRow: r => 'p:' + r.id }), { meta: 'каждое изменение цены сохраняется — старые цены не перезаписываются' });
      return h;
    }
    const cols = [
      { k: 'sku', t: 'Артикул', h: r => `<span class="doc">${esc(r.sku)}</span>` }, { k: 'name', t: 'Наименование' }, { k: 'brand', t: 'Бренд', cls: 'lo' }, { k: 'cat', t: 'Категория', cls: 'lo' },
      ...(R.seeCost() ? [{ k: 'buyK', t: 'Закупка', num: 1 }, { k: 'extra', t: 'Доп. затраты', num: 1, cls: 'lo' }, { k: 'cost', t: 'Факт. себест.', num: 1 }] : []),
      { k: 'retail', t: 'Розница', num: 1 }, ...(R.seeCost() ? [{ k: 'mk', t: 'Наценка', num: 1, f: P }, { k: 'gm', t: 'Маржа', num: 1, f: P, cls: 'lo' }] : []),
      { k: 'st', t: 'Остаток', num: 1, sum: 1 }, { k: 'res', t: 'Резерв', num: 1, sum: 1 }, { k: 'avail', t: 'Доступно', num: 1, sum: 1, h: r => `<b class="${r.avail <= 0 ? 'dn' : ''}">${N(r.avail)}</b>` },
    ];
    h += card('Справочник товаров', table({ id: 'goods', rows, cols, sort: 'name', sortDir: 1, onRow: r => 'p:' + r.id, ph: 'Артикул, штрихкод, название, бренд…', extra: `<select id="gcat" data-filter="cat" aria-label="Категория"><option value="">Все категории</option>${R.CATS.map(c => `<option ${S.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>` }), { meta: 'Фактическая себестоимость = закупка + распределённые доп. затраты · Доступно = остаток − резерв' });
    return h;
  };

  // ======================= СКЛАД =======================
  V.stock = function(tab){
    tab = tab || 'rest';
    let h = head('Складской учёт', `${D.WH.length} складов · ${per()}`, R.canEdit('stock') ? `<button type="button" class="btn-p" data-new="receipt">+ Приход</button><button type="button" class="btn-s" data-new="transfer">Перемещение</button><button type="button" class="btn-s" data-new="writeoff">Списание</button><button type="button" class="btn-s" data-new="adjust">Корректировка</button>` : '');
    h += tabs('stock', tab, [['rest', 'Остатки'], ['card', 'Складская карточка'], ['log', 'Журнал операций'], ['slow', 'Неликвид']]);
    if (tab === 'rest'){
      const st = R.stockAt();
      const whs = D.WH.filter(w => R.okDir(w.dir));
      h += `<div class="tiles k5">${whs.map(w => { const rr = st.rows.filter(r => r.wh.id === w.id); return tile({ t: w.name, v: R.seeCost() ? MS(rr.reduce((x, r) => x + r.val, 0)) : N(rr.reduce((x, r) => x + r.q, 0)) + ' ед.', d: `${N(rr.filter(r => r.q > 0).length)} позиций · резерв ${N(rr.reduce((x, r) => x + r.res, 0))} ед.`, go: 'wh:' + w.id, c: U.DIRC[w.dir] }); }).join('')}</div>`;
      h += card('Остатки по складам', table({ id: 'rest', rows: st.rows.filter(r => r.q !== 0), cols: [{ k: 'sku', t: 'Артикул', v: r => r.p.sku, h: r => `<span class="doc">${esc(r.p.sku)}</span>` }, { k: 'n', t: 'Товар', v: r => r.p.name }, { k: 'w', t: 'Склад', v: r => r.wh.short }, { k: 'q', t: 'Остаток', num: 1, sum: 1 }, { k: 'res', t: 'Резерв', num: 1, sum: 1 }, { k: 'avail', t: 'Доступно', num: 1, sum: 1 }, ...(R.seeCost() ? [{ k: 'val', t: 'Стоимость, сом', num: 1, sum: 1 }] : [])], sort: 'val', onRow: r => 'sc:' + r.p.id + ':' + r.wh.id }), { meta: `на ${dt(S.to)}${S.to !== T ? ' · резерв показывается только на сегодня' : ''}` });
      return h;
    }
    if (tab === 'card'){
      const sel = R.SC = R.SC || { p: D.P[1].id, wh: 'W1' };
      const c = R.stockCard(sel.p, sel.wh);
      const p = D.PI[sel.p];
      h += `<div class="frow card"><label class="fld">Товар<select id="scp" data-sc="p">${D.P.map(x => `<option value="${x.id}" ${x.id === sel.p ? 'selected' : ''}>${esc(x.sku + ' · ' + x.name)}</option>`).join('')}</select></label><label class="fld">Склад<select id="scw" data-sc="wh"><option value="">Все склады</option>${D.WH.map(w => `<option value="${w.id}" ${w.id === sel.wh ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select></label></div>`;
      const kv = [['Товар', esc(p.name)], ['Начальный остаток', N(c.open) + ' ' + p.unit + ' на ' + dt(S.from)], ['Приход', '+' + N(c.inQ)], ['Расход', '−' + N(c.outQ)], ['Резерв', N(c.res) + (S.to !== T ? ' (на сегодня)' : '')], ['Доступно', '<b>' + N(c.avail) + '</b> = остаток − резерв'], ['Конечный остаток', '<b>' + N(c.end) + '</b> на ' + dt(S.to)], ['Стоимость остатка', R.seeCost() ? SS(c.endV) : noCost()]];
      h += `<div class="two">${card('Складская карточка', `<dl class="kv">${kv.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`, { meta: R.perLabel() })}${card('Движение за период', table({ id: 'scrows', rows: c.rows, cols: [{ k: 'd', t: 'Дата', f: dt }, { k: 'type', t: 'Операция' }, { k: 'doc', t: 'Документ', h: r => `<span class="doc">${esc(r.doc)}</span>` }, { k: 'wh', t: 'Склад', v: r => D.WH.find(w => w.id === r.wh).short }, { k: 'q', t: 'Кол-во', num: 1, h: r => `<b class="${r.q > 0 ? 'up' : 'dn'}">${r.q > 0 ? '+' : ''}${N(r.q)}</b>` }, { k: 'who', t: 'Кто', cls: 'lo' }, { k: 'note', t: 'Основание', cls: 'lo' }], sort: 'd', pageSize: 12 }))}</div>`;
      return h;
    }
    if (tab === 'slow'){
      const st = R.stockAt(); const last = {};
      for (const m of D.MOVES) if (m.q < 0 && m.type === 'Продажа и отгрузка') last[m.p + '|' + m.wh] = Math.max(last[m.p + '|' + m.wh] || 0, m.d);
      const rows = st.rows.filter(r => r.q > 0).map(r => { const l = last[r.p.id + '|' + r.wh.id]; return { ...r, last: l, days: l ? S.to - l : S.to }; }).filter(r => r.days >= 60);
      h += card('Неликвидные и медленно оборачиваемые товары', table({ id: 'slow', rows, cols: [{ k: 'n', t: 'Товар', v: r => r.p.name }, { k: 'w', t: 'Склад', v: r => r.wh.short }, { k: 'q', t: 'Остаток', num: 1, sum: 1 }, ...(R.seeCost() ? [{ k: 'val', t: 'Стоимость', num: 1, sum: 1 }] : []), { k: 'last', t: 'Последняя продажа', h: r => r.last ? dt(r.last) : 'не было' }, { k: 'days', t: 'Дней без продаж', num: 1, h: r => `<b class="${r.days > 120 ? 'dn' : 'wn'}">${N(r.days)}</b>` }], sort: 'days', onRow: r => 'sc:' + r.p.id + ':' + r.wh.id }), { meta: 'нет отгрузок 60 дней и больше' });
      return h;
    }
    const types = ['Приход товара', 'Продажа и отгрузка', 'Перемещение', 'Возврат от клиента', 'Возврат поставщику', 'Списание', 'Инвентаризация', 'Корректировка остатков', 'Начальный остаток'];
    const tf = (R.TSF = R.TSF || {}).log || '';
    const rows = D.MOVES.filter(m => R.inPer(m.d) && R.okDir(m.dir) && (!S.wh || m.wh === S.wh) && (!tf || m.type === tf));
    h += `<div class="funnel"><button type="button" class="${!tf ? 'on' : ''}" data-stf="log:">Все</button>${types.map(t => `<button type="button" class="${tf === t ? 'on' : ''}" data-stf="log:${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
    h += card('Журнал складских операций', table({ id: 'mlog', rows, cols: [{ k: 'd', t: 'Дата', f: dt }, { k: 'type', t: 'Операция' }, { k: 'doc', t: 'Документ', h: r => `<span class="doc">${esc(r.doc)}</span>${r.live ? ' ' + pill(r.reversed || r.isRev ? 'сторно' : 'проведено') : ''}` }, { k: 'p', t: 'Товар', v: r => D.PI[r.p].name }, { k: 'wh', t: 'Склад', v: r => D.WH.find(w => w.id === r.wh).short }, { k: 'q', t: 'Кол-во', num: 1, h: r => `<b class="${r.q > 0 ? 'up' : 'dn'}">${r.q > 0 ? '+' : ''}${N(r.q)}</b>` }, ...(R.seeCost() ? [{ k: 'sum', t: 'Сумма', num: 1, v: r => r.q * r.cost }] : []), { k: 'who', t: 'Пользователь' }, { k: 'note', t: 'Основание' }], sort: 'd', onRow: r => 'sc:' + r.p + ':' + r.wh }), { meta: 'дата, пользователь, основание и документ — у каждой операции; проведённое не удаляется' });
    return h;
  };

  // ======================= ЗАКУПКИ =======================
  V.purch = function(){
    const rows = D.PURCH.filter(po => R.okDir(po.dir) && (R.inPer(po.d) || (po.d < S.from && (po.fact == null || po.fact >= S.from)))).map(po => ({ id: po.id, po, d: po.d, dir: po.dir, sup: D.SUP.find(s => s.id === po.sup).name, cur: po.cur, val: po.lines.reduce((x, l) => x + l.q * l.price, 0), total: po.total, extra: po.extra, rule: po.rule, plan: po.plan, fact: po.fact, paid: po.pays.filter(p => p.d <= T).reduce((x, p) => x + p.amt, 0), stage: po.stage, project: po.project }));
    rows.forEach(r => r.debt = (r.fact != null ? r.total : 0) - r.paid);
    const f = (R.TSF = R.TSF || {}).purch || ''; const view = f ? rows.filter(r => r.stage === f) : rows;
    let h = head('Закупки', `работа с поставщиками · ${per()}`, R.canEdit('purch') ? `<button type="button" class="btn-p" data-new="po">+ Заявка на закупку</button>` : '');
    const cnt = {}; for (const r of rows) cnt[r.stage] = (cnt[r.stage] || 0) + 1;
    h += `<div class="funnel"><button type="button" class="${!f ? 'on' : ''}" data-stf="purch:">Все <b>${rows.length}</b></button>${D.STAGES.map((s, k) => `<button type="button" class="${f === s ? 'on' : ''}" data-stf="purch:${esc(s)}"><i>${k + 1}</i>${esc(s)} <b>${cnt[s] || 0}</b></button>`).join('')}</div>`;
    h += card('Закупки у поставщиков', table({ id: 'purch', rows: view, cols: [{ k: 'id', t: 'Номер', h: r => `<span class="doc">${esc(r.id)}</span>` }, { k: 'd', t: 'Дата заказа', f: dt }, { k: 'dir', t: 'Направление', h: r => chip(r.dir) + (r.project ? ` <small>${esc(r.project)}</small>` : '') }, { k: 'sup', t: 'Поставщик' }, { k: 'val', t: 'Сумма в валюте', num: 1, h: r => N(r.val) + ' ' + r.cur }, ...(R.seeCost() ? [{ k: 'extra', t: 'Доп. затраты', num: 1, sum: 1, cls: 'lo' }, { k: 'total', t: 'Итог. себестоимость', num: 1, sum: 1 }] : []), { k: 'rule', t: 'Распределение', cls: 'lo', h: r => 'по ' + esc(r.rule) }, { k: 'plan', t: 'План / факт поступления', h: r => dts(r.plan) + ' / ' + (r.fact != null ? `<b class="${r.fact > r.plan ? 'dn' : 'up'}">${dts(r.fact)}</b>` : '—') }, { k: 'paid', t: 'Оплачено', num: 1, sum: 1 }, { k: 'debt', t: 'Долг поставщику', num: 1, sum: 1, h: r => r.debt > 0 ? `<b class="dn">${N(r.debt)}</b>` : r.debt < 0 ? `<small>аванс ${N(-r.debt)}</small>` : '—' }, { k: 'stage', t: 'Этап', h: r => pill(r.stage) }], sort: 'd', onRow: r => 'po:' + r.id }), { meta: 'Заявка → Согласование → Заказ поставщику → Оплата → Доставка → Приёмка → Закрытие' });
    return h;
  };

  window.RS_VIEWS = V;
})();
