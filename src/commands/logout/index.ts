import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import { BaseCommand } from '../../base-command.js'

export default class Logout extends BaseCommand<typeof Logout> {
  static description = 'Remove stored authentication credentials'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --profile myprofile'
  ]

  async run(): Promise<void> {
    const configPath = join(this.config.configDir, 'config.json')

    try {
      await rm(configPath)
      this.log('Logged out successfully.')
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'ENOENT') {
        this.log('Not logged in.')
      } else {
        throw error
      }
    }
  }
}
