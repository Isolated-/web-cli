import {Args, Command, Flags} from '@oclif/core'
import {ArtifactStorage, Artifact} from '@xgsd/artifact-sdk'
import {existsSync, readdirSync, statSync} from 'node:fs'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {dirname, join, relative, resolve} from 'node:path'
import {runPool} from '../util.js'

export default class Push extends Command {
  static override args = {}
  static override description = 'push local artifacts to remote'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)

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

    manifest.artifacts = manifest.artifacts.map((a: Artifact) => {
      const path = existsSync(join(cwd, a.key)) ? a.key : null

      return {
        key: a.key,
        path,
      }
    })

    return manifest
  }

  public async uploadArtifacts(cwd: string, uploads: any[], dry?: boolean) {
    let completed = 0
    const started = Date.now()

    if (uploads.length === 0) {
      this.log(`Nothing to upload...`)
      return
    }

    await runPool(uploads, async (item: {key: string; path: string}, workerId: number, position: number) => {
      this.log(`[worker ${workerId}] (${position}/${uploads.length}) uploading ${item.path}`)

      if (item.key) {
        return
      }

      item.key = item.path
      const remoteKey = `crawldb:${item.key}`

      try {
        if (dry !== true) {
          await this.artifact.uploadFile(item.path, remoteKey)
        }

        completed++

        this.log(`[worker ${workerId}] ✓ ${item.key} (${completed}/${uploads.length})`)
      } catch (error: any) {
        this.log(`[worker ${workerId}] ✗ ${item.key} - ${error?.message ?? 'unknown error'}`)
      }
    })

    const duration = ((Date.now() - started) / 1000).toFixed(2)
    this.log(`Upload complete (${completed}/${uploads.length}) in ${duration}s`)
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Push)

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

    const artifactPaths = new Set(manifest.artifacts.map((a: any) => a.path).filter(Boolean))
    const pendingUpload = [...localFiles]
      .filter((path) => !artifactPaths.has(path))
      .map((path) => ({
        key: null,
        path,
      }))

    if (pendingUpload.length === 0) {
      this.log(`Nothing to upload`)
      return
    }

    this.log(`${pendingUpload.length} artifacts will be uploaded`)
    await this.uploadArtifacts(join(flags.cwd, 'artifacts'), pendingUpload, flags.dry)

    manifest.artifacts = [...manifest.artifacts, ...pendingUpload].filter(Boolean)
    manifest.total = manifest.artifacts.length

    this.log(`Updating manifest ...`)
    if (!flags.dry) {
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    }

    this.log(`Push complete!`)
  }
}
