import { Config } from '@oclif/core'
import { strict as assert } from 'node:assert'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('notifications services', () => {
  let config: Config

  before(async () => {
    config = await Config.load({ root })
  })

  it('list should be loadable', () => {
    const cmd = config.findCommand('notifications:services')
    assert.ok(cmd)
  })

  it('delete should be loadable', () => {
    const cmd = config.findCommand('notifications:services:delete')
    assert.ok(cmd)
  })

  it('delete should require serviceName arg', () => {
    const cmd = config.findCommand('notifications:services:delete')
    assert.ok(cmd)
    const args = cmd.args as Record<string, { required?: boolean }>
    assert.ok(args.serviceName)
    assert.equal(args.serviceName.required, true)
  })

  it('create should be loadable', () => {
    const cmd = config.findCommand('notifications:services:create')
    assert.ok(cmd)
  })

  it('create should require name arg and type/datas flags', () => {
    const cmd = config.findCommand('notifications:services:create')
    assert.ok(cmd)
    const args = cmd.args as Record<string, { required?: boolean }>
    assert.ok(args.name)
    assert.equal(args.name.required, true)
    const flagNames = Object.keys(cmd.flags)
    assert.ok(flagNames.includes('type'))
    assert.ok(flagNames.includes('datas'))
  })
})
