import { captureOutput } from '@oclif/test'
import { strict as assert } from 'node:assert'
import { rmSync } from 'node:fs'
import type { AuthToken } from 'afpnews-api'
import Login from '../../src/commands/login/index.js'
import { loadIsolatedConfig, runCliCommand } from '../helpers/run-command.js'

const APIKEY_B64 = Buffer.from('client123:secretpass').toString('base64')

async function makeLogin(argv: string[] = []): Promise<{ cmd: Login; configDir: string }> {
  const { config, configDir } = await loadIsolatedConfig()
  return { cmd: new Login(argv, config), configDir }
}

describe('login', () => {
  describe('run — full flow', () => {
    it('authenticates with apiKey + username/password and prints the client id', async () => {
      const authCalls: unknown[] = []
      const { error, stdout } = await runCliCommand(
        'src/commands/login/index.js',
        ['--apiKey', APIKEY_B64, '--username', 'alice', '--password', 'hunter2'],
        {
          apiCore: {
            token: undefined,
            async authenticate(this: { token: unknown }, credentials: unknown) {
              authCalls.push(credentials)
              this.token = { accessToken: 'tok', authType: 'apikey', tokenExpires: Date.now() + 2 * 3_600_000 }
            },
          },
        }
      )

      assert.equal(error, undefined)
      assert.deepEqual(authCalls, [{ password: 'hunter2', username: 'alice' }])
      assert.ok(stdout.includes("authenticated as client123"), stdout)
    })

    it('authenticates using an apiKey already present in config.json, without the --apiKey flag', async () => {
      const authCalls: unknown[] = []
      const { error, stdout } = await runCliCommand(
        'src/commands/login/index.js',
        ['--username', 'alice', '--password', 'hunter2'],
        {
          userConfig: { apiKey: APIKEY_B64 },
          apiCore: {
            token: undefined,
            async authenticate(this: { token: unknown }, credentials: unknown) {
              authCalls.push(credentials)
              this.token = { accessToken: 'tok', authType: 'apikey', tokenExpires: Date.now() + 3_600_000 }
            },
          },
        }
      )

      assert.equal(error, undefined)
      assert.equal(authCalls.length, 1)
      assert.ok(stdout.includes('client123'), stdout)
    })

    it('does not call authenticate() when no apiKey is configured (anonymous, no --info)', async () => {
      const authCalls: unknown[] = []
      const { error } = await runCliCommand('src/commands/login/index.js', [], {
        apiCore: { async authenticate() { authCalls.push('called') } },
      })

      assert.equal(authCalls.length, 0)
      // logAuthInfo() then throws: no token was ever set.
      assert.ok(error?.message.includes('No token found'), error?.message)
    })

    it('--json returns the token as the command result', async () => {
      const { error, result } = await runCliCommand(
        'src/commands/login/index.js',
        ['--apiKey', APIKEY_B64, '--username', 'alice', '--password', 'hunter2', '--json'],
        {
          apiCore: {
            token: undefined,
            async authenticate(this: { token: unknown }) {
              this.token = { accessToken: 'tok', authType: 'apikey', tokenExpires: Date.now() + 3_600_000 }
            },
          },
        }
      )
      assert.equal(error, undefined)
      assert.equal((result as AuthToken).accessToken, 'tok')
    })
  })

  describe('run — --info', () => {
    it('prints remaining validity for a non-expired token', async () => {
      const token = { accessToken: 'tok', authType: 'anonymous', tokenExpires: Date.now() + 3_600_000 }
      const { error, stdout } = await runCliCommand('src/commands/login/index.js', ['--info'], {
        userConfig: { token },
        apiCore: { token },
      })
      assert.equal(error, undefined)
      assert.ok(stdout.includes('authenticated as anonymous'), stdout)
    })

    it('errors when there is no token at all', async () => {
      const { error } = await runCliCommand('src/commands/login/index.js', ['--info'], {
        apiCore: {},
      })
      assert.ok(error?.message.includes('No token found'), error?.message)
    })
  })

  describe('getClientId (unit)', () => {
    let configDir: string

    afterEach(() => {
      if (configDir) rmSync(configDir, { recursive: true, force: true })
    })

    it('throws when there is no token', async () => {
      const made = await makeLogin()
      configDir = made.configDir
      assert.throws(() => made.cmd.getClientId(), /No token found/)
    })

    it("returns 'anonymous' for an anonymous token", async () => {
      const made = await makeLogin()
      configDir = made.configDir
      made.cmd['userConfig'].token = { accessToken: 'x', authType: 'anonymous', tokenExpires: Date.now() + 1000 }
      assert.equal(made.cmd.getClientId(), 'anonymous')
    })

    it('throws when the token is apikey-based but no apiKey is configured', async () => {
      const made = await makeLogin()
      configDir = made.configDir
      made.cmd['userConfig'].token = { accessToken: 'x', authType: 'apikey', tokenExpires: Date.now() + 1000 }
      assert.throws(() => made.cmd.getClientId(), /No apiKey found/)
    })

    it('decodes the client id from a base64 apiKey (user:pass)', async () => {
      const made = await makeLogin()
      configDir = made.configDir
      made.cmd['userConfig'].token = { accessToken: 'x', authType: 'apikey', tokenExpires: Date.now() + 1000 }
      made.cmd['userConfig'].apiKey = APIKEY_B64
      assert.equal(made.cmd.getClientId(), 'client123')
    })
  })

  describe('logAuthInfo (unit) — timeConvert formatting', () => {
    let configDir: string

    afterEach(() => {
      if (configDir) rmSync(configDir, { recursive: true, force: true })
    })

    it('formats hours and minutes remaining until expiry', async () => {
      const made = await makeLogin()
      configDir = made.configDir
      made.cmd['userConfig'].token = {
        accessToken: 'x',
        authType: 'anonymous',
        tokenExpires: Date.now() + (2 * 60 + 15) * 60_000, // 2h15m from now
      }

      const { stdout } = await captureOutput(async () => made.cmd.logAuthInfo())
      assert.ok(stdout.includes('for 2 hours and 15 minutes'), stdout)
    })

    it('is a no-op under --json (handled by the return value instead)', async () => {
      const made = await makeLogin(['--json'])
      configDir = made.configDir
      made.cmd['userConfig'].token = { accessToken: 'x', authType: 'anonymous', tokenExpires: Date.now() + 60_000 }

      const { stdout } = await captureOutput(async () => made.cmd.logAuthInfo())
      assert.equal(stdout, '')
    })
  })
})
