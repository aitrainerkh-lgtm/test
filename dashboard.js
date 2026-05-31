/* ============================================================
   Finance Dashboard — data + chart rendering
   ============================================================ */

const COLORS = {
  green900: '#0f5132',
  green700: '#1a7a4c',
  green600: '#198754',
  green300: '#8fd0a8',
  green200: '#b7e1c6',
  gold: '#f2b705',
  blue: '#3d7edb',
  grey: '#adb5bd',
  ink: '#1f2d28',
};

/* ---------- Data ---------- */
const data = {
  kpis: [
    { label: 'Total Revenue',  value: 2125000, delta: 12.5, vs: 'vs May 2023', icon: '📊' },
    { label: 'Gross Profit',   value: 945000,  delta: 14.3, vs: 'vs May 2023', icon: '🪙' },
    { label: 'Net Profit',     value: 425000,  delta: 15.7, vs: 'vs May 2023', icon: '💵' },
    { label: 'Total Expenses', value: 1180000, delta: 8.6,  vs: 'vs May 2023', icon: '👛' },
    { label: 'Cash Balance',   value: 1350000, delta: 9.8,  vs: 'vs Apr 2024', icon: '🏦' },
  ],

  months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  revenue:  [1480, 1560, 1720, 1860, 2000, 1580, 1600, 1720, 1820, 1900, 2000, 2080].map(v => v * 1000),
  expenses: [ 940,  980, 1200, 1280, 2380, 1180, 1230, 1240, 1290, 1300, 1330, 1440].map(v => v * 1000),
  netProfit:[ 360,  380,  520,  500,  640,  380,  380,  430,  490,  560,  520,  600].map(v => v * 1000),

  categories: [
    { name: 'Salaries & Benefits', pct: 38.1, color: COLORS.green600 },
    { name: 'Operating Expenses',  pct: 22.0, color: COLORS.green700 },
    { name: 'Marketing',           pct: 12.7, color: COLORS.green300 },
    { name: 'Rent & Utilities',    pct: 9.3,  color: COLORS.gold },
    { name: 'Depreciation',        pct: 6.4,  color: COLORS.blue },
    { name: 'Other Expenses',      pct: 11.5, color: COLORS.grey },
  ],
  categoriesTotal: 1180000,

  pl: [
    { name: 'Total Revenue',    a: 2125000, b: 1889000, chg: 12.5, up: true },
    { name: 'Cost of Goods Sold', a: 1180000, b: 1056000, chg: 11.7, up: true },
    { name: 'Gross Profit',     a: 945000,  b: 833000,  chg: 14.3, up: true },
    { name: 'Total Expenses',   a: 1180000, b: 1086000, chg: 8.6,  up: true },
    { name: 'Operating Profit', a: 765000,  b: 636000,  chg: 20.3, up: true },
    { name: 'Net Profit',       a: 425000,  b: 367000,  chg: 15.7, up: true, bold: true },
    { name: 'Net Profit Margin', a: '20.0%', b: '19.4%', chg: '0.6 pp', up: true, bold: true, raw: true },
  ],

  cashflow: [
    { name: 'Cash from Operating Activities', v: 1650000 },
    { name: 'Cash from Investing Activities', v: -450000 },
    { name: 'Cash from Financing Activities', v: -250000 },
    { name: 'Net Change in Cash', v: 950000, total: true },
    { name: 'Beginning Cash Balance (Jan 2024)', v: 400000 },
    { name: 'Ending Cash Balance (May 2024)', v: 1350000, total: true },
  ],

  budget: {
    labels: ['Revenue', 'COGS', 'Expenses', 'Net Profit'],
    budget: [1380000, 1090000, 1010000, 350000],
    actual: [1660000, 1310000, 1230000, 540000],
    pctOfBudget: [112, 108, 97, 121],
  },
};

/* ---------- Helpers ---------- */
const fmtUSD = (n) => '$' + Math.round(n).toLocaleString('en-US');
const fmtAccounting = (n) =>
  n < 0 ? '(' + fmtUSD(Math.abs(n)) + ')' : fmtUSD(n);
const fmtMillions = (v) => {
  if (v === 0) return '$0';
  return v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1e3) + 'K';
};

/* ---------- KPI cards ---------- */
function renderKpis() {
  const el = document.getElementById('kpis');
  el.innerHTML = data.kpis.map(k => `
    <div class="kpi">
      <div class="kpi-icon">${k.icon}</div>
      <div class="kpi-body">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value">${fmtUSD(k.value)}</div>
        <div class="kpi-delta">▲ ${k.delta}% <span class="vs">${k.vs}</span></div>
      </div>
    </div>
  `).join('');
}

