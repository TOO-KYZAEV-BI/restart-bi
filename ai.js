// RESTART BI · ai.js — ИИ-помощник: один на всю систему, эксперт под каждую роль, отвечает только по данным системы и в пределах прав роли.
// Claude получает инструменты-функции страницы (чтение витрин, переходы, подготовка документа). Проводит документ всегда человек кнопкой «Провести».
(function(){
  'use strict';
  const R = window.RS, D = R.D, U = R.U, S = R.S, T = R.T;
  const { $, esc, N, M, P, dt } = U;
  const KS = 'restart-bi-ai-chat';

  // ---------- эксперты по ролям ----------
  const EXPERT = {
    owner: { name: 'Финансовый директор', hello: 'Я вижу все направления, деньги, долги и прибыль. Спросите что угодно о цифрах — отвечу с документами-основаниями.',
      quick: ['Утренняя сводка по компании', 'Почему операционная прибыль Italbrands ниже, чем у Klen Market?', 'Кто из клиентов должен больше всего и сколько просрочено?', 'Какие проекты RestArt принесли меньше плановой прибыли?', 'Хватит ли денег на счетах на месяц операционных расходов?', 'Проверь систему по критериям приёмки ТЗ'] },
    saleshead: { name: 'Эксперт по продажам', hello: 'Помогу с планом, менеджерами, клиентами и скидками. Общую прибыль компании я не показываю — её видят собственник и бухгалтер.',
      quick: ['Как менеджеры выполняют план в этом месяце?', 'Топ-10 клиентов за период и их долги', 'Какие заказы зависли в статусе «Счёт выставлен»?', 'Где мы даём самые большие скидки?', 'Сравни продажи этого и прошлого месяца по направлениям'] },
    acc: { name: 'Главный бухгалтер', hello: 'Деньги, ДДС, ОПиУ, дебиторка и кредиторка. Объясню любую разницу между деньгами и прибылью.',
      quick: ['Сверь выручку и поступления за период: откуда разница?', 'Остатки по счетам и кассам на сегодня', 'Просроченная дебиторка старше 60 дней', 'Структура расходов по статьям за период', 'Какие авансы клиентов ещё не стали выручкой?'] },
    wh: { name: 'Эксперт по складу', hello: 'Остатки, резервы, перемещения, неликвид. Цены закупки и прибыль для вашей роли скрыты.',
      quick: ['Каких товаров осталось меньше 2 штук на центральном складе?', 'Что лежит без продаж больше 90 дней?', 'Какие поставки опаздывают?', 'Подготовь перемещение пароконвектомата 6 GN в шоурум', 'Сколько всего в резерве и под какие заказы?'] },
    mgr: { name: 'Помощник менеджера', hello: 'Ваши клиенты, заказы, долги и план. Чужих клиентов и себестоимость я не вижу.',
      quick: ['Кто из моих клиентов должен и сколько дней просрочки?', 'Как я выполняю план в этом месяце?', 'Мои заказы, которые ещё не отгружены', 'Есть ли в наличии плита индукционная 4 конфорки?', 'Подготовь продажу клиенту из моего списка'] },
    buyer: { name: 'Эксперт по закупкам', hello: 'Поставщики, закупки, сроки, себестоимость с доставкой и таможней.',
      quick: ['Какие закупки сейчас в пути и когда придут?', 'Кто из поставщиков чаще всего опаздывает?', 'Что пора дозаказать на складе Italbrands?', 'Как распределились доп. затраты в последней закупке?', 'Долги поставщикам на сегодня'] },
    admin: { name: 'Помощник администратора', hello: 'Роли, права, выключатели разделов, журнал изменений. Финансовых данных у вашей роли нет.',
      quick: ['Какие разделы видит роль «Менеджер»?', 'Что изменялось в системе сегодня?', 'Проверь систему по критериям приёмки ТЗ', 'Какие разделы сейчас выключены?'] },
  };

  // ---------- инструменты ----------
  const STAGE_SEC = { kpi: 'dash', sales: 'sales', orders: 'sales', ar: 'settle', ap: 'settle', stock: 'stock', proj: 'projects', cash: 'cash', purch: 'purch', goods: 'goods' };
  const need = sec => { if (!R.canSee(sec)) throw new Error(`роль «${R.role().name}» не имеет доступа к разделу «${(R.SECS.find(s => s[0] === sec) || [, sec])[1]}»`); };
  const per = inp => { const f = inp && inp.from ? D.idx(String(inp.from)) : S.from, t = inp && inp.to ? D.idx(String(inp.to)) : S.to; if (isNaN(f) || isNaN(t)) throw new Error('даты в формате ГГГГ-ММ-ДД'); return [Math.max(0, Math.min(f, t)), Math.min(T, Math.max(f, t))]; };
  // временно применить фильтры инструмента и вернуть прежние
  function withF(inp, fn){
    const keep = { dir: S.dir, mgr: S.mgr, wh: S.wh, cat: S.cat, client: S.client, from: S.from, to: S.to };
    try {
      if (inp){ if (inp.direction) S.dir = ({ restart: 'RA', ra: 'RA', km: 'KM', 'klen market': 'KM', klen: 'KM', ib: 'IB', italbrands: 'IB', all: 'all', 'все': 'all' })[String(inp.direction).toLowerCase()] || String(inp.direction); if (inp.manager){ const m = findMgr(inp.manager); if (m) S.mgr = m.id; } if (inp.client){ const c = findClient(inp.client); if (c) S.client = c.id; } if (inp.from || inp.to){ const [a, b] = per(inp); S.from = a; S.to = b; } }
      R.bump(); return fn();
    } finally { Object.assign(S, keep); R.bump(); }
  }
  const findMgr = q => { q = String(q).toLowerCase(); return D.MGR.find(m => m.id.toLowerCase() === q || m.name.toLowerCase().includes(q)); };
  const findClient = q => { q = String(q).toLowerCase().replace(/[«»"]/g, ''); return D.CL.find(c => c.id.toLowerCase() === q || c.name.toLowerCase().replace(/[«»"]/g, '').includes(q)); };
  const findProd = q => { q = String(q).toLowerCase(); return D.P.filter(p => p.id.toLowerCase() === q || p.sku.toLowerCase() === q || p.ean === q || p.name.toLowerCase().includes(q) || q.split(/\s+/).filter(w => w.length > 2).every(w => p.name.toLowerCase().includes(w))); };
  const money = v => Math.round(v);
  const pct = v => isFinite(v) ? Math.round(v * 1000) / 10 : null;
  const cost = () => R.seeCost(), profit = () => R.seeProfit();
  const progress = t => { if (cur && cur.tools) { cur.tools.push(t); paintTools(); } };

  const TOOLS = [
    { name: 'get_kpi', description: 'Главные показатели за период: выручка, валовая прибыль и маржа, операционные расходы и прибыль, ПДС (поступления от покупателей), план и % выполнения, деньги на счетах, дебиторка (в т. ч. просрочка), авансы клиентов, кредиторка, стоимость остатков, активные проекты. Можно по направлению.',
      inputSchema: { type: 'object', properties: { from: { type: 'string', description: 'ГГГГ-ММ-ДД, по умолчанию — период на экране' }, to: { type: 'string' }, direction: { type: 'string', enum: ['all', 'RA', 'KM', 'IB'] } } },
      execute(i){ need('dash'); progress('смотрю показатели' + (i.direction && i.direction !== 'all' ? ' · ' + U.dirName(i.direction) : '')); return withF(i, () => { const x = R.pl(), a = R.ar(), b = R.ap(), st = R.stockAt(), plan = R.planOf(), pd = R.pds().sum;
        const o = { period: R.perLabel(), filter: R.filterLabel() || 'вся компания', revenue: money(x.rev), discounts: money(x.disc), pds_received_from_customers: money(pd), plan: money(plan), plan_done_pct: pct(plan ? x.rev / plan : NaN), receivables: money(a.sum), receivables_overdue: money(a.overdue), customer_advances_not_revenue: money(a.advSum), active_projects: D.PROJ.filter(p => R.projVisible(p) && p.order && R.projStats(p).status !== 'Закрыт').length };
        if (cost()) Object.assign(o, { cogs: money(x.cogs), project_direct_costs: money(x.proj), gross_profit: money(x.gross), gross_margin_pct: pct(x.gm), markup_pct: pct(x.markup), stock_value: money(st.val) });
        if (profit()) Object.assign(o, { opex: money(x.opex), operating_profit: money(x.op), operating_margin_pct: pct(x.om) });
        if (R.role().money) Object.assign(o, { cash_total: money(R.cashTotal()), payables: money(b.sum), supplier_advances: money(b.advSum) });
        return o; }); } },
    { name: 'sales_breakdown', description: 'Продажи за период в разрезе: direction, manager, client, product, category, month, source. Возвращает выручку, количество, число заказов, ПДС (для direction/manager/client/month), план (для direction/manager/month) и маржу, если роль её видит. top — сколько строк (по умолчанию 10).',
      inputSchema: { type: 'object', properties: { by: { type: 'string', enum: ['direction', 'manager', 'client', 'product', 'category', 'month', 'source'] }, from: { type: 'string' }, to: { type: 'string' }, direction: { type: 'string' }, manager: { type: 'string' }, top: { type: 'number' } }, required: ['by'] },
      execute(i){ need('sales'); progress('считаю продажи по ' + ({ direction: 'направлениям', manager: 'менеджерам', client: 'клиентам', product: 'товарам', category: 'категориям', month: 'месяцам', source: 'источникам' }[i.by] || i.by)); return withF(i, () => {
        const by = String(i.by), g = {}; const key = z => by === 'direction' ? z.o.dir : by === 'manager' ? z.o.mgr : by === 'client' ? z.o.client : by === 'product' ? (z.l.p || z.l.svc) : by === 'category' ? (z.l.p ? D.PI[z.l.p].cat : 'Услуги проектов') : by === 'source' ? z.o.src : D.mOf(z.d);
        const name = k => by === 'direction' ? U.dirName(k) : by === 'manager' ? (D.MGR.find(m => m.id === k) || {}).name : by === 'client' ? (D.CLI[k] || {}).name : by === 'product' ? (D.PI[k] ? D.PI[k].name : (D.SERVICES.find(s => s.id === k) || {}).name) : by === 'month' ? U.MONF[k % 12] + ' ' + (2025 + Math.floor(k / 12)) : k;
        for (const z of R.saleLines()){ const k = key(z); g[k] = g[k] || { key: k, name: name(k), revenue: 0, qty: 0, cost: 0, orders: new Set() }; g[k].revenue += z.rev; g[k].qty += z.q; g[k].cost += z.cost; g[k].orders.add(z.o.id); }
        let rows = Object.values(g).map(r => { const o = { name: r.name, revenue: money(r.revenue), qty: r.qty, orders: r.orders.size }; if (cost()){ o.gross_profit = money(r.revenue - r.cost); o.margin_pct = pct((r.revenue - r.cost) / r.revenue); } return { o, k: r.key }; });
        if (['direction', 'manager', 'client', 'month'].includes(by)) for (const r of rows){ const keep = { dir: S.dir, mgr: S.mgr, client: S.client, from: S.from, to: S.to };
          if (by === 'direction') S.dir = r.k; if (by === 'manager') S.mgr = r.k; if (by === 'client') S.client = r.k; if (by === 'month'){ S.from = Math.max(keep.from, D.monthStart(r.k)); S.to = Math.min(keep.to, D.monthStart(r.k + 1) - 1); }
          r.o.pds = money(R.pds().sum); if (by !== 'client') { r.o.plan = money(R.planOf()); r.o.plan_done_pct = pct(r.o.plan ? r.o.revenue / r.o.plan : NaN); } Object.assign(S, keep); }
        rows = by === 'month' ? rows.sort((a, b) => a.k - b.k) : rows.sort((a, b) => b.o.revenue - a.o.revenue);
        const top = Math.max(1, Math.min(40, Number(i.top) || (by === 'month' ? 24 : 10)));
        return { period: R.perLabel(), filter: R.filterLabel() || 'вся компания', total_revenue: money(rows.reduce((s, r) => s + r.o.revenue, 0)), rows: rows.slice(0, top).map(r => r.o), rows_total: rows.length }; }); } },
    { name: 'find_orders', description: 'Найти заказы покупателей: по тексту (номер, клиент, товар), статусу, направлению, менеджеру; only_debt — только с долгом; not_shipped — только не отгруженные полностью. Возвращает номер, дату, клиента, менеджера, сумму, оплату, долг, статус.',
      inputSchema: { type: 'object', properties: { q: { type: 'string' }, status: { type: 'string', enum: ['Новый', 'Согласование', 'Счёт выставлен', 'Частично оплачен', 'Оплачен', 'Комплектация', 'Отгружен', 'Завершён', 'Отменён', 'Возврат'] }, direction: { type: 'string' }, manager: { type: 'string' }, only_debt: { type: 'boolean' }, not_shipped: { type: 'boolean' }, from: { type: 'string' }, to: { type: 'string' }, limit: { type: 'number' } } },
      execute(i){ need('sales'); progress('ищу заказы'); return withF({ direction: i.direction, manager: i.manager, from: i.from || D.iso(0), to: i.to }, () => {
        const q = i.q ? String(i.q).toLowerCase() : '';
        let os = D.SALES.filter(o => R.okOrder(o) && R.inPer(o.d));
        if (q) os = os.filter(o => o.id.toLowerCase().includes(q) || D.CLI[o.client].name.toLowerCase().includes(q) || o.lines.some(l => l.p && D.PI[l.p].name.toLowerCase().includes(q)));
        if (i.status) os = os.filter(o => D.statusOf(o, T) === i.status);
        if (i.only_debt) os = os.filter(o => D.revOf(o, T) - D.paidOf(o, T) > 1);
        if (i.not_shipped) os = os.filter(o => o.cancel == null && o.lines.some(l => (l.shipped || 0) < l.q));
        os.sort((a, b) => b.d - a.d);
        const lim = Math.max(1, Math.min(50, Number(i.limit) || 15));
        return { found: os.length, orders: os.slice(0, lim).map(o => ({ id: o.id, date: dt(o.d), direction: U.dirName(o.dir), client: D.CLI[o.client].name, manager: (D.MGR.find(m => m.id === o.mgr) || {}).name, total: D.orderTotal(o), paid: D.paidOf(o, T), debt: Math.max(0, D.revOf(o, T) - D.paidOf(o, T)), status: D.statusOf(o, T), project: o.project || undefined })) }; }); } },
    { name: 'get_order', description: 'Полная карточка заказа по номеру (например KM-01234): строки товаров, отгрузки, оплаты, долг, статус.',
      inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      execute(i){ need('sales'); const o = D.SALES.find(x => x.id.toLowerCase() === String(i.id).toLowerCase()); if (!o) throw new Error('заказ не найден'); if (!R.okOrder({ ...o, dir: o.dir })) throw new Error('это заказ вне прав вашей роли'); progress('открываю заказ ' + o.id);
        const r = { id: o.id, date: dt(o.d), direction: U.dirName(o.dir), client: D.CLI[o.client].name, manager: (D.MGR.find(m => m.id === o.mgr) || {}).name, source: o.src, status: D.statusOf(o, T), total: D.orderTotal(o), revenue_recognized: D.revOf(o, T), paid: D.paidOf(o, T),
          lines: o.lines.map(l => ({ item: l.p ? D.PI[l.p].name : D.SERVICES.find(s => s.id === l.svc).name, qty: l.q, shipped: l.shipped || 0, price: l.price, discount_pct: Math.round(l.disc * 100), sum: D.lineNet(l) })), shipments: o.ships.map(s => ({ id: s.id, date: dt(s.d) })), payments: o.pays.map(p => ({ date: dt(p.d), amount: p.amt })) };
        if (cost()){ const c = o.ships.reduce((x, s) => x + s.lines.reduce((y, z) => y + z.q * z.cost, 0), 0); r.cost_of_shipped = money(c); r.gross_profit = money(r.revenue_recognized - c); }
        return r; } },
    { name: 'receivables', description: 'Дебиторская задолженность на дату: список долгов с клиентом, заказом, суммой, сроком, днями просрочки и менеджером; итоги по корзинам просрочки. min_late — минимум дней просрочки.',
      inputSchema: { type: 'object', properties: { direction: { type: 'string' }, manager: { type: 'string' }, min_late: { type: 'number' }, top: { type: 'number' } } },
      execute(i){ need('settle'); progress('смотрю дебиторку'); return withF(i, () => { const a = R.ar(); let rows = a.debt; const ml = Number(i.min_late) || 0; if (ml) rows = rows.filter(r => r.late >= ml);
        const buck = { 'в срок': 0, '1-30': 0, '31-60': 0, '61-90': 0, '91+': 0 }; for (const r of a.debt){ const k = r.late <= 0 ? 'в срок' : r.late <= 30 ? '1-30' : r.late <= 60 ? '31-60' : r.late <= 90 ? '61-90' : '91+'; buck[k] += r.bal; }
        rows = rows.slice().sort((x, y) => y.bal - x.bal);
        return { as_of: dt(S.to), total: money(a.sum), overdue: money(a.overdue), customer_advances: money(a.advSum), by_age: Object.fromEntries(Object.entries(buck).map(([k, v]) => [k, money(v)])), debts: rows.slice(0, Math.min(40, Number(i.top) || 15)).map(r => ({ client: D.CLI[r.o.client].name, order: r.o.id, project: r.o.project || undefined, debt: money(r.bal), due: dt(r.due), days_late: r.late, manager: (D.MGR.find(m => m.id === r.o.mgr) || {}).name })), count: rows.length }; }); } },
    { name: 'payables', description: 'Кредиторская задолженность поставщикам на дату и авансы поставщикам.',
      execute(){ need('settle'); if (!R.role().money && R.role().id !== 'buyer') throw new Error('кредиторка недоступна для вашей роли'); progress('смотрю кредиторку'); const b = R.ap(); return { as_of: dt(S.to), total: money(b.sum), supplier_advances: money(b.advSum), debts: b.debt.sort((x, y) => y.bal - x.bal).slice(0, 15).map(r => ({ supplier: D.SUP.find(s => s.id === r.po.sup).name, purchase: r.po.id, debt: money(r.bal), days_late: r.late })) }; } },
    { name: 'stock_lookup', description: 'Остатки товаров: по названию, артикулу или штрихкоду (q) и/или складу (W1 центральный, W2 шоурум KM, W5 Ош, W3 Italbrands, W4 проекты RestArt). below — показать позиции, где доступно меньше этого числа. Возвращает остаток, резерв, доступно по складам, цены.',
      inputSchema: { type: 'object', properties: { q: { type: 'string' }, warehouse: { type: 'string' }, below: { type: 'number' } } },
      execute(i){ need('goods'); progress('проверяю склад'); let ps = i.q ? findProd(i.q) : D.P.slice(); const wh = i.warehouse ? String(i.warehouse).toUpperCase() : null;
        const rows = []; for (const p of ps) for (const w of D.WH){ if (wh && w.id !== wh) continue; const q = p.stock[w.id] || 0, rs = p.res[w.id] || 0; if (!q && !rs && !i.q) continue; if (i.below != null && q - rs >= Number(i.below)) continue; if (!q && !rs && wh == null && i.q && w.id !== 'W1') continue;
          const pr = D.priceAt(p, T); const o = { sku: p.sku, name: p.name, warehouse: w.name, stock: q, reserved: rs, available: q - rs, retail: pr.retail, wholesale: pr.opt, min_price: pr.min }; if (cost()) o.unit_cost = money(p.avg); rows.push(o); }
        return { found: rows.length, items: rows.slice(0, 40) }; } },
    { name: 'slow_stock', description: 'Неликвид: товары на складах без продаж больше days дней (по умолчанию 90), с остатком и стоимостью.',
      inputSchema: { type: 'object', properties: { days: { type: 'number' } } },
      execute(i){ need('stock'); progress('ищу неликвид'); const d = Number(i.days) || 90; const last = {}; for (const m of D.MOVES) if (m.type === 'Продажа и отгрузка') last[m.p + '|' + m.wh] = Math.max(last[m.p + '|' + m.wh] || 0, m.d);
        const st = R.stockAt(T); const rows = st.rows.filter(r => r.q > 0).map(r => { const l = last[r.p.id + '|' + r.wh.id]; return { name: r.p.name, warehouse: r.wh.short, qty: r.q, days_without_sales: l ? T - l : T, last_sale: l ? dt(l) : 'не было', value: cost() ? money(r.val) : undefined }; }).filter(r => r.days_without_sales >= d).sort((a, b) => b.days_without_sales - a.days_without_sales);
        return { days: d, count: rows.length, items: rows.slice(0, 30) }; } },
    { name: 'projects', description: 'Проекты RestArt: договор, оплачено, остаток, признанная выручка, аванс, статус, сроки; при доступе — плановая и фактическая себестоимость, расходы проекта и итоговая прибыль против плана.',
      inputSchema: { type: 'object', properties: { status: { type: 'string', description: 'фильтр статуса: КП, Договор, Закупка, Поставка, Монтаж, Сдан, Закрыт или active' } } },
      execute(i){ need('projects'); progress('считаю проекты'); let ps = D.PROJ.filter(p => R.projVisible(p) && p.order); const out = ps.map(pr => { const s = R.projStats(pr, T); const o = { id: pr.id, name: pr.name, client: D.CLI[pr.client].name, manager: (D.MGR.find(m => m.id === pr.mgr) || {}).name, status: s.status, start: dt(pr.d0), planned_end: dt(pr.end), contract: pr.contract, paid: s.paid, rest_to_pay: Math.max(0, s.rest), revenue_recognized: s.rev, advance_not_revenue: s.adv };
        if (cost()) Object.assign(o, { planned_cost: pr.planCost, actual_cost: money(s.factCost), project_expenses: money(s.exp), profit_actual: money(s.profit), profit_plan: money(s.planProfit), margin_pct: pct(s.pm) }); return o; });
        const f = i.status ? String(i.status) : ''; return { projects: f === 'active' ? out.filter(p => p.status !== 'Закрыт') : f ? out.filter(p => p.status === f) : out }; } },
    { name: 'cash_flow', description: 'Движение денег за период: по статьям (by=article), по счетам (by=account) или по типам (by=type); поступления и выплаты отдельно; переводы между своими счетами показаны отдельно и не являются доходом. Плюс остатки по счетам на конец.',
      inputSchema: { type: 'object', properties: { by: { type: 'string', enum: ['article', 'account', 'type'] }, from: { type: 'string' }, to: { type: 'string' }, direction: { type: 'string' } } },
      execute(i){ need('cash'); progress('смотрю ДДС'); return withF(i, () => { const by = i.by || 'article'; const g = {}; for (const c of R.cashRows()){ const k = by === 'account' ? D.ACC.find(a => a.id === c.acc).name : by === 'type' ? c.type : (c.type === 'Перевод между счетами' ? 'Переводы между своими счетами' : c.art); g[k] = g[k] || { name: k, inflow: 0, outflow: 0 }; if (c.amt > 0) g[k].inflow += c.amt; else g[k].outflow -= c.amt; }
        return { period: R.perLabel(), groups: Object.values(g).map(x => ({ name: x.name, inflow: money(x.inflow), outflow: money(x.outflow), net: money(x.inflow - x.outflow) })).sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow)).slice(0, 30), balances_end: D.ACC.map(a => ({ account: a.name, currency: a.cur, balance_kgs: money(R.accBal(a.id)), balance_in_currency: money(R.accBalCur(a.id)) })) }; }); } },
    { name: 'purchases', description: 'Закупки у поставщиков: этап, поставщик, сумма в валюте, итоговая себестоимость с доставкой и таможней, правило распределения доп. затрат, план и факт поступления, опоздания, оплаты и долг. in_transit — только не принятые; late — только опоздавшие.',
      inputSchema: { type: 'object', properties: { in_transit: { type: 'boolean' }, late: { type: 'boolean' }, supplier: { type: 'string' }, limit: { type: 'number' } } },
      execute(i){ need('purch'); progress('смотрю закупки'); let ps = D.PURCH.filter(p => R.okDir(p.dir)); if (i.in_transit) ps = ps.filter(p => p.fact == null); if (i.late) ps = ps.filter(p => (p.fact == null ? T : p.fact) > p.plan); if (i.supplier){ const q = String(i.supplier).toLowerCase(); ps = ps.filter(p => D.SUP.find(s => s.id === p.sup).name.toLowerCase().includes(q)); }
        ps = ps.slice().sort((a, b) => b.d - a.d);
        return { found: ps.length, purchases: ps.slice(0, Math.min(30, Number(i.limit) || 12)).map(p => { const o = { id: p.id, date: dt(p.d), supplier: D.SUP.find(s => s.id === p.sup).name, direction: U.dirName(p.dir), project: p.project || undefined, stage: p.stage, amount_currency: Math.round(p.lines.reduce((a, l) => a + l.q * l.price, 0)) + ' ' + p.cur, rate: p.rate, planned_arrival: dt(p.plan), actual_arrival: p.fact != null ? dt(p.fact) : null, days_late: Math.max(0, (p.fact == null ? T : p.fact) - p.plan), extra_cost_rule: 'по ' + p.rule, paid: p.pays.reduce((a, x) => a + x.amt, 0) }; if (cost()) Object.assign(o, { delivery: p.delivery, customs_and_other: p.customs + p.other, total_cost: p.total }); return o; }) }; } },
    { name: 'audit_log', description: 'Журнал изменений: последние записи (изменения цен, инвентаризации, проведённые документы, сторно, отказы системы, выключатели).',
      inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
      execute(i){ if (!R.canSee('audit') && !R.canSee('admin')) throw new Error('журнал недоступен для вашей роли'); progress('читаю журнал'); const rows = [...(R.LIVE_AUDIT || []), ...D.AUDIT.slice().reverse()]; return rows.slice(0, Math.min(40, Number(i.limit) || 15)).map(r => ({ date: dt(r.d), who: R.whoName ? R.whoName(r) : r.who, action: r.what, object: r.obj, before: r.before, after: r.after, note: r.note })); } },
    { name: 'access_info', description: 'Роли и права: какие разделы видит каждая роль (П полный, Б свой блок, Ч чтение, С свои записи), кто видит себестоимость и прибыль, какие разделы выключены в «Администраторе».',
      execute(){ return { current_role: R.role().name, roles: R.ROLES.map(r => ({ role: r.name, sections: Object.fromEntries(R.SECS.map(([k, n]) => [n, r.rt[k] || '—'])), sees_cost: r.cost, sees_profit: r.profit })), switched_off: [...R.OFF] }; } },
    { name: 'acceptance_checks', description: 'Прогнать 12 критериев приёмки из раздела 18 ТЗ на данных системы и вернуть результат по каждому.',
      execute(){ progress('проверяю критерии приёмки'); return R.runChecks().map((c, k) => ({ n: k + 1, criterion: c.t, passed: c.ok, details: String(c.d).replace(/<[^>]+>/g, '') })); } },
    { name: 'open_section', description: 'Открыть на экране раздел системы для пользователя. hash: dash, sales, projects, parties, b24, goods, goods-prices, stock, stock-card, stock-log, stock-slow, purch, cash, cash-acc, cash-dds, pl, settle, settle-ap, settle-adv, settle-act, budget, reports, reports-r1…r15, roles, admin, audit, checks. Можно также открыть карточку: so:<номер заказа>, po:<закупка>, pr:<проект>, k:<клиент K001>.',
      inputSchema: { type: 'object', properties: { hash: { type: 'string' } }, required: ['hash'] },
      execute(i){ const h = String(i.hash).replace(/^#/, ''); if (/^(so|po|pr|k|p):/.test(h)){ setTimeout(() => R.go(h), 50); return 'открыта карточка ' + h; } const sec = h.split('-')[0]; if (!R.SECS.some(s => s[0] === sec)) throw new Error('нет такого раздела'); if (!R.canSee(sec)) throw new Error('раздел недоступен для роли'); location.hash = '#' + h; return 'открыт раздел ' + h; } },
    { name: 'prepare_document', description: 'Подготовить документ и показать пользователю заполненную форму — провести его пользователь должен сам кнопкой «Провести». kind: sale (fields: client, product, warehouse, qty, price, discount_pct, pay, ship), payin (order, amount), receipt (product, warehouse, qty, unit_cost), transfer (product, from, to, qty), writeoff (product, warehouse, qty, reason), cashout (amount, article, counterparty, basis), xfer (from, to, amount: счета A1 касса, A2 Оптима, A3 Демир), projexp (project, category, amount), party (name, inn, phone). Товар и клиента можно назвать текстом.',
      inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['sale', 'payin', 'receipt', 'transfer', 'writeoff', 'cashout', 'xfer', 'projexp', 'party'] }, fields: { type: 'object' } }, required: ['kind'] },
      execute(i){ const f = i.fields || {}; const kind = String(i.kind); const pre = {}; let ref;
        const prod = f.product ? findProd(f.product)[0] : null; if (f.product && !prod) throw new Error('товар не найден: ' + f.product);
        const whId = w => { if (!w) return null; const s = String(w).toLowerCase(); const x = D.WH.find(z => z.id.toLowerCase() === s || z.name.toLowerCase().includes(s) || z.short.toLowerCase().includes(s)); return x && x.id; };
        if (kind === 'sale'){ const c = f.client ? findClient(f.client) : null; if (f.client && !c) throw new Error('клиент не найден: ' + f.client); if (c){ pre.f_dir = c.dirs[0]; pre.f_client = c.id; } if (prod){ pre.f_p = prod.id; pre.f_dir = pre.f_dir || prod.dir; } if (whId(f.warehouse)) pre.f_wh = whId(f.warehouse); if (f.qty) pre.f_q = f.qty; if (f.price) pre.f_price = f.price; if (f.discount_pct != null) pre.f_disc = f.discount_pct; if (f.pay) pre.f_pay = f.pay; if (f.ship) pre.f_ship = true; }
        if (kind === 'payin'){ ref = f.order; if (f.amount) pre.f_amt = f.amount; }
        if (kind === 'receipt'){ if (prod) pre.f_p = prod.id; if (whId(f.warehouse)) pre.f_wh = whId(f.warehouse); if (f.qty) pre.f_q = f.qty; if (f.unit_cost) pre.f_cost = f.unit_cost; }
        if (kind === 'transfer'){ if (prod) pre.f_p = prod.id; if (whId(f.from)) pre.f_from = whId(f.from); if (whId(f.to)) pre.f_to = whId(f.to); if (f.qty) pre.f_q = f.qty; }
        if (kind === 'writeoff'){ if (prod) pre.f_p = prod.id; if (whId(f.warehouse)) pre.f_wh = whId(f.warehouse); if (f.qty) pre.f_q = f.qty; if (f.reason) pre.f_reason = f.reason; }
        if (kind === 'cashout'){ if (f.amount) pre.f_amt = f.amount; if (f.article) pre.f_art = f.article; if (f.counterparty) pre.f_cp = f.counterparty; if (f.basis) pre.f_basis = f.basis; }
        if (kind === 'xfer'){ if (f.from) pre.f_from = f.from; if (f.to) pre.f_to = f.to; if (f.amount) pre.f_amt = f.amount; }
        if (kind === 'projexp'){ const pr = f.project && D.PROJ.find(p => p.id === f.project || p.name.toLowerCase().includes(String(f.project).toLowerCase())); ref = pr && pr.id; if (f.category) pre.f_cat = f.category; if (f.amount) pre.f_amt = f.amount; }
        if (kind === 'party'){ if (f.name) pre.f_name = f.name; if (f.inn) pre.f_inn = f.inn; if (f.phone) pre.f_phone = f.phone; }
        const ok = R.openForm(kind, ref, pre); if (!ok) throw new Error('роль «' + R.role().name + '» не может проводить такой документ');
        return 'форма открыта и заполнена; пользователь проверит и нажмёт «Провести» сам'; } },
  ];

  // ---------- инструкция ----------
  function rules(){
    const ro = R.role(), ex = EXPERT[ro.id] || EXPERT.owner;
    return `Ты — ИИ-помощник системы управленческого учёта RESTART BI компании RestArt (Кыргызстан, учёт в сомах, суммы без НДС). Направления: RestArt (проектное оснащение ресторанов и HoReCa под ключ), Klen Market (профессиональное оборудование из наличия), Italbrands (посуда и премиальные товары).
Твоя роль сейчас: «${ex.name}» для пользователя с ролью «${ro.name}»${ro.id === 'mgr' ? ' (менеджер ' + D.MGR.find(m => m.id === S.asMgr).name + ', видит только своих клиентов)' : ''}. Сегодня ${dt(T)}. На экране выбран период ${R.perLabel()}${R.filterLabel() ? ', фильтр: ' + R.filterLabel() : ''}.
Правила:
1. Отвечай по-русски, кратко и по делу: сначала главный вывод одной-двумя фразами, затем цифры и причины. Суммы пиши в сомах с пробелами между разрядами или в млн с одной цифрой после запятой («12,4 млн сом»).
2. Каждую цифру бери только из инструментов. Ничего не выдумывай. Если данных нет или инструмент отказал из-за прав — так и скажи.
3. Называй документы-основания по номерам (KM-01234, ЗК-0123, ПРJ-005, ДДС-01234) — пользователь сможет их открыть.
4. Права: себестоимость и маржа ${ro.cost ? 'доступны' : 'НЕ доступны этой роли — не пытайся их вычислить'}; общая прибыль компании ${ro.profit ? 'доступна' : 'НЕ доступна этой роли'}.
5. Формулы ТЗ: фактическая себестоимость = закупка + распределённые доп. затраты; валовая прибыль = выручка − себестоимость товаров и услуг; маржа = валовая / выручка; наценка = (цена − себестоимость) / себестоимость; операционная прибыль = валовая − операционные расходы; доступно = остаток − резерв; долг = реализация − оплаты − корректировки. Выручка признаётся при отгрузке или акте; аванс — это деньги, но не выручка. Переводы между своими счетами — не доход.
6. Когда просят создать документ (продажа, оплата, приход, перемещение, списание, расход, перевод, расход проекта, контрагент) — вызови prepare_document. Сам ты ничего не проводишь: форму проверяет и проводит человек.
7. Если полезно показать раздел или карточку — вызови open_section.
8. Форматирование: короткие абзацы, маркированные списки «- », жирный **так**, при сравнении нескольких строк — простая таблица Markdown (не больше 8 строк). Без вступлений и без повторения вопроса.`;
  }

  // ---------- панель ----------
  let sample = null, avail = null, ctl = null, cur = null; let turns = [];
  try { turns = JSON.parse(localStorage.getItem(KS) || '[]').slice(-20); } catch(e){}
  const saveTurns = () => { try { localStorage.setItem(KS, JSON.stringify(turns.slice(-20))); } catch(e){} };
  const panel = $('#aip');
  function md(s){
    const lines = esc(s).split('\n'); let out = '', inList = false, tbl = [];
    const flushT = () => { if (!tbl.length) return; const rows = tbl.filter(r => !/^\s*\|?\s*:?-{2,}/.test(r)).map(r => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim())); out += `<div class="tw"><table class="tbl compact"><thead><tr>${rows[0].map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td class="${/^[−\-–]?[\d\s,.%]+(млн|тыс|сом|с)?$/.test(c) ? 'num' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; tbl = []; };
    for (const ln of lines){
      if (/^\s*\|.*\|\s*$/.test(ln)){ if (inList){ out += '</ul>'; inList = false; } tbl.push(ln); continue; } flushT();
      const li = ln.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/);
      if (li){ if (!inList){ out += '<ul>'; inList = true; } out += `<li>${li[1]}</li>`; continue; }
      if (inList){ out += '</ul>'; inList = false; }
      const hd = ln.match(/^#{1,4}\s+(.*)/); if (hd){ out += `<p><b>${hd[1]}</b></p>`; continue; }
      if (ln.trim()) out += `<p>${ln}</p>`;
    }
    flushT(); if (inList) out += '</ul>';
    return out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\b((?:KM|IB|RA)-\d{5})\b/g, '<a href="#" data-go="so:$1" class="doc">$1</a>').replace(/(ЗК-\d{4})/g, '<a href="#" data-go="po:$1" class="doc">$1</a>').replace(/(ПРJ-\d{3})/g, '<a href="#" data-go="pr:$1" class="doc">$1</a>').replace(/(ДДС-\d{5})/g, '<a href="#" data-go="cash:$1" class="doc">$1</a>');
  }
  function paint(){
    const ex = EXPERT[R.role().id] || EXPERT.owner;
    const hist = turns.map(t => `<div class="m ${t.role === 'user' ? 'u' : 'a'}">${t.role === 'user' ? esc(t.content) : `<b class="who">${esc(t.ex || ex.name)}</b>${md(t.content)}`}</div>`).join('');
    const empty = !turns.length ? `<div class="m a"><b class="who">${esc(ex.name)}</b><p>${esc(ex.hello)}</p></div>` : '';
    $('#aiMsgs').innerHTML = hist + empty + (cur ? `<div class="m a live"><b class="who">${esc(ex.name)}</b><div id="aiLive">${cur.text ? md(cur.text) : '<p class="think">Думаю…</p>'}</div><div class="tools" id="aiTools"></div></div>` : '');
    paintTools();
    $('#aiChips').innerHTML = ex.quick.map(q => `<button type="button" data-aiq="${esc(q)}">${esc(q)}</button>`).join('');
    $('#aiRole').textContent = ex.name + ' · ' + R.role().name;
    $('#aiStop').hidden = !cur; $('#aiSend').hidden = !!cur;
    $('#aiNote').innerHTML = avail === false ? (window.RS_AI_LOCAL ? window.RS_AI_LOCAL.note : 'ИИ-помощник работает, когда система открыта в Claude под вашим аккаунтом. Здесь он недоступен.') : 'Отвечает по данным системы в пределах прав роли. Документы проводите вы сами. Запросы расходуют лимит вашего аккаунта Claude.';
    const box = $('#aiMsgs'); box.scrollTop = box.scrollHeight;
  }
  function paintTools(){ const el = $('#aiTools'); if (el && cur) el.innerHTML = cur.tools.map(t => `<span>✓ ${esc(t)}</span>`).join(''); }
  const COPY = { not_granted: 'Доступ к Claude не разрешён для этой страницы. Разрешите его в меню страницы «Разрешения».', rate_limited: 'Слишком много запросов подряд. Подождите минуту и спросите снова.', prompt_too_large: 'Слишком длинный разговор. Нажмите «Новый разговор».', session_expired: 'Сессия истекла — обновите страницу.', sampling_disabled: 'ИИ отключён для вашей организации.', refused: 'Claude отказался отвечать на этот запрос.', upstream_error: 'Сервис Claude временно недоступен. Попробуйте ещё раз.', tools_unavailable: 'Инструменты помощника недоступны в этом окне.', queue_overflow: 'Очередь запросов переполнена — попробуйте через минуту.' };
  async function ask(text){
    text = String(text || '').trim(); if (!text || cur) return;
    if (!sample){ try { sample = await window.claude?.use?.('sample'); } catch(e){} }
    if (!sample){ avail = false; const loc = window.RS_AI_LOCAL; const ex0 = EXPERT[R.role().id] || EXPERT.owner;
      turns.push({ role: 'user', content: text }, { role: 'assistant', ex: ex0.name, content: loc ? loc.answer(text) : 'ИИ-помощник недоступен в этом окне. Откройте RESTART BI в Claude под своим аккаунтом.' }); saveTurns(); paint(); return; }
    avail = true;
    turns.push({ role: 'user', content: text }); saveTurns();
    cur = { text: '', tools: [] }; ctl = new AbortController(); paint();
    const ex = EXPERT[R.role().id] || EXPERT.owner;
    const conv = turns.slice(-12); while (conv.length && conv[0].role !== 'user') conv.shift();
    try {
      const res = await sample([{ role: 'user', content: rules() }, ...conv.map(t => ({ role: t.role, content: t.content }))], {
        tools: TOOLS, cache: false, signal: ctl.signal,
        onText: ({ text: tx }) => { cur.text = tx; const el = $('#aiLive'); if (el) el.innerHTML = md(tx); const b = $('#aiMsgs'); b.scrollTop = b.scrollHeight; },
      });
      turns.push({ role: 'assistant', content: res.text + (res.truncated ? '\n\n_Ответ обрезан — спросите уже._' : ''), ex: ex.name });
    } catch(e){
      const kept = e && e.text ? e.text : '';
      if (e && e.code === 'cancelled') turns.push({ role: 'assistant', content: (kept ? kept + '\n\n' : '') + '_Остановлено._', ex: ex.name });
      else turns.push({ role: 'assistant', content: (kept ? kept + '\n\n' : '') + (COPY[e && e.code] || 'Не удалось получить ответ: ' + ((e && e.message) || 'ошибка')), ex: ex.name });
    } finally { cur = null; ctl = null; saveTurns(); paint(); }
  }
  function open(q){ panel.hidden = false; document.body.classList.add('ai-open'); paint(); const i = $('#aiIn'); if (q) ask(q); else setTimeout(() => i.focus(), 30); }
  function close(){ panel.hidden = true; document.body.classList.remove('ai-open'); }
  panel.innerHTML = `<header><span class="aimark" aria-hidden="true">✦</span><div><b>ИИ-помощник</b><small id="aiRole"></small></div><button type="button" class="btn-q" id="aiNew" title="Начать новый разговор">Новый</button><button type="button" id="aiClose" aria-label="Закрыть помощника">×</button></header>
    <div class="msgs" id="aiMsgs" aria-live="polite"></div>
    <div class="chips" id="aiChips"></div>
    <form class="ask" id="aiForm"><textarea id="aiIn" rows="2" placeholder="Спросите о продажах, деньгах, складе, проектах… или поручите подготовить документ" aria-label="Вопрос помощнику"></textarea><button type="submit" class="btn-p" id="aiSend">Отправить</button><button type="button" class="btn-danger" id="aiStop" hidden>Стоп</button></form>
    <p class="ainote" id="aiNote"></p>`;
  $('#aiForm').addEventListener('submit', e => { e.preventDefault(); const v = $('#aiIn').value; $('#aiIn').value = ''; ask(v); });
  $('#aiIn').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); $('#aiForm').requestSubmit(); } });
  $('#aiStop').addEventListener('click', () => ctl && ctl.abort());
  $('#aiClose').addEventListener('click', close);
  $('#aiNew').addEventListener('click', () => { if (cur) return; turns = []; saveTurns(); paint(); });
  panel.addEventListener('click', e => { const q = e.target.closest('[data-aiq]'); if (q) ask(q.dataset.aiq); });
  document.addEventListener('click', e => { const b = e.target.closest('[data-ai]'); if (b){ e.preventDefault(); open(b.dataset.ai || ''); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden && $('#modal').hidden) close(); });
  // смена роли — другой эксперт
  $('#roleSel').addEventListener('change', () => { if (!panel.hidden) paint(); });
  if (window.claude && window.claude.use) window.claude.use('sample').then(s => { sample = s; avail = !!s; if (!panel.hidden) paint(); }).catch(() => { avail = false; }); else { avail = false; }
  R.AI = { open, ask, close, EXPERT, TOOLS };
})();
