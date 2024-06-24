import puppeteer from '@dword-design/puppeteer';

export default (options = {}) => {
  options = { launchOptions: {}, ...options };
  return {
    async afterEach() {
      if (this.browser) {
        await this.page.close();
        await this.browser.close();
      }
    },
    async beforeEach() {
      this.browser = await puppeteer.launch(options.launchOptions);
      this.page = await this.browser.newPage();

      this.page.on('framenavigated', () =>
        this.page.addStyleTag({ content: '* { caret-color: transparent }' }),
      );
    },
  };
};
