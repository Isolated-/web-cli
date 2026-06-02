import {Args, Command, Flags} from '@oclif/core'
import {Artifact, ArtifactStorage} from '@xgsd/artifact-sdk'
import {existsSync, readdirSync, statSync} from 'fs'
import {readFile, mkdir, writeFile} from 'fs/promises'
import {dirname, join, relative, resolve} from 'path'
import {runPool} from '../util.js'

export default class Fetch extends Command {
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

    cwd: Flags.string({
      char: 'c',
      description: 'current working directory',
      default: process.cwd(),
    }),

    dry: Flags.boolean({
      char: 'd',
      description: 'view what changes will be made',
      default: false,
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

  public async loadManifest(path: string) {
    const content = await readFile(path, 'utf-8')
    const manifest = JSON.parse(content)
    const cwd = dirname(path)

    manifest.artifacts = await Promise.all(
      manifest.artifacts.map(async (a: Artifact) => {
        const path = existsSync(join(cwd, a.key)) ? a.key : null

        return {
          key: a.key,
          path,
        }
      }),
    )

    return manifest
  }

  public async downloadArtifacts(cwd: string, pending: any[], dry?: boolean) {
    let completed = 0
    const started = Date.now()

    if (pending.length === 0) {
      this.log(`Nothing to download ...`)
      return
    }

    await runPool(pending, async (item: any, workerId: number, position: number) => {
      const output = join(cwd, item.key)

      await mkdir(dirname(output), {recursive: true})

      this.log(`[worker ${workerId}] (${position}/${pending.length}) downloading ${item.key}`)

      try {
        if (dry !== true) {
          await this.artifact.downloadFile(`crawldb:${item.key}`, output)
        }

        item.path = relative(cwd, output)
        console.log(item.path)
        completed++

        this.log(`[worker ${workerId}] ✓ ${item.key} (${completed}/${pending.length})`)
      } catch (error: any) {
        this.log(`[worker ${workerId}] ✗ ${item.key} - ${error?.message ?? 'unknown error'}`)
      }
    })

    const duration = ((Date.now() - started) / 1000).toFixed(2)
    this.log(`Download complete (${completed}/${pending.length}) in ${duration}s`)
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Fetch)

    const absoluteBasePath = resolve(flags.cwd)
    const artifact = new ArtifactStorage(flags.signUrl, flags.signToken)
    this.artifact = artifact

    const manifestPath = join(absoluteBasePath, 'artifact.manifest.json')

    if (!existsSync(manifestPath)) {
      this.error(`Manifest not found, use "$ art init".`)
    }

    const artifactPath = join(absoluteBasePath, 'artifacts')
    await mkdir(artifactPath, {recursive: true})

    const manifest = await this.loadManifest(manifestPath)
    const localFiles = new Set(
      readdirSync(artifactPath, {recursive: true})
        .map((p: any) => join(artifactPath, p))
        .filter((p: any) => statSync(p).isFile())
        .map((p) => relative(flags.cwd, p)),
    )

    const pendingDownload = manifest.artifacts.filter((a: any) => a.key && !localFiles.has(a.key))
    if (pendingDownload.length === 0) {
      this.log(`Nothing to download`)
      return
    }

    this.log(`${pendingDownload.length} artifacts will be downloaded`)

    await this.downloadArtifacts(flags.cwd, pendingDownload, flags.dry)

    manifest.artifacts = manifest.artifacts.filter(Boolean)
    manifest.total = manifest.artifacts.length

    this.log(`Updating manifest ...`)
    if (!flags.dry) {
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    }

    this.log(`Fetch complete!`)
  }
}
