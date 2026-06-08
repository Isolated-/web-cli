import {Args, Command, Flags} from '@oclif/core'
import {Secret} from '../../util.js'
import keytar from 'keytar'

export default class SecretSet extends Command {
  static override args = {
    key: Args.string({
      required: true,
    }),

    value: Args.string({
      required: true,
    }),
  }

  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {}

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(SecretSet)
    const secret = new Secret(keytar)

    if (args.key.trim().length === 0 || args.value.trim().length === 0) {
      this.error('invalid key/value')
    }

    await secret.set(args.key, args.value)
    this.log(`"${args.key}" has been updated`)
  }
}
