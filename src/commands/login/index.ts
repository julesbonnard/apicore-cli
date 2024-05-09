import { Flags, ux } from '@oclif/core'
import { AuthToken, defaultBaseUrl } from 'afpnews-api'

import { BaseCommand } from '../../base-command.js'

/**
 * Get number of hours and minutes from a number of milliseconds
 * @param milliseconds - The number of milliseconds to convert
 * @returns An object with the number of hours and minutes
 */
function timeConvert(milliseconds: number) {
  const dateInMinutes = milliseconds / 1000 / 60
  const hours = (dateInMinutes / 60)
  const rhours = Math.floor(hours)
  const minutes = (hours - rhours) * 60
  const rminutes = Math.round(minutes)
  return { hours: rhours, minutes: rminutes }
}

export default class Login extends BaseCommand<typeof Login> {
  static description = 'Get a token for the API'
  public static enableJsonFlag = true

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --info',
    '<%= config.bin %> <%= command.id %> --json'
  ]

  static flags = {
    apiKey: Flags.string({char: 'a', description: 'Your API Key', required: false}),
    baseUrl: Flags.string({char: 'u', default: defaultBaseUrl, description: 'The API base url', required: false }),
    info: Flags.boolean({char: 'i', default: false, description: 'Just check if you\'re authenticated', required: false }),
    username: Flags.string({description: 'Your username (not recommended, prefer interactive prompt)', required: false}),
    password: Flags.string({description: 'Your password (not recommended, prefer interactive prompt)', required: false})
  }

  public getClientId(): string {
    if (!this.userConfig.token) throw new Error('No token found')
    if (this.userConfig.token.authType === 'anonymous') return 'anonymous'
    if (!this.userConfig.apiKey) throw new Error('No apiKey found')
    return Buffer.from(this.userConfig.apiKey, 'base64').toString('utf8').split(':')[0]
  }

  public logAuthInfo(): void {
    if (!this.userConfig.token) throw new Error('No token found')
    if (this.jsonEnabled()) {
      this.log(JSON.stringify(this.userConfig.token, null, 2))
      return
    }
    
    const diffTime = timeConvert(this.userConfig.token.tokenExpires - Date.now())
    this.log(`You're authenticated as ${this.getClientId()} for ${diffTime.hours} hours and ${diffTime.minutes} minutes.`)
  }

  async run(): Promise<AuthToken | undefined> {
    const { flags } = await this.parse(Login)

    if (flags.info) {
      if (this.userConfig.token && this.userConfig.token.tokenExpires <= Date.now()) {
        this.log('Your token is expired.')
        const refresh = await ux.confirm('Do you want to refresh it?')
        if (refresh) {
          try {
            await this.authenticate()
          } catch {
            this.error('Error refreshing token. Please login again', { exit: 1 })
          }
        } else {
          this.error('You need to login again', { exit: 1 })
        }
      }
      
      this.logAuthInfo()
      return this.apiCore.token
    }

    if (flags.apiKey) {
      this.setApiKey(flags.apiKey)
    }

    if (flags.baseUrl) {
      this.setBaseUrl(flags.baseUrl)
    }

    if (this.userConfig.apiKey) {
      const username = flags.username || await ux.prompt('Type your username')
      const password = flags.password || await ux.prompt('Type your password', {type: 'hide'})

      await this.authenticate(username, password)
    }

    this.logAuthInfo()
    return this.apiCore.token
  }
}
