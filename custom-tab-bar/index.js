Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/dashboard/index', text: '首页', icon: '首' },
      { pagePath: '/pages/records/index', text: '明细', icon: '明' },
      { pagePath: '/pages/add/index', text: '记一笔', center: true, icon: '+' },
      { pagePath: '/pages/stats/index', text: '统计', icon: '统' },
      { pagePath: '/pages/settings/index', text: '设置', icon: '设' }
    ]
  },

  lifetimes: {
    ready() {
      this.syncSelected();
    }
  },

  methods: {
    syncSelected() {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      const route = current ? `/${current.route}` : '';
      const selected = this.data.list.findIndex((item) => item.pagePath === route);
      if (selected >= 0) {
        this.setData({ selected });
      }
    },

    switchTab(event) {
      const index = Number(event.currentTarget.dataset.index);
      const url = event.currentTarget.dataset.path;
      if (this.data.list[index] && this.data.list[index].center) {
        wx.navigateTo({ url });
        return;
      }
      this.setData({ selected: index });
      wx.switchTab({ url });
    }
  }
});
