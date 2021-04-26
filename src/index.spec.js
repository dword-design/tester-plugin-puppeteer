import { endent, map, range } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import { readFile } from 'fs-extra'
import outputFiles from 'output-files'
import unifyMochaOutput from 'unify-mocha-output'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  caret() {
    return withLocalTmpDir(async () => {
      await outputFiles({
        pages: {
          'foo.vue': endent`
            <template>
              <input type="text" />
            </template>

          `,
          'index.spec.js': endent`
            import tester from '${packageName`@dword-design/tester`}'
            import { Builder, Nuxt } from '${packageName`nuxt`}'
            import { delay, filter, map, range } from '@dword-design/functions'
            import self from '../../src'

            export default tester({
              async works() {
                const nuxt = new Nuxt({ dev: true })
                await new Builder(nuxt).build()
                try {
                  await nuxt.listen()
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
                } finally {
                  nuxt.close()
                }
              }
            }, [self()])

          `,
          'index.vue': endent`
            <template>
              <input type="text" />
            </template>

          `,
        },
      })
      await execa.command(
        `mocha --ui ${packageName`mocha-ui-exports-auto-describe`} --timeout 80000 pages/index.spec.js`
      )
      await (range(10)
        |> map(async index =>
          expect(
            readFile(`screenshot${index}.png`) |> await
          ).toMatchImageSnapshot(this)
        )
        |> Promise.all)
    })
  },
  chdir() {
    return withLocalTmpDir(async () => {
      await outputFiles({
        'subdir/pages': {
          'index.js': endent`
            export default {
              render: h => <div class="foo">Hello world</div>,
            }
          `,
          'index.spec.js': endent`
              import tester from '${packageName`@dword-design/tester`}'
              import { Builder, Nuxt } from '${packageName`nuxt`}'
              import self from '../../../src'

              export default tester({
                async works() {
                  process.chdir('subdir')
                  const nuxt = new Nuxt({
                    dev: true,
                    modules: ['${packageName`nuxt-sourcemaps-abs-sourceroot`}'],
                  })
                  await new Builder(nuxt).build()
                  try {
                    await nuxt.listen()
                    await this.page.goto('http://localhost:3000')
                    const $foo = await this.page.waitForSelector('.foo')
                    expect(await $foo.evaluate(el => el.innerText)).toEqual('Hello world')
                  } finally {
                    nuxt.close()
                    process.chdir('..')
                  }
                }
              }, [self()])

            `,
        },
      })

      const output = await execa(
        'nyc',
        [
          '--cwd',
          process.cwd(),
          '--include',
          'subdir/pages/index.js',
          'mocha',
          '--ui',
          packageName`mocha-ui-exports-auto-describe`,
          '--timeout',
          80000,
          'subdir/pages/index.spec.js',
        ],
        { all: true }
      )
      expect(output.all |> unifyMochaOutput).toMatchSnapshot(this)
    })
  },
  js() {
    return withLocalTmpDir(async () => {
      await outputFiles({
        pages: {
          'index.js': endent`
            export default {
              render: h => <div class="foo">Hello world</div>,
            }
          `,
          'index.spec.js': endent`
              import tester from '${packageName`@dword-design/tester`}'
              import { Builder, Nuxt } from '${packageName`nuxt`}'
              import self from '../../src'

              export default tester({
                async works() {
                  const nuxt = new Nuxt({ dev: true })
                  await new Builder(nuxt).build()
                  try {
                    await nuxt.listen()
                    await this.page.goto('http://localhost:3000')
                    const $foo = await this.page.waitForSelector('.foo')
                    expect(await $foo.evaluate(el => el.innerText)).toEqual('Hello world')
                  } finally {
                    nuxt.close()
                  }
                }
              }, [self()])

            `,
        },
      })

      const output = await execa(
        'nyc',
        [
          '--cwd',
          process.cwd(),
          '--include',
          'pages/index.js',
          'mocha',
          '--ui',
          packageName`mocha-ui-exports-auto-describe`,
          '--timeout',
          80000,
          'pages/index.spec.js',
        ],
        { all: true }
      )
      expect(output.all |> unifyMochaOutput).toMatchSnapshot(this)
    })
  },
  launchOptions: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        pages: {
          'index.js': endent`
          export default {
            render: h => <div class="foo">{process.env.FOO}</div>,
          }
        `,
          'index.spec.js': endent`
            import tester from '${packageName`@dword-design/tester`}'
            import { Builder, Nuxt } from '${packageName`nuxt`}'
            import self from '../../src'

            export default tester({
              async works() {
                const nuxt = new Nuxt({ dev: true })
                await new Builder(nuxt).build()
                try {
                  await nuxt.listen()
                  await this.page.goto('http://localhost:3000')
                  const $foo = await this.page.waitForSelector('.foo')
                  expect(await $foo.evaluate(el => el.innerText)).toEqual('Hello world')
                } finally {
                  nuxt.close()
                }
              }
            }, [self({ launchOptions: { timeout: 1 } })])

          `,
        },
      })
      await expect(
        execa('mocha', [
          '--ui',
          packageName`mocha-ui-exports-auto-describe`,
          '--timeout',
          80000,
          'pages/index.spec.js',
        ])
      ).rejects.toThrow(
        'TimeoutError: Timed out after 1 ms while trying to connect to the browser!'
      )
    }),
  'multiple tests': function () {
    return withLocalTmpDir(async () => {
      await outputFiles({
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
              import { Builder, Nuxt } from '${packageName`nuxt`}'
              import self from '../../src'

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
      })

      const output = await execa(
        'nyc',
        [
          '--cwd',
          process.cwd(),
          '--exclude',
          '.nuxt',
          'mocha',
          '--ui',
          packageName`mocha-ui-exports-auto-describe`,
          '--timeout',
          80000,
          'pages/index.spec.js',
        ],
        { all: true }
      )
      expect(output.all |> unifyMochaOutput).toMatchSnapshot(this)
    })
  },
  sass() {
    return withLocalTmpDir(async () => {
      await outputFiles({
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
            import { Builder, Nuxt } from '${packageName`nuxt`}'
            import self from '../../src'

            export default tester({
              async works() {
                const nuxt = new Nuxt({
                  dev: true,
                  css: ['~/assets/style.scss'],
                })
                await new Builder(nuxt).build()
                try {
                  await nuxt.listen()
                  await this.page.goto('http://localhost:3000')
                  const $foo = await this.page.waitForSelector('.foo')
                  expect(await $foo.evaluate(el => el.innerText)).toEqual('Hello world')
                } finally {
                  nuxt.close()
                }
              }
            }, [self()])

          `,
          'index.vue': endent`
            <template>
              <div class="foo">Hello world</div>
            </template>

          `,
        },
      })

      const output = await execa(
        'nyc',
        [
          '--cwd',
          process.cwd(),
          '--extension',
          '.scss',
          '--include',
          'assets/style.scss',
          'mocha',
          '--ui',
          packageName`mocha-ui-exports-auto-describe`,
          '--timeout',
          80000,
          'pages/index.spec.js',
        ],
        { all: true }
      )
      expect(output.all |> unifyMochaOutput).toMatchSnapshot(this)
    })
  },
  vue() {
    return withLocalTmpDir(async () => {
      await outputFiles({
        pages: {
          'index.spec.js': endent`
            import tester from '${packageName`@dword-design/tester`}'
            import { Builder, Nuxt } from '${packageName`nuxt`}'
            import self from '../../src'

            export default tester({
              async works() {
                const nuxt = new Nuxt({ dev: true })
                await new Builder(nuxt).build()
                try {
                  await nuxt.listen()
                  await this.page.goto('http://localhost:3000')
                  const $foo = await this.page.waitForSelector('.foo')
                  expect(await $foo.evaluate(el => el.innerText)).toEqual('Hello world')
                } finally {
                  nuxt.close()
                }
              }
            }, [self()])

          `,
          'index.vue': endent`
            <template>
              <div class="foo">Hello world</div>
            </template>

          `,
        },
      })

      const output = await execa(
        'nyc',
        [
          '--cwd',
          process.cwd(),
          '--extension',
          '.vue',
          '--include',
          'pages/index.vue',
          'mocha',
          '--ui',
          packageName`mocha-ui-exports-auto-describe`,
          '--timeout',
          80000,
          'pages/index.spec.js',
        ],
        { all: true }
      )
      expect(output.all |> unifyMochaOutput).toMatchSnapshot(this)
    })
  },
}
