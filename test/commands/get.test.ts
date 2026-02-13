import { Config } from '@oclif/core'
import { strict as assert } from 'node:assert'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

describe('get', () => {
  let config: Config

  before(async () => {
    config = await Config.load({ root })
  })

  it('should be loadable', () => {
    const cmd = config.findCommand('get')
    assert.ok(cmd)
    assert.equal(cmd.id, 'get')
  })

  it('should require an id arg', () => {
    const cmd = config.findCommand('get')
    assert.ok(cmd)
    const args = cmd.args as Record<string, { required?: boolean }>
    assert.ok(args.id)
    assert.equal(args.id.required, true)
  })
})
