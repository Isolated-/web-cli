import {Args, Command} from '@oclif/core'
import {join} from 'node:path'
import {UserConfig} from '../../config.js'
import chalk from 'chalk'
import {error, success} from '../../util.js'

export default class ConfigUnset extends Command {
  static override args = {
    key: Args.string({
      description: 'config key path to remove (e.g. auth.domain)',
      required: true,
    }),
  }

  static override description = 'remove a config value (supports dot paths)'

  public async run(): Promise<void> {
    const {args} = await this.parse(ConfigUnset)

    const configPath = join(this.config.configDir, '.config.json')

    const config = UserConfig.exists(configPath) ? UserConfig.fromPath(configPath)! : UserConfig.new()

    config.unset(args.key)

    await config.save(configPath)

    this.log(error(`${args.key}`, 'UNSET'))
  }
}
