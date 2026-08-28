import { strict as assert } from 'node:assert'
import { runCliCommand } from '../../helpers/run-command.js'

describe('notifications subscriptions', () => {
  describe('list', () => {
    it('lists all subscriptions when no service name is given', async () => {
      const calls: string[] = []
      const { error, stdout } = await runCliCommand('src/commands/notifications/subscriptions/index.js', [], {
        apiCore: {
          notificationCenter: {
            async listSubscriptions() {
              calls.push('listSubscriptions')
              return [{ name: 'sub-1', identifier: 'id-1' }]
            },
            async subscriptionsInService() { calls.push('subscriptionsInService') },
          },
        },
      })
      assert.equal(error, undefined)
      assert.deepEqual(calls, ['listSubscriptions'])
      assert.ok(stdout.includes('sub-1'), stdout)
    })

    it('lists only subscriptions of the given service', async () => {
      const calls: unknown[] = []
      const { error } = await runCliCommand('src/commands/notifications/subscriptions/index.js', ['my-service'], {
        apiCore: {
          notificationCenter: {
            async listSubscriptions() { calls.push(['listSubscriptions']) },
            async subscriptionsInService(name: string) { calls.push(['subscriptionsInService', name]); return [] },
          },
        },
      })
      assert.equal(error, undefined)
      assert.deepEqual(calls, [['subscriptionsInService', 'my-service']])
    })
  })

  describe('delete', () => {
    it('deletes the subscription and re-lists subscriptions for the service', async () => {
      const deleteCalls: unknown[] = []
      const { error, runCommandCalls, stdout } = await runCliCommand(
        'src/commands/notifications/subscriptions/delete.js',
        ['my-service', 'sub-identifier'],
        {
          apiCore: {
            notificationCenter: {
              async deleteSubscription(serviceName: string, subscriptionIdentifier: string) {
                deleteCalls.push([serviceName, subscriptionIdentifier])
              },
            },
          },
        }
      )
      assert.equal(error, undefined)
      assert.deepEqual(deleteCalls, [['my-service', 'sub-identifier']])
      assert.ok(stdout.includes('Subscription sub-identifier deleted'), stdout)
      assert.deepEqual(runCommandCalls, [{ argv: ['my-service'], id: 'notifications:subscriptions' }])
    })
  })

  describe('create', () => {
    it('splits --langs and --products and re-lists subscriptions for the service', async () => {
      const addCalls: unknown[] = []
      const { error, runCommandCalls, stdout } = await runCliCommand(
        'src/commands/notifications/subscriptions/create.js',
        ['my-service', 'my-subscription', 'france', '--langs', 'fr,es', '--products', 'news,photo'],
        {
          apiCore: {
            notificationCenter: {
              async addSubscription(subscriptionName: string, serviceName: string, params: unknown) {
                addCalls.push([subscriptionName, serviceName, params])
                return 'sub-identifier-123'
              },
            },
          },
        }
      )
      assert.equal(error, undefined)
      assert.deepEqual(addCalls, [[
        'my-subscription',
        'my-service',
        { langs: ['fr', 'es'], product: ['news', 'photo'], query: 'france' },
      ]])
      assert.ok(stdout.includes('Subscription my-subscription created on service my-service (sub-identifier-123)'), stdout)
      assert.deepEqual(runCommandCalls, [{ argv: ['my-service'], id: 'notifications:subscriptions' }])
    })

    it('omits langs/products/query when the corresponding flags are absent', async () => {
      const addCalls: unknown[] = []
      await runCliCommand('src/commands/notifications/subscriptions/create.js', ['my-service', 'my-subscription'], {
        apiCore: {
          notificationCenter: {
            async addSubscription(subscriptionName: string, serviceName: string, params: unknown) {
              addCalls.push(params)
            },
          },
        },
      })
      assert.deepEqual(addCalls, [{ langs: undefined, product: undefined, query: undefined }])
    })
  })
})
