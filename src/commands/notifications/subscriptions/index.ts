import { Args, ux } from '@oclif/core'

import { BaseCommand } from '../../../base-command.js'

export default class listSubscriptions extends BaseCommand<typeof listSubscriptions> {
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
    const { args } = await this.parse(listSubscriptions)

    let subscriptions = []
    subscriptions = await (args.serviceName ? this.apiCore.notificationCenter.subscriptionsInService(args.serviceName) : this.apiCore.notificationCenter.listSubscriptions());

    /* eslint-disable perfectionist/sort-objects */
    ux.table(subscriptions, {
      name: {
        header: 'Subscription Name'
      },
      identifier: {
        header: 'Subscription Identifier'
      }
    }, {
      printLine: this.log.bind(this)
    })
    /* eslint-enable perfectionist/sort-objects */
  }
}
