const RECORDS_KEY = 'byd_records';
const SETTINGS_KEY = 'byd_settings';

const DEFAULT_CATEGORIES = {
  expense: ['餐饮', '交通', '购物', '住房', '娱乐', '医疗', '学习', '其他'],
  income: ['工资', '奖金', '副业', '理财', '红包', '其他']
};

const DEFAULT_SETTINGS = {
  monthlyBudget: 3000,
  currency: 'CNY',
  categories: DEFAULT_CATEGORIES
};

function initStore() {
  if (!wx.getStorageSync(RECORDS_KEY)) {
    wx.setStorageSync(RECORDS_KEY, []);
  }

  if (!wx.getStorageSync(SETTINGS_KEY)) {
    wx.setStorageSync(SETTINGS_KEY, DEFAULT_SETTINGS);
  }
}

function getSettings() {
  return Object.assign({}, DEFAULT_SETTINGS, wx.getStorageSync(SETTINGS_KEY) || {});
}

function saveSettings(settings) {
  wx.setStorageSync(SETTINGS_KEY, Object.assign({}, getSettings(), settings));
}

function getRecords() {
  return (wx.getStorageSync(RECORDS_KEY) || []).sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

function saveRecords(records) {
  wx.setStorageSync(RECORDS_KEY, records);
}

function addRecord(record) {
  const records = getRecords();
  const next = Object.assign({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString()
  }, record);
  records.unshift(next);
  saveRecords(records);
  return next;
}

function updateRecord(record) {
  saveRecords(getRecords().map((item) => {
    return item.id === record.id ? Object.assign({}, item, record) : item;
  }));
}

function getRecordById(id) {
  return getRecords().find((item) => item.id === id);
}

function deleteRecord(id) {
  saveRecords(getRecords().filter((item) => item.id !== id));
}

function clearRecords() {
  saveRecords([]);
}

function getMonthKey(date = new Date()) {
  const value = typeof date === 'string' ? new Date(date) : date;
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  return `${value.getFullYear()}-${month}`;
}

function getDayKey(date = new Date()) {
  const value = typeof date === 'string' ? new Date(date) : date;
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${getMonthKey(value)}-${day}`;
}

function getYearKey(date = new Date()) {
  const value = typeof date === 'string' ? new Date(date) : date;
  return `${value.getFullYear()}`;
}

function formatDateTime(value) {
  if (!value) {
    return '未知';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '未知';
  }
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  const second = `${date.getSeconds()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}:${second}`;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return amount.toFixed(2);
}

function getMonthlyRecords(monthKey = getMonthKey()) {
  return getRecords().filter((item) => item.date && item.date.slice(0, 7) === monthKey);
}

function summarize(records) {
  const result = {
    income: 0,
    expense: 0,
    balance: 0,
    byCategory: {}
  };

  records.forEach((item) => {
    const amount = Number(item.amount || 0);
    result[item.type] += amount;
    if (!result.byCategory[item.category]) {
      result.byCategory[item.category] = 0;
    }
    result.byCategory[item.category] += amount;
  });

  result.balance = result.income - result.expense;
  return result;
}

function buildDemoRecords() {
  const today = new Date();
  const monthKey = getMonthKey(today);
  return [
    { type: 'expense', amount: 36.5, category: '餐饮', date: `${monthKey}-02`, note: '午餐' },
    { type: 'expense', amount: 128, category: '交通', date: `${monthKey}-04`, note: '打车' },
    { type: 'income', amount: 9800, category: '工资', date: `${monthKey}-08`, note: '本月工资' },
    { type: 'expense', amount: 420, category: '购物', date: `${monthKey}-11`, note: '日用品' },
    { type: 'expense', amount: 88, category: '娱乐', date: `${monthKey}-14`, note: '电影' }
  ].map((item, index) => Object.assign({
    id: `demo-${Date.now()}-${index}`,
    createdAt: today.toISOString()
  }, item));
}

module.exports = {
  DEFAULT_CATEGORIES,
  initStore,
  getSettings,
  saveSettings,
  getRecords,
  saveRecords,
  addRecord,
  updateRecord,
  getRecordById,
  deleteRecord,
  clearRecords,
  getMonthKey,
  getDayKey,
  getYearKey,
  formatDateTime,
  getMonthlyRecords,
  summarize,
  formatMoney,
  buildDemoRecords
};
