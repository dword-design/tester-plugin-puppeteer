import { endent, map, range } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import packageName from 'depcheck-package-name'
import { execaCommand } from 'execa'
import fs from 'fs-extra'
import outputFiles from 'output-files'

export default tester(
  {
    caret: {
      files: {
        pages: {
          'foo.vue': endent`
          <template>
            <input type="text" />
          </template>
        `,
          'index.spec.js': endent`
          import tester from '${packageName`@dword-design/tester`}'
          import testerPluginNuxt from '${packageName`@dword-design/tester-plugin-nuxt`}'
          import { delay, filter, map, range } from '@dword-design/functions'

          import self from '../../src/index.js'

          export default tester({
            async works() {
              await this.page.goto('http://localhost:3000')
              let input = await this.page.waitForSelector('input[type=text]')
              await input.evaluate(el => el.focus())
              const shot = (start = 0) => async index => {
                await delay(200)
                await this.page.screenshot({ path: \`screenshot\${start + index}.png\` })
              }
              await (range(5) |> map(shot()) |> Promise.all)
              await this.page.goto('http://localhost:3000/foo')
              input = await this.page.waitForSelector('input[type=text]')
              await input.evaluate(el => el.focus())
              await (range(5) |> map(shot(5)) |> Promise.all)
            }
          }, [testerPluginNuxt(), self()])

        `,
          'index.vue': endent`
          <template>
            <input type="text" />
          </template>

        `,
        },
      },
      async test() {
        await execaCommand(
          `mocha --ui exports --timeout 80000 pages/index.spec.js`,
          { stdio: 'inherit' }
        )
        await (range(10)
          |> map(async index =>
            expect(
              fs.readFile(`screenshot${index}.png`) |> await
            ).toMatchImageSnapshot(this)
          )
          |> Promise.all)
      },
    },
    headful: {
      files: {
        'index.spec.js': endent`
        import tester from '${packageName`@dword-design/tester`}'
        import self from '../src/index.js'

        export default tester({ works: () => {} }, [self({ launchOptions: { headless: false } })])
      `,
      },
      test: () =>
        execaCommand('mocha --ui exports --timeout 80000 index.spec.js'),
    },
    js: {
      files: {
        pages: {
          'index.js': endent`
          export default {
            render: h => <div class="foo">Hello world</div>,
          }
        `,
          'index.spec.js': endent`
            import tester from '${packageName`@dword-design/tester`}'
            import testerPluginNuxt from '${packageName`@dword-design/tester-plugin-nuxt`}'
            import { expect } from '${packageName`expect`}'

            import self from '../../src/index.js'

            export default tester({
              async works() {
                await this.page.goto('http://localhost:3000')
                const $foo = await this.page.waitForSelector('.foo')
                expect(await $foo.evaluate(el => el.innerText)).toEqual('Hello world')
              }
            }, [testerPluginNuxt(), self()])
          `,
        },
      },
      test: () =>
        execaCommand('mocha --ui exports --timeout 80000 pages/index.spec.js'),
    },
    launchOptions: {
      files: {
        pages: {
          'index.js': endent`
        export default {
          render: h => <div class="foo">{process.env.FOO}</div>,
        }
      `,
          'index.spec.js': endent`
          import tester from '${packageName`@dword-design/tester`}'
          import testerPluginNuxt from '${packageName`@dword-design/tester-plugin-nuxt`}'
          import { expect } from '${packageName`expect`}'

          import self from '../../src/index.js'

          export default tester({
            async works() {
              await this.page.goto('http://localhost:3000')
              const $foo = await this.page.waitForSelector('.foo')
              expect(await $foo.evaluate(el => el.innerText)).toEqual('Hello world')
            }
          }, [testerPluginNuxt(), self({ launchOptions: { timeout: 1 } })])

        `,
        },
      },
      test: () =>
        expect(
          execaCommand('mocha --ui exports --timeout 80000 pages/index.spec.js')
        ).rejects.toThrow(
          'TimeoutError: Timed out after 1 ms while trying to connect to the browser!'
        ),
    },
    'multiple tests': {
      files: {
        'model/test.js': endent`
        export default {
          foo: () => {
            return 1
          },
          bar: () => {
            return 2
          }
        }
      `,
        pages: {
          '1.js': endent`
          import test from '../model/test'

          export default {
            render: h => <div class="foo">{test.foo()}</div>,
          }

        `,
          '2.js': endent`
          import test from '../model/test'

          export default {
            render: h => <div class="foo">{test.bar()}</div>,
          }

        `,
          'index.spec.js': endent`
            import tester from '${packageName`@dword-design/tester`}'
            import testerPluginNuxt from '${packageName`@dword-design/tester-plugin-nuxt`}'
            import { expect } from '${packageName`expect`}'
            import self from '../../src/index.js'

            export default tester({
              async test1() {
                await this.page.goto('http://localhost:3000/1')
                await this.page.evaluate(() => localStorage.setItem('foo', 'bar'))
              },
              async test2() {
                await this.page.goto('http://localhost:3000/2')
                expect(await this.page.evaluate(() => localStorage.getItem('foo'))).toBeNull()
              }
            }, [self(), testerPluginNuxt()])

          `,
        },
      },
      test: () =>
        execaCommand('mocha --ui exports --timeout 80000 pages/index.spec.js'),
    },
    sass: {
      files: {
        'assets/style.scss': endent`
        .foo {
          color: red;
        }

        .bar {
          color: green;
        }

      `,
        pages: {
          'index.spec.js': endent`
          import tester from '${packageName`@dword-design/tester`}'
          import testerPluginNuxt from '${packageName`@dword-design/tester-plugin-nuxt`}'
          import { expect } from '${packageName`expect`}'
          import self from '../../src/index.js'

          export default tester({
            async works() {
              await this.page.goto('http://localhost:3000')
              const $foo = await this.page.waitForSelector('.foo')
              expect(await $foo.evaluate(el => el.innerText)).toEqual('Hello world')
            }
          }, [testerPluginNuxt(), self()])

        `,
          'index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>

        `,
        },
      },
      test: () =>
        execaCommand('mocha --ui exports --timeout 80000 pages/index.spec.js'),
    },
    vue: {
      files: {
        pages: {
          'index.spec.js': endent`
          import tester from '${packageName`@dword-design/tester`}'
          import testerPluginNuxt from '${packageName`@dword-design/tester-plugin-nuxt`}'
          import { expect } from '${packageName`expect`}'

          import self from '../../src/index.js'

          export default tester({
            async works() {
              await this.page.goto('http://localhost:3000')
              const $foo = await this.page.waitForSelector('.foo')
              expect(await $foo.evaluate(el => el.innerText)).toEqual('Hello world')
            }
          }, [testerPluginNuxt(), self()])

        `,
          'index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>

        `,
        },
      },
      test: () =>
        execaCommand('mocha --ui exports --timeout 80000 pages/index.spec.js'),
    },
  },
  [
    testerPluginTmpDir(),
    {
      transform: test =>
        async function () {
          await outputFiles(test.files)
          await test.test.call(this)
        },
    },
  ]
)
