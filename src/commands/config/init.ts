import {input} from '@inquirer/prompts'
import {Args, Command, Flags} from '@oclif/core'
import chalk from 'chalk'
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'

type ConfigType = {
  app: string
  username?: string
  auth?: {
    domain?: string
    clientId?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

class Config {
  static new(partial?: Partial<ConfigType>): Config {
    return new Config({
      ...partial,
      app: partial?.app ?? 'web-cli',
      username: partial?.username,
      auth: {
        domain: partial?.auth?.domain,
        clientId: partial?.auth?.clientId,
      },
    })
  }

  static fromPath(path: string): Config | null {
    if (!existsSync(path)) {
      throw new Error(`"${path}" does not exist`)
    }

    const content = readFileSync(path, 'utf-8')

    try {
      return new Config(JSON.parse(content))
    } catch {
      throw new Error('cannot parse config/invalid data')
    }
  }

  private constructor(private _content: ConfigType) {}

  async save(path: string) {
    mkdirSync(dirname(path), {recursive: true})
    writeFileSync(path, JSON.stringify(this._content, null, 2))
  }

  get content() {
    return this._content
  }

  clone() {
    return structuredClone(this._content)
  }

  get<T = unknown>(key: string): T | null {
    return this._content[key] as T
  }

  set<T = unknown>(key: string, data: T): void {
    this._content[key] = data
  }
}

export default class ConfigInit extends Command {
  static override args = {}
  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    force: Flags.boolean({char: 'f', default: false}),
    username: Flags.string({
      char: 'u',
      env: 'XGSD_USERNAME',
    }),

    domain: Flags.string({
      char: 'd',
      env: 'XGSD_AUTH_DOMAIN',
    }),

    clientId: Flags.string({
      char: 'c',
      env: 'XGSD_CLIENT_ID',
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ConfigInit)

    let config: Config | null
    try {
      config = Config.fromPath(join(this.config.configDir, '.config.json'))
    } catch {
      config = Config.new()
    }

    const content = config?.content
    if (content?.username && content?.auth?.domain && content.auth?.clientId && !flags.force) {
      this.log('up to date')
      return
    }

    if (!config) {
      this.error('something went wrong, please try again.')
    }

    const username =
      flags.username ??
      (await input({
        message: 'username:',
      }))

    const domain = flags.domain ?? (await input({message: 'domain:'}))
    const clientId = flags.clientId ?? (await input({message: 'clientId:'}))

    await Promise.all([config.set('username', username), config.set('auth', {domain, clientId})])

    await config.save(join(this.config.configDir, '.config.json'))
    this.log('initialised!')
  }
}
