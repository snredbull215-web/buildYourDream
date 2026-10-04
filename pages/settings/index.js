const {
  getSettings,
  saveSettings,
  getRecords,
  saveRecords,
  clearRecords,
  buildDemoRecords
} = require('../../utils/storage');

Page({
  data: {
    monthlyBudget: ''
  },

  onShow() {
    this.syncTabBar();
    this.setData({
      monthlyBudget: `${getSettings().monthlyBudget || 0}`
    });
  },

  syncTabBar() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && tabBar.syncSelected) {
      tabBar.syncSelected();
    }
  },

  onBudgetInput(event) {
    this.setData({ monthlyBudget: event.detail.value });
  },

  saveBudget() {
    const amount = Number(this.data.monthlyBudget);
    if (amount < 0 || Number.isNaN(amount)) {
      wx.showToast({ title: '请输入有效预算', icon: 'none' });
      return;
    }

    saveSettings({ monthlyBudget: Math.round(amount * 100) / 100 });
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  copyExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      records: getRecords(),
      settings: getSettings()
    };

    wx.setClipboardData({
      data: JSON.stringify(payload, null, 2),
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  loadDemoData() {
    wx.showModal({
      title: '导入演示数据',
      content: '会追加几条本月示例账目，是否继续？',
      success: (result) => {
        if (result.confirm) {
          saveRecords(buildDemoRecords().concat(getRecords()));
          wx.showToast({ title: '已导入', icon: 'success' });
        }
      }
    });
  },

  confirmClear() {
    wx.showModal({
      title: '清空账目',
      content: '所有本地账目都会被删除，且无法恢复。',
      confirmColor: '#9b1c1c',
      success: (result) => {
        if (result.confirm) {
          clearRecords();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  }
});
