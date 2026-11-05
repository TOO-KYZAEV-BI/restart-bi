// RESTART BI · ai-local.js — встроенный режим ИИ-помощника для публичного сайта (GitHub Pages), где нет среды Claude.
// Разбирает вопрос по ключевым словам, вызывает те же инструменты данных, что и Claude (R.AI.TOOLS), и отвечает по данным роли.
// Права проверяют сами инструменты: чужие данные роль не получит. Документы не проводит — только открывает формы и разделы.
(function(){
  'use strict';
  const R = window.RS, D = R.D, U = R.U, S = R.S, T = R.T;
  const tool = name => { const t = (R.AI && R.AI.TOOLS || []).find(x => x.name === name); if (!t) throw new Error('инструмент ' + name + ' недоступен'); return t; };
  const run = (name, inp) => tool(name).execute(inp || {});
  const mn = v => { const a = Math.abs(v || 0); return (a >= 1e6 ? U.M(v) : U.N(v)) + ' сом'; };
  const pc = v => v == null || !isFinite(v) ? '—' : String(v).replace('.', ',') + ' %';
  const has = (t, ...ws) => ws.some(w => t.includes(w));
  const num = (t, re) => { const m = t.match(re); return m ? Number(m[1]) : null; };
  const tbl = (head, rows) => rows.length ? '| ' + head.join(' | ') + ' |\n| ' + head.map(() => '---').join(' | ') + ' |\n' + rows.map(r => '| ' + r.join(' | ') + ' |').join('\n') : '_нет строк_';
  const dirOf = t => has(t, 'italbrands', 'итал') ? 'IB' : has(t, 'klen', 'клен') ? 'KM' : has(t, 'restart', 'рестарт') && !has(t, 'restart bi') ? 'RA' : undefined;
  const cost = () => R.seeCost(), profit = () => R.seeProfit();

  // ---------- ответы ----------
  function kpi(t){
    const k = run('get_kpi', { direction: dirOf(t) });
    const L = [`**Период:** ${k.period} · ${k.filter}`, '', `- Выручка: **${mn(k.revenue)}**` + (k.plan ? ` · план ${mn(k.plan)} · выполнение ${pc(k.plan_done_pct)}` : '') ];
    if (k.gross_profit != null) L.push(`- Валовая прибыль: **${mn(k.gross_profit)}** · маржа ${pc(k.gross_margin_pct)} · наценка ${pc(k.markup_pct)}`);
    if (k.operating_profit != null) L.push(`- Операционные расходы: ${mn(k.opex)} · операционная прибыль: **${mn(k.operating_profit)}** (${pc(k.operating_margin_pct)})`);
    L.push(`- Поступления от покупателей (ПДС): ${mn(k.pds_received_from_customers)}`);
    if (k.cash_total != null) L.push(`- Деньги на счетах и в кассах: **${mn(k.cash_total)}**`);
    L.push(`- Дебиторка: ${mn(k.receivables)}, из них просрочено **${mn(k.receivables_overdue)}** · авансы клиентов (ещё не выручка): ${mn(k.customer_advances_not_revenue)}`);
    if (k.payables != null) L.push(`- Долг поставщикам: ${mn(k.payables)} · авансы поставщикам: ${mn(k.supplier_advances)}`);
    if (k.stock_value != null) L.push(`- Стоимость остатков на складах: ${mn(k.stock_value)}`);
    L.push(`- Активных проектов RestArt: ${k.active_projects}`);
    if (k.discounts) L.push(`- Скидки за период: ${mn(k.discounts)}`);
    return L.join('\n');
  }
  function enoughMoney(){
    const k = run('get_kpi'); if (k.cash_total == null) throw new Error('остатки денег недоступны вашей роли');
    const months = Math.max(1, R.monthsIn().length); const opexM = (k.opex || 0) / months;
    const cover = opexM ? k.cash_total / opexM : Infinity;
    return `**${cover >= 1 ? 'Да, хватит' : 'Нет, не хватит'}.** Деньги на счетах: **${mn(k.cash_total)}**, операционные расходы в среднем **${mn(opexM)} в месяц** (по периоду ${k.period}). Запас — ${isFinite(cover) ? cover.toFixed(1).replace('.', ',') + ' мес.' : 'расходов нет'}.\n\nПросроченная дебиторка ${mn(k.receivables_overdue)} — её сбор добавит денег; долг поставщикам ${k.payables != null ? mn(k.payables) : '—'} уменьшит запас.`;
  }
  function breakdown(by, t, title){
    const top = num(t, /топ[\s-]*(\d+)/) || num(t, /(\d+)\s+(?:лучш|крупн)/) || 10;
    const r = run('sales_breakdown', { by, top, direction: dirOf(t) });
    const head = ['#', title, 'Выручка', 'Заказов']; const hasPlan = r.rows.some(x => x.plan != null), hasPds = r.rows.some(x => x.pds != null), hasM = cost() && r.rows.some(x => x.margin_pct != null);
    if (hasPds) head.push('ПДС'); if (hasPlan) head.push('План', 'Выполнение'); if (hasM) head.push('Маржа');
    const rows = r.rows.map((x, i) => { const row = [String(i + 1), x.name, mn(x.revenue), String(x.orders)]; if (hasPds) row.push(mn(x.pds)); if (hasPlan) row.push(x.plan ? mn(x.plan) : '—', pc(x.plan_done_pct)); if (hasM) row.push(pc(x.margin_pct)); return row; });
    const best = r.rows[0];
    let lead = `**${r.period}** · ${r.filter} · всего ${mn(r.total_revenue)}` + (best ? `. Лидер — **${best.name}** (${mn(best.revenue)}).` : '.');
    if (hasPlan){ const lag = r.rows.filter(x => x.plan && x.plan_done_pct < 100).map(x => x.name); if (lag.length) lead += ` Отстают от плана: ${lag.join(', ')}.`; }
    return lead + '\n\n' + tbl(head, rows) + (r.rows_total > r.rows.length ? `\n\n_Показано ${r.rows.length} из ${r.rows_total}._` : '');
  }
  function months(t){
    const r = run('sales_breakdown', { by: 'month', direction: dirOf(t) }); const rows = r.rows;
    const last = rows[rows.length - 1], prev = rows[rows.length - 2];
    let lead = `**${r.period}** · ${r.filter}.`;
    if (last && prev){ const d = prev.revenue ? (last.revenue - prev.revenue) / prev.revenue : NaN; lead += ` ${last.name}: **${mn(last.revenue)}**, к ${prev.name} ${isFinite(d) ? (d >= 0 ? '+' : '') + (d * 100).toFixed(1).replace('.', ',') + ' %' : '—'}.`; }
    const head = ['Месяц', 'Выручка', 'ПДС', 'План', 'Выполнение']; if (cost()) head.push('Маржа');
    return lead + '\n\n' + tbl(head, rows.slice(-12).map(x => { const row = [x.name, mn(x.revenue), mn(x.pds), x.plan ? mn(x.plan) : '—', pc(x.plan_done_pct)]; if (cost()) row.push(pc(x.margin_pct)); return row; }));
  }
  function receivables(t){
    const ml = num(t, /(\d+)\s*дн/) || (has(t, 'просроч') ? 1 : 0);
    const r = run('receivables', { min_late: ml, direction: dirOf(t), top: 12 });
    const age = Object.entries(r.by_age).map(([k, v]) => `${k}: ${mn(v)}`).join(' · ');
    const lead = `На ${r.as_of} дебиторка **${mn(r.total)}**, просрочено **${mn(r.overdue)}**; авансы клиентов ${mn(r.customer_advances)}.\n\nПо возрасту: ${age}.` + (ml ? `\n\nДолги с просрочкой от ${ml} дн.: ${r.count}.` : '');
    return lead + '\n\n' + tbl(['Клиент', 'Заказ', 'Долг', 'Срок', 'Просрочка, дн', 'Менеджер'], r.debts.map(x => [x.client, x.order, mn(x.debt), x.due, String(x.days_late), x.manager || '—']));
  }
  function payables(){
    const r = run('payables');
    return `На ${r.as_of} долг поставщикам **${mn(r.total)}**, авансы поставщикам ${mn(r.supplier_advances)}.\n\n` + tbl(['Поставщик', 'Закупка', 'Долг', 'Просрочка, дн'], r.debts.map(x => [x.supplier, x.purchase, mn(x.debt), String(x.days_late)]));
  }
  const WH = { 'центральн': 'W1', 'шоурум': 'W2', 'ош': 'W5', 'italbrands': 'W3', 'итал': 'W3', 'проект': 'W4' };
  function stock(t, raw){
    const below = num(t, /меньше\s+(\d+)/) || num(t, /менее\s+(\d+)/);
    let wh; for (const k in WH) if (t.includes(k)) wh = WH[k];
    const quoted = raw.match(/[«"]([^»"]+)[»"]/);
    let q = quoted ? quoted[1] : null;
    if (!q && below == null){ const m = raw.match(/(?:наличии|остат\w*|есть ли|сколько)\s+(.+?)(?:\?|$| на склад)/i); if (m) q = m[1].replace(/^(у нас|в наличии|на складе|ли)\s+/i, '').trim(); }
    const r = run('stock_lookup', { q: q || undefined, warehouse: wh, below: below != null ? below : undefined });
    if (!r.found) return q ? `Товар «${q}» на складах не найден. Уточните название или артикул.` : 'Таких позиций нет.';
    const head = ['Товар', 'Склад', 'Остаток', 'Резерв', 'Доступно', 'Опт', 'Розница']; if (cost()) head.push('Себест.');
    const lead = q ? `По запросу «${q}» найдено позиций: ${r.found}.` : `Позиций с доступным остатком ${below != null ? 'меньше ' + below : ''}: ${r.found}.`;
    return lead + '\n\n' + tbl(head, r.items.map(x => { const row = [x.name, x.warehouse, String(x.stock), String(x.reserved), '**' + x.available + '**', U.N(x.wholesale), U.N(x.retail)]; if (cost()) row.push(U.N(x.unit_cost)); return row; }));
  }
  function slow(t){
    const d = num(t, /(\d+)\s*дн/) || 90; const r = run('slow_stock', { days: d });
    return `Без продаж больше ${d} дней: **${r.count}** позиций.\n\n` + tbl(['Товар', 'Склад', 'Остаток', 'Дней без продаж', 'Последняя продажа'].concat(cost() ? ['Стоимость'] : []), r.items.slice(0, 15).map(x => [x.name, x.warehouse, String(x.qty), String(x.days_without_sales), x.last_sale].concat(cost() ? [mn(x.value)] : [])));
  }
  function projects(t){
    const r = run('projects', { status: has(t, 'закрыт', 'сдан', 'все') ? undefined : 'active' }); let ps = r.projects;
    if (has(t, 'меньше план', 'ниже план', 'хуже план') && cost()) ps = ps.filter(p => p.profit_actual < p.profit_plan);
    const head = ['Проект', 'Клиент', 'Статус', 'Договор', 'Оплачено', 'Остаток']; if (cost()) head.push('Прибыль факт', 'Прибыль план', 'Маржа');
    const lead = has(t, 'меньше план', 'ниже план', 'хуже план') ? `Проектов с прибылью ниже плана: **${ps.length}**.` : `Проектов RestArt: **${ps.length}**` + (ps.length ? ` · оплачено ${mn(ps.reduce((a, p) => a + p.paid, 0))} из ${mn(ps.reduce((a, p) => a + p.contract, 0))} по договорам.` : '.');
    return lead + '\n\n' + tbl(head, ps.slice(0, 15).map(p => { const row = [`${p.name} (${p.id})`, p.client, p.status, mn(p.contract), mn(p.paid), mn(p.rest_to_pay)]; if (cost()) row.push(mn(p.profit_actual), mn(p.profit_plan), pc(p.margin_pct)); return row; }));
  }
  function cash(t){
    const by = has(t, 'по счет', 'по счёт', 'остатки по', 'касс') && !has(t, 'стать') ? 'account' : has(t, 'по тип') ? 'type' : 'article';
    const r = run('cash_flow', { by, direction: dirOf(t) });
    const bal = r.balances_end.map(b => `${b.account}: **${mn(b.balance_kgs)}**` + (b.currency !== 'KGS' ? ` (${U.N(b.balance_in_currency)} ${b.currency})` : '')).join(' · ');
    const inflow = r.groups.reduce((a, g) => a + g.inflow, 0), outflow = r.groups.reduce((a, g) => a + g.outflow, 0);
    const lead = `**${r.period}.** Поступления ${mn(inflow)}, выплаты ${mn(outflow)}, чистый поток **${mn(inflow - outflow)}** (переводы между своими счетами — не доход).\n\nОстатки на конец периода: ${bal}.`;
    return lead + '\n\n' + tbl([by === 'account' ? 'Счёт' : by === 'type' ? 'Тип' : 'Статья', 'Поступления', 'Выплаты', 'Чистый поток'], r.groups.slice(0, 15).map(g => [g.name, mn(g.inflow), mn(g.outflow), mn(g.net)]));
  }
  function revenueVsCash(){
    const k = run('get_kpi'); const diff = k.revenue - k.pds_received_from_customers;
    return `За ${k.period}: выручка **${mn(k.revenue)}**, поступления от покупателей **${mn(k.pds_received_from_customers)}**, разница **${mn(diff)}**.\n\nПричины разницы:\n- дебиторка на конец периода ${mn(k.receivables)} (отгрузили, деньги ещё не пришли), из неё просрочено ${mn(k.receivables_overdue)};\n- авансы клиентов ${mn(k.customer_advances_not_revenue)} (деньги пришли, отгрузки ещё нет — это не выручка);\n- оплаты по отгрузкам прошлых периодов.\n\nВыручка признаётся при отгрузке или акте, деньги — при оплате.`;
  }
  function purchases(t){
    const r = run('purchases', { in_transit: has(t, 'в пути', 'когда прид', 'ожида'), late: has(t, 'опазд', 'опозд', 'задерж'), limit: 15 });
    const head = ['Закупка', 'Поставщик', 'Этап', 'Сумма', 'План прихода', 'Факт', 'Опоздание, дн', 'Оплачено']; if (cost()) head.push('Себест. с доставкой');
    let lead = `Закупок найдено: **${r.found}**.`;
    if (has(t, 'чаще', 'кто из поставщиков')){ const g = {}; for (const p of r.purchases){ g[p.supplier] = g[p.supplier] || { n: 0, late: 0 }; g[p.supplier].n++; if (p.days_late > 0) g[p.supplier].late++; } const worst = Object.entries(g).sort((a, b) => b[1].late - a[1].late)[0]; if (worst) lead += ` Чаще всего опаздывает **${worst[0]}**: ${worst[1].late} из ${worst[1].n} закупок.`; }
    return lead + '\n\n' + tbl(head, r.purchases.map(p => { const row = [p.id, p.supplier, p.stage, p.amount_currency, p.planned_arrival, p.actual_arrival || '—', String(p.days_late), mn(p.paid)]; if (cost()) row.push(mn(p.total_cost)); return row; }));
  }
  function orders(t, raw){
    const st = ['Новый', 'Согласование', 'Счёт выставлен', 'Частично оплачен', 'Оплачен', 'Комплектация', 'Отгружен', 'Завершён', 'Отменён', 'Возврат'].find(s => t.includes(s.toLowerCase()));
    const id = raw.match(/\b(KM|RA|IB|SO)-?\d{3,6}\b/i);
    if (id){ const o = run('get_order', { id: id[0].toUpperCase() });
      return `**Заказ ${o.id}** от ${o.date} · ${o.client} · ${o.direction} · менеджер ${o.manager || '—'} · статус **${o.status}**.\n\nСумма ${mn(o.total)}, признано выручкой ${mn(o.revenue_recognized)}, оплачено ${mn(o.paid)}, долг **${mn(Math.max(0, o.revenue_recognized - o.paid))}**.` + (o.gross_profit != null ? ` Валовая прибыль по отгруженному: ${mn(o.gross_profit)}.` : '') + '\n\n' + tbl(['Позиция', 'Кол-во', 'Отгружено', 'Цена', 'Скидка', 'Сумма'], o.lines.map(l => [l.item, String(l.qty), String(l.shipped), U.N(l.price), l.discount_pct + ' %', mn(l.sum)])); }
    const r = run('find_orders', { status: st, not_shipped: has(t, 'не отгруж', 'ещё не отгруж', 'зависл') && !st, only_debt: has(t, 'долг', 'не оплач'), direction: dirOf(t), limit: 15 });
    return `Заказов найдено: **${r.found}**` + (st ? ` в статусе «${st}»` : '') + '.\n\n' + tbl(['Заказ', 'Дата', 'Клиент', 'Менеджер', 'Сумма', 'Оплачено', 'Долг', 'Статус'], r.orders.map(o => [o.id, o.date, o.client, o.manager || '—', mn(o.total), mn(o.paid), mn(o.debt), o.status]));
  }
  function discounts(t){
    const k = run('get_kpi', { direction: dirOf(t) }); const r = run('sales_breakdown', { by: 'manager', top: 10 });
    return `Скидки за ${k.period}: **${mn(k.discounts)}** при выручке ${mn(k.revenue)} (${k.revenue ? (k.discounts / (k.revenue + k.discounts) * 100).toFixed(1).replace('.', ',') : '—'} % от цены прайса).\n\nПродажи по менеджерам за тот же период:\n\n` + tbl(['Менеджер', 'Выручка', 'Заказов'].concat(cost() ? ['Маржа'] : []), r.rows.map(x => [x.name, mn(x.revenue), String(x.orders)].concat(cost() ? [pc(x.margin_pct)] : [])));
  }
  function access(t){
    const r = run('access_info'); const roleQ = (t.match(/рол[ьи]\s*[«"]?([а-яё\s\/]+?)[»"]?(?:\?|$|\s+вид)/) || [])[1];
    const role = roleQ ? r.roles.find(x => x.role.toLowerCase().includes(roleQ.trim())) : null;
    if (has(t, 'выключ')) return r.switched_off.length ? `Выключенные разделы: ${r.switched_off.join(', ')}.` : 'Сейчас все разделы включены.';
    if (role) return `Роль **${role.role}** видит: ${Object.entries(role.sections).filter(([, v]) => v !== '—').map(([k, v]) => `${k} (${v})`).join(', ')}. Себестоимость: ${role.sees_cost ? 'да' : 'нет'}, прибыль: ${role.sees_profit ? 'да' : 'нет'}.\n\nУровни: П — полный, Б — свой блок, Ч — чтение, С — свои записи.`;
    return `Ваша роль: **${r.current_role}**.\n\n` + tbl(['Роль', 'Себест.', 'Прибыль', 'Разделов'], r.roles.map(x => [x.role, x.sees_cost ? 'да' : 'нет', x.sees_profit ? 'да' : 'нет', String(Object.values(x.sections).filter(v => v !== '—').length)]));
  }
  function audit(){ const r = run('audit_log', { limit: 15 }); return `Последние записи журнала:\n\n` + tbl(['Дата', 'Кто', 'Действие', 'Объект', 'Примечание'], r.map(x => [x.date, x.who || '—', x.action, x.object || '—', x.note || '—'])); }
  function checks(){ const r = run('acceptance_checks'); const ok = r.filter(x => x.passed).length; return `Критерии приёмки: **${ok} из ${r.length}** выполнены.\n\n` + r.map(x => `${x.passed ? '✅' : '❌'} ${x.n}. ${x.criterion} — ${x.details}`).join('\n'); }
  function docForm(t){
    const kind = has(t, 'перемещ') ? 'transfer' : has(t, 'продаж', 'реализац', 'счёт клиенту', 'счет клиенту') ? 'sale' : has(t, 'оплат', 'поступлени') ? 'payin' : has(t, 'приход', 'приём', 'прием') ? 'receipt' : has(t, 'списан') ? 'writeoff' : has(t, 'расход проекта') ? 'projexp' : has(t, 'расход') ? 'cashout' : has(t, 'перевод') ? 'xfer' : has(t, 'контрагент', 'клиента') ? 'party' : null;
    if (!kind) return null;
    run('prepare_document', { kind, fields: {} });
    return 'Открыл форму документа. В этом окне я не заполняю поля по тексту — заполните их и нажмите «Провести». Полное заполнение по описанию работает при открытии RESTART BI в Claude.';
  }
  function help(){
    const ex = R.AI && R.AI.EXPERT && (R.AI.EXPERT[R.role().id] || R.AI.EXPERT.owner);
    return 'Я отвечаю по данным системы в пределах вашей роли. Спросите, например:\n' + (ex ? ex.quick.map(q => '- ' + q).join('\n') : '- Утренняя сводка по компании') + '\n\nПонимаю темы: сводка и показатели, продажи по направлениям / менеджерам / клиентам / товарам / месяцам, дебиторка и кредиторка, остатки и неликвид, проекты, деньги и ДДС, закупки, заказы, скидки, роли и права, журнал, критерии приёмки.';
  }


  const DIRS = [['IB', ['italbrands', 'итал']], ['KM', ['klen', 'клен']], ['RA', ['restart', 'рестарт']]];
  const dirsIn = t => DIRS.filter(([, ws]) => ws.some(w => t.includes(w))).map(([id]) => id);
  function compareDirs(t){
    let ds = dirsIn(t); if (ds.length < 2) ds = ['RA', 'KM', 'IB'];
    const ks = ds.map(d => ({ d, k: run('get_kpi', { direction: d }) }));
    const rowsDef = [['Выручка', k => mn(k.revenue)], ['Выполнение плана', k => pc(k.plan_done_pct)]];
    if (cost()) rowsDef.push(['Валовая прибыль', k => mn(k.gross_profit)], ['Маржа', k => pc(k.gross_margin_pct)]);
    if (profit()) rowsDef.push(['Опер. расходы', k => mn(k.opex)], ['Доля расходов в выручке', k => pc(k.revenue ? Math.round(k.opex / k.revenue * 1000) / 10 : NaN)], ['Опер. прибыль', k => mn(k.operating_profit)], ['Опер. рентабельность', k => pc(k.operating_margin_pct)]);
    rowsDef.push(['ПДС', k => mn(k.pds_received_from_customers)], ['Просроченная дебиторка', k => mn(k.receivables_overdue)]);
    let lead = `**${ks[0].k.period}.** `;
    if (profit() && ks.length >= 2){
      const srt = ks.slice().sort((a, b) => b.k.operating_profit - a.k.operating_profit); const hi = srt[0], lo = srt[srt.length - 1];
      const why = [];
      if (lo.k.revenue < hi.k.revenue) why.push(`выручка ниже в ${(hi.k.revenue / Math.max(1, lo.k.revenue)).toFixed(1).replace('.', ',')} раза (${mn(lo.k.revenue)} против ${mn(hi.k.revenue)})`);
      if (lo.k.gross_margin_pct != null && hi.k.gross_margin_pct != null && lo.k.gross_margin_pct < hi.k.gross_margin_pct) why.push(`валовая маржа ниже (${pc(lo.k.gross_margin_pct)} против ${pc(hi.k.gross_margin_pct)})`);
      const sl = lo.k.revenue ? lo.k.opex / lo.k.revenue : 0, sh = hi.k.revenue ? hi.k.opex / hi.k.revenue : 0;
      if (sl > sh) why.push(`операционные расходы съедают большую долю выручки (${pc(Math.round(sl * 1000) / 10)} против ${pc(Math.round(sh * 1000) / 10)})`);
      lead += `Операционная прибыль **${U.dirName(hi.d)}** ${mn(hi.k.operating_profit)}, **${U.dirName(lo.d)}** ${mn(lo.k.operating_profit)}. ` + (why.length ? `У ${U.dirName(lo.d)} ${why.join('; ')}.` : `Разница объясняется масштабом направления.`);
    } else lead += 'Сравнение направлений по показателям, доступным вашей роли.';
    return lead + '\n\n' + tbl(['Показатель', ...ds.map(d => U.dirName(d))], rowsDef.map(([n, f]) => [n, ...ks.map(x => f(x.k))]));
  }
  function monthDirs(t){
    const ds = ['RA', 'KM', 'IB']; const rows = []; let cur = null, prev = null;
    for (const d of ds){ const r = run('sales_breakdown', { by: 'month', direction: d }); const m = r.rows; const a = m[m.length - 1], b = m[m.length - 2]; if (!a) continue; cur = a.name; prev = b ? b.name : null;
      const ch = b && b.revenue ? (a.revenue - b.revenue) / b.revenue : NaN; rows.push([U.dirName(d), b ? mn(b.revenue) : '—', mn(a.revenue), isFinite(ch) ? (ch >= 0 ? '+' : '') + (ch * 100).toFixed(1).replace('.', ',') + ' %' : '—', pc(a.plan_done_pct)]); }
    return `Сравнение **${prev || '—'}** и **${cur}** по направлениям (текущий месяц — не полный, до сегодняшнего дня).\n\n` + tbl(['Направление', prev || 'пред. месяц', cur || 'тек. месяц', 'Изменение', 'План тек. мес.'], rows);
  }

  // ---------- маршрутизация ----------
  function answer(raw){
    const t = String(raw || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
    try {
      if (has(t, 'хватит ли денег', 'хватит денег')) return enoughMoney();
      if (has(t, 'критери', 'приемк', 'проверь систему')) return checks();
      if (has(t, 'журнал', 'что изменял', 'что менял')) return audit();
      if (has(t, 'какие разделы', 'права', 'видит роль', 'выключен')) return access(t);
      if (has(t, 'сверь выручку', 'выручку и поступлен', 'откуда разница', 'деньги и прибыл')) return revenueVsCash();
      if (has(t, 'подготов', 'создай', 'оформи', 'проведи')) { const d = docForm(t); if (d) return d; }
      if (has(t, 'неликвид', 'без продаж')) return slow(t);
      if (has(t, 'дебитор', 'должен', 'должны', 'просроч', 'долги клиент')) return receivables(t);
      if (has(t, 'кредитор', 'долг поставщик', 'долги поставщик')) return payables();
      if (has(t, 'закуп', 'поставк', 'в пути', 'поставщик')) return purchases(t);
      if (has(t, 'проект')) return projects(t);
      if (has(t, 'скидк')) return discounts(t);
      if (has(t, 'авансы')) return receivables(t);
      if (has(t, 'ддс', 'остатки по счет', 'по счетам', 'касс', 'структура расходов', 'по стать', 'движение денег')) return cash(t);
      if (dirsIn(t).length >= 2 || (has(t, 'почему', 'сравни', 'сравнен') && has(t, 'направлен', 'прибыл') && !has(t, 'месяц'))) return compareDirs(t);
      if (has(t, 'по направлен') && has(t, 'месяц')) return monthDirs(t);
      if (has(t, 'сводка', 'как дела', 'показател', 'kpi', 'итоги', 'операционн', 'прибыль')) return kpi(t);
      if (has(t, 'по месяц', 'этого и прошлого месяца', 'динамик', 'прошлый месяц', 'сравни продажи')) return months(t);
      if (has(t, 'менеджер')) return breakdown('manager', t, 'Менеджер');
      if (has(t, 'клиент')) return breakdown('client', t, 'Клиент');
      if (has(t, 'направлен', 'italbrands', 'klen', 'restart')) return breakdown('direction', t, 'Направление');
      if (has(t, 'категор')) return breakdown('category', t, 'Категория');
      if (has(t, 'источник')) return breakdown('source', t, 'Источник');
      if (has(t, 'заказ')) return orders(t, raw);
      if (has(t, 'в наличии', 'остат', 'на складе', 'есть ли', 'сколько', 'резерв', 'меньше')) return stock(t, raw);
      if (has(t, 'товар', 'продаж', 'выручк')) return breakdown('product', t, 'Товар');
      return help();
    } catch(e){ return 'Не могу ответить: ' + (e && e.message || 'ошибка') + '.'; }
  }
  window.RS_AI_LOCAL = { answer, note: 'Встроенный режим: отвечаю по данным системы без Claude, по заранее заданным темам. Для свободного диалога откройте RESTART BI в Claude.' };
})();
