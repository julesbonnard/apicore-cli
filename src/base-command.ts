import { Command, Flags, Interfaces } from '@oclif/core'
import ora from 'ora';
import { ApiCore, type AuthToken } from 'afpnews-api'
import { existsSync, mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

type UserConfig = {
  apiKey?: string
  baseUrl?: string
  token?: AuthToken
}

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<typeof BaseCommand['baseFlags'] & T['flags']>
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>

export abstract class BaseCommand<T extends typeof Command> extends Command {
  static baseFlags = {
    profile: Flags.string({ description: 'Define a custom profile to save auth config' })
  }

  protected apiCore: ApiCore = new ApiCore()
  
  protected args!: Args<T>
  protected flags!: Flags<T>
  
  protected userConfig: UserConfig = {
    apiKey: undefined,
    baseUrl: undefined,
    token: undefined
  }

  public async authenticate(username?: string, password?: string): Promise<void> {
    const spinner = ora('Authenticate').start();
    await (username && password ? this.apiCore.authenticate({ password, username }) : this.apiCore.authenticate())
    if (this.apiCore.token?.accessToken !== this.userConfig.token?.accessToken) {
      this.userConfig.token = this.apiCore.token
      await this.saveUserConfig()
    }

    spinner.stop()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async catch(err: Error & {exitCode?: number}): Promise<any> {
    return super.catch(err)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async finally(_: Error | undefined): Promise<any> {
    return super.finally(_)
  }

  public async init(): Promise<void> {
    await super.init()
    const { args, flags } = await this.parse({
      args: this.ctor.args,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      enableJsonFlag: this.ctor.enableJsonFlag,
      flags: this.ctor.flags,
      strict: this.ctor.strict
    })

    this.flags = flags as Flags<T>
    this.args = args as Args<T>

    if (flags.profile) {
      this.config.configDir = join(this.config.configDir, flags.profile)
      console.log('Using profile', flags.profile)
    }
    
    await this.loadUserConfig()
  }

  public initApiCore(): void {
    this.apiCore = new ApiCore({ apiKey: this.userConfig.apiKey, baseUrl: this.userConfig.baseUrl })
    this.apiCore.token = this.userConfig.token
    this.apiCore.on('tokenChanged', token => {
      this.userConfig.token = token
      this.saveUserConfig()
    })
  }

  public async loadUserConfig(): Promise<void> {
    try {
      const configFile = await readFile(join(this.config.configDir, 'config.json'))
      Object.assign(this.userConfig, JSON.parse(configFile.toString()))
      this.initApiCore()
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'ENOENT') {
        this.warn('No config file found, using defaults')
      } else {
        throw error
      }
    }
  }
  
  public async saveUserConfig(): Promise<void> {
    if (!existsSync(this.config.configDir)){
      mkdirSync(this.config.configDir, { recursive: true });
    }

    await writeFile(join(this.config.configDir, 'config.json'), JSON.stringify(this.userConfig))
  }

  public setApiKey(apiKey: string): void {
    this.userConfig.apiKey = apiKey
    this.initApiCore()
  }

  public setBaseUrl(baseUrl: string): void {
    this.userConfig.baseUrl = baseUrl
    this.initApiCore()
  }
}