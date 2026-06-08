import {Args, Command, Flags} from '@oclif/core'
import {UserConfig} from '../../config.js'
import {join} from 'path'
import {AuthService} from '../../auth-util.js'
import {checkbox, select} from '@inquirer/prompts'
import chalk from 'chalk'
import ms from 'ms'

export default class AuthTokens extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    action: Flags.string({
      char: 'a',
      options: ['view', 'revoke'],
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AuthTokens)

    const configPath = join(this.config.configDir, '.config.json')

    if (!UserConfig.exists(configPath)) {
      this.error('config not initialised, use "web config init"')
    }

    const config = UserConfig.fromPath(configPath)!

    if (!config.exists('auth.identityUrl')) {
      this.error(`auth.identityUrl is unset, use "web config set auth.identityUrl {value}"`)
    }

    const auth = new AuthService(config)
    const http = await auth.createHttpClient()

    const baseUrl = config.get<string>('auth.identityUrl')

    const url = `${baseUrl}/tokens?page=1&limit=20&status=active`

    // make this error safe
    const res = await http.get(url)
    const {data} = res
    const tokens = data.data

    if (tokens.length === 0) {
      this.log('no active tokens')
      return
    }

    const choices = (await checkbox({
      message: 'select a token',
      choices: tokens.map((token: any) => `${token.tokenId} (${token.name})`),
      required: true,
    })) as string[]

    const tokenIds = choices.map((str: string) => str.split(' ')[0])
    const action =
      flags.action ??
      (await select({
        message: 'select a action',
        choices: ['view', 'revoke'],
      }))

    if (tokenIds.length === 0) {
      this.log(`no token selected!`)
      return
    }

    const results = await Promise.all(
      tokenIds.map(async (t) => {
        const fn = action === 'view' ? http.get : http.post
        const url = action === 'view' ? `${baseUrl}/tokens/${t}` : `${baseUrl}/tokens/revoke/${t}`

        try {
          const result = await fn(url)

          return result.data
        } catch (error: any) {
          this.error(`could not ${action} ${t} - ${error.message}`)
        }
      }),
    )

    for (const result of results) {
      const now = Date.now()
      const expiresIn = new Date(result.expiresAt).getTime() - now

      if (action === 'view') {
        this.log(`${chalk.blue(`INFO`)} ${result.tokenId} (${result.type}) valid for ${ms(expiresIn)}`)
      }

      if (action === 'revoke') {
        this.log(`${chalk.red('REVOKE')} ${result.tokenId}`)
      }
    }
  }
}
