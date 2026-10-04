const {
  getSettings,
  addRecord,
  getMonthKey
} = require('../../utils/storage');

function todayText() {
  const now = new Date();
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${getMonthKey(now)}-${day}`;
}

Page({
  data: {
    categories: [],
    categoryIndex: 0,
    form: {
      type: 'expense',
      amount: '',
      category: '',
      date: todayText(),
      note: ''
    }
  },

  onShow() {
    this.resetCategories(this.data.form.type);
  },

  resetCategories(type) {
    const settings = getSettings();
    const categories = settings.categories[type] || [];
    this.setData({
      categories,
      categoryIndex: 0,
      'form.category': categories[0] || '其他'
    });
  },

  changeType(event) {
    const type = event.currentTarget.dataset.type;
    this.setData({ 'form.type': type });
    this.resetCategories(type);
  },

  onAmountInput(event) {
    this.setData({ 'form.amount': event.detail.value });
  },

  onCategoryChange(event) {
    const index = Number(event.detail.value);
    this.setData({
      categoryIndex: index,
      'form.category': this.data.categories[index]
    });
  },

  onDateChange(event) {
    this.setData({ 'form.date': event.detail.value });
  },

  onNoteInput(event) {
    this.setData({ 'form.note': event.detail.value });
  },

  saveRecord() {
    const amount = Number(this.data.form.amount);
    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    addRecord(Object.assign({}, this.data.form, {
      amount: Math.round(amount * 100) / 100,
      note: this.data.form.note.trim()
    }));

    wx.showToast({ title: '已保存', icon: 'success' });
    this.setData({
      form: Object.assign({}, this.data.form, {
        amount: '',
        date: todayText(),
        note: ''
      })
    });
    setTimeout(() => {
      wx.navigateBack({ delta: 1 });
    }, 800);
  }
});
