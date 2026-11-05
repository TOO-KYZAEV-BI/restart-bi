// RESTART BI · core.js — состояние, роли, фильтры и все расчёты (раздел 14 ТЗ). Один источник цифр: экраны только читают отсюда.
(function(){
  'use strict';
  const D = window.RS_DATA, U = window.RS_UI;
  const T = D.TODAY;

  // ---------- состояние ----------
  const KEY = 'restart-bi-state';
  const S = { per: 'ytd', from: D.idx('2026-01-01'), to: T, dir: 'all', mgr: '', wh: '', cat: '', client: '', role: 'owner', asMgr: 'M3' };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e){}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} };

  const PERIODS = [
    ['today', 'Сегодня', () => [T, T]], ['week', 'Неделя', () => [T - 6, T]], ['month', 'Текущий месяц', () => [D.monthStart(D.mOf(T)), T]],
    ['pmonth', 'Прошлый месяц', () => [D.monthStart(D.mOf(T) - 1), D.monthStart(D.mOf(T)) - 1]], ['q', 'Квартал', () => [D.monthStart(D.mOf(T) - D.mOf(T) % 3), T]],
    ['ytd', 'С начала 2026', () => [D.idx('2026-01-01'), T]], ['y25', '2025 год', () => [0, D.idx('2025-12-31')]], ['all', 'Всё время', () => [0, T]],
  ];
  function setPeriod(k){ const p = PERIODS.find(x => x[0] === k); if (p){ const [a, b] = p[2](); S.per = k; S.from = a; S.to = b; } save(); }
  if (S.per !== 'custom') setPeriod(S.per);

  // ---------- роли (раздел 13 ТЗ) и уровни SANHARA BI: П полный · Б свой блок · Ч чтение · С свои записи ----------
  const SECS = [
    ['dash', 'Дашборд', 'Главная'], ['sales', 'Продажи', 'Коммерция'], ['projects', 'Проекты RestArt', 'Коммерция'], ['parties', 'Клиенты и поставщики', 'Коммерция'], ['b24', 'Битрикс24', 'Коммерция'],
    ['goods', 'Товары и номенклатура', 'Товары и склад'], ['stock', 'Складской учёт', 'Товары и склад'], ['purch', 'Закупки', 'Товары и склад'],
    ['cash', 'Финансы и ДДС', 'Финансы'], ['pl', 'ОПиУ (P&L)', 'Финансы'], ['settle', 'Взаиморасчёты', 'Финансы'], ['budget', 'План-факт и бюджет', 'Финансы'],
    ['reports', 'Отчёты', 'Отчёты'], ['roles', 'Роли и права', 'Система'], ['admin', 'Администратор', 'Система'], ['audit', 'Журнал изменений', 'Система'], ['checks', 'Контроль приёмки', 'Система'], ['about', 'О проекте', 'Система'],
  ];
  const ROLES = [
    { id: 'owner', name: 'Собственник', short: 'СБ', who: 'Собственник RestArt', cost: true, profit: true, money: true,
      rt: { dash: 'П', sales: 'П', projects: 'П', parties: 'П', b24: 'Ч', goods: 'П', stock: 'П', purch: 'П', cash: 'П', pl: 'П', settle: 'П', budget: 'П', reports: 'П', roles: 'Ч', admin: 'Ч', audit: 'Ч', checks: 'Ч', about: 'Ч' } },
    { id: 'saleshead', name: 'Руководитель продаж', short: 'РП', who: 'Руководитель продаж', cost: true, profit: false, money: false,
      rt: { dash: 'Ч', sales: 'П', projects: 'П', parties: 'П', b24: 'Б', goods: 'Ч', stock: 'Ч', purch: 'Ч', cash: '', pl: '', settle: 'Ч', budget: 'П', reports: 'Б', roles: '', admin: '', audit: '', checks: '', about: 'Ч' } },
    { id: 'acc', name: 'Бухгалтер / финансист', short: 'БФ', who: 'Айгуль Б., бухгалтер', cost: true, profit: true, money: true,
      rt: { dash: 'Ч', sales: 'Ч', projects: 'Ч', parties: 'Б', b24: '', goods: 'Ч', stock: 'Ч', purch: 'Ч', cash: 'П', pl: 'П', settle: 'П', budget: 'Б', reports: 'Б', roles: '', admin: '', audit: 'Ч', checks: 'Ч', about: 'Ч' } },
    { id: 'wh', name: 'Складской сотрудник', short: 'СК', who: 'Марат, склад', cost: false, profit: false, money: false,
      rt: { dash: '', sales: '', projects: '', parties: '', b24: '', goods: 'Ч', stock: 'Б', purch: 'Ч', cash: '', pl: '', settle: '', budget: '', reports: 'Б', roles: '', admin: '', audit: '', checks: '', about: 'Ч' } },
    { id: 'mgr', name: 'Менеджер', short: 'МН', who: '', cost: false, profit: false, money: false,
      rt: { dash: 'С', sales: 'С', projects: 'С', parties: 'С', b24: 'С', goods: 'Ч', stock: 'Ч', purch: '', cash: '', pl: '', settle: 'С', budget: 'С', reports: 'С', roles: '', admin: '', audit: '', checks: '', about: 'Ч' } },
    { id: 'buyer', name: 'Закупщик', short: 'ЗК', who: 'Руслан Т., закупщик', cost: true, profit: false, money: false,
      rt: { dash: '', sales: '', projects: 'Ч', parties: 'Б', b24: '', goods: 'Б', stock: 'Ч', purch: 'П', cash: '', pl: '', settle: 'Ч', budget: '', reports: 'Б', roles: '', admin: '', audit: '', checks: '', about: 'Ч' } },
    { id: 'admin', name: 'Администратор', short: 'АД', who: 'Администратор системы', cost: false, profit: false, money: false,
      rt: { dash: '', sales: '', projects: '', parties: '', b24: 'Б', goods: '', stock: '', purch: '', cash: '', pl: '', settle: '', budget: '', reports: '', roles: 'П', admin: 'П', audit: 'П', checks: 'П', about: 'Ч' } },
  ];
  const role = () => ROLES.find(r => r.id === S.role) || ROLES[0];
  const lvl = sec => role().rt[sec] || '';
  const canSee = sec => !!lvl(sec) && !OFF.has(sec);
  const canEdit = sec => ['П', 'Б', 'С'].includes(lvl(sec));
  const myMgr = () => role().id === 'mgr' ? S.asMgr : null;
  const seeCost = () => role().cost;
  const seeProfit = () => role().profit;
  const OFF = new Set();   // выключенные в «Администраторе» разделы (без удаления данных)

  // ---------- фильтры ----------
  const inPer = d => d >= S.from && d <= S.to;
  const okDir = dir => S.dir === 'all' || dir === S.dir;
  const okOrder = o => okDir(o.dir) && (!S.mgr || o.mgr === S.mgr) && (!S.client || o.client === S.client) && (!myMgr() || o.mgr === myMgr());
  const okLine = l => (!S.wh || l.wh === S.wh) && (!S.cat || (l.p ? D.PI[l.p].cat : 'Услуги') === S.cat);
  const lineFiltered = () => !!(S.wh || S.cat);

  // ---------- продажи: строки реализации (выручка признаётся при отгрузке/акте) ----------
  let VER = 0; const memo = {};
  const cache = (k, fn) => { const kk = k + '|' + VER + '|' + JSON.stringify([S.from, S.to, S.dir, S.mgr, S.wh, S.cat, S.client, S.role, S.asMgr]); if (!(kk in memo)) memo[kk] = fn(); return memo[kk]; };
  const bump = () => { VER++; for (const k in memo) delete memo[k]; };
  // все строки реализации и возвратов, без периода (период фильтрует вызывающий)
  function allSaleLines(){
    return cache('asl', () => {
      const out = [];
      for (const o of D.SALES){
        if (!okOrder(o)) continue;
        for (const s of o.ships) for (const z of s.lines){ if (!okLine(z.l)) continue;
          out.push({ d: s.d, doc: s.id, o, l: z.l, q: z.q, rev: z.rev, cost: z.q * z.cost, gross: z.q * z.l.price, disc: Math.round(z.q * z.l.price * z.l.disc), kind: z.l.svc ? 'услуга' : 'товар' }); }
        if (o.ret && okLine(o.ret.l)) out.push({ d: o.ret.d, doc: 'ВК-' + o.id, o, l: o.ret.l, q: -o.ret.q, rev: -o.ret.amt, cost: -o.ret.q * o.ret.cost, gross: -o.ret.q * o.ret.l.price, disc: 0, kind: 'возврат' });
      }
      return out;
    });
  }
  const saleLines = (a = S.from, b = S.to) => allSaleLines().filter(x => x.d >= a && x.d <= b);
  // прямые затраты проектов (логистика, монтаж, подрядчики…) — часть себестоимости услуг RestArt
  const PROJ_ART = ['Логистика проекта', 'Доставка по проекту', 'Командировочные', 'Оплата подрядчикам', 'Прочие расходы проекта'];
  function projCosts(a = S.from, b = S.to){
    if (lineFiltered() || S.client || (S.dir !== 'all' && S.dir !== 'RA')) return [];
    return D.CASH.filter(c => PROJ_ART.includes(c.art) && c.d >= a && c.d <= b && !c.storno).filter(c => { if (!S.mgr && !myMgr()) return true; const pr = D.PROJ.find(p => p.id === c.ref); return pr && (!S.mgr || pr.mgr === S.mgr) && (!myMgr() || pr.mgr === myMgr()); });
  }
  // операционные расходы: свои по направлению + доля «Общих» пропорционально выручке периода
  function opexRows(a = S.from, b = S.to){
    const rows = D.CASH.filter(c => c.type === 'Операционный расход' && c.d >= a && c.d <= b && !c.storno);
    if (S.dir === 'all' && !S.mgr && !myMgr()) return rows.map(c => ({ c, share: 1 }));
    const share = dirShare(a, b);
    return rows.filter(c => c.dir === S.dir || c.dir === 'Общие').map(c => ({ c, share: c.dir === 'Общие' ? share : 1 }));
  }
  function dirShare(a, b){
    const keep = S.dir; let tot = 0, mine = 0;
    for (const o of D.SALES) for (const s of o.ships) if (s.d >= a && s.d <= b) for (const z of s.lines){ const v = z.q * z.l.price * (1 - z.l.disc); tot += v; if (keep === 'all' || o.dir === keep) mine += v; }
    return tot ? mine / tot : 0;
  }
  function pl(a = S.from, b = S.to){
    return cache('pl' + a + '-' + b, () => {
      const L = saleLines(a, b), pc = projCosts(a, b), ox = opexRows(a, b);
      const rev = L.reduce((x, r) => x + r.rev, 0), cogs = L.reduce((x, r) => x + r.cost, 0), proj = -pc.reduce((x, c) => x + c.amt, 0);
      const opex = -ox.reduce((x, r) => x + r.c.amt * r.share, 0);
      const gross = rev - cogs - proj, op = gross - opex;
      return { rev, cogs, proj, gross, gm: rev ? gross / rev : NaN, opex, op, om: rev ? op / rev : NaN, markup: cogs ? (rev - cogs) / cogs : NaN, disc: L.reduce((x, r) => x + r.disc, 0), L, pc, ox };
    });
  }
  // ---------- деньги ----------
  const accBal = (acc, i = S.to) => (D.OPEN_CASH[acc] || 0) + D.CASH.filter(c => c.acc === acc && c.d <= i && !c.storno).reduce((x, c) => x + c.amt, 0);
  const accBalCur = (acc, i = S.to) => { const a = D.ACC.find(x => x.id === acc); if (a.cur === 'KGS') return accBal(acc, i); return D.CASH.filter(c => c.acc === acc && c.d <= i && !c.storno).reduce((x, c) => x + (c.amtCur || 0) * Math.sign(c.amt), 0); };
  const cashTotal = (i = S.to) => D.ACC.reduce((x, a) => x + accBal(a.id, i), 0);
  function cashRows(a = S.from, b = S.to){
    return D.CASH.filter(c => c.d >= a && c.d <= b).filter(c => S.dir === 'all' || c.dir === S.dir).filter(c => !S.client || c.cp === (D.CLI[S.client] || {}).name);
  }
  // ПДС — поступления денег от покупателей (по заказам), в разрезе фильтров продаж
  function pds(a = S.from, b = S.to){
    let s = 0; const rows = [];
    for (const o of D.SALES){ if (!okOrder(o)) continue; for (const p of o.pays) if (p.d >= a && p.d <= b){ s += p.amt; rows.push({ o, p }); } }
    return { sum: s, rows };
  }
  // ---------- дебиторка и авансы на дату ----------
  function ar(i = S.to){
    return cache('ar' + i, () => {
      const rows = [];
      for (const o of D.SALES){ if (!okOrder(o) || o.d > i) continue;
        const rev = D.revOf(o, i), paid = D.paidOf(o, i), bal = rev - paid;
        if (Math.abs(bal) < 1) continue;
        const due = o.due != null ? o.due : (o.ships[0] ? o.ships[0].d : o.d);
        rows.push({ o, rev, paid, bal, due, late: Math.max(0, i - due), pr: o.project ? D.PROJ.find(p => p.id === o.project) : null });
      }
      const debt = rows.filter(r => r.bal > 0), adv = rows.filter(r => r.bal < 0);
      return { rows, debt, adv, sum: debt.reduce((x, r) => x + r.bal, 0), advSum: -adv.reduce((x, r) => x + r.bal, 0), overdue: debt.filter(r => r.late > 0).reduce((x, r) => x + r.bal, 0) };
    });
  }
  // ---------- кредиторка перед поставщиками на дату ----------
  function ap(i = S.to){
    return cache('ap' + i, () => {
      const rows = [];
      for (const po of D.PURCH){ if (!okDir(po.dir) || po.d > i) continue;
        const recv = po.fact != null && po.fact <= i ? po.total : 0, paid = po.pays.filter(p => p.d <= i).reduce((x, p) => x + p.amt, 0), bal = recv - paid;
        if (Math.abs(bal) < 1) continue;
        const due = (po.fact || po.plan) + 10;
        rows.push({ po, recv, paid, bal, due, late: Math.max(0, i - due) });
      }
      const debt = rows.filter(r => r.bal > 0), adv = rows.filter(r => r.bal < 0);
      return { rows, debt, adv, sum: debt.reduce((x, r) => x + r.bal, 0), advSum: -adv.reduce((x, r) => x + r.bal, 0) };
    });
  }
  // ---------- склад на дату ----------
  function stockAt(i = S.to){
    return cache('st' + i, () => {
      const q = {}, v = {};
      for (const m of D.MOVES){ if (m.d > i) continue; const k = m.p + '|' + m.wh; q[k] = (q[k] || 0) + m.q; v[k] = (v[k] || 0) + m.q * m.cost; }
      const rows = [];
      for (const k in q){ const [p, wh] = k.split('|'); const pp = D.PI[p], w = D.WH.find(x => x.id === wh);
        if (!okDir(w.dir) || (S.wh && wh !== S.wh) || (S.cat && pp.cat !== S.cat)) continue;
        if (!q[k] && Math.abs(v[k]) < 1) continue;
        const res = i === T ? (pp.res[wh] || 0) : 0;
        rows.push({ p: pp, wh: w, q: q[k], res, avail: q[k] - res, val: v[k] });
      }
      return { rows, val: rows.reduce((x, r) => x + r.val, 0), qty: rows.reduce((x, r) => x + r.q, 0) };
    });
  }
  // складская карточка: товар × склад × период
  function stockCard(p, wh, a = S.from, b = S.to){
    let open = 0, openV = 0, inQ = 0, outQ = 0, inV = 0, outV = 0; const rows = [];
    for (const m of D.MOVES){ if (m.p !== p || (wh && m.wh !== wh)) continue;
      if (m.d < a){ open += m.q; openV += m.q * m.cost; continue; } if (m.d > b) continue;
      if (wh || m.type !== 'Перемещение'){ if (m.q > 0){ inQ += m.q; inV += m.q * m.cost; } else { outQ -= m.q; outV -= m.q * m.cost; } }
      rows.push(m);
    }
    const res = b === T ? (wh ? (D.PI[p].res[wh] || 0) : Object.values(D.PI[p].res).reduce((x, y) => x + y, 0)) : 0;
    const end = open + inQ - outQ;
    return { open, openV, inQ, outQ, inV, outV, res, avail: end - res, end, endV: openV + inV - outV, rows };
  }
  // ---------- проекты ----------
  function projStats(pr, i = S.to){
    const o = D.SALES.find(x => x.id === pr.order);
    const rev = o ? D.revOf(o, i) : 0, paid = o ? D.paidOf(o, i) : 0;
    const cogs = o ? o.ships.filter(s => s.d <= i).reduce((x, s) => x + s.lines.reduce((y, z) => y + z.q * z.cost, 0), 0) : 0;
    const exp = pr.exp.filter(e => e.d <= i).reduce((x, e) => x + e.amt, 0);
    const factCost = cogs + exp, gross = rev - cogs, profit = rev - factCost;
    let status = pr.status; if (i < T){ status = i < pr.d0 + 6 ? 'КП' : rev === 0 ? 'Закупка' : 'Поставка'; }
    return { o, rev, paid, rest: (pr.contract || 0) - paid, cogs, exp, factCost, gross, profit, pm: rev ? profit / rev : NaN, planProfit: (pr.contract || 0) - (pr.planCost || 0), status, adv: Math.max(0, paid - rev) };
  }
  const projVisible = pr => (S.dir === 'all' || S.dir === 'RA') && (!myMgr() || pr.mgr === myMgr()) && (!S.mgr || pr.mgr === S.mgr) && (!S.client || pr.client === S.client);
  // ---------- план ----------
  function planOf(a = S.from, b = S.to){
    let s = 0;
    for (let m = D.mOf(a); m <= D.mOf(b); m++){
      const ms = D.monthStart(m), me = D.monthStart(m + 1) - 1, dim = me - ms + 1;
      const k = (Math.min(b, me) - Math.max(a, ms) + 1) / dim; if (k <= 0) continue;
      for (const mg of D.MGR){ if (!okDir(mg.dir) || (S.mgr && mg.id !== S.mgr) || (myMgr() && mg.id !== myMgr())) continue; s += (D.PLAN[m] || {})[mg.id] * k || 0; }
    }
    return s;
  }
  // помесячно
  const monthsIn = (a = S.from, b = S.to) => { const r = []; for (let m = D.mOf(a); m <= D.mOf(b); m++) r.push(m); return r; };
  const mRange = m => [Math.max(S.from, D.monthStart(m)), Math.min(S.to, D.monthStart(m + 1) - 1)];
  function byMonth(fn, a = S.from, b = S.to){ return monthsIn(a, b).map(m => { const [x, y] = [Math.max(a, D.monthStart(m)), Math.min(b, D.monthStart(m + 1) - 1)]; return fn(x, y, m); }); }
  // в разрезе направлений: временно переключает фильтр
  function perDir(fn){ const keep = S.dir; const out = {}; for (const d of D.DIRS){ S.dir = d.id; out[d.id] = fn(d.id); } S.dir = 'all'; out.all = fn('all'); S.dir = keep; return out; }

  const filterLabel = () => {
    const p = []; if (S.dir !== 'all') p.push(U.dirName(S.dir)); if (S.mgr) p.push(D.MGR.find(m => m.id === S.mgr).name); if (S.wh) p.push(D.WH.find(w => w.id === S.wh).short); if (S.cat) p.push(S.cat); if (S.client) p.push(D.CLI[S.client].name); if (myMgr()) p.push('только мои клиенты');
    return p.join(' · ');
  };
  const perLabel = () => S.from === S.to ? U.dt(S.from) : U.dt(S.from) + ' – ' + U.dt(S.to);
  const CATS = [...new Set(D.P.map(p => p.cat))];

  window.RS = { D, U, S, T, save, PERIODS, setPeriod, SECS, ROLES, role, lvl, canSee, canEdit, myMgr, seeCost, seeProfit, OFF, inPer, okDir, okOrder, okLine,
    allSaleLines, saleLines, projCosts, opexRows, pl, accBal, accBalCur, cashTotal, cashRows, pds, ar, ap, stockAt, stockCard, projStats, projVisible, planOf, monthsIn, mRange, byMonth, perDir, filterLabel, perLabel, CATS, PROJ_ART, bump };
})();
