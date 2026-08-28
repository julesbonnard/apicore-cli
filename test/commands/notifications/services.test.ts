import { strict as assert } from 'node:assert'
import { runCliCommand } from '../../helpers/run-command.js'

describe('notifications services', () => {
  describe('list', () => {
    it('renders the services table', async () => {
      const { error, stdout } = await runCliCommand('src/commands/notifications/services/index.js', [], {
        apiCore: {
          notificationCenter: {
            async listServices() {
              return [{ serviceName: 'my-service', serviceType: 'mail', createdDate: '2026-01-01', lastRegisteredDate: '2026-01-02', shared: false, serviceDatas: '{}' }]
            },
          },
        },
      })
      assert.equal(error, undefined)
      assert.ok(stdout.includes('my-service'), stdout)
      assert.ok(stdout.includes('mail'), stdout)
    })
  })

  describe('delete', () => {
    it('deletes the named service and re-lists services', async () => {
      const deleteCalls: unknown[] = []
      const { error, runCommandCalls, stdout } = await runCliCommand(
        'src/commands/notifications/services/delete.js',
        ['my-service'],
        {
          apiCore: {
            notificationCenter: {
              async deleteService(name: string) { deleteCalls.push(name) },
            },
          },
        }
      )
      assert.equal(error, undefined)
      assert.deepEqual(deleteCalls, ['my-service'])
      assert.ok(stdout.includes('Service my-service deleted'), stdout)
      assert.deepEqual(runCommandCalls, [{ argv: undefined, id: 'notifications:services' }])
    })
  })

  describe('create', () => {
    it('errors when --datas is not valid JSON', async () => {
      const { error } = await runCliCommand(
        'src/commands/notifications/services/create.js',
        ['my-service', '--type', 'mail', '--datas', 'not-json'],
        { apiCore: {} }
      )
      assert.ok(error?.message.includes('--datas must be a valid JSON object'), error?.message)
    })

    it('errors when --datas does not match the schema for --type', async () => {
      const { error } = await runCliCommand(
        'src/commands/notifications/services/create.js',
        ['my-service', '--type', 'mail', '--datas', '{}'],
        { apiCore: {} }
      )
      assert.ok(error?.message.includes('Invalid --datas for service type mail'), error?.message)
      assert.ok(error?.message.includes('address'), error?.message)
    })

    it('registers the service with the parsed datas and re-lists services', async () => {
      const registerCalls: unknown[] = []
      const { error, runCommandCalls, stdout } = await runCliCommand(
        'src/commands/notifications/services/create.js',
        ['my-service', '--type', 'mail', '--datas', '{"address":"user@example.com"}'],
        {
          apiCore: {
            notificationCenter: {
              async registerService(params: unknown) {
                registerCalls.push(params)
                return 'service-identifier-123'
              },
            },
          },
        }
      )
      assert.equal(error, undefined)
      assert.deepEqual(registerCalls, [{ datas: { address: 'user@example.com' }, name: 'my-service', type: 'mail' }])
      assert.ok(stdout.includes('Service my-service created (service-identifier-123)'), stdout)
      assert.deepEqual(runCommandCalls, [{ argv: undefined, id: 'notifications:services' }])
    })
  })
})
