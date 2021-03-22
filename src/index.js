import { flatten } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import P from 'path'
import puppeteerToIstanbul from 'puppeteer-to-istanbul'

const storagePath = P.resolve('.nyc_output')

export default () => ({
  async after() {
    const coverages =
      Promise.all([
        this.page.coverage.stopJSCoverage(),
        this.page.coverage.stopCSSCoverage(),
      ])
      |> await
      |> flatten
    puppeteerToIstanbul.write(coverages, { storagePath })
    return this.browser.close()
  },
  async before() {
    this.browser = await puppeteer.launch()
    this.page = await this.browser.newPage()
    await Promise.all([
      this.page.coverage.startJSCoverage(),
      this.page.coverage.startCSSCoverage(),
    ])
  },
})
