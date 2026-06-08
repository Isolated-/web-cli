import {Args, Command, Flags} from '@oclif/core'
import {join} from 'node:path'
import {UserConfig} from '../../config.js'
import chalk from 'chalk'
import {success} from '../../util.js'

export default class ConfigSet extends Command {
  static override args = {
    key: Args.string({
      description: 'config key path (e.g. auth.domain or username)',
      required: true,
    }),
    value: Args.string({
      description: 'value to set (string, JSON, or primitive)',
      required: true,
    }),
  }

  static override description = 'set a config value (supports dot paths)'

  static override flags = {
    force: Flags.boolean({char: 'f'}),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(ConfigSet)

    const configPath = join(this.config.configDir, '.config.json')

    const config = UserConfig.exists(configPath) ? UserConfig.fromPath(configPath)! : UserConfig.new()

    // ---- value parsing (important) ----
    let parsedValue: any = args.value

    // try JSON first (so "true", "123", "{...}" work)
    try {
      parsedValue = JSON.parse(args.value)
    } catch {
      // keep as string
    }

    config.set(args.key, parsedValue)

    await config.save(configPath)

    this.log(success(`${args.key} ${args.value}`, 'SET'))
  }
}
