const {
  getSettings,
  getRecords,
  saveRecords,
  getDayKey,
  getMonthKey,
  getYearKey,
  summarize,
  formatMoney,
  formatDateTime
} = require('../../utils/storage');
const { syncRecords } = require('../../utils/cloud');

Page({
  data: {
    todayLabel: '',
    heroSummary: {},
    budget: {},
    periodStats: [],
    recentRecords: [],
    incomeRanking: []
  },

  onShow() {
    this.syncTabBar();
    this.loadData();
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
      this.loadData();
    }).catch(() => {});
  },

  loadData() {
    const allRecords = getRecords();
    const dayKey = getDayKey();
    const monthKey = getMonthKey();
    const yearKey = getYearKey();
    const todayRecords = allRecords.filter((item) => item.date === dayKey);
    const monthRecords = allRecords.filter((item) => item.date && item.date.slice(0, 7) === monthKey);
    const yearRecords = allRecords.filter((item) => item.date && item.date.slice(0, 4) === yearKey);
    const monthSummary = summarize(monthRecords);
    const settings = getSettings();
    const budgetTotal = Number(settings.monthlyBudget || 0);
    const usedPercent = budgetTotal > 0 ? Math.min(100, Math.round(monthSummary.expense / budgetTotal * 100)) : 0;
    const incomeRanking = this.buildCategoryRows(allRecords, 'income');

    this.setData({
      todayLabel: `${dayKey} 今日账本`,
      heroSummary: {
        balanceText: formatMoney(monthSummary.balance),
        incomeText: formatMoney(monthSummary.income),
        expenseText: formatMoney(monthSummary.expense)
      },
      budget: {
        totalText: formatMoney(budgetTotal),
        leftText: formatMoney(Math.max(0, budgetTotal - monthSummary.expense)),
        percent: usedPercent
      },
      periodStats: [
        this.toPeriodStat('本日', todayRecords),
        this.toPeriodStat('本月', monthRecords),
        this.toPeriodStat('本年', yearRecords),
        this.toPeriodStat('账本总收支', allRecords)
      ],
      recentRecords: allRecords.slice(0, 5).map((item) => Object.assign({}, item, {
        amountText: formatMoney(item.amount),
        createdAtText: formatDateTime(item.createdAt)
      })),
      incomeRanking
    });
  },

  toPeriodStat(label, records) {
    const data = summarize(records);
    return {
      label,
      incomeText: formatMoney(data.income),
      expenseText: formatMoney(data.expense),
      balanceText: formatMoney(data.balance)
    };
  },

  buildCategoryRows(records, type) {
    const grouped = {};
    records.filter((item) => item.type === type).forEach((item) => {
      grouped[item.category] = (grouped[item.category] || 0) + Number(item.amount || 0);
    });
    const rows = Object.keys(grouped)
      .map((name) => ({ name, amount: grouped[name] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    const max = rows[0] ? rows[0].amount : 0;
    return rows.map((item) => Object.assign({}, item, {
      amountText: formatMoney(item.amount),
      percent: max > 0 ? Math.max(8, Math.round(item.amount / max * 100)) : 0
    }));
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/add/index' });
  },

  goRecords() {
    wx.switchTab({ url: '/pages/records/index' });
  }
});
