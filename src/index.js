import puppeteer from '@dword-design/puppeteer'
import isDocker from 'is-docker'
import P from 'path'
import puppeteerToIstanbul from 'puppeteer-to-istanbul'
import Xvfb from 'xvfb'

const xvfb = new Xvfb()

const storagePath = P.resolve('.nyc_output')

export default (options = {}) => {
  options = { launchOptions: {}, ...options }

  const useXvfb = !options.launchOptions.headless && isDocker()

  return {
    after() {
      puppeteerToIstanbul.write(this.puppeteerCoverages, { storagePath })
    },
    async afterEach() {
      if (this.page) {
        this.puppeteerCoverages.push(
          ...(await this.page.coverage.stopJSCoverage())
        )
        this.puppeteerCoverages.push(
          ...(await this.page.coverage.stopCSSCoverage())
        )
        await this.page.close()
      }
      if (this.browser) {
        await this.browser.close()
      }
      if (useXvfb) {
        xvfb.stopSync()
      }
    },
    before() {
      this.puppeteerCoverages = []
    },
    async beforeEach() {
      if (useXvfb) {
        xvfb.startSync()
      }
      this.browser = await puppeteer.launch(options.launchOptions)
      this.page = await this.browser.newPage()
      this.page.on('framenavigated', () =>
        this.page.addStyleTag({ content: '* { caret-color: transparent }' })
      )
      await Promise.all([
        this.page.coverage.startJSCoverage(),
        this.page.coverage.startCSSCoverage(),
      ])
    },
  }
}
