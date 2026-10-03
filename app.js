const { initStore } = require('./utils/storage');

App({
  onLaunch() {
    initStore();
  }
});
