import { exists, outputFile } from 'fs-extra'
import isDocker from 'is-docker'
import P from 'path'
import playwright from 'playwright'
import { v4 as uuid } from 'uuid'
import v8toIstanbul from 'v8-to-istanbul'
import Xvfb from 'xvfb'

const xvfb = new Xvfb()

export default (options = {}) => {
  options = { launchOptions: {}, ...options }

  const useXvfb = !options.launchOptions.headless && isDocker()

  return {
    async after() {
      for (const entry of this.puppeteerCoverages) {

        if (!entry.url.startsWith('webpack-internal:///') || !entry.functions) {
          continue
        }

        const path = entry.url.replace('webpack-internal:///', '')
        if (!(await exists(path))) {
          continue
        }

        const converter = v8toIstanbul(path, 0, { source: entry.source })
        await converter.load()
        converter.applyCoverage(entry.functions)

        const data = converter.toIstanbul()

        const id = uuid()
        await outputFile(
          P.join('.nyc_output', `${id}.json`),
          JSON.stringify(data, undefined, 2)
        )
      }
    },
    async afterEach() {
      this.puppeteerCoverages.push(
        ...(await this.page.coverage.stopJSCoverage())
      )
      this.puppeteerCoverages.push(
        ...(await this.page.coverage.stopCSSCoverage())
      )
      await this.page.close()
      await this.browser.close()
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
      this.browser = await playwright.chromium.launch(options.launchOptions)
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
