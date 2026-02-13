import { Config } from '@oclif/core'
import { strict as assert } from 'node:assert'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

describe('login', () => {
  let config: Config

  before(async () => {
    config = await Config.load({ root })
  })

  it('should be loadable', () => {
    const cmd = config.findCommand('login')
    assert.ok(cmd)
    assert.equal(cmd.id, 'login')
  })

  it('should have expected flags', () => {
    const cmd = config.findCommand('login')
    assert.ok(cmd)
    const flagNames = Object.keys(cmd.flags)
    assert.ok(flagNames.includes('apiKey'))
    assert.ok(flagNames.includes('baseUrl'))
    assert.ok(flagNames.includes('info'))
    assert.ok(flagNames.includes('username'))
    assert.ok(flagNames.includes('password'))
    assert.ok(flagNames.includes('json'))
  })
})
