import { ApiCore } from 'afpnews-api'
import { strict as assert } from 'node:assert'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { BaseCommand } from '../src/base-command.js'
import { loadIsolatedConfig } from './helpers/run-command.js'

class TestCommand extends BaseCommand<typeof TestCommand> {
  async run(): Promise<void> {}
}

async function makeCommand(): Promise<{ cmd: TestCommand; configDir: string }> {
  const { config, configDir } = await loadIsolatedConfig()
  const cmd = new TestCommand([], config)
  return { cmd, configDir }
}

describe('BaseCommand', () => {
  let configDir: string

  afterEach(() => {
    if (configDir) rmSync(configDir, { recursive: true, force: true })
  })

  describe('loadUserConfig', () => {
    it('reads an existing config.json and initializes apiCore from it', async () => {
      const made = await makeCommand()
      configDir = made.configDir
      writeFileSync(join(configDir, 'config.json'), JSON.stringify({ apiKey: 'dGVzdDpwYXNz', baseUrl: 'https://example.test' }))

      await made.cmd.loadUserConfig()

      assert.equal(made.cmd['userConfig'].apiKey, 'dGVzdDpwYXNz')
      assert.equal(made.cmd['userConfig'].baseUrl, 'https://example.test')
      assert.ok(made.cmd['apiCore'] instanceof ApiCore)
    })

    it('falls back to createUserConfig on ENOENT (no config.json yet)', async () => {
      const made = await makeCommand()
      configDir = made.configDir

      await made.cmd.loadUserConfig()

      // Non-interactive test environment: createUserConfig() must skip prompts and just
      // initialize apiCore, without writing a config.json.
      assert.ok(made.cmd['apiCore'] instanceof ApiCore)
      assert.throws(() => readFileSync(join(configDir, 'config.json')))
    })

    it('rethrows non-ENOENT errors instead of silently creating a config', async () => {
      const made = await makeCommand()
      configDir = made.configDir
      // A directory named config.json makes readFile fail with EISDIR, not ENOENT.
      writeFileSync(join(configDir, 'config.json'), '')
      rmSync(join(configDir, 'config.json'))
      const { mkdirSync } = await import('node:fs')
      mkdirSync(join(configDir, 'config.json'))

      await assert.rejects(() => made.cmd.loadUserConfig())
    })
  })

  describe('createUserConfig', () => {
    it('skips prompts and initializes apiCore for the login command itself', async () => {
      const made = await makeCommand()
      configDir = made.configDir
      made.cmd.id = 'login'

      await made.cmd.createUserConfig()

      assert.ok(made.cmd['apiCore'] instanceof ApiCore)
      assert.throws(() => readFileSync(join(configDir, 'config.json')))
    })
  })

  describe('saveUserConfig', () => {
    it('creates the config directory if missing and writes userConfig as JSON', async () => {
      const made = await makeCommand()
      configDir = made.configDir
      rmSync(configDir, { recursive: true, force: true })
      made.cmd['userConfig'].apiKey = 'the-key'

      await made.cmd.saveUserConfig()

      const written = JSON.parse(readFileSync(join(configDir, 'config.json'), 'utf8'))
      assert.equal(written.apiKey, 'the-key')
    })
  })

  describe('initApiCore', () => {
    it('persists a new token to disk when apiCore emits tokenChanged', async () => {
      const made = await makeCommand()
      configDir = made.configDir
      made.cmd.initApiCore()

      // The tokenChanged listener calls saveUserConfig() fire-and-forget, so capture the
      // actual promise it returns instead of guessing how many ticks the write needs.
      const originalSave = made.cmd.saveUserConfig.bind(made.cmd)
      let savePromise: Promise<void> | undefined
      made.cmd.saveUserConfig = () => {
        savePromise = originalSave()
        return savePromise
      }

      const fakeToken = { accessToken: 'new-access-token', authType: 'anonymous', tokenExpires: Date.now() + 3_600_000 }
      made.cmd['apiCore'].emit('tokenChanged', fakeToken)
      await savePromise

      assert.equal(made.cmd['userConfig'].token?.accessToken, 'new-access-token')
      const written = JSON.parse(readFileSync(join(configDir, 'config.json'), 'utf8'))
      assert.equal(written.token.accessToken, 'new-access-token')
    })
  })

  describe('setApiKey / setBaseUrl', () => {
    it('update userConfig and re-create apiCore', async () => {
      const made = await makeCommand()
      configDir = made.configDir
      made.cmd.initApiCore()
      const firstApiCore = made.cmd['apiCore']

      made.cmd.setApiKey('brand-new-key')
      assert.equal(made.cmd['userConfig'].apiKey, 'brand-new-key')
      assert.notEqual(made.cmd['apiCore'], firstApiCore)

      const secondApiCore = made.cmd['apiCore']
      made.cmd.setBaseUrl('https://other.example')
      assert.equal(made.cmd['userConfig'].baseUrl, 'https://other.example')
      assert.notEqual(made.cmd['apiCore'], secondApiCore)
    })
  })

  describe('authenticate', () => {
    it('saves the new token when it differs from the current one', async () => {
      const made = await makeCommand()
      configDir = made.configDir
      const authenticateCalls: unknown[] = []
      made.cmd['apiCore'] = {
        token: undefined,
        async authenticate(credentials?: unknown) {
          authenticateCalls.push(credentials)
          ;(made.cmd['apiCore'] as { token: unknown }).token = { accessToken: 'fresh-token' }
        },
      } as unknown as ApiCore

      await made.cmd.authenticate('alice', 'hunter2')

      assert.deepEqual(authenticateCalls, [{ password: 'hunter2', username: 'alice' }])
      assert.equal(made.cmd['userConfig'].token?.accessToken, 'fresh-token')
      const written = JSON.parse(readFileSync(join(configDir, 'config.json'), 'utf8'))
      assert.equal(written.token.accessToken, 'fresh-token')
    })

    it('authenticates anonymously when no username/password is given', async () => {
      const made = await makeCommand()
      configDir = made.configDir
      made.cmd['userConfig'].token = { accessToken: 'unchanged' }
      const authenticateCalls: unknown[] = []
      made.cmd['apiCore'] = {
        token: { accessToken: 'unchanged' },
        async authenticate(credentials?: unknown) {
          authenticateCalls.push(credentials)
        },
      } as unknown as ApiCore

      await made.cmd.authenticate()

      assert.deepEqual(authenticateCalls, [undefined])
      // Token identical to the one already in userConfig: saveUserConfig must not run.
      assert.throws(() => readFileSync(join(configDir, 'config.json')))
    })
  })
})
