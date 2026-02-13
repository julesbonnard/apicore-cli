import { Config } from '@oclif/core'
import { strict as assert } from 'node:assert'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

describe('search', () => {
  let config: Config

  before(async () => {
    config = await Config.load({ root })
  })

  it('should be loadable', () => {
    const cmd = config.findCommand('search')
    assert.ok(cmd)
    assert.equal(cmd.id, 'search')
  })

  it('should have expected flags', () => {
    const cmd = config.findCommand('search')
    assert.ok(cmd)
    const flagNames = Object.keys(cmd.flags)
    assert.ok(flagNames.includes('fields'))
    assert.ok(flagNames.includes('from'))
    assert.ok(flagNames.includes('to'))
    assert.ok(flagNames.includes('langs'))
    assert.ok(flagNames.includes('size'))
    assert.ok(flagNames.includes('json'))
  })
})
