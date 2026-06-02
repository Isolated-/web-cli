import {Args, Command, Flags} from '@oclif/core'
import {ArtifactStorage} from '@xgsd/artifact-sdk'

export default class Build extends Command {
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

    const artifact = new ArtifactStorage(flags.signUrl, flags.signToken)
    this.log(`Rebuilding remote manifest ...`)

    const manifest = await artifact.publishManifest()
    this.log(`Finished, version: ${manifest.version}, artifacts: ${manifest.artifacts.length}.`)
  }
}
