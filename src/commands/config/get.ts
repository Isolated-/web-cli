import {Args, Command, Flags} from '@oclif/core'
import {join} from 'node:path'
import {UserConfig} from '../../config.js'

export default class ConfigGet extends Command {
  static override args = {
    key: Args.string({
      description: 'the key to obtain (e.g. username)',
    }),
  }
  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run() {
    const {args, flags} = await this.parse(ConfigGet)

    const configPath = join(this.config.configDir, '.config.json')
    if (!UserConfig.exists(configPath)) {
      this.error(`config not initialised - use "web config init"`)
    }

    const config = UserConfig.fromPath(configPath)!

    if (args.key) {
      // do something
      if (!config.exists(args.key)) {
        this.error(`"${args.key}" does not exist, use "web config set"`)
      }

      const content = config.get<any>(args.key)!
      if (typeof content === 'object') {
        this.logJson(content)
      } else {
        this.log(content)
      }

      return
    }

    // otherwise full content
    this.logJson(config.content)

    return config.content
  }
}
