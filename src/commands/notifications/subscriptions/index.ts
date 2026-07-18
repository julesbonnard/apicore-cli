import { Args } from '@oclif/core'
import { table } from '../../../components/table.js'

import { BaseCommand } from '../../../base-command.js'

export default class ListSubscriptions extends BaseCommand<typeof ListSubscriptions> {
  static args = {
    serviceName: Args.string({
      description: 'Name of the service to list subscriptions for',
      hidden: false,
      name: 'service-name',
      required: false
    })
  }

  static description = 'List notifications subscriptions'

  async run(): Promise<void> {
    const subscriptions = await (this.args.serviceName ? this.apiCore.notificationCenter.subscriptionsInService(this.args.serviceName) : this.apiCore.notificationCenter.listSubscriptions());

    table(subscriptions, {
      name: {
        header: 'Subscription Name'
      },
      identifier: {
        header: 'Subscription Identifier'
      }
    }, {
      printLine: this.log.bind(this)
    })
  }
}
