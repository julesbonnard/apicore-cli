import { strict as assert } from 'node:assert'
import { runCliCommand } from '../helpers/run-command.js'

describe('logout', () => {
  it('removes config.json and confirms when logged in', async () => {
    // rm() is real (not mocked): "Logged out successfully." only logs if the isolated
    // config.json was actually deleted — the ENOENT branch below logs a different message.
    const { error, stdout } = await runCliCommand('src/commands/logout/index.js', [], {
      userConfig: { apiKey: 'some-key' },
    })
    assert.equal(error, undefined)
    assert.ok(stdout.includes('Logged out successfully.'), stdout)
  })

  it('reports "Not logged in." when there is nothing to remove (ENOENT)', async () => {
    const { error, stdout } = await runCliCommand('src/commands/logout/index.js', [], {
      seedConfigFile: false,
    })
    assert.equal(error, undefined)
    assert.ok(stdout.includes('Not logged in.'), stdout)
  })
})
