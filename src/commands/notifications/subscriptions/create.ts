import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../../base-command.js'

export default class CreateSubscription extends BaseCommand<typeof CreateSubscription> {
  static args = {
    serviceName: Args.string({
      description: 'Name of the service to attach the subscription to',
      required: true
    }),
    subscriptionName: Args.string({
      description: 'Name to give to the new subscription',
      required: true
    }),
    query: Args.string({
      description: 'Search query to subscribe to',
      required: false
    })
  }

  static description = 'Add a subscription to an existing notification service'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-service my-subscription "france" -l fr,es',
    '<%= config.bin %> <%= command.id %> my-service my-subscription --products news,photo'
  ]

  static flags = {
    langs: Flags.string({char: 'l', description: 'Langs separated by commas, like fr,es', required: false}),
    products: Flags.string({char: 'p', description: 'Products separated by commas, like news,photo', required: false})
  }

  async run(): Promise<void> {
    const identifier = await this.apiCore.notificationCenter.addSubscription(
      this.args.subscriptionName,
      this.args.serviceName,
      {
        langs: this.flags.langs?.split(','),
        product: this.flags.products?.split(','),
        query: this.args.query
      }
    )

    this.log(`Subscription ${this.args.subscriptionName} created on service ${this.args.serviceName} (${identifier})`)

    await this.config.runCommand('notifications:subscriptions', [this.args.serviceName])
  }
}
