import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command.js'

export default class DeleteSubscription extends BaseCommand<typeof DeleteSubscription> {
  static args = {
    serviceName: Args.string({
      description: 'Name of the service to delete the subscription from',
      hidden: false,
      name: 'service-name',
      required: true
    }),
    subscriptionIdentifier: Args.string({
      description: 'Identifier of the subscription to delete',
      hidden: false,
      name: 'subscription-identifier',
      required: true
    })
  }

  static description = 'Delete notifications subscription'

  async run(): Promise<void> {
    const { args } = await this.parse(DeleteSubscription)

    if (args.serviceName && args.subscriptionIdentifier) {
      await this.apiCore.notificationCenter.deleteSubscription(args.serviceName, args.subscriptionIdentifier)
      this.log(`Subscription ${args.subscriptionIdentifier} deleted`)
    }

    await this.config.runCommand('notifications:subscriptions', [args.serviceName])
  }
}
