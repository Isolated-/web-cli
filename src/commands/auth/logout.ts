import {Args, Command, Flags} from '@oclif/core'
import {AuthService} from '../../auth-util.js'
import axios from 'axios'
import {Secret} from '../../util.js'
import {UserConfig} from '../../config.js'
import {join} from 'node:path'
import keytar from 'keytar'

export default class AuthLogout extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AuthLogout)

    const configPath = join(this.config.configDir)

    if (!UserConfig.exists(configPath)) {
      this.error('config not initialised, use "web config init"')
    }

    const auth = new AuthService(UserConfig.fromPath(join(this.config.configDir, '.config.json'))!)

    try {
      await auth.logout()
      this.log('you have been logged out')
    } catch (error: any) {
      if (error.message) {
        this.log(`already logged out`)
        return
      }

      this.error('failed to logout, try again later.')
    }
  }
}