/* ---------- Tables ---------- */
function renderPL() {
  const t = document.getElementById('plTable');
  t.innerHTML = `
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">May 2024</th>
        <th class="num">May 2023</th>
        <th class="num">% Change</th>
      </tr>
    </thead>
    <tbody>
      ${data.pl.map(r => `
        <tr class="${r.bold ? 'total' : ''}">
          <td class="row-name">${r.name}</td>
          <td class="num">${r.raw ? r.a : fmtUSD(r.a)}</td>
          <td class="num">${r.raw ? r.b : fmtUSD(r.b)}</td>
          <td class="num up">${r.raw ? r.chg : r.chg + '%'} ▲</td>
        </tr>
      `).join('')}
    </tbody>`;
}

function renderCashflow() {
  const t = document.getElementById('cfTable');
  t.innerHTML = `
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">YTD May 2024</th>
      </tr>
    </thead>
    <tbody>
      ${data.cashflow.map(r => `
        <tr class="${r.total ? 'total' : ''}">
          <td class="row-name">${r.name}</td>
          <td class="num ${r.v < 0 ? 'neg' : ''}">${fmtAccounting(r.v)}</td>
        </tr>
      `).join('')}
    </tbody>`;
}

function renderLegend() {
  const el = document.getElementById('catLegend');
  el.innerHTML = data.categories.map(c => `
    <li>
      <span class="dot" style="background:${c.color}"></span>
      <span>${c.name}</span>
      <span class="pct">${c.pct}%</span>
    </li>
  `).join('');
}

/* ---------- Charts ---------- */
function moneyTicks(value) { return fmtMillions(value); }

function renderRevVsExp() {
  new Chart(document.getElementById('revVsExp'), {
    data: {
      labels: data.months,
      datasets: [
        { type: 'bar', label: 'Revenue', data: data.revenue,
          backgroundColor: COLORS.green700, borderRadius: 2, order: 2 },
        { type: 'bar', label: 'Expenses', data: data.expenses,
          backgroundColor: COLORS.green200, borderRadius: 2, order: 2 },
        { type: 'line', label: 'Net Profit', data: data.netProfit,
          borderColor: COLORS.ink, backgroundColor: '#fff', borderWidth: 2,
          pointRadius: 4, pointBackgroundColor: '#fff', pointBorderColor: COLORS.ink,
          pointBorderWidth: 2, tension: 0.3, order: 1 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 14, font: { size: 11 } } },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmtUSD(c.parsed.y)}` } },
      },
      scales: {
        y: { ticks: { callback: moneyTicks, font: { size: 10 } }, grid: { color: '#eef2f0' } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      },
    },
  });
}

function renderExpByCat() {
  new Chart(document.getElementById('expByCat'), {
    type: 'doughnut',
    data: {
      labels: data.categories.map(c => c.name),
      datasets: [{
        data: data.categories.map(c => c.pct),
        backgroundColor: data.categories.map(c => c.color),
        borderColor: '#fff', borderWidth: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed}%` } },
      },
    },
    plugins: [{
      id: 'centerText',
      afterDraw(chart) {
        const { ctx, chartArea: { left, right, top, bottom } } = chart;
        const x = (left + right) / 2, y = (top + bottom) / 2;
        ctx.save();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.ink;
        ctx.font = '700 16px Inter, sans-serif';
        ctx.fillText(fmtUSD(data.categoriesTotal), x, y - 8);
        ctx.fillStyle = '#5d6b66';
        ctx.font = '500 12px Inter, sans-serif';
        ctx.fillText('Total', x, y + 12);
        ctx.restore();
      },
    }],
  });
}

function renderBudgetActual() {
  new Chart(document.getElementById('budgetActual'), {
    data: {
      labels: data.budget.labels,
      datasets: [
        { type: 'bar', label: 'Budget', data: data.budget.budget,
          backgroundColor: COLORS.green300, borderRadius: 2, yAxisID: 'y', order: 2 },
        { type: 'bar', label: 'Actual', data: data.budget.actual,
          backgroundColor: COLORS.green700, borderRadius: 2, yAxisID: 'y', order: 2 },
        { type: 'line', label: '% of Budget', data: data.budget.pctOfBudget,
          borderColor: COLORS.gold, backgroundColor: COLORS.gold, borderWidth: 2,
          pointRadius: 4, tension: 0.3, yAxisID: 'y1', order: 1 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 14, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (c) => c.dataset.yAxisID === 'y1'
              ? `${c.dataset.label}: ${c.parsed.y}%`
              : `${c.dataset.label}: ${fmtUSD(c.parsed.y)}`,
          },
        },
      },
      scales: {
        y: { position: 'left', ticks: { callback: moneyTicks, font: { size: 10 } }, grid: { color: '#eef2f0' } },
        y1: { position: 'right', min: 0, max: 150,
          ticks: { callback: (v) => v + '%', font: { size: 10 } }, grid: { drawOnChartArea: false } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      },
    },
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  Chart.defaults.color = '#5d6b66';

  renderKpis();
  renderPL();
  renderCashflow();
  renderLegend();
  renderRevVsExp();
  renderExpByCat();
  renderBudgetActual();
});
