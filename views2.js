// RESTART BI · views2.js — финансы, ДДС, ОПиУ, взаиморасчёты, контрагенты, Битрикс24, план-факт.
(function(){
  'use strict';
  const R = window.RS, D = R.D, U = R.U, S = R.S, T = R.T, V = window.RS_VIEWS;
  const { esc, N, M, S: SS, MS, P, dt, dts, chip, pill, table } = U;
  const { head, per, tile, card, tabs, noCost, clName, mgrName } = V._;

  // ======================= ФИНАНСЫ И ДДС =======================
  const IN_T = ['Приход денег', 'Оплата от клиента'];
  V.cash = function(tab){
    tab = tab || 'log';
    let h = head('Финансы и ДДС', `движение денежных средств · ${per()}`, R.canEdit('cash') ? `<button type="button" class="btn-p" data-new="cashout">+ Расход денег</button><button type="button" class="btn-s" data-new="cashin">+ Приход денег</button><button type="button" class="btn-s" data-new="xfer">Перевод между счетами</button>` : '');
    h += tabs('cash', tab, [['log', 'Журнал ДДС'], ['acc', 'Остатки по счетам'], ['dds', 'Отчёт ДДС'], ['art', 'Расходы по статьям'], ['inc', 'Доходы по направлениям']]);
    const rows = R.cashRows();
    if (tab === 'acc'){
      const accs = D.ACC.map(a => ({ a, open: R.accBal(a.id, S.from - 1), in: rows.filter(c => c.acc === a.id && c.amt > 0 && !c.storno).reduce((x, c) => x + c.amt, 0), out: -rows.filter(c => c.acc === a.id && c.amt < 0 && !c.storno).reduce((x, c) => x + c.amt, 0), end: R.accBal(a.id, S.to), cur: R.accBalCur(a.id, S.to) }));
      h += `<div class="tiles k5">${accs.map(z => tile({ t: z.a.name, v: MS(z.end), d: z.a.cur !== 'KGS' ? `${N(z.cur)} ${z.a.cur} · в сомах по курсу операций` : z.a.kind, go: 'acc:' + z.a.id })).join('')}</div>`;
      h += card('Остатки денег по кассам и счетам', table({ id: 'accs', rows: accs, search: false, cols: [{ k: 'n', t: 'Касса / счёт', v: z => z.a.name }, { k: 'c', t: 'Валюта', v: z => z.a.cur }, { k: 'open', t: 'На начало', num: 1, sum: 1 }, { k: 'in', t: 'Приход', num: 1, sum: 1 }, { k: 'out', t: 'Расход', num: 1, sum: 1 }, { k: 'end', t: 'На конец', num: 1, sum: 1 }], onRow: z => 'acc:' + z.a.id, all: true }), { meta: `сом · ${R.perLabel()}${S.dir !== 'all' ? ' · остатки — по всей компании' : ''}` });
      return h;
    }
    if (tab === 'dds' || tab === 'art' || tab === 'inc'){
      const ms = R.monthsIn();
      const grp = {};
      const sec = c => c.type === 'Перевод между счетами' ? 'Переводы между своими счетами' : c.amt > 0 ? 'Поступления' : (c.art === 'Оплата поставщикам товара' || c.art === 'Доставка и таможня закупок') ? 'Выплаты: закупки' : R.PROJ_ART.includes(c.art) ? 'Выплаты: проекты' : 'Выплаты: операционные';
      for (const c of rows){ if (c.storno) continue; if (tab === 'art' && (c.amt > 0 || c.type === 'Перевод между счетами')) continue; if (tab === 'inc' && !(c.amt > 0 && c.type !== 'Перевод между счетами')) continue;
        const k = tab === 'inc' ? c.dir : sec(c) + '|' + c.art; grp[k] = grp[k] || { k, sec: tab === 'inc' ? 'Доходы' : sec(c), art: tab === 'inc' ? U.dirName(c.dir) : c.art, m: {}, s: 0 }; const m = D.mOf(c.d); grp[k].m[m] = (grp[k].m[m] || 0) + c.amt; grp[k].s += c.amt; }
      const list = Object.values(grp).sort((a, b) => a.sec.localeCompare(b.sec) || Math.abs(b.s) - Math.abs(a.s));
      const show = ms.slice(-12);
      const cols = [{ k: 'sec', t: 'Раздел', cls: 'lo' }, { k: 'art', t: tab === 'inc' ? 'Направление' : 'Статья ДДС' }, ...show.map(m => ({ k: 'm' + m, t: U.mName(m), num: 1, v: r => Math.abs(r.m[m] || 0), sum: 1 })), { k: 's', t: 'Итого', num: 1, v: r => tab === 'dds' ? r.s : Math.abs(r.s), sum: 1 }];
      const netIn = rows.filter(c => !c.storno && c.type !== 'Перевод между счетами').reduce((x, c) => x + c.amt, 0);
      const xf = rows.filter(c => !c.storno && c.type === 'Перевод между счетами').reduce((x, c) => x + c.amt, 0);
      h += card(tab === 'dds' ? 'Отчёт о движении денежных средств' : tab === 'art' ? 'Расходы по статьям' : 'Доходы по направлениям', table({ id: 'dds-' + tab, rows: list, cols, onRow: r => 'art:' + r.art, pageSize: 40 }) + (tab === 'dds' ? `<p class="note">Чистый денежный поток периода: <b>${SS(netIn)}</b>. Переводы между своими счетами в сумме дают <b>${SS(xf)}</b> — они не являются ни доходом, ни расходом и не попадают в выручку.</p>` : ''), { meta: `сом · ${show.length < ms.length ? 'последние 12 месяцев периода, итого — за весь период' : R.perLabel()}` });
      return h;
    }
    const tf = (R.TSF = R.TSF || {}).cash || '';
    const types = ['Оплата от клиента', 'Оплата поставщику', 'Операционный расход', 'Расход денег', 'Перевод между счетами', 'Возврат денежных средств', 'Приход денег'];
    const v = tf ? rows.filter(c => c.type === tf) : rows;
    h += `<div class="funnel"><button type="button" class="${!tf ? 'on' : ''}" data-stf="cash:">Все</button>${types.map(t => `<button type="button" class="${tf === t ? 'on' : ''}" data-stf="cash:${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
    h += card('Журнал движения денежных средств', table({ id: 'cashlog', rows: v, cols: [{ k: 'd', t: 'Дата', f: dt }, { k: 'id', t: 'Номер', h: c => `<span class="doc">${esc(c.id)}</span>${c.live ? ' ' + pill(c.reversed || c.isRev ? 'сторно' : 'проведено') : ''}` }, { k: 'type', t: 'Тип движения' }, { k: 'acc', t: 'Касса / счёт', v: c => D.ACC.find(a => a.id === c.acc).name }, { k: 'dir', t: 'Направление', h: c => c.dir === 'Общие' ? '<small>общие</small>' : chip(c.dir) }, { k: 'art', t: 'Статья ДДС' }, { k: 'ref', t: 'Проект / заказ', cls: 'lo' }, { k: 'cp', t: 'Контрагент' }, { k: 'amt', t: 'Сумма, сом', num: 1, sum: 1, h: c => `<b class="${c.amt > 0 ? 'up' : ''}">${N(c.amt)}</b>` }, { k: 'cur', t: 'Валюта · курс', cls: 'lo', h: c => c.cur === 'KGS' ? 'сом' : `${U.N2(c.amtCur)} ${c.cur} · ${U.N2(c.rate)}` }, { k: 'basis', t: 'Основание', cls: 'lo' }, { k: 'who', t: 'Ответственный', cls: 'lo' }], sort: 'd', onRow: c => 'cash:' + c.id }), { meta: 'аванс клиента — это деньги, но не выручка: выручка признаётся при отгрузке или акте' });
    return h;
  };

  // ======================= ОПиУ =======================
  V.pl = function(){
    if (!R.seeProfit()) return head('ОПиУ (P&L)', 'отчёт о прибылях и убытках') + `<div class="banner-warn">Общая прибыль компании доступна только собственнику и бухгалтеру.</div>`;
    const ms = R.monthsIn(); const show = ms.slice(-12);
    const cols = show.map(m => { const [a, b] = R.mRange(m); return { m, x: R.pl(a, b) }; });
    const tot = R.pl();
    const pd = R.perDir(() => R.pl());
    const line = (name, f, o = {}) => `<tr class="${o.cls || ''}"><td class="pl-n">${o.go ? `<a href="#" data-go="${o.go}">${esc(name)}</a>` : esc(name)}</td>${cols.map(c => `<td class="num xl">${o.p ? P(f(c.x)) : N(f(c.x))}</td>`).join('')}<td class="num">${o.p ? P(f(tot)) : N(f(tot))}</td>${S.dir === 'all' ? D.DIRS.map(d => `<td class="num">${o.p ? P(f(pd[d.id])) : N(f(pd[d.id]))}</td>`).join('') : ''}</tr>`;
    const arts = [...new Set(tot.ox.map(r => r.c.art))];
    let h = head('ОПиУ (P&L)', `отчёт о прибылях и убытках · ${per()} · метод начисления`);
    let t = `<div class="tw"><table class="tbl pl"><thead><tr><th>Показатель</th>${cols.map(c => `<th class="num xl">${U.mName(c.m)}</th>`).join('')}<th class="num">Итого</th>${S.dir === 'all' ? D.DIRS.map(d => `<th class="num">${esc(d.name)}</th>`).join('') : ''}</tr></thead><tbody>`;
    t += line('Выручка', x => x.rev, { cls: 'sec', go: 'drill:rev' });
    t += line('Себестоимость товаров', x => -x.cogs, { cls: 'sub' });
    t += line('Прямые затраты проектов (логистика, монтаж, подрядчики)', x => -x.proj, { cls: 'sub' });
    t += line('Валовая прибыль', x => x.gross, { cls: 'tot', go: 'drill:gross' });
    t += line('Валовая маржа', x => x.gm, { cls: 'pct', p: 1 });
    t += `<tr class="sec"><td class="pl-n">Операционные расходы</td>${cols.map(c => `<td class="num xl">${N(-c.x.opex)}</td>`).join('')}<td class="num">${N(-tot.opex)}</td>${S.dir === 'all' ? D.DIRS.map(d => `<td class="num">${N(-pd[d.id].opex)}</td>`).join('') : ''}</tr>`;
    for (const a of arts){ const f = x => x.ox.filter(r => r.c.art === a).reduce((s, r) => s + r.c.amt * r.share, 0); t += line(a, f, { cls: 'sub', go: 'art:' + a }); }
    t += line('Операционная прибыль', x => x.op, { cls: 'tot net', go: 'drill:op' });
    t += line('Операционная рентабельность', x => x.om, { cls: 'pct', p: 1 });
    t += `</tbody></table></div>`;
    h += card('Отчёт о прибылях и убытках', t, { meta: `сом${show.length < ms.length ? ' · колонки — последние 12 месяцев' : ''}${S.dir === 'all' ? ' · справа — по направлениям, общие расходы распределены по выручке' : ''}` });
    // сверка ДДС ↔ ОПиУ
    const pdx = R.pds(), a0 = R.ar(S.from - 1), a1 = R.ar(S.to);
    h += card('Почему деньги ≠ прибыль <small>сверка выручки и поступлений</small>', `<dl class="kv"><dt>Выручка (ОПиУ)</dt><dd>${SS(tot.rev)}</dd><dt>Поступления от покупателей (ДДС)</dt><dd>${SS(pdx.sum)}</dd><dt>Рост дебиторки за период</dt><dd>${SS(a1.sum - a0.sum)} — отгружено, ещё не оплачено</dd><dt>Рост авансов полученных</dt><dd>${SS(a1.advSum - a0.advSum)} — оплачено, ещё не отгружено: <b>не выручка</b></dd><dt>Проверка</dt><dd>${(() => { const d = tot.rev - pdx.sum - (a1.sum - a0.sum) + (a1.advSum - a0.advSum); return Math.abs(d) < 2 ? '<b class="up">сходится до сома</b>' : `<b class="dn">расхождение ${SS(d)}</b>`; })()}</dd></dl>`);
    return h;
  };

  // ======================= ВЗАИМОРАСЧЁТЫ =======================
  const BUCK = [[0, 0, 'в срок'], [1, 30, '1–30 дн.'], [31, 60, '31–60 дн.'], [61, 90, '61–90 дн.'], [91, 1e9, '91+ дн.']];
  V.settle = function(tab){
    tab = tab || 'ar';
    let h = head('Взаиморасчёты', `дебиторская и кредиторская задолженность на ${dt(S.to)}${R.filterLabel() ? ' · ' + esc(R.filterLabel()) : ''}`);
    h += tabs('settle', tab, [['ar', 'Дебиторская'], ['ap', 'Кредиторская'], ['adv', 'Авансы'], ['act', 'Акт сверки']]);
    if (tab === 'ar'){
      const a = R.ar();
      h += `<div class="tiles k5">${BUCK.map(([x, y, n], k) => { const v = a.debt.filter(r => r.late >= x && r.late <= y).reduce((s, r) => s + r.bal, 0); return tile({ t: n, v: MS(v), d: `${a.debt.filter(r => r.late >= x && r.late <= y).length} документов`, c: `var(--age-${k})` }); }).join('')}</div>`;
      h += card('Дебиторская задолженность', table({ id: 'ar', rows: a.debt, cols: [{ k: 'c', t: 'Клиент', v: r => D.CLI[r.o.client].name }, { k: 'n', t: 'Заказ / проект', v: r => r.o.project || r.o.id, h: r => `<span class="doc">${esc(r.o.id)}</span>${r.o.project ? ' <small>' + esc(r.o.project) + '</small>' : ''}` }, { k: 'dir', t: 'Направление', v: r => r.o.dir, h: r => chip(r.o.dir) }, { k: 'rev', t: 'Сумма реализации', num: 1, sum: 1 }, { k: 'paid', t: 'Сумма оплат', num: 1, sum: 1 }, { k: 'bal', t: 'Остаток долга', num: 1, sum: 1, h: r => `<b>${N(r.bal)}</b>` }, { k: 'due', t: 'Срок оплаты', f: dt }, { k: 'late', t: 'Дней просрочки', num: 1, h: r => r.late ? `<b class="${r.late > 60 ? 'dn' : 'wn'}">${r.late}</b>` : '—' }, { k: 'm', t: 'Менеджер', v: r => (D.MGR.find(m => m.id === r.o.mgr) || {}).name }], sort: 'late', onRow: r => 'so:' + r.o.id }), { meta: 'Долг = начисления по реализации − зачтённые оплаты − корректировки' });
      return h;
    }
    if (tab === 'ap'){
      const a = R.ap();
      h += card('Кредиторская задолженность перед поставщиками', table({ id: 'ap', rows: a.debt, cols: [{ k: 's', t: 'Поставщик', v: r => D.SUP.find(s => s.id === r.po.sup).name }, { k: 'n', t: 'Закупка', v: r => r.po.id, h: r => `<span class="doc">${esc(r.po.id)}</span>` }, { k: 'dir', t: 'Направление', v: r => r.po.dir, h: r => chip(r.po.dir) }, { k: 'recv', t: 'Принято товара', num: 1, sum: 1 }, { k: 'paid', t: 'Оплачено', num: 1, sum: 1 }, { k: 'bal', t: 'Долг', num: 1, sum: 1 }, { k: 'due', t: 'Срок', f: dt }, { k: 'late', t: 'Дней просрочки', num: 1 }], sort: 'bal', onRow: r => 'po:' + r.po.id }), { meta: 'подрядчики проектов оплачиваются по факту актов — долгов нет' });
      return h;
    }
    if (tab === 'adv'){
      const a = R.ar(), b = R.ap();
      h += `<div class="two">${card('Авансы полученные от клиентов', table({ id: 'advin', rows: a.adv, cols: [{ k: 'c', t: 'Клиент', v: r => D.CLI[r.o.client].name }, { k: 'n', t: 'Заказ', v: r => r.o.id }, { k: 'v', t: 'Аванс', num: 1, sum: 1, v: r => -r.bal }], sort: 'v', onRow: r => 'so:' + r.o.id }), { meta: 'это обязательство: товар или работы ещё не переданы' })}${card('Авансы выданные поставщикам', table({ id: 'advout', rows: b.adv, cols: [{ k: 's', t: 'Поставщик', v: r => D.SUP.find(s => s.id === r.po.sup).name }, { k: 'n', t: 'Закупка', v: r => r.po.id }, { k: 'v', t: 'Аванс', num: 1, sum: 1, v: r => -r.bal }], sort: 'v', onRow: r => 'po:' + r.po.id }))}</div>`;
      return h;
    }
    // акт сверки
    const sel = R.ACT = R.ACT || { c: D.CL.find(c => c.slow && !c.b2c).id };
    const c = D.CLI[sel.c];
    const ev = [];
    let open = 0;
    for (const o of D.SALES){ if (o.client !== c.id) continue;
      for (const s of o.ships){ const v = s.lines.reduce((x, z) => x + z.rev, 0); if (s.d < S.from) open += v; else if (s.d <= S.to) ev.push({ d: s.d, doc: 'Реализация ' + s.id, deb: v, cre: 0 }); }
      if (o.ret){ if (o.ret.d < S.from) open -= o.ret.amt; else if (o.ret.d <= S.to) ev.push({ d: o.ret.d, doc: 'Возврат ВК-' + o.id, deb: 0, cre: o.ret.amt }); }
      for (const p of o.pays){ if (p.d < S.from) open -= p.amt; else if (p.d <= S.to) ev.push({ d: p.d, doc: (p.amt < 0 ? 'Возврат денег по ' : 'Оплата по ') + o.id, deb: p.amt < 0 ? -p.amt : 0, cre: p.amt > 0 ? p.amt : 0 }); }
    }
    ev.sort((a, b) => a.d - b.d);
    const deb = ev.reduce((x, e) => x + e.deb, 0), cre = ev.reduce((x, e) => x + e.cre, 0), close = open + deb - cre;
    h += `<div class="frow card"><label class="fld">Контрагент<select id="actc" data-act="c">${D.CL.filter(x => !x.b2c).map(x => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label><p class="note">Период акта — из верхнего фильтра: ${R.perLabel()}.</p></div>`;
    h += card(`Акт сверки взаимных расчётов · ${esc(c.name)}`, `<p class="small">между ОсОО «РестАрт» и ${esc(c.name)}${c.inn ? ' (ИНН ' + esc(c.inn) + ')' : ''} за период ${R.perLabel()}</p><div class="tw"><table class="tbl"><thead><tr><th>Дата</th><th>Документ</th><th class="num">Дебет (начислено)</th><th class="num">Кредит (оплачено)</th></tr></thead><tbody><tr class="total"><td>${dt(S.from)}</td><td>Сальдо на начало</td><td class="num">${open > 0 ? N(open) : ''}</td><td class="num">${open < 0 ? N(-open) : ''}</td></tr>${ev.map(e => `<tr><td>${dt(e.d)}</td><td>${esc(e.doc)}</td><td class="num">${e.deb ? N(e.deb) : ''}</td><td class="num">${e.cre ? N(e.cre) : ''}</td></tr>`).join('')}<tr class="total"><td></td><td>Обороты за период</td><td class="num">${N(deb)}</td><td class="num">${N(cre)}</td></tr><tr class="total"><td>${dt(S.to)}</td><td>Сальдо на конец</td><td class="num">${close > 0 ? N(close) : ''}</td><td class="num">${close < 0 ? N(-close) : ''}</td></tr></tbody></table></div><p class="note">${close > 0 ? `На ${dt(S.to)} задолженность ${esc(c.name)} перед ОсОО «РестАрт» — <b>${SS(close)}</b>.` : close < 0 ? `На ${dt(S.to)} аванс клиента — <b>${SS(-close)}</b>.` : 'Задолженности нет.'}</p><div class="mact"><button type="button" class="btn-s" data-actcsv="1">⤓ Скачать акт для Excel</button></div>`, { meta: 'формируется автоматически из реализаций и оплат' });
    R._actRows = { c, open, ev, close, deb, cre };
    return h;
  };

  // ======================= КОНТРАГЕНТЫ =======================
  V.parties = function(tab){
    tab = tab || 'cl';
    let h = head('Клиенты и поставщики', 'единый справочник контрагентов · защита от дублей по ИНН, телефону и названию', R.canEdit('parties') ? `<button type="button" class="btn-p" data-new="party">+ Новый контрагент</button>` : '');
    h += tabs('parties', tab, [['cl', 'Клиенты'], ['sup', 'Поставщики и подрядчики']]);
    if (tab === 'sup'){
      const a = R.ap();
      const rows = [...D.SUP.map(s => ({ id: s.id, n: s.name, kind: 'поставщик', country: s.country, cur: s.cur, lead: s.lead + ' дн.', debt: a.debt.filter(r => r.po.sup === s.id).reduce((x, r) => x + r.bal, 0), cnt: D.PURCH.filter(p => p.sup === s.id).length })), ...D.CONTRACTORS.map(c => ({ id: c.id, n: c.name, kind: 'подрядчик', country: 'Кыргызстан', cur: 'KGS', lead: '—', debt: 0, cnt: D.CASH.filter(x => x.cp === c.name).length }))];
      h += card('Поставщики и подрядчики', table({ id: 'sups', rows, cols: [{ k: 'n', t: 'Наименование' }, { k: 'kind', t: 'Тип' }, { k: 'country', t: 'Страна' }, { k: 'cur', t: 'Валюта' }, { k: 'lead', t: 'Срок поставки' }, { k: 'cnt', t: 'Документов', num: 1 }, { k: 'debt', t: 'Кредиторка', num: 1, sum: 1 }], sort: 'cnt', onRow: r => 'sup:' + r.id }));
      return h;
    }
    const a = R.ar(T);
    const rows = D.CL.filter(c => (S.dir === 'all' || c.dirs.includes(S.dir)) && (!R.myMgr() || Object.values(c.mgr).includes(R.myMgr()))).map(c => { const os = D.SALES.filter(o => o.client === c.id); return { id: c.id, c, n: c.name, inn: c.inn, phone: c.phone, city: c.city, dirs: c.dirs, mgr: [...new Set(Object.values(c.mgr))].map(m => D.MGR.find(x => x.id === m).name).join(', '), orders: os.length, rev: os.reduce((x, o) => x + D.revOf(o, T), 0), debt: a.debt.filter(r => r.o.client === c.id).reduce((x, r) => x + r.bal, 0) }; });
    const live = (R.LIVE_PARTIES || []);
    h += card('Клиенты', table({ id: 'cls', rows: [...live, ...rows], cols: [{ k: 'n', t: 'Организация / ФИО', h: r => esc(r.n) + (r.live ? ' <span class="pill p-info">новый</span>' : '') }, { k: 'inn', t: 'ИНН', cls: 'lo' }, { k: 'phone', t: 'Телефон / WhatsApp', cls: 'lo' }, { k: 'city', t: 'Город' }, { k: 'dirs', t: 'Направления', h: r => (r.dirs || []).map(chip).join(' ') }, { k: 'mgr', t: 'Ответственный' }, { k: 'orders', t: 'Заказов', num: 1 }, { k: 'rev', t: 'Покупки', num: 1, sum: 1 }, { k: 'debt', t: 'Долг', num: 1, sum: 1, h: r => r.debt ? `<b class="dn">${N(r.debt)}</b>` : '—' }], sort: 'rev', onRow: r => 'k:' + r.id, ph: 'Название, ИНН, телефон…' }), { meta: R.myMgr() ? 'только мои клиенты' : 'один клиент может работать с несколькими направлениями' });
    return h;
  };

  // ======================= БИТРИКС24 =======================
  V.b24 = function(){
    const deals = D.SALES.filter(o => o.b24 && R.okOrder(o) && o.d >= T - 30).slice(-40).reverse();
    let h = head('Интеграция с Битрикс24', 'Битрикс24 — коммуникации и воронка продаж; RESTART BI — склад, деньги и управленческая отчётность');
    h += `<div class="banner-info">Состояние: <b>макет обмена</b>. Подключение делается на сервере RESTART BI по входящему вебхуку Битрикс24, ключи хранятся только на сервере. Ниже — схема полей и журнал обмена на демо-данных.</div>`;
    h += `<div class="two">${card('Из Битрикс24 → в RESTART BI', `<table class="tbl compact"><tbody>${[['Клиент', 'компания / контакт → справочник контрагентов (поиск дубля по ИНН и телефону)'], ['Контактные данные', 'телефон, WhatsApp, e-mail, адрес'], ['Сделка', 'сделка → заказ покупателя или проект RestArt (ID сделки хранится в документе)'], ['Ответственный менеджер', 'пользователь Битрикс24 → менеджер'], ['Товары и услуги', 'товарные позиции сделки → строки заказа по артикулу'], ['Сумма сделки', 'для сверки с суммой заказа'], ['Направление продаж', 'воронка → RestArt / Klen Market / Italbrands']].map(([a, b]) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`).join('')}</tbody></table>`)}${card('Из RESTART BI → в Битрикс24', `<table class="tbl compact"><tbody>${[['Статус оплаты', 'не оплачен / частично / оплачен — поле сделки'], ['Статус заказа', 'Новый … Завершён, Отменён, Возврат'], ['Наличие товара', 'доступный остаток по складам направления'], ['Статус отгрузки', 'не отгружен / частично / отгружен'], ['Ссылка на счёт', 'номер и ссылка на счёт в RESTART BI']].map(([a, b]) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`).join('')}</tbody></table><p class="note">Защита от дублей: одна сделка — один документ. Повторный вебхук с тем же ID сделки обновляет документ и не создаёт новый.</p>`)}</div>`;
    h += card('Журнал обмена (последние 30 дней)', table({ id: 'b24', rows: deals.map(o => ({ o, id: o.b24, d: o.d, doc: o.id, cl: D.CLI[o.client].name, mgr: (D.MGR.find(m => m.id === o.mgr) || {}).name, sum: D.orderTotal(o), st: D.statusOf(o, T), pay: D.paidOf(o, T) >= D.orderTotal(o) ? 'оплачен' : D.paidOf(o, T) > 0 ? 'частично' : 'не оплачен' })), cols: [{ k: 'd', t: 'Дата', f: dt }, { k: 'id', t: 'Сделка Б24', h: r => `<span class="doc">${esc(r.id)}</span>` }, { k: 'doc', t: 'Документ', h: r => `<span class="doc">${esc(r.doc)}</span>` }, { k: 'cl', t: 'Клиент' }, { k: 'mgr', t: 'Менеджер' }, { k: 'sum', t: 'Сумма', num: 1 }, { k: 'st', t: 'Статус → Б24', h: r => pill(r.st) }, { k: 'pay', t: 'Оплата → Б24' }], sort: 'd', onRow: r => 'so:' + r.doc }), { meta: 'демо: сделки из источника «Bitrix24 · сделка»' });
    return h;
  };

  // ======================= ПЛАН-ФАКТ =======================
  V.budget = function(){
    const x = R.pl(), pd = R.pds();
    let h = head('План-факт и бюджет', `${per()} · рядом с продажами — ПДС и план`);
    const rows = D.MGR.filter(m => R.okDir(m.dir) && (!R.myMgr() || m.id === R.myMgr())).map(m => { const keep = S.mgr; S.mgr = m.id; const r = { id: m.id, n: m.name, dir: m.dir, plan: R.planOf(), fact: R.saleLines().reduce((s, z) => s + z.rev, 0), pds: R.pds().sum, ar: R.ar().sum }; S.mgr = keep; return r; });
    rows.forEach(r => r.pf = r.plan ? r.fact / r.plan : NaN);
    h += card('Продажи по менеджерам: план, факт, ПДС', table({ id: 'pfm', rows, search: false, all: true, cols: [{ k: 'n', t: 'Менеджер' }, { k: 'dir', t: 'Направление', h: r => chip(r.dir) }, { k: 'plan', t: 'План', num: 1, sum: 1 }, { k: 'fact', t: 'Факт продаж', num: 1, sum: 1 }, { k: 'pf', t: 'Выполнение', num: 1, f: P, sum: rr => { const p = rr.reduce((a, r) => a + r.plan, 0); return p ? rr.reduce((a, r) => a + r.fact, 0) / p : NaN; }, sf: P, h: r => `<span class="bar"><i style="width:${Math.min(100, (r.pf || 0) * 100)}%;background:${r.pf >= 1 ? 'var(--good)' : r.pf >= 0.85 ? 'var(--warn)' : 'var(--bad)'}"></i></span> <b>${P(r.pf)}</b>` }, { k: 'pds', t: 'ПДС', num: 1, sum: 1 }, { k: 'ar', t: 'Дебиторка', num: 1, sum: 1 }], sort: 'pf' }), { meta: 'план менеджера — средняя за 3 прошлых месяца + 7 % (RestArt — без роста)' });
    if (R.seeProfit()){
      const ms = R.monthsIn().slice(-12);
      const br = ms.map(m => { const [a, b] = R.mRange(m); const f = R.pl(a, b); const plan = R.planOf(a, b); return { m, plan, fact: f.rev, gplan: plan * 0.34, gfact: f.gross, oplan: plan * 0.34 - f.rev * 0 - (f.opex), ofact: f.op }; });
      h += card('Бюджет: выручка и валовая прибыль, план и факт', table({ id: 'bud', rows: br, search: false, all: true, cols: [{ k: 'm', t: 'Месяц', f: U.mName }, { k: 'plan', t: 'Выручка план', num: 1, sum: 1 }, { k: 'fact', t: 'Выручка факт', num: 1, sum: 1 }, { k: 'd1', t: 'Отклонение', num: 1, v: r => r.fact - r.plan, sum: 1, h: r => `<b class="${r.fact >= r.plan ? 'up' : 'dn'}">${N(r.fact - r.plan)}</b>` }, { k: 'gplan', t: 'Валовая план (34 %)', num: 1, sum: 1 }, { k: 'gfact', t: 'Валовая факт', num: 1, sum: 1 }, { k: 'd2', t: 'Отклонение', num: 1, v: r => r.gfact - r.gplan, sum: 1, h: r => `<b class="${r.gfact >= r.gplan ? 'up' : 'dn'}">${N(r.gfact - r.gplan)}</b>` }] }), { meta: 'целевая валовая маржа бюджета — 34 %' });
    }
    return h;
  };
})();
