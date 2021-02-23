import puppeteer from '@dword-design/puppeteer'

export default () => ({
  after() {
    return this.browser.close()
  },
  async before() {
    this.browser = await puppeteer.launch()
    this.page = await this.browser.newPage()
  },
})
