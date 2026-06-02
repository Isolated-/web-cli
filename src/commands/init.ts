import {Args, Command, Flags} from '@oclif/core'
import {existsSync, readFileSync} from 'fs'
import {mkdir, readFile, rm, writeFile} from 'fs/promises'
import {dirname, join, relative, resolve} from 'path'
import {Artifact, ArtifactManifest, ArtifactStorage} from '@xgsd/artifact-sdk'

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

  public async loadManifest(path: string) {
    const content = await readFile(path, 'utf-8')
    return JSON.parse(content)
  }

  protected async buildManifest(artifact: ArtifactStorage, manifestPath: string) {
    this.log(`Downloading remote manifest ...`)

    const remote = (await artifact.downloadManifest()) as any
    const manifest = {
      version: remote.version,
      previous: remote.previous,
      generatedAt: remote.generatedAt,
      total: remote.total,
      cwd: dirname(manifestPath),
      artifacts: remote.artifacts.map((a: Artifact) => {
        const path = existsSync(join(this.config.dataDir, a.key)) ? a.key : null

        return {
          key: a.key,
          path,
        }
      }),
    }

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2))

    return manifest
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Init)

    const absoluteBasePath = resolve(flags.cwd)
    const artifact = new ArtifactStorage(flags.signUrl, flags.signToken)

    const manifestPath = join(absoluteBasePath, 'artifact.manifest.json')

    if (flags.force && existsSync(manifestPath)) {
      await rm(manifestPath)
    }

    let manifest: ArtifactManifest
    let downloaded = false
    if (!existsSync(manifestPath) || flags.remote) {
      try {
        manifest = await this.buildManifest(artifact, manifestPath)
        downloaded = true
      } catch {
        this.error(`Cannot download latest manifest`)
      }
    } else {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as ArtifactManifest
    }

    manifest.generatedAt = new Date().toISOString()
    manifest.artifacts = manifest.artifacts.map((a) => ({
      key: a.key,
      path: existsSync(join(flags.cwd, a.key)) ? a.key : null,
    }))

    if (downloaded) {
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    }

    const hasChanges = manifest.artifacts.some((a: any) => !a.path && !existsSync(join(flags.cwd, a.key)))

    if (hasChanges) {
      this.log(`There are artifacts waiting to be downloaded, use \"$ art fetch\".`)
    }

    this.log(`Initialisation complete.`)
  }
}
