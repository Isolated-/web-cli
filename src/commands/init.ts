import {Args, Command, Flags} from '@oclif/core'
import {existsSync, readFileSync} from 'fs'
import {mkdir, readFile, rm, writeFile} from 'fs/promises'
import {dirname, join, relative, resolve} from 'path'
import {Artifact, ArtifactIndex, ArtifactStorage} from '@xgsd/artifact-sdk'

export default class Init extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'initialise artifact storage in your cwd'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),

    cwd: Flags.string({
      char: 'c',
      description: 'current working directory',
      default: process.cwd(),
    }),

    remote: Flags.boolean({
      char: 'r',
      description: 'when true, the remote manifest will always be obtained',
    }),

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

  artifact!: ArtifactStorage

  public async loadLocalIndex(path: string) {
    const content = await readFile(path, 'utf-8')
    return JSON.parse(content)
  }

  async getRemoteIndex() {
    try {
      return await this.artifact.getIndex()
    } catch {
      return null
    }
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Init)

    const absoluteBasePath = resolve(flags.cwd)
    const indexPath = join(absoluteBasePath, 'artifacts.index.json')

    this.artifact = new ArtifactStorage(flags.signUrl, flags.signToken)

    let index: ArtifactIndex | null = null
    if (existsSync(indexPath)) {
      index = await this.loadLocalIndex(indexPath)
    } else {
      index = await this.getRemoteIndex()
    }

    if (!index) {
      this.error(`unable to obtain local or remote index`)
    }

    const local = this.artifact.toLocalIndex(absoluteBasePath, index)
    if (!existsSync(indexPath)) {
      await local.save()
    }

    let total = 0
    const pending = local
      .query((a) => !a.path || !existsSync(a.path))
      .map((a) => {
        total++
        return a.size
      })
      .reduce((p, c) => 0 + p + c)

    if (pending > 0) {
      this.log(`You have ${total} downloads pending (${(pending / 1024 / 1024).toFixed(2)} MB)`)
    }

    await local.save()
    this.log('Everything complete!')
  }
}
