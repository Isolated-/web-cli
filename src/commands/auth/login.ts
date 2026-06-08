import {input, password, password as sensitive} from '@inquirer/prompts'
import {Args, Command, Flags} from '@oclif/core'
import axios from 'axios'
import keytar from 'keytar'
import {Secret} from '../../util.js'
import chalk from 'chalk'
import ora from 'ora'
import {UserConfig} from '../../config.js'
import {join} from 'node:path'
import {AuthService} from '../../auth-util.js'
import ms from 'ms'

export default class AuthLogin extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),

    password: Flags.string({
      char: 'p',
      env: 'XGSD_AUTH_PASSWORD',
      description: 'useful if needing to log in without interactive prompts',
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AuthLogin)

    const configPath = join(this.config.configDir, '.config.json')

    if (!UserConfig.exists(configPath)) {
      this.error('config not initialised, use "web config init"')
    }

    const config = UserConfig.fromPath(configPath)!
    const password = flags.password ?? (await sensitive({message: 'password:'}))
    const auth = new AuthService(config)

    try {
      const {expiresAt} = await auth.loginUsernamePassword(password)
      const expiresIn = new Date(expiresAt).getTime() - Date.now()

      this.log(`logged in as ${config.get('username')} (valid for ${ms(expiresIn)})`)
    } catch (error: any) {
      if (error.message.startsWith('invalid')) {
        this.error(error.message)
      }

      if (error.message.startsWith('http')) {
        this.error(`couldn't log you in, status: ${error.message}`)
      }

      console.log(error)

      this.error('something went wrong, try again later.')
    }
  }
}
