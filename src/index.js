import puppeteer from '@dword-design/puppeteer'
import isDocker from 'is-docker'
import Xvfb from 'xvfb'

const xvfb = new Xvfb()

export default (options = {}) => {
  options = { launchOptions: {}, ...options }

  const useXvfb = !options.launchOptions.headless && isDocker()

  return {
    async afterEach() {
      if (this.browser) {
        await this.page.close()
        await this.browser.close()
      }
      if (useXvfb) {
        xvfb.stopSync()
      }
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
    },
  }
}
