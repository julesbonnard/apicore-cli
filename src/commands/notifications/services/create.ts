import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command.js'
import { ServiceDataSchemaByType, type ServiceType } from '../../../schemas/notification.js'

export default class CreateService extends BaseCommand<typeof CreateService> {
  static args = {
    name: Args.string({
      description: 'Name of the service to create',
      required: true
    })
  }

  static description = 'Register a new notification service (mail, rest, sqs or jms)'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-service --type mail --datas \'{"address":"user@example.com"}\'',
    '<%= config.bin %> <%= command.id %> my-service --type rest --datas \'{"href":"https://example.com/hook","user":"u","password":"p"}\'',
    '<%= config.bin %> <%= command.id %> my-service --type sqs --datas \'{"accessKey":"...","secretKey":"...","region":"eu-west-1","queue":"...","ownerId":"..."}\'',
    '<%= config.bin %> <%= command.id %> my-service --type jms --datas \'{"url":"...","type":"...","queueName":"...","username":"...","password":"...","ttlInSeconds":"...","qosEnabled":"...","deliveryMode":"..."}\''
  ]

  static flags = {
    datas: Flags.string({
      description: 'JSON object with the service connection parameters (shape depends on --type)',
      required: true
    }),
    type: Flags.string({
      description: 'Type of the service',
      options: Object.keys(ServiceDataSchemaByType),
      required: true
    })
  }

  async run(): Promise<void> {
    let rawDatas: unknown
    try {
      rawDatas = JSON.parse(this.flags.datas)
    } catch {
      this.error('--datas must be a valid JSON object', { exit: 1 })
    }

    const type = this.flags.type as ServiceType
    const parsed = ServiceDataSchemaByType[type].safeParse(rawDatas)
    if (!parsed.success) {
      const details = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      this.error(`Invalid --datas for service type ${type}: ${details}`, { exit: 1 })
    }

    const identifier = await this.apiCore.notificationCenter.registerService({
      datas: parsed.data,
      name: this.args.name,
      type
    })

    this.log(`Service ${this.args.name} created (${identifier})`)

    await this.config.runCommand('notifications:services')
  }
}
