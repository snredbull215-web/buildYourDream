const {
  getMonthKey,
  getMonthlyRecords,
  deleteRecord,
  formatMoney
} = require('../../utils/storage');

Page({
  data: {
    monthKey: getMonthKey(),
    typeFilter: 'all',
    records: [],
    totalText: '0.00'
  },

  onShow() {
    this.loadRecords();
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
        categoryShort: item.category.slice(0, 1)
      })),
      totalText: formatMoney(total)
    });
  },

  confirmDelete(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录',
      content: '删除后无法恢复，确定继续吗？',
      confirmColor: '#dc2626',
      success: (result) => {
        if (result.confirm) {
          deleteRecord(id);
          this.loadRecords();
        }
      }
    });
  }
});
