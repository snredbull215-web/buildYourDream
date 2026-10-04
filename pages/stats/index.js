const {
  getSettings,
  getRecords,
  saveRecords,
  getMonthKey,
  getMonthlyRecords,
  summarize,
  formatMoney
} = require('../../utils/storage');
const { syncRecords } = require('../../utils/cloud');

Page({
  data: {
    monthKey: getMonthKey(),
    summary: {},
    budget: {},
    expenseRows: [],
    incomeRows: []
  },

  onShow() {
    this.syncTabBar();
    this.loadStats();
    this.syncCloudRecords();
  },

  syncTabBar() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && tabBar.syncSelected) {
      tabBar.syncSelected();
    }
  },

  syncCloudRecords() {
    syncRecords(getRecords()).then((records) => {
      saveRecords(records);
      this.loadStats();
    }).catch(() => {});
  },

  onMonthChange(event) {
    this.setData({ monthKey: event.detail.value });
    this.loadStats();
  },

  loadStats() {
    const settings = getSettings();
    const records = getMonthlyRecords(this.data.monthKey);
    const summary = summarize(records);
    const budgetTotal = Number(settings.monthlyBudget || 0);

    this.setData({
      summary: {
        incomeText: formatMoney(summary.income),
        expenseText: formatMoney(summary.expense),
        balanceText: formatMoney(summary.balance)
      },
      budget: {
        totalText: formatMoney(budgetTotal),
        leftText: formatMoney(Math.max(0, budgetTotal - summary.expense)),
        percent: budgetTotal > 0 ? Math.min(100, Math.round(summary.expense / budgetTotal * 100)) : 0
      },
      expenseRows: this.buildRows(records, 'expense'),
      incomeRows: this.buildRows(records, 'income')
    });
  },

  buildRows(records, type) {
    const grouped = {};
    records.filter((item) => item.type === type).forEach((item) => {
      grouped[item.category] = (grouped[item.category] || 0) + Number(item.amount || 0);
    });
    const rows = Object.keys(grouped)
      .map((name) => ({ name, amount: grouped[name] }))
      .sort((a, b) => b.amount - a.amount);
    const max = rows[0] ? rows[0].amount : 0;
    return rows.map((item) => Object.assign({}, item, {
      amountText: formatMoney(item.amount),
      percent: max > 0 ? Math.max(6, Math.round(item.amount / max * 100)) : 0
    }));
  }
});
