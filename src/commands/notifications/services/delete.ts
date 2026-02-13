import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command.js'

export default class DeleteService extends BaseCommand<typeof DeleteService> {
  static args = {
    serviceName: Args.string({
      description: 'Name of the service to delete',
      required: true
    })
  }

  static description = 'Delete notifications service'

  async run(): Promise<void> {
    await this.apiCore.notificationCenter.deleteService(this.args.serviceName)
    this.log(`Service ${this.args.serviceName} deleted`)

    await this.config.runCommand('notifications:services')
  }
}
