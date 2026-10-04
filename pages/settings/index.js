const {
  getSettings,
  saveSettings,
  getRecords,
  saveRecords,
  clearRecords,
  buildDemoRecords
} = require('../../utils/storage');
const {
  saveSettingsToCloud,
  fetchSettingsFromCloud,
  syncRecords,
  clearRecordsFromCloud
} = require('../../utils/cloud');

Page({
  data: {
    monthlyBudget: ''
  },

  onShow() {
    this.syncTabBar();
    this.syncCloudSettings();
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

  syncCloudSettings() {
    fetchSettingsFromCloud().then((settings) => {
      if (settings) {
        saveSettings(settings);
        this.setData({
          monthlyBudget: `${getSettings().monthlyBudget || 0}`
        });
      }
    }).catch(() => {});
  },

  saveBudget() {
    const amount = Number(this.data.monthlyBudget);
    if (amount < 0 || Number.isNaN(amount)) {
      wx.showToast({ title: '请输入有效预算', icon: 'none' });
      return;
    }

    saveSettings({ monthlyBudget: Math.round(amount * 100) / 100 });
    saveSettingsToCloud(getSettings()).catch(() => {
      wx.showToast({ title: '本地已保存，云端稍后同步', icon: 'none' });
    });
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
          const records = buildDemoRecords().concat(getRecords());
          saveRecords(records);
          syncRecords(records).then(saveRecords).catch(() => {});
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
          clearRecordsFromCloud().catch(() => {
            wx.showToast({ title: '本地已清空，云端稍后同步', icon: 'none' });
          });
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  }
});
