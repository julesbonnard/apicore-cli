import { Config } from '@oclif/core'
import { strict as assert } from 'node:assert'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('notifications subscriptions', () => {
  let config: Config

  before(async () => {
    config = await Config.load({ root })
  })

  it('list should be loadable', () => {
    const cmd = config.findCommand('notifications:subscriptions')
    assert.ok(cmd)
  })

  it('delete should be loadable', () => {
    const cmd = config.findCommand('notifications:subscriptions:delete')
    assert.ok(cmd)
  })

  it('delete should require serviceName and subscriptionIdentifier args', () => {
    const cmd = config.findCommand('notifications:subscriptions:delete')
    assert.ok(cmd)
    const args = cmd.args as Record<string, { required?: boolean }>
    assert.ok(args.serviceName)
    assert.equal(args.serviceName.required, true)
    assert.ok(args.subscriptionIdentifier)
    assert.equal(args.subscriptionIdentifier.required, true)
  })
})
