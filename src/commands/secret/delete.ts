import {Args, Command, Flags} from '@oclif/core'
import {Secret} from '../../util.js'
import keytar from 'keytar'

export default class SecretDelete extends Command {
  static override args = {
    key: Args.string({
      required: true,
    }),
  }

  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {}

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(SecretDelete)
    const secret = new Secret(keytar)

    if (args.key.trim().length === 0) {
      this.error('invalid key/value')
    }

    if (!(await secret.get(args.key))) {
      this.error(`"${args.key}" does not exist`)
    }

    await secret.delete(args.key)
    this.log(`"${args.key}" has been deleted`)
  }
}
