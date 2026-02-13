import { Config } from '@oclif/core'
import { strict as assert } from 'node:assert'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

describe('logout', () => {
  let config: Config

  before(async () => {
    config = await Config.load({ root })
  })

  it('should be loadable', () => {
    const cmd = config.findCommand('logout')
    assert.ok(cmd)
    assert.equal(cmd.id, 'logout')
  })
})
