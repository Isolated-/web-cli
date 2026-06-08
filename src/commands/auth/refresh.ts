import {Args, Command, Flags} from '@oclif/core'
import ora from 'ora'
import {password} from '@inquirer/prompts'
import {BaseCommand} from '../../base.js'
import chalk from 'chalk'
import keytar from 'keytar'
import axios from 'axios'
import ms from 'ms'
import {Secret} from '../../util.js'
import {AuthService} from '../../auth-util.js'
import {UserConfig} from '../../config.js'
import {join} from 'node:path'

type RefreshCredentials = {
  clientId: string
  clientSecret: string
  refreshToken: string
  authDomain: string
  audience?: string
  scopes?: string[]
}

async function loginWithRefreshToken(credentials: RefreshCredentials) {
  const res = await axios({
    url: `https://${credentials.authDomain}/oauth/token`,
    method: 'POST',
    timeout: 5000,
    data: {
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: 'refresh_token',
      scope: (credentials.scopes ?? []).map((s) => s.toLowerCase().trim()).join(','),
      audience: credentials.audience,
    },
  })

  if (res.status >= 400) {
    throw new Error(res.data)
  }

  return {accessToken: res.data.access_token, expiresIn: res.data.expires_in * 1000}
}

export default class AuthRefresh extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    output: Flags.boolean({
      char: 'o',
      description: 'output the obtained access token',
    }),

    silent: Flags.boolean({
      char: 's',
      description: 'only return the access token (suppress logs)',
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AuthRefresh)

    const configPath = join(this.config.configDir)
    if (!UserConfig.exists(configPath)) {
      this.error('config not initialised')
    }

    const config = UserConfig.fromPath(join(this.config.configDir, '.config.json'))!
    const auth = new AuthService(config)

    try {
      const {accessToken, expiresAt} = await auth.loginRefreshToken({
        returnType: flags.output ? 'accessToken' : 'minimal',
      })
      const expiresIn = new Date(expiresAt).getTime() - Date.now()

      if (!flags.silent) this.log(`logged in as ${config.get('username')} (valid for ${ms(expiresIn)})`)

      if (accessToken) {
        this.log(accessToken)
      }
    } catch (error) {
      this.error(`couldn't refresh access, try "web auth login"`)
    }
  }
}
