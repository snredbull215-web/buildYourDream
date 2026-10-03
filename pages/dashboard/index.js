const {
  getSettings,
  getMonthKey,
  getMonthlyRecords,
  summarize,
  formatMoney
} = require('../../utils/storage');

Page({
  data: {
    monthLabel: '',
    summary: {},
    budget: {},
    recentRecords: [],
    topCategories: []
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const monthKey = getMonthKey();
    const records = getMonthlyRecords(monthKey);
    const rawSummary = summarize(records);
    const settings = getSettings();
    const budgetTotal = Number(settings.monthlyBudget || 0);
    const usedPercent = budgetTotal > 0 ? Math.min(100, Math.round(rawSummary.expense / budgetTotal * 100)) : 0;
    const expenseByCategory = {};
    records.filter((item) => item.type === 'expense').forEach((item) => {
      expenseByCategory[item.category] = (expenseByCategory[item.category] || 0) + Number(item.amount || 0);
    });
    const categoryRows = Object.keys(expenseByCategory)
      .map((name) => ({ name, amount: expenseByCategory[name] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    const maxCategory = categoryRows[0] ? categoryRows[0].amount : 0;

    this.setData({
      monthLabel: `${monthKey} 月度结余`,
      summary: {
        incomeText: formatMoney(rawSummary.income),
        expenseText: formatMoney(rawSummary.expense),
        balanceText: formatMoney(rawSummary.balance)
      },
      budget: {
        totalText: formatMoney(budgetTotal),
        leftText: formatMoney(Math.max(0, budgetTotal - rawSummary.expense)),
        percent: usedPercent
      },
      recentRecords: records.slice(0, 5).map((item) => Object.assign({}, item, {
        amountText: formatMoney(item.amount)
      })),
      topCategories: categoryRows.map((item) => Object.assign({}, item, {
        amountText: formatMoney(item.amount),
        percent: maxCategory > 0 ? Math.round(item.amount / maxCategory * 100) : 0
      }))
    });
  },

  goAdd() {
    wx.switchTab({ url: '/pages/add/index' });
  },

  goRecords() {
    wx.switchTab({ url: '/pages/records/index' });
  }
});
