import tester from '@dword-design/tester'
import express from 'express'

import self from '.'

export default tester(
  {
    async works() {
      const app = express()
      app.get('/', (req, res) => res.send('Hello world'))
      const server = app.listen(3000)
      const response = await this.page.goto('http://localhost:3000')
      expect(await response.text()).toEqual('Hello world')
      return server.close()
    },
  },
  [self]
)
