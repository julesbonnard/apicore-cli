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
    await this.apiCore.notificationCenter.deleteSubscription(this.args.serviceName, this.args.subscriptionIdentifier)
    this.log(`Subscription ${this.args.subscriptionIdentifier} deleted`)

    await this.config.runCommand('notifications:subscriptions', [this.args.serviceName])
  }
}
