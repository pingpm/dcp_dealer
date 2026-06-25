import MiniappLoginSheet from '../components/miniapp-login-sheet/miniapp-login-sheet.vue';

function currentPageOptions() {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] || {};
  return current.options || current.$page?.options || {};
}

export const miniappLoginPageMixin = {
  components: {
    MiniappLoginSheet,
  },
  methods: {
    handleLoginSuccess() {
      const options = currentPageOptions();
      if (typeof this.onLoad === 'function') {
        this.onLoad(options);
        return;
      }
      if (typeof this.onShow === 'function') {
        this.onShow();
      }
    },
  },
};
