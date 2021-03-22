import { endent } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import { readFile } from 'fs-extra'
import outputFiles from 'output-files'
import P from 'path'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  chdir: () =>
    withLocalTmpDir(async () => {
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
      await execa('nyc', [
        '--reporter',
        'lcov',
        '--cwd',
        process.cwd(),
        '--exclude',
        '.nuxt',
        'mocha',
        '--ui',
        packageName`mocha-ui-exports-auto-describe`,
        '--timeout',
        80000,
        'subdir/pages/index.spec.js',
      ])
      expect(await readFile(P.resolve('coverage', 'lcov.info'), 'utf8'))
        .toMatch(endent`
            TN:
            SF:subdir/pages/index.js
            FNF:0
            FNH:0
            DA:1,1
            DA:2,3
            LF:2
            LH:2
            BRF:0
            BRH:0
            end_of_record
          `)
    }),
  js: () =>
    withLocalTmpDir(async () => {
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
      await execa('nyc', [
        '--reporter',
        'lcov',
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
      ])
      expect(await readFile(P.resolve('coverage', 'lcov.info'), 'utf8'))
        .toMatch(endent`
            TN:
            SF:pages/index.js
            FNF:0
            FNH:0
            DA:1,3
            DA:2,5
            LF:2
            LH:2
            BRF:0
            BRH:0
            end_of_record
          `)
    }),
  sass: () =>
    withLocalTmpDir(async () => {
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
      await execa('nyc', [
        '--reporter',
        'lcov',
        '--cwd',
        process.cwd(),
        '--extension',
        '.vue',
        '--extension',
        '.scss',
        '--exclude',
        '.nuxt',
        'mocha',
        '--ui',
        packageName`mocha-ui-exports-auto-describe`,
        '--timeout',
        80000,
        'pages/index.spec.js',
      ])
      expect(await readFile(P.resolve('coverage', 'lcov.info'), 'utf8'))
        .toMatch(endent`
          TN:
          SF:assets/style.scss
          FNF:0
          FNH:0
          DA:1,2
          DA:2,1
          DA:3,2
          DA:4,2
          DA:5,1
          DA:6,1
          DA:7,1
          DA:8,1
          DA:9,1
          DA:10,1
          DA:11,1
          DA:12,1
          DA:13,1
          DA:14,1
          DA:15,0
          DA:16,0
          DA:17,0
          DA:18,0
          DA:19,0
          DA:20,0
          DA:21,1
          DA:22,1
          DA:23,0
          DA:24,1
          LF:24
          LH:17
          BRDA:1,0,0,1
          BRDA:5,1,0,1
          BRDA:6,2,0,1
          BRDA:7,3,0,1
          BRDA:20,4,0,1
          BRF:5
          BRH:5
          end_of_record
        `)
    }),
  vue: () =>
    withLocalTmpDir(async () => {
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
      await execa('nyc', [
        '--reporter',
        'lcov',
        '--cwd',
        process.cwd(),
        '--extension',
        '.vue',
        '--exclude',
        '.nuxt',
        'mocha',
        '--ui',
        packageName`mocha-ui-exports-auto-describe`,
        '--timeout',
        80000,
        'pages/index.spec.js',
      ])
      expect(await readFile(P.resolve('coverage', 'lcov.info'), 'utf8'))
        .toMatch(endent`
          TN:
          SF:pages/index.vue
          FNF:0
          FNH:0
          DA:1,8
          DA:2,1
          DA:3,1
          DA:4,0
          DA:5,1
          DA:6,1
          DA:7,1
          DA:8,1
          LF:8
          LH:7
          BRDA:1,0,0,1
          BRF:1
          BRH:1
          end_of_record
        `)
    }),
}
