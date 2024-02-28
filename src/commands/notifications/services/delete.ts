import { Args } from '@oclif/core'

import { BaseCommand } from '../../../base-command.js'

export default class DeleteService extends BaseCommand<typeof DeleteService> {
  static args = {
    serviceName: Args.string()
  }

  static description = 'Delete notifications service'

  async run(): Promise<void> {
    const { args } = await this.parse(DeleteService)

    if (args.serviceName) {
      await this.apiCore.notificationCenter.deleteService(args.serviceName)
      this.log(`Service ${args.serviceName} deleted`)
    }

    await this.config.runCommand('notifications:services')
  }
}
