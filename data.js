// RESTART BI · data.js — единая книга операций RestArt (демо).
// Все операции порождаются одним проходом по дням 01.01.2025 → 05.11.2026, поэтому склад, продажи, деньги,
// долги и прибыль сходятся между собой на любую дату. Названия, клиенты, бренды и суммы вымышлены.
(function(){
  'use strict';
  const TODAY_ISO = '2026-11-05';
  const D0 = Date.UTC(2025, 0, 1);
  const idx = s => Math.round((Date.parse(s + 'T00:00:00Z') - D0) / 864e5);
  const iso = i => new Date(D0 + i * 864e5).toISOString().slice(0, 10);
  const T = idx(TODAY_ISO);
  const wd = i => new Date(D0 + i * 864e5).getUTCDay();
  const mOf = i => { const d = new Date(D0 + i * 864e5); return (d.getUTCFullYear() - 2025) * 12 + d.getUTCMonth(); };
  const NM = mOf(T) + 1;   // месяцев с января 2025 по текущий включительно
  const monthStart = m => idx(`${2025 + Math.floor(m / 12)}-${String(m % 12 + 1).padStart(2, '0')}-01`);

  // ---------- детерминированный случай ----------
  let seed = 20250101;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = a => a[Math.floor(rnd() * a.length)];
  const pickW = items => { const s = items.reduce((x, y) => x + y[0], 0); let r = rnd() * s; for (const [w, v] of items){ if ((r -= w) < 0) return v; } return items[items.length - 1][1]; };
  const r2 = x => Math.round(x * 100) / 100;
  const r0 = x => Math.round(x);

  // ---------- курсы (сом за единицу валюты), по месяцам ----------
  const FX = { KGS: [], USD: [], EUR: [], CNY: [] };
  for (let m = 0; m < 24; m++){ const u = 87.2 + 0.06 * m + 0.7 * Math.sin(m / 2.6); FX.KGS.push(1); FX.USD.push(r2(u)); FX.EUR.push(r2(u * (1.06 + 0.025 * Math.sin(m / 4)))); FX.CNY.push(r2(u / 7.18)); }
  const fx = (cur, i) => FX[cur][Math.max(0, Math.min(23, mOf(i)))];

  // ---------- направления, склады, счета ----------
  const DIRS = [
    { id: 'RA', name: 'RestArt', sub: 'проектные продажи HoReCa' },
    { id: 'KM', name: 'Klen Market', sub: 'оборудование из наличия' },
    { id: 'IB', name: 'Italbrands', sub: 'посуда и премиальные товары' },
  ];
  const WH = [
    { id: 'W1', name: 'Центральный склад, Бишкек', short: 'Центральный', dir: 'KM' },
    { id: 'W2', name: 'Шоурум Klen Market', short: 'Шоурум KM', dir: 'KM' },
    { id: 'W5', name: 'Склад Ош', short: 'Ош', dir: 'KM' },
    { id: 'W3', name: 'Склад Italbrands', short: 'Italbrands', dir: 'IB' },
    { id: 'W4', name: 'Склад проектов RestArt', short: 'Проекты RA', dir: 'RA' },
  ];
  const ACC = [
    { id: 'A1', name: 'Касса, Бишкек', cur: 'KGS', kind: 'касса' },
    { id: 'A2', name: 'Р/с «Оптима Капитал», сом', cur: 'KGS', kind: 'счёт' },
    { id: 'A3', name: 'Р/с «Демир Альянс», сом', cur: 'KGS', kind: 'счёт' },
    { id: 'A4', name: 'Р/с «Оптима Капитал», USD', cur: 'USD', kind: 'счёт' },
    { id: 'A5', name: 'Р/с «Оптима Капитал», EUR', cur: 'EUR', kind: 'счёт' },
  ];

  // ---------- поставщики ----------
  const SUP = [
    { id: 'S1', name: 'Termika S.r.l.', country: 'Италия', cur: 'EUR', lead: 38, customs: 0.11 },
    { id: 'S2', name: 'Frostel Soğutma A.Ş.', country: 'Турция', cur: 'USD', lead: 24, customs: 0.09 },
    { id: 'S3', name: 'Guangzhou KitchenPro Co.', country: 'Китай', cur: 'CNY', lead: 42, customs: 0.12 },
    { id: 'S4', name: 'Mixor GmbH', country: 'Германия', cur: 'EUR', lead: 34, customs: 0.10 },
    { id: 'S5', name: 'Porcellana Viva S.p.A.', country: 'Италия', cur: 'EUR', lead: 40, customs: 0.10 },
    { id: 'S6', name: 'Cristallo Fino S.r.l.', country: 'Италия', cur: 'EUR', lead: 40, customs: 0.10 },
    { id: 'S7', name: 'ТОО «АзияХолодТорг»', country: 'Казахстан', cur: 'USD', lead: 9, customs: 0 },
    { id: 'S8', name: 'Lama Acciaio S.r.l.', country: 'Италия', cur: 'EUR', lead: 36, customs: 0.10 },
  ];
  const CONTRACTORS = [
    { id: 'C1', name: 'ИП Асанов (монтаж кухонь)' }, { id: 'C2', name: 'ОсОО «ВентМонтаж»' },
    { id: 'C3', name: 'ОсОО «Тез Логистик»' }, { id: 'C4', name: 'ИП Белоусов (электрика)' },
  ];

  // ---------- номенклатура ----------
  // [название, бренд, категория, подкатегория, ед., поставщик, цена закупки в валюте поставщика, вес кг, объём м³, гарантия мес., направление]
  const PRODUCTS_SRC = [
    ['Пароконвектомат 6 GN 1/1 электрический', 'Termika', 'Тепловое оборудование', 'Пароконвектоматы', 'шт', 'S1', 5200, 92, 0.62, 24, 'KM'],
    ['Пароконвектомат 10 GN 1/1 электрический', 'Termika', 'Тепловое оборудование', 'Пароконвектоматы', 'шт', 'S1', 7400, 128, 0.85, 24, 'KM'],
    ['Плита индукционная 4 конфорки', 'Termika', 'Тепловое оборудование', 'Плиты', 'шт', 'S1', 2900, 58, 0.36, 12, 'KM'],
    ['Плита электрическая 6 конфорок с духовкой', 'KitchenPro', 'Тепловое оборудование', 'Плиты', 'шт', 'S3', 9800, 145, 0.9, 12, 'KM'],
    ['Фритюрница 2×8 л', 'KitchenPro', 'Тепловое оборудование', 'Фритюрницы', 'шт', 'S3', 3100, 22, 0.12, 12, 'KM'],
    ['Гриль контактный двойной', 'KitchenPro', 'Тепловое оборудование', 'Грили', 'шт', 'S3', 1900, 18, 0.08, 12, 'KM'],
    ['Печь для пиццы 2 камеры', 'Termika', 'Тепловое оборудование', 'Печи', 'шт', 'S1', 3600, 110, 0.7, 12, 'KM'],
    ['Мармит вторых блюд 4 GN', 'KitchenPro', 'Тепловое оборудование', 'Мармиты', 'шт', 'S3', 6200, 44, 0.4, 12, 'KM'],
    ['Шкаф холодильный 700 л', 'Frostel', 'Холодильное оборудование', 'Шкафы', 'шт', 'S2', 1450, 110, 1.4, 24, 'KM'],
    ['Шкаф морозильный 700 л', 'Frostel', 'Холодильное оборудование', 'Шкафы', 'шт', 'S2', 1650, 115, 1.4, 24, 'KM'],
    ['Стол холодильный 3 двери', 'Frostel', 'Холодильное оборудование', 'Столы', 'шт', 'S2', 1250, 95, 0.9, 24, 'KM'],
    ['Льдогенератор 40 кг/сутки', 'Frostel', 'Холодильное оборудование', 'Льдогенераторы', 'шт', 'S2', 1100, 42, 0.3, 12, 'KM'],
    ['Витрина кондитерская 1,2 м', 'Frostel', 'Холодильное оборудование', 'Витрины', 'шт', 'S7', 1900, 150, 1.6, 12, 'KM'],
    ['Шкаф шоковой заморозки 5 GN', 'Termika', 'Холодильное оборудование', 'Шоковая заморозка', 'шт', 'S1', 4300, 105, 0.8, 24, 'KM'],
    ['Машина посудомоечная купольная', 'Termika', 'Посудомоечное оборудование', 'Купольные', 'шт', 'S1', 3900, 95, 0.75, 24, 'KM'],
    ['Машина посудомоечная фронтальная', 'Termika', 'Посудомоечное оборудование', 'Фронтальные', 'шт', 'S1', 2300, 62, 0.45, 24, 'KM'],
    ['Машина стаканомоечная', 'KitchenPro', 'Посудомоечное оборудование', 'Стаканомоечные', 'шт', 'S3', 7800, 32, 0.2, 12, 'KM'],
    ['Миксер планетарный 20 л', 'Mixor', 'Электромеханическое оборудование', 'Миксеры', 'шт', 'S4', 1600, 78, 0.35, 12, 'KM'],
    ['Мясорубка 300 кг/ч', 'Mixor', 'Электромеханическое оборудование', 'Мясорубки', 'шт', 'S4', 980, 28, 0.08, 12, 'KM'],
    ['Слайсер 300 мм', 'Mixor', 'Электромеханическое оборудование', 'Слайсеры', 'шт', 'S4', 1150, 26, 0.1, 12, 'KM'],
    ['Овощерезка 2 диска', 'Mixor', 'Электромеханическое оборудование', 'Овощерезки', 'шт', 'S4', 1350, 24, 0.09, 12, 'KM'],
    ['Блендер профессиональный 2 л', 'KitchenPro', 'Электромеханическое оборудование', 'Блендеры', 'шт', 'S3', 1600, 6, 0.02, 6, 'KM'],
    ['Стол разделочный нерж. 1500×700', 'KitchenPro', 'Нейтральное оборудование', 'Столы', 'шт', 'S7', 210, 28, 0.25, 12, 'KM'],
    ['Стеллаж нерж. 4 полки', 'KitchenPro', 'Нейтральное оборудование', 'Стеллажи', 'шт', 'S7', 160, 18, 0.2, 12, 'KM'],
    ['Ванна моечная 2 секции', 'KitchenPro', 'Нейтральное оборудование', 'Ванны', 'шт', 'S7', 240, 22, 0.3, 12, 'KM'],
    ['Зонт вытяжной пристенный 2 м', 'KitchenPro', 'Нейтральное оборудование', 'Вентиляция', 'шт', 'S7', 380, 40, 0.6, 12, 'KM'],
    ['Кофемашина 2 группы', 'Barista Line', 'Барное оборудование', 'Кофемашины', 'шт', 'S4', 4800, 62, 0.25, 24, 'KM'],
    ['Кофемолка жерновая 64 мм', 'Barista Line', 'Барное оборудование', 'Кофемолки', 'шт', 'S4', 690, 11, 0.03, 12, 'KM'],
    ['Соковыжималка для цитрусовых', 'Barista Line', 'Барное оборудование', 'Соковыжималки', 'шт', 'S4', 420, 8, 0.03, 12, 'KM'],
    ['Тарелка мелкая 27 см, фарфор', 'Porcellana Viva', 'Фарфор', 'Тарелки', 'шт', 'S5', 6.8, 0.7, 0.002, 0, 'IB'],
    ['Тарелка глубокая 23 см, фарфор', 'Porcellana Viva', 'Фарфор', 'Тарелки', 'шт', 'S5', 6.2, 0.6, 0.002, 0, 'IB'],
    ['Тарелка для пасты 30 см', 'Porcellana Viva', 'Фарфор', 'Тарелки', 'шт', 'S5', 9.4, 0.9, 0.003, 0, 'IB'],
    ['Блюдо овальное 36 см', 'Porcellana Viva', 'Фарфор', 'Блюда', 'шт', 'S5', 14.5, 1.3, 0.004, 0, 'IB'],
    ['Чашка капучино 250 мл с блюдцем', 'Porcellana Viva', 'Фарфор', 'Чашки', 'шт', 'S5', 5.9, 0.45, 0.002, 0, 'IB'],
    ['Бокал для вина 450 мл', 'Cristallo Fino', 'Стекло', 'Бокалы', 'шт', 'S6', 4.6, 0.25, 0.002, 0, 'IB'],
    ['Бокал для шампанского 220 мл', 'Cristallo Fino', 'Стекло', 'Бокалы', 'шт', 'S6', 4.2, 0.2, 0.002, 0, 'IB'],
    ['Стакан хайбол 360 мл', 'Cristallo Fino', 'Стекло', 'Стаканы', 'шт', 'S6', 2.4, 0.3, 0.001, 0, 'IB'],
    ['Графин 1 л', 'Cristallo Fino', 'Стекло', 'Графины', 'шт', 'S6', 8.9, 0.6, 0.003, 0, 'IB'],
    ['Нож шефа 20 см', 'Lama Acciaio', 'Ножи и инструмент', 'Ножи', 'шт', 'S8', 38, 0.3, 0.001, 24, 'IB'],
    ['Нож сантоку 18 см', 'Lama Acciaio', 'Ножи и инструмент', 'Ножи', 'шт', 'S8', 34, 0.28, 0.001, 24, 'IB'],
    ['Набор приборов 24 предмета', 'Lama Acciaio', 'Столовые приборы', 'Наборы', 'набор', 'S8', 46, 2.1, 0.006, 12, 'IB'],
    ['Сковорода 28 см, 3 слоя', 'Lama Acciaio', 'Наплитная посуда', 'Сковороды', 'шт', 'S8', 41, 1.6, 0.008, 24, 'IB'],
    ['Кастрюля 10 л, нерж.', 'Lama Acciaio', 'Наплитная посуда', 'Кастрюли', 'шт', 'S8', 58, 3.2, 0.02, 24, 'IB'],
    ['Сотейник 24 см', 'Lama Acciaio', 'Наплитная посуда', 'Сотейники', 'шт', 'S8', 36, 1.4, 0.007, 24, 'IB'],
    ['Гастроемкость GN 1/1 h65', 'Lama Acciaio', 'Кухонный инвентарь', 'Гастроемкости', 'шт', 'S8', 9.5, 1.1, 0.008, 0, 'IB'],
    ['Доска разделочная HACCP 60×40', 'Lama Acciaio', 'Кухонный инвентарь', 'Доски', 'шт', 'S8', 12, 1.5, 0.005, 0, 'IB'],
  ];
  const SERVICES = [
    { id: 'SV1', name: 'Доставка и подъём оборудования', unit: 'усл.' },
    { id: 'SV2', name: 'Монтаж и пусконаладка', unit: 'усл.' },
    { id: 'SV3', name: 'Проектирование кухни', unit: 'усл.' },
  ];
  const MARKUP = { 'Тепловое оборудование': 1.56, 'Холодильное оборудование': 1.52, 'Посудомоечное оборудование': 1.54, 'Электромеханическое оборудование': 1.6, 'Нейтральное оборудование': 1.7, 'Барное оборудование': 1.58, 'Фарфор': 2.05, 'Стекло': 2.15, 'Ножи и инструмент': 1.9, 'Столовые приборы': 1.95, 'Наплитная посуда': 1.85, 'Кухонный инвентарь': 1.8 };
  const P = PRODUCTS_SRC.map((r, k) => {
    const [name, brand, cat, sub, unit, sup, buy, w, v, war, dir] = r;
    const s = SUP.find(x => x.id === sup);
    const sku = (dir === 'IB' ? 'IB-' : 'KM-') + String(1001 + k);
    const ean = '470' + String(2100000000 + k * 7919).slice(0, 9);
    let c = 0; for (const ch of ean) c += 1; // контрольная цифра упрощённо
    return { id: 'P' + (k + 1), sku, ean: ean + String(k % 10), name, brand, maker: brand + ' · ' + s.country, cat, sub, unit, sup, cur: s.cur, buy, w, v, war, dir,
      status: 'активен', priceHist: [], avg: 0, stock: {}, res: {} };
  });
  const PI = Object.fromEntries(P.map(p => [p.id, p]));
  // прайс-листы: розничный, оптовый, минимальный; история изменений 3 раза
  const PRICE_DATES = [0, idx('2025-07-01'), idx('2026-02-01'), idx('2026-09-15')];
  for (const p of P){
    const base = p.buy * fx(p.cur, 0) * (1 + (SUP.find(s => s.id === p.sup).customs) + 0.07);
    let k = MARKUP[p.cat] * (0.96 + rnd() * 0.08);
    PRICE_DATES.forEach((d, j) => {
      if (j) k *= 1 + 0.02 + rnd() * 0.05;
      const retail = Math.round(base * k / (p.dir === 'IB' ? 10 : 100)) * (p.dir === 'IB' ? 10 : 100);
      p.priceHist.push({ from: d, retail, opt: Math.round(retail * 0.9 / 10) * 10, min: Math.round(base * (1.12 + 0.03 * j) / 10) * 10, who: j ? pick(['Руслан Т.', 'Айгерим С.']) : 'перенос из Excel', reason: j ? pick(['рост курса EUR', 'новый прайс поставщика', 'плановая индексация']) : 'начальные цены' });
    });
  }
  const priceAt = (p, i) => { let r = p.priceHist[0]; for (const h of p.priceHist) if (h.from <= i) r = h; return r; };

  // ---------- менеджеры и клиенты ----------
  const MGR = [
    { id: 'M1', name: 'Азамат Жумабеков', dir: 'RA', role: 'Менеджер проектов' },
    { id: 'M2', name: 'Динара Осмонова', dir: 'RA', role: 'Менеджер проектов' },
    { id: 'M3', name: 'Тимур Касымов', dir: 'KM', role: 'Менеджер продаж' },
    { id: 'M4', name: 'Елена Ким', dir: 'KM', role: 'Менеджер продаж' },
    { id: 'M5', name: 'Бектур Алиев', dir: 'KM', role: 'Менеджер продаж' },
    { id: 'M6', name: 'Алина Романова', dir: 'IB', role: 'Менеджер продаж' },
    { id: 'M7', name: 'Нурлан Садыков', dir: 'IB', role: 'Менеджер продаж' },
  ];
  const CL_NAMES = {
    RA: ['Ресторан «Тянь-Шань Гриль»', 'Гостиница «Иссык-Куль Резорт»', 'ОсОО «Ала-Тоо Текстиль» (столовая)', 'Пиццерия «Форно Бишкек»', 'Чайхана «Сарай»', 'Банкетный зал «Ордо Палас»', 'Комбинат школьного питания №12', 'Суши-бар «Кайдзен»', 'Бургерная «Гриль Хаус»', 'Пекарня «Нан Дом»', 'Отель «Орион Сити»', 'Фуд-корт ТРЦ «Ала-Арча Молл»', 'Кофейня «Мята»', 'Ресторан «Береке»'],
    KM: ['Кафе «Достук»', 'ИП Мамытов (шаурма)', 'Кофейня «Зерно»', 'Столовая «Ашкана»', 'ОсОО «ФудСервис Ош»', 'Кафе «Самса Хаус»', 'Ресторан «Курут»', 'ИП Ли (корейская кухня)', 'Кафе «Арча»', 'Пиццерия «Пицца Мания»', 'ОсОО «Кейтеринг Плюс»', 'Бар «Барсук»', 'Кафе «Лагман Центр»', 'Кондитерская «Сладкий Дом»', 'ИП Токтосунов', 'Кафе «Нарын»', 'Хостел «Номад»', 'Кофейня «Пенка»', 'Розничный покупатель (касса)', 'Ресторан «Восток»'],
    IB: ['Ресторан «Береке»', 'Гостиница «Иссык-Куль Резорт»', 'Кофейня «Мята»', 'Ресторан «Сфера»', 'Бар «Винотека 12»', 'Отель «Орион Сити»', 'Кейтеринг «Той Сервис»', 'Магазин «Дом Посуды»', 'Розничный покупатель (шоурум)', 'Ресторан «Курут»', 'Банкетный зал «Ордо Палас»', 'Кафе «Самса Хаус»'],
  };
  const SRC = ['Bitrix24 · сделка', 'Звонок', 'Сайт', 'Instagram', 'Повторный клиент', 'Рекомендация', 'Выставка HoReCa'];
  const CL = []; const CLI = {};
  const nameKey = n => n.toLowerCase().replace(/[«»"'.,()№\s-]/g, '');
  for (const d of ['RA', 'KM', 'IB']){
    CL_NAMES[d].forEach((n, k) => {
      let c = CL.find(x => x.name === n);
      if (!c){
        const isB2C = /Розничный/.test(n);
        const id = 'K' + String(CL.length + 1).padStart(3, '0');
        c = { id, name: n, inn: isB2C ? '' : String(ri(1, 2)) + String(10000000000000 + CL.length * 7340033 % 89999999999999).slice(1, 14), phone: isB2C ? '' : '+996 ' + ri(500, 799) + ' ' + String(ri(100000, 999999)).replace(/(\d{3})(\d{3})/, '$1 $2'),
          email: isB2C ? '' : 'info@' + nameKey(n).replace(/[^a-zа-я0-9]/g, '').slice(0, 10) + '.kg', city: /Ош/.test(n) ? 'Ош' : /Иссык/.test(n) ? 'Чолпон-Ата' : 'Бишкек', contact: isB2C ? '' : pick(['Айбек', 'Марина', 'Канат', 'Жылдыз', 'Сергей', 'Гульнара', 'Эрлан']) + ' (' + pick(['шеф-повар', 'управляющий', 'закупщик', 'владелец']) + ')',
          b2c: isB2C, dirs: [], mgr: {}, slow: rnd() < 0.18, b24: isB2C ? '' : 'C-' + ri(1200, 9800) };
        c.whatsapp = c.phone; c.addr = c.city + ', ' + pick(['ул. Киевская', 'пр. Чуй', 'ул. Токтогула', 'пр. Манаса', 'ул. Ахунбаева', 'ул. Ленина']) + ', ' + ri(1, 180);
        CL.push(c); CLI[id] = c;
      }
      c.dirs.push(d);
      const mg = MGR.filter(m => m.dir === d); c.mgr[d] = mg[k % mg.length].id;
    });
  }
  // намеренный «почти дубль» — его ловит проверка дублей в справочнике
  const DUP_SAMPLE = { name: 'Ресторан Береке', inn: CL.find(c => c.name === 'Ресторан «Береке»').inn };

  // ---------- журналы ----------
  const MOVES = [];      // складской журнал: {d, type, doc, p, wh, q(+/-), cost(ед.), dir, who, note}
  const CASH = [];       // ДДС: {id, d, type, acc, dir, art, ref, cp, amt(сом,+/-), cur, amtCur, rate, basis, who, note}
  const SALES = [];      // заказы покупателей
  const PURCH = [];      // закупки
  const PROJ = [];       // проекты RestArt
  const AUDIT = [];      // журнал изменений
  let cashN = 0;
  const addCash = (o) => { o.id = 'ДДС-' + String(++cashN).padStart(5, '0'); if (!o.cur) o.cur = 'KGS'; if (o.rate == null) o.rate = 1; if (o.amtCur == null) o.amtCur = o.amt / o.rate; CASH.push(o); return o; };
  const stockQ = (p, wh) => (PI[p].stock[wh] || 0);
  const resQ = (p, wh) => (PI[p].res[wh] || 0);
  const move = (o) => {
    const p = PI[o.p];
    if (o.q > 0 && o.cost != null && o.type !== 'Перемещение'){   // приход по себестоимости → средняя
      const tot = Object.values(p.stock).reduce((a, b) => a + b, 0);
      p.avg = tot + o.q > 0 ? (p.avg * Math.max(0, tot) + o.cost * o.q) / (Math.max(0, tot) + o.q) : o.cost;
    }
    if (o.cost == null) o.cost = p.avg;
    p.stock[o.wh] = (p.stock[o.wh] || 0) + o.q;
    MOVES.push(o); return o;
  };
  const WHO = { wh: ['Марат (склад)', 'Ислам (склад)', 'Ольга (склад IB)'], fin: ['Айгуль Б. (бухгалтер)'], buy: ['Руслан Т. (закупщик)'] };

  // ---------- начальные остатки 01.01.2025 ----------
  const TARGET = {};   // целевой остаток по складу
  for (const p of P){
    if (p.dir === 'KM'){ const big = p.buy > 1500; TARGET[p.id] = { W1: big ? ri(4, 7) : ri(8, 14), W2: big ? 1 : ri(2, 3), W5: big ? ri(0, 1) : ri(1, 3) }; }
    else TARGET[p.id] = { W3: p.buy < 10 ? ri(600, 900) : ri(70, 140) };
    const c0 = p.buy * fx(p.cur, 0) * (1 + SUP.find(s => s.id === p.sup).customs + 0.075);
    for (const wh in TARGET[p.id]){ const q = Math.round(TARGET[p.id][wh] * (0.8 + rnd() * 0.3)); if (q > 0) move({ d: 0, type: 'Начальный остаток', doc: 'ВВОД-0001', p: p.id, wh, q, cost: r2(c0), dir: p.dir, who: 'перенос из Excel', note: 'остатки на 01.01.2025' }); }
  }

  // ---------- закупки ----------
  const STAGES = ['Заявка', 'Согласование', 'Заказ поставщику', 'Оплата', 'Доставка', 'Приёмка', 'Закрыт'];
  const RULES = ['стоимости', 'количеству', 'весу', 'объёму', 'вручную'];
  let poN = 0;
  function createPO(d, dir, sup, lines, project){
    const s = SUP.find(x => x.id === sup), rate = fx(s.cur, d + 3);
    const val = lines.reduce((a, l) => a + l.q * l.price, 0);
    const delivery = r0(val * rate * (s.country === 'Казахстан' ? 0.035 : 0.065 + rnd() * 0.02));
    const customs = r0(val * rate * s.customs);
    const other = r0(val * rate * (0.004 + rnd() * 0.004));
    const rule = pickW([[5, 'стоимости'], [2, 'количеству'], [3, 'весу'], [2, 'объёму'], [1, 'вручную']]);
    const po = { id: 'ЗК-' + String(++poN).padStart(4, '0'), d, dir, sup, cur: s.cur, rate, lines, delivery, customs, other, rule, project: project || null,
      plan: d + 3 + s.lead, fact: null, who: WHO.buy[0], pays: [], stage: 'Заявка', cancelled: false };
    po.extra = delivery + customs + other;
    // распределение доп. затрат на строки
    const base = l => po.rule === 'количеству' ? l.q : po.rule === 'весу' ? l.q * PI[l.p].w : po.rule === 'объёму' ? l.q * PI[l.p].v : l.q * l.price;
    const tb = lines.reduce((a, l) => a + base(l), 0) || 1;
    let left = po.extra;
    lines.forEach((l, j) => { l.alloc = j === lines.length - 1 ? left : r0(po.extra * base(l) / tb); left -= l.alloc; l.costKgs = r2(l.price * rate + l.alloc / l.q); });
    po.total = r0(val * rate) + po.extra;
    // оплаты: поставщику в валюте — предоплата 50 % через 3 дня, остаток перед отгрузкой; доставка и таможня — по приёмке
    const arrive = po.plan + ri(-3, 6);
    po.arrive = arrive;
    const payPlan = s.country === 'Казахстан' ? [[d + 4, 1]] : [[d + 3, 0.5], [d + 3 + Math.round(s.lead * 0.55), 0.5]];
    po.payPlan = payPlan;
    PURCH.push(po); return po;
  }
  function payPO(po, i, share){
    const s = SUP.find(x => x.id === po.sup);
    const amtCur = r2(po.lines.reduce((a, l) => a + l.q * l.price, 0) * share);
    const rate = fx(po.cur, i);
    const acc = po.cur === 'EUR' ? 'A5' : 'A4';
    const kgs = r0(amtCur * (po.cur === 'CNY' ? rate : rate));
    // покупка валюты: перевод с сомового счёта на валютный — не доход и не расход
    if (po.cur !== 'CNY'){
      addCash({ d: i, type: 'Перевод между счетами', acc: 'A2', dir: po.dir, art: 'Покупка валюты', ref: po.id, cp: 'собственные счета', amt: -kgs, basis: 'покупка ' + po.cur + ' для ' + po.id, who: WHO.fin[0], pair: acc });
      addCash({ d: i, type: 'Перевод между счетами', acc, dir: po.dir, art: 'Покупка валюты', ref: po.id, cp: 'собственные счета', amt: kgs, cur: po.cur, rate, amtCur, basis: 'покупка ' + po.cur + ' для ' + po.id, who: WHO.fin[0], pair: 'A2' });
      addCash({ d: i, type: 'Оплата поставщику', acc, dir: po.dir, art: 'Оплата поставщикам товара', ref: po.id, cp: s.name, amt: -kgs, cur: po.cur, rate, amtCur, basis: 'инвойс по ' + po.id + ' (' + Math.round(share * 100) + ' %)', who: WHO.fin[0] });
    } else {
      const ur = fx('USD', i), usd = r2(kgs / ur);
      addCash({ d: i, type: 'Перевод между счетами', acc: 'A2', dir: po.dir, art: 'Покупка валюты', ref: po.id, cp: 'собственные счета', amt: -kgs, basis: 'покупка USD для ' + po.id, who: WHO.fin[0], pair: 'A4' });
      addCash({ d: i, type: 'Перевод между счетами', acc: 'A4', dir: po.dir, art: 'Покупка валюты', ref: po.id, cp: 'собственные счета', amt: kgs, cur: 'USD', rate: ur, amtCur: usd, basis: 'покупка USD для ' + po.id, who: WHO.fin[0], pair: 'A2' });
      addCash({ d: i, type: 'Оплата поставщику', acc: 'A4', dir: po.dir, art: 'Оплата поставщикам товара', ref: po.id, cp: s.name, amt: -kgs, cur: 'USD', rate: ur, amtCur: usd, basis: 'инвойс по ' + po.id + ' (CNY ' + amtCur + ')', who: WHO.fin[0] });
    }
    po.pays.push({ d: i, amt: kgs, what: 'товар' });
  }
  function receivePO(po, i){
    po.fact = i;
    const wh = po.dir === 'IB' ? 'W3' : po.dir === 'RA' ? 'W4' : 'W1';
    po.wh = wh;
    for (const l of po.lines) move({ d: i, type: 'Приход товара', doc: po.id, p: l.p, wh, q: l.q, cost: l.costKgs, dir: po.dir, who: pick(WHO.wh), note: SUP.find(s => s.id === po.sup).name });
    // логистика и таможня оплачиваются в сомах при приёмке
    addCash({ d: i, type: 'Расход денег', acc: 'A2', dir: po.dir, art: 'Доставка и таможня закупок', ref: po.id, cp: 'ОсОО «Тез Логистик» / таможня', amt: -(po.delivery + po.customs + po.other), basis: 'доп. затраты ' + po.id + ' → себестоимость (по ' + po.rule + ')', who: WHO.fin[0] });
    po.pays.push({ d: i, amt: po.delivery + po.customs + po.other, what: 'доставка и таможня' });
  }

  // ---------- проекты RestArt ----------
  const PSTAT = ['КП', 'Договор', 'Закупка', 'Поставка', 'Монтаж', 'Сдан', 'Закрыт'];
  const PROJ_SRC = [
    ['Кухня под ключ, ресторан «Тянь-Шань Гриль»', 'Ресторан «Тянь-Шань Гриль»', '2025-02-10', 95],
    ['Горячий цех, гостиница «Иссык-Куль Резорт»', 'Гостиница «Иссык-Куль Резорт»', '2025-03-18', 120],
    ['Столовая на 400 мест, «Ала-Тоо Текстиль»', 'ОсОО «Ала-Тоо Текстиль» (столовая)', '2025-04-22', 110],
    ['Пиццерия «Форно Бишкек»', 'Пиццерия «Форно Бишкек»', '2025-06-02', 70],
    ['Чайхана «Сарай» — кухня и бар', 'Чайхана «Сарай»', '2025-07-14', 80],
    ['Банкетный зал «Ордо Палас»', 'Банкетный зал «Ордо Палас»', '2025-09-01', 105],
    ['Комбинат школьного питания №12', 'Комбинат школьного питания №12', '2025-10-20', 130],
    ['Суши-бар «Кайдзен»', 'Суши-бар «Кайдзен»', '2025-12-08', 60],
    ['Бургерная «Гриль Хаус» (2 точки)', 'Бургерная «Гриль Хаус»', '2026-02-02', 75],
    ['Пекарня «Нан Дом» — цех', 'Пекарня «Нан Дом»', '2026-03-16', 85],
    ['Ресторан отеля «Орион Сити»', 'Отель «Орион Сити»', '2026-05-11', 120],
    ['Фуд-корт ТРЦ «Ала-Арча Молл»', 'Фуд-корт ТРЦ «Ала-Арча Молл»', '2026-07-06', 150],
    ['Кофейня «Мята» (3 точки)', 'Кофейня «Мята»', '2026-08-24', 70],
    ['Ресторан «Береке» — реконструкция кухни', 'Ресторан «Береке»', '2026-10-05', 90],
  ];
  const KM_P = P.filter(p => p.dir === 'KM');
  PROJ_SRC.forEach(([name, cl, start, dur], k) => {
    const c = CL.find(x => x.name === cl), d0 = idx(start);
    const mgr = c.mgr.RA;
    // спецификация оборудования
    const n = ri(9, 15), used = new Set(), lines = [];
    while (lines.length < n){ const p = pick(KM_P); if (used.has(p.id)) continue; used.add(p.id); lines.push({ p: p.id, q: p.buy > 2500 ? ri(1, 3) : ri(2, 6) }); }
    PROJ.push({ id: 'ПРJ-' + String(k + 1).padStart(3, '0'), name, client: c.id, mgr, d0, end: d0 + dur, spec: lines, disc: ri(3, 8) / 100,
      svc: [{ s: 'SV3', amt: ri(18, 45) * 10000 }, { s: 'SV1', amt: ri(25, 70) * 10000 }, { s: 'SV2', amt: ri(60, 180) * 10000 }],
      exp: [], pays: [], ships: [], po: null, order: null, status: 'КП' });
  });

  // ---------- продажи ----------
  let soN = { RA: 0, KM: 0, IB: 0 };
  const PFX = { RA: 'RA', KM: 'KM', IB: 'IB' };
  function newOrder(d, dir, client, mgr, src, extra){
    const o = Object.assign({ id: PFX[dir] + '-' + String(++soN[dir]).padStart(5, '0'), d, dir, client, mgr, src, lines: [], pays: [], ships: [], cancel: null, ret: null, b24: src.startsWith('Bitrix') ? 'D-' + (40000 + SALES.length * 3) : '', terms: 0 }, extra || {});
    SALES.push(o); return o;
  }
  const lineNet = l => r0(l.q * l.price * (1 - l.disc));
  const orderTotal = o => o.lines.reduce((a, l) => a + lineNet(l), 0);
  function reserve(o){ for (const l of o.lines) if (l.p && l.wh){ const p = PI[l.p]; p.res[l.wh] = (p.res[l.wh] || 0) + l.q; l.resQ = l.q; } }
  function unreserve(o, l, q){ const p = PI[l.p]; p.res[l.wh] = Math.max(0, (p.res[l.wh] || 0) - q); l.resQ = Math.max(0, (l.resQ || 0) - q); }
  function ship(o, i, part){
    const sh = { d: i, id: 'ОТГ-' + o.id + '-' + (o.ships.length + 1), lines: [] };
    for (const l of o.lines){
      const left = l.q - (l.shipped || 0); if (left <= 0) continue;
      const q = part ? Math.max(1, Math.ceil(left * part)) : left;
      if (l.svc) continue;   // услуги проектов признаются отдельными актами
      if (stockQ(l.p, l.wh) < q) continue;
      unreserve(o, l, q);
      const mv = move({ d: i, type: 'Продажа и отгрузка', doc: sh.id, p: l.p, wh: l.wh, q: -q, dir: o.dir, who: pick(WHO.wh), note: CLI[o.client].name });
      l.shipped = (l.shipped || 0) + q; const rv = l.shipped >= l.q ? lineNet(l) - (l.recog || 0) : r0(q * l.price * (1 - l.disc)); l.recog = (l.recog || 0) + rv; sh.lines.push({ l, q, cost: r2(mv.cost), rev: rv });
    }
    if (sh.lines.length) o.ships.push(sh);
    return sh;
  }
  function pay(o, i, amt, acc){
    if (amt <= 0) return;
    o.pays.push({ d: i, amt, acc });
    addCash({ d: i, type: 'Оплата от клиента', acc, dir: o.dir, art: o.dir === 'RA' && o.project ? 'Поступления по проектам' : 'Поступления от покупателей', ref: o.project || o.id, cp: CLI[o.client].name, amt, basis: (o.project ? 'договор ' + o.project : 'счёт по заказу ' + o.id), who: WHO.fin[0], order: o.id });
  }

  // ---------- главный проход по дням ----------
  const pending = [];   // запланированные события: {d, fn}
  const at = (d, fn) => pending.push({ d, fn });
  const clientsOf = dir => CL.filter(c => c.dirs.includes(dir));
  const OPEX = [
    // [статья, направление, сумма в мес., день]
    ['Зарплата и премии', 'RA', 780000, 5], ['Зарплата и премии', 'KM', 1700000, 5], ['Зарплата и премии', 'IB', 820000, 5], ['Зарплата и премии', 'Общие', 950000, 5],
    ['Аренда склада и шоурума', 'KM', 560000, 2], ['Аренда склада и шоурума', 'IB', 210000, 2], ['Аренда склада и шоурума', 'RA', 140000, 2], ['Аренда офиса', 'Общие', 210000, 2],
    ['Маркетинг и реклама', 'KM', 240000, 12], ['Маркетинг и реклама', 'IB', 150000, 12], ['Маркетинг и реклама', 'RA', 120000, 12],
    ['Связь, ПО, Bitrix24', 'Общие', 95000, 8], ['Транспорт и топливо', 'KM', 180000, 20], ['Транспорт и топливо', 'RA', 90000, 20], ['Хозяйственные расходы', 'Общие', 70000, 15],
  ];
  // запланировать проекты
  for (const pr of PROJ){
    at(pr.d0 + 6, i => { pr.status = 'Договор'; const c = CLI[pr.client];
      const o = newOrder(i, 'RA', pr.client, pr.mgr, 'Bitrix24 · сделка', { project: pr.id, terms: 0 });
      for (const s of pr.spec){ const p = PI[s.p]; const pr0 = priceAt(p, i); o.lines.push({ p: s.p, wh: 'W4', q: s.q, price: pr0.retail, disc: pr.disc }); }
      for (const s of pr.svc) o.lines.push({ svc: s.s, q: 1, price: s.amt, disc: 0 });
      pr.order = o.id; pr.contract = orderTotal(o);
      pr.planCost = r0(pr.spec.reduce((a, s) => a + s.q * PI[s.p].buy * fx(PI[s.p].cur, i) * 1.17, 0) + pr.svc[1].amt * 0.55 + pr.svc[2].amt * 0.6 + pr.contract * 0.02);
      // аванс 50 % — деньги пришли, но это ещё не выручка
      const adv = r0(pr.contract * 0.5); pay(o, i + 2, adv, 'A2'); pr.pays.push({ d: i + 2, amt: adv, what: 'аванс 50 %' });
      // закупка под проект
      const bySup = {};
      for (const s of pr.spec){ const p = PI[s.p]; (bySup[p.sup] = bySup[p.sup] || []).push({ p: s.p, q: s.q, price: p.buy }); }
      pr.po = [];
      for (const sp in bySup){ const po = createPO(i + 3, 'RA', sp, bySup[sp], pr.id); pr.po.push(po.id); schedulePO(po); }
      pr.status = 'Закупка';
    });
  }
  function schedulePO(po){
    for (const [d, sh] of po.payPlan) at(d, i => payPO(po, i, sh));
    at(po.arrive, i => receivePO(po, i));
  }
  // проект: поставка, монтаж, оплаты, расходы
  function projectTick(pr, i){
    if (!pr.order) return;
    const o = SALES.find(x => x.id === pr.order);
    const allIn = pr.po.every(id => PURCH.find(p => p.id === id).fact != null);
    const goods = o.lines.filter(l => l.p);
    if (!o._reserved && allIn){ for (const l of goods){ const p = PI[l.p]; p.res.W4 = (p.res.W4 || 0) + l.q; l.resQ = l.q; } o._reserved = true; pr.status = 'Поставка'; pr.shipFrom = i + 2; }
    if (o._reserved && pr.ships.length === 0 && i >= pr.shipFrom){
      const sh = ship(o, i, 0.6); if (sh.lines.length){ pr.ships.push(sh.id); const sv = o.lines.find(l => l.svc === 'SV3'); if (sv){ sv.shipped = 1; sh.lines.push({ l: sv, q: 1, cost: 0, rev: lineNet(sv) }); } }
      addCash({ d: i, type: 'Расход денег', acc: 'A2', dir: 'RA', art: 'Логистика проекта', ref: pr.id, cp: CONTRACTORS[2].name, amt: -r0(pr.contract * 0.012), basis: 'доставка 1-й партии', who: WHO.fin[0] });
      pr.exp.push({ d: i, cat: 'Логистика', amt: r0(pr.contract * 0.012) });
      const p2 = r0(pr.contract * 0.3); at(i + ri(3, 9), j => { pay(o, j, p2, 'A2'); pr.pays.push({ d: j, amt: p2, what: '30 % по поставке' }); });
      pr.ship2 = i + ri(8, 16);
    }
    if (pr.ships.length === 1 && i >= pr.ship2){
      const sh = ship(o, i); const sv = o.lines.find(l => l.svc === 'SV1'); if (sv && !sv.shipped){ sv.shipped = 1; sh.lines.push({ l: sv, q: 1, cost: 0, rev: lineNet(sv) }); }
      if (sh.lines.length) pr.ships.push(sh.id);
      const dl = pr.svc[1].amt * 0.55; addCash({ d: i, type: 'Расход денег', acc: 'A2', dir: 'RA', art: 'Доставка по проекту', ref: pr.id, cp: CONTRACTORS[2].name, amt: -r0(dl), basis: 'доставка и подъём, 2-я партия', who: WHO.fin[0] }); pr.exp.push({ d: i, cat: 'Доставка', amt: r0(dl) });
      pr.status = 'Монтаж'; pr.montEnd = i + ri(10, 22);
      if (rnd() < 0.5){ const tr = ri(4, 9) * 10000; addCash({ d: i + 1, type: 'Расход денег', acc: 'A1', dir: 'RA', art: 'Командировочные', ref: pr.id, cp: 'подотчёт: ' + MGR.find(m => m.id === pr.mgr).name, amt: -tr, basis: 'выезд на объект', who: WHO.fin[0] }); pr.exp.push({ d: i + 1, cat: 'Командировочные', amt: tr }); }
    }
    if (pr.status === 'Монтаж' && i >= pr.montEnd){
      const sv = o.lines.find(l => l.svc === 'SV2'); const sh = { d: i, id: 'АКТ-' + pr.id.slice(4), lines: [{ l: sv, q: 1, cost: 0, rev: lineNet(sv) }] }; sv.shipped = 1; o.ships.push(sh);
      const mt = r0(pr.svc[2].amt * 0.6); addCash({ d: i, type: 'Расход денег', acc: 'A2', dir: 'RA', art: 'Оплата подрядчикам', ref: pr.id, cp: pick([CONTRACTORS[0], CONTRACTORS[1], CONTRACTORS[3]]).name, amt: -mt, basis: 'монтаж и пусконаладка', who: WHO.fin[0] }); pr.exp.push({ d: i, cat: 'Монтаж и подрядчики', amt: mt });
      const oth = r0(pr.contract * 0.006); addCash({ d: i, type: 'Расход денег', acc: 'A1', dir: 'RA', art: 'Прочие расходы проекта', ref: pr.id, cp: 'разные', amt: -oth, basis: 'расходники, крепёж', who: WHO.fin[0] }); pr.exp.push({ d: i, cat: 'Прочие', amt: oth });
      pr.status = 'Сдан'; pr.done = i;
      const rest = orderTotal(o) - o.pays.reduce((a, p) => a + p.amt, 0);
      const late = CLI[pr.client].slow ? ri(25, 70) : ri(4, 18);
      at(i + late, j => { if (rest > 0){ pay(o, j, rest, 'A2'); pr.pays.push({ d: j, amt: rest, what: 'окончательный расчёт' }); } pr.status = 'Закрыт'; });
    }
  }
  // ежемесячная дозакупка KM и IB
  function replenish(i, dir){
    const whs = dir === 'IB' ? ['W3'] : ['W1', 'W2', 'W5'];
    const bySup = {};
    for (const p of P.filter(x => x.dir === dir)){
      const tgt = whs.reduce((a, w) => a + (TARGET[p.id][w] || 0), 0) * (dir === 'KM' ? 1.35 : 1.25);
      const have = whs.reduce((a, w) => a + stockQ(p.id, w), 0);
      const inbound = PURCH.filter(po => !po.fact && po.dir === dir).reduce((a, po) => a + po.lines.filter(l => l.p === p.id).reduce((x, l) => x + l.q, 0), 0);
      const need = Math.round(tgt - have - inbound);
      if (need > (dir === 'IB' ? 12 : 0)) (bySup[p.sup] = bySup[p.sup] || []).push({ p: p.id, q: dir === 'IB' ? Math.ceil(need / 12) * 12 : need, price: r2(p.buy * (1 + 0.03 * Math.floor(mOf(i) / 8))) });
    }
    for (const s in bySup){ const po = createPO(i, dir, s, bySup[s]); schedulePO(po); }
  }
  // перемещения KM: центральный → шоурум и Ош
  function transfers(i){
    let n = 0;
    for (const p of P.filter(x => x.dir === 'KM')) for (const w of ['W2', 'W5']){
      const t = TARGET[p.id][w] || 0, have = stockQ(p.id, w), free = stockQ(p.id, 'W1') - resQ(p.id, 'W1');
      const q = Math.min(t - have, free - 1);
      if (q > 0){ n++; const doc = 'ПМ-' + iso(i).slice(2).replace(/-/g, '') + '-' + w;
        const mv = move({ d: i, type: 'Перемещение', doc, p: p.id, wh: 'W1', q: -q, dir: 'KM', who: WHO.wh[0], note: '→ ' + WH.find(x => x.id === w).short });
        move({ d: i, type: 'Перемещение', doc, p: p.id, wh: w, q, cost: mv.cost, dir: 'KM', who: WHO.wh[1], note: '← Центральный' }); }
    }
    return n;
  }
  function genOrder(i, dir){
    const cls = clientsOf(dir); const c = pick(cls);
    const b2c = c.b2c; const mgr = c.mgr[dir];
    const whs = dir === 'IB' ? ['W3'] : (c.city === 'Ош' ? ['W5', 'W1'] : b2c ? ['W2', 'W1'] : ['W1']);
    const o = newOrder(i, dir, c.id, mgr, b2c ? pick(['Сайт', 'Instagram', 'Звонок']) : pickW([[4, 'Bitrix24 · сделка'], [2, 'Звонок'], [2, 'Повторный клиент'], [1, 'Рекомендация'], [1, 'Выставка HoReCa'], [1, 'Сайт']]), { b2c, terms: b2c ? 0 : pick([0, 7, 14, 30]) });
    const n = dir === 'IB' ? ri(1, 5) : ri(1, 3); const used = new Set();
    for (let k = 0; k < n; k++){
      const p = pick(P.filter(x => x.dir === dir)); if (used.has(p.id)) continue; used.add(p.id);
      let q = dir === 'IB' ? (b2c ? ri(2, 12) : pick([12, 24, 36, 48, 60, 96, 120])) : (p.buy > 2000 ? 1 : ri(1, b2c ? 1 : 4));
      if (dir === 'IB' && p.buy > 25) q = Math.max(1, Math.round(q / 8));
      let wh = whs.find(w => stockQ(p.id, w) - resQ(p.id, w) >= q);
      if (!wh){ const w = whs[0]; const free = stockQ(p.id, w) - resQ(p.id, w); if (free >= 1){ q = free; wh = w; } else continue; }
      const pl = priceAt(p, i); const price = b2c ? pl.retail : pl.opt;
      let disc = b2c ? pickW([[6, 0], [2, 0.03], [1, 0.05]]) : pickW([[4, 0], [3, 0.03], [2, 0.05], [1, 0.08], [0.5, 0.1]]);
      if (price * (1 - disc) < pl.min) disc = Math.max(0, 1 - pl.min / price);
      o.lines.push({ p: p.id, wh, q, price, disc: r2(disc) });
    }
    if (!o.lines.length){ SALES.pop(); soN[dir]--; return; }
    reserve(o);
    const tot = orderTotal(o);
    const cancel = rnd() < 0.03;
    if (b2c){ pay(o, i, tot, dir === 'IB' ? 'A1' : pick(['A1', 'A3'])); at(i + ri(0, 2), j => ship(o, j)); }
    else {
      const pre = pickW([[3, 0], [3, 0.3], [3, 0.5], [2, 1]]);
      const approve = ri(0, 2), pd = i + approve + ri(0, 3);
      if (cancel){ if (pre > 0) at(pd, j => pay(o, j, r0(tot * pre), 'A2')); at(pd + ri(2, 6), j => { o.cancel = j; for (const l of o.lines) unreserve(o, l, l.resQ || 0); const paid = o.pays.reduce((a, p) => a + p.amt, 0); if (paid > 0){ o.pays.push({ d: j, amt: -paid, acc: 'A2', refund: true }); addCash({ d: j, type: 'Возврат денежных средств', acc: 'A2', dir, art: 'Возвраты покупателям', ref: o.id, cp: CLI[o.client].name, amt: -paid, basis: 'отмена заказа ' + o.id, who: WHO.fin[0], order: o.id }); } }); return; }
      if (pre > 0) at(pd, j => pay(o, j, r0(tot * pre), 'A2'));
      const sd = (pre > 0 ? pd : i + approve) + ri(1, 6);
      const split = rnd() < 0.14;
      at(sd, j => { ship(o, j, split ? 0.5 : 0); if (split) at(j + ri(5, 14), k => ship(o, k)); });
      const rest = tot - r0(tot * pre);
      if (rest > 0){
        const due = sd + (split ? 10 : 0) + o.terms;
        o.due = due;
        const late = c.slow ? ri(10, 75) : pickW([[6, ri(-3, 2)], [3, ri(3, 15)], [1, ri(16, 40)]]);
        if (rnd() < 0.18){ const p1 = r0(rest * pick([0.3, 0.5, 0.6])); at(due - ri(0, 5), j => pay(o, j, p1, 'A2')); at(due + late + ri(3, 20), j => pay(o, j, rest - p1, 'A2')); }
        else at(due + late, j => pay(o, j, rest, 'A2'));
      } else o.due = sd;
      // возврат части товара покупателем
      if (rnd() < 0.025) at(sd + ri(4, 20), j => { const l = o.lines.find(x => x.p && (x.shipped || 0) > 0); if (!l) return; const q = Math.max(1, Math.floor(l.shipped / 4)); const sh = o.ships.flatMap(s => s.lines).find(x => x.l === l);
        move({ d: j, type: 'Возврат от клиента', doc: 'ВК-' + o.id, p: l.p, wh: l.wh, q, cost: sh ? sh.cost : PI[l.p].avg, dir, who: pick(WHO.wh), note: 'брак упаковки / не подошло' });
        o.ret = { d: j, l, q, amt: r0(q * l.price * (1 - l.disc)), cost: sh ? sh.cost : PI[l.p].avg }; });
    }
  }

  for (let i = 0; i <= T; i++){
    const dw = wd(i), m = mOf(i), dom = new Date(D0 + i * 864e5).getUTCDate();
    // плановые события дня
    for (let k = 0; k < pending.length; k++){ if (pending[k].d === i){ const e = pending.splice(k, 1)[0]; k--; if (i <= T) e.fn(i); } }
    for (const pr of PROJ) projectTick(pr, i);
    if (dom === 3){ replenish(i, 'KM'); replenish(i, 'IB'); }
    if (dw === 2) transfers(i);
    if (dw !== 0){
      const season = 1 + 0.18 * Math.sin((m % 12 - 2) / 12 * 2 * Math.PI) + 0.012 * m;
      const kmN = Math.round((dw === 6 ? 1.6 : 2.6) * season * (0.6 + rnd() * 0.8));
      for (let k = 0; k < kmN; k++) genOrder(i, 'KM');
      const ibN = Math.round((dw === 6 ? 2.2 : 3.0) * season * (0.6 + rnd() * 0.8) + ((m % 12) === 11 ? 1 : 0));
      for (let k = 0; k < ibN; k++) genOrder(i, 'IB');
    }
    // пополнение зарплатного счёта перед выплатой
    if (dom === 4){ const sal = OPEX.filter(x => x[0].startsWith('Зарплата')).reduce((a, x) => a + x[2], 0) * (1 + 0.01 * m) * 1.06; const bal3 = CASH.filter(c => c.acc === 'A3').reduce((a, c) => a + c.amt, 0) + 4200000; const q = Math.max(0, Math.ceil((sal - bal3 + 500000) / 100000) * 100000); if (q > 0){ addCash({ d: i, type: 'Перевод между счетами', acc: 'A2', dir: 'Общие', art: 'Перевод на зарплатный счёт', ref: '', cp: 'собственные счета', amt: -q, basis: 'фонд оплаты труда ' + iso(i).slice(0, 7), who: WHO.fin[0], pair: 'A3' }); addCash({ d: i, type: 'Перевод между счетами', acc: 'A3', dir: 'Общие', art: 'Перевод на зарплатный счёт', ref: '', cp: 'собственные счета', amt: q, basis: 'фонд оплаты труда ' + iso(i).slice(0, 7), who: WHO.fin[0], pair: 'A2' }); } }
    // операционные расходы
    for (const [art, dir, amt, day] of OPEX) if (dom === day) addCash({ d: i, type: 'Операционный расход', acc: art.startsWith('Зарплата') ? 'A3' : 'A2', dir, art, ref: '', cp: art.startsWith('Аренда') ? 'арендодатель' : art.startsWith('Зарплата') ? 'сотрудники (ведомость)' : 'разные', amt: -r0(amt * (1 + 0.01 * m) * (0.95 + rnd() * 0.1)), basis: art + ' за ' + iso(i).slice(0, 7), who: WHO.fin[0] });
    if (dom === 25){ // налоги (упрощённо: налог с продаж и НДС к уплате) и банк
      const mrev = SALES.reduce((a, o) => a + o.ships.filter(s => mOf(s.d) === m).reduce((x, s) => x + s.lines.reduce((y, z) => y + z.rev, 0), 0), 0);
      addCash({ d: i, type: 'Операционный расход', acc: 'A2', dir: 'Общие', art: 'Налоги', ref: '', cp: 'ГНС при МФ КР', amt: -r0(mrev * 0.045), basis: 'налоги за ' + iso(i).slice(0, 7) + ' (упрощённо)', who: WHO.fin[0] });
      addCash({ d: i, type: 'Операционный расход', acc: 'A2', dir: 'Общие', art: 'Банковские комиссии', ref: '', cp: 'банки', amt: -r0(mrev * 0.0025 + 4500), basis: 'комиссии банков', who: WHO.fin[0] });
    }
    // инкассация кассы по пятницам
    if (dw === 5){ const bal = CASH.filter(c => c.acc === 'A1').reduce((a, c) => a + c.amt, 0) + 600000; const q = Math.floor(Math.max(0, bal - 400000) / 10000) * 10000; if (q > 0){ addCash({ d: i, type: 'Перевод между счетами', acc: 'A1', dir: 'Общие', art: 'Инкассация', ref: '', cp: 'собственные счета', amt: -q, basis: 'сдача выручки в банк', who: WHO.fin[0], pair: 'A2' }); addCash({ d: i, type: 'Перевод между счетами', acc: 'A2', dir: 'Общие', art: 'Инкассация', ref: '', cp: 'собственные счета', amt: q, basis: 'сдача выручки в банк', who: WHO.fin[0], pair: 'A1' }); } }
    // списание боя посуды и инвентаризация
    if (dom === 28){ const p = pick(P.filter(x => x.dir === 'IB' && x.buy < 15)); const q = ri(1, 6); if (stockQ(p.id, 'W3') - resQ(p.id, 'W3') >= q) move({ d: i, type: 'Списание', doc: 'СП-' + iso(i).slice(2, 7).replace('-', ''), p: p.id, wh: 'W3', q: -q, dir: 'IB', who: WHO.wh[2], note: 'бой при хранении, акт комиссии' }); }
    if (dom === 30 && [2, 5, 8, 11].includes(m % 12)){
      for (const w of ['W1', 'W3']){ const p = pick(P.filter(x => x.dir === (w === 'W3' ? 'IB' : 'KM'))); const d = pick([-2, -1, 1]); const free = stockQ(p.id, w) - resQ(p.id, w);
        if (d > 0 || free >= -d){ const doc = 'ИНВ-' + iso(i).slice(2, 7).replace('-', '') + '-' + w; move({ d: i, type: 'Инвентаризация', doc, p: p.id, wh: w, q: d, cost: d > 0 ? PI[p.id].avg : null, dir: w === 'W3' ? 'IB' : 'KM', who: WHO.wh[w === 'W3' ? 2 : 0], note: 'пересчёт ' + (d > 0 ? 'излишек' : 'недостача') });
          AUDIT.push({ d: i, who: WHO.wh[w === 'W3' ? 2 : 0], what: 'Инвентаризация', obj: doc, before: 'учёт ' + (stockQ(p.id, w) - d), after: 'факт ' + stockQ(p.id, w), note: PI[p.id].name }); } }
    }
    // возврат поставщику (брак) — раз в квартал
    if (dom === 18 && m % 3 === 1){ const p = pick(P.filter(x => x.dir === 'KM' && x.buy < 2000)); if (stockQ(p.id, 'W1') - resQ(p.id, 'W1') >= 1){ move({ d: i, type: 'Возврат поставщику', doc: 'ВП-' + iso(i).slice(2, 7).replace('-', ''), p: p.id, wh: 'W1', q: -1, dir: 'KM', who: WHO.wh[0], note: 'заводской брак, рекламация ' + SUP.find(s => s.id === p.sup).name }); } }
  }

  // ---------- статусы на сегодня ----------
  const paidOf = (o, i) => o.pays.filter(p => p.d <= i).reduce((a, p) => a + p.amt, 0);
  const revOf = (o, i) => o.ships.filter(s => s.d <= i).reduce((a, s) => a + s.lines.reduce((x, z) => x + z.rev, 0), 0) - (o.ret && o.ret.d <= i ? o.ret.amt : 0);
  function statusOf(o, i){
    if (i == null) i = T;
    if (o.cancel != null && o.cancel <= i) return 'Отменён';
    if (o.ret && o.ret.d <= i) return 'Возврат';
    const tot = orderTotal(o), paid = paidOf(o, i);
    const qAll = o.lines.reduce((a, l) => a + l.q, 0), qSh = o.ships.filter(s => s.d <= i).reduce((a, s) => a + s.lines.reduce((x, z) => x + z.q, 0), 0);
    if (qSh >= qAll) return paid >= tot ? (i - Math.max(o.ships[o.ships.length - 1].d, o.pays.length ? o.pays[o.pays.length - 1].d : 0) > 2 ? 'Завершён' : 'Отгружен') : 'Отгружен';
    if (qSh > 0) return 'Комплектация';
    const age = i - o.d;
    if (paid >= tot) return age > 1 ? 'Комплектация' : 'Оплачен';
    if (paid > 0) return 'Частично оплачен';
    return age < 1 ? 'Новый' : age < 2 ? 'Согласование' : 'Счёт выставлен';
  }
  for (const po of PURCH){
    po.paid = po.pays.reduce((a, p) => a + p.amt, 0);
    const paidPlan = po.payPlan.filter(([d]) => d <= T).length;
    po.stage = po.fact != null ? (po.paid >= po.total - 1 ? 'Закрыт' : 'Приёмка') : paidPlan === po.payPlan.length ? 'Доставка' : paidPlan > 0 ? 'Оплата' : (T - po.d > 1 ? 'Заказ поставщику' : T - po.d > 0 ? 'Согласование' : 'Заявка');
  }

  // ---------- аудит: изменения цен и пример исправлений ----------
  for (const p of P) p.priceHist.slice(1).forEach((h, j) => AUDIT.push({ d: h.from, who: h.who, what: 'Изменение цены', obj: p.sku, before: p.priceHist[j].retail, after: h.retail, note: h.reason }));
  AUDIT.push({ d: idx('2026-04-14'), who: 'Айгуль Б. (бухгалтер)', what: 'Сторно операции', obj: 'ДДС-0' + ri(2000, 4000), before: 'проведено', after: 'сторнировано корректирующим документом', note: 'двойной ввод платежа — исходная запись сохранена' });
  AUDIT.push({ d: idx('2026-06-03'), who: 'Марат (склад)', what: 'Попытка отгрузки в минус', obj: 'KM-0' + ri(1500, 2500), before: '—', after: 'отклонено системой', note: 'остаток 0, нужен особый допуск' });
  AUDIT.sort((a, b) => a.d - b.d);

  // ---------- план продаж: по направлениям и менеджерам на месяц ----------
  const PLAN = {};   // PLAN[m][mgr] = сумма
  for (let m = 0; m < 24; m++){ PLAN[m] = {}; }
  const mgrRev = {}; for (const o of SALES) for (const s of o.ships){ const m = mOf(s.d); const v = s.lines.reduce((x, z) => x + z.rev, 0); mgrRev[o.mgr] = mgrRev[o.mgr] || {}; mgrRev[o.mgr][m] = (mgrRev[o.mgr][m] || 0) + v; }
  for (const mg of MGR) for (let m = 0; m < 24; m++){
    const hist = []; for (let k = Math.max(0, m - 3); k < m; k++) hist.push((mgrRev[mg.id] || {})[k] || 0);
    const base = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : ((mgrRev[mg.id] || {})[0] || 0);
    PLAN[m][mg.id] = Math.round(base * (mg.dir === 'RA' ? 1.0 : 1.07) / 100000) * 100000;
  }

  window.RS_DATA = {
    TODAY: T, TODAY_ISO, idx, iso, mOf, monthStart, NM, FX, fx,
    DIRS, WH, ACC, SUP, CONTRACTORS, P, PI, SERVICES, MGR, CL, CLI, SRC, nameKey, DUP_SAMPLE,
    MOVES, CASH, SALES, PURCH, PROJ, AUDIT, PLAN, STAGES, PSTAT, RULES,
    priceAt, lineNet, orderTotal, statusOf, paidOf, revOf,
    fn: { move, addCash, newOrder, reserve, unreserve, ship, pay, stockQ, resQ },
    OPEN_CASH: { A1: 600000, A2: 24500000, A3: 4200000, A4: 0, A5: 0 },
  };
})();
