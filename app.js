const { initStore, getRecords, saveRecords, getSettings, saveSettings } = require('./utils/storage');
const { initCloud } = require('./utils/cloud');
const { syncRecords, fetchSettingsFromCloud } = require('./utils/cloud');

App({
  onLaunch() {
    initStore();
    if (initCloud()) {
      syncRecords(getRecords()).then(saveRecords).catch(() => {});
      fetchSettingsFromCloud().then((settings) => {
        if (settings) {
          saveSettings(Object.assign({}, getSettings(), settings));
        }
      }).catch(() => {});
    }
  }
});
