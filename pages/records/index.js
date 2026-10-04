const {
  getMonthKey,
  getMonthlyRecords,
  deleteRecord,
  formatMoney,
  formatDateTime
} = require('../../utils/storage');

Page({
  data: {
    monthKey: getMonthKey(),
    typeFilter: 'all',
    records: [],
    totalText: '0.00'
  },

  onShow() {
    this.syncTabBar();
    this.loadRecords();
  },

  syncTabBar() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && tabBar.syncSelected) {
      tabBar.syncSelected();
    }
  },

  onPullDownRefresh() {
    this.loadRecords();
    wx.stopPullDownRefresh();
  },

  onMonthChange(event) {
    this.setData({ monthKey: event.detail.value });
    this.loadRecords();
  },

  changeTypeFilter(event) {
    this.setData({ typeFilter: event.currentTarget.dataset.type });
    this.loadRecords();
  },

  loadRecords() {
    const all = getMonthlyRecords(this.data.monthKey);
    const records = this.data.typeFilter === 'all'
      ? all
      : all.filter((item) => item.type === this.data.typeFilter);
    const total = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    this.setData({
      records: records.map((item) => Object.assign({}, item, {
        amountText: formatMoney(item.amount),
        createdAtText: formatDateTime(item.createdAt),
        categoryShort: item.category.slice(0, 1)
      })),
      totalText: formatMoney(total)
    });
  },

  showDetail(event) {
    const id = event.currentTarget.dataset.id;
    const item = this.data.records.find((record) => record.id === id);
    if (!item) {
      return;
    }

    wx.showModal({
      title: '账目明细',
      showCancel: false,
      confirmText: '知道了',
      content: [
        `类型：${item.type === 'income' ? '收入' : '支出'}`,
        `金额：¥${item.amountText}`,
        `分类：${item.category}`,
        `记账日期：${item.date}`,
        `提交时间：${item.createdAtText}`,
        `备注：${item.note || '无'}`
      ].join('\n')
    });
  },

  confirmDelete(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录',
      content: '删除后无法恢复，确定继续吗？',
      confirmColor: '#9b1c1c',
      success: (result) => {
        if (result.confirm) {
          deleteRecord(id);
          this.loadRecords();
        }
      }
    });
  }
});
