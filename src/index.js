import puppeteer from '@dword-design/puppeteer'
import P from 'path'
import puppeteerToIstanbul from 'puppeteer-to-istanbul'

const storagePath = P.resolve('.nyc_output')

export default () => ({
  after() {
    puppeteerToIstanbul.write(this.puppeteerCoverages, { storagePath })
  },
  async afterEach() {
    this.puppeteerCoverages.push(...(await this.page.coverage.stopJSCoverage()))
    this.puppeteerCoverages.push(
      ...(await this.page.coverage.stopCSSCoverage())
    )
    await this.page.close()
    await this.browser.close()
  },
  before() {
    this.puppeteerCoverages = []
  },
  async beforeEach() {
    this.browser = await puppeteer.launch()
    this.page = await this.browser.newPage()
    await Promise.all([
      this.page.coverage.startJSCoverage(),
      this.page.coverage.startCSSCoverage(),
    ])
  },
})
