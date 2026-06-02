import {Args, Command, Flags} from '@oclif/core'
import {ArtifactStorage} from '@xgsd/artifact-sdk'
import {readFile} from 'node:fs/promises'

export default class Build extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 're-build remote manifest/index (do not use often)'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),

    signUrl: Flags.string({
      char: 'u',
      env: 'SIGN_URL',
      required: true,
    }),

    signToken: Flags.string({
      char: 't',
      env: 'SIGN_API_TOKEN',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Build)
  }
}
