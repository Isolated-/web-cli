import {Args, Command, Flags} from '@oclif/core'
import {Artifact, ArtifactStorage} from '@xgsd/artifact-sdk'
import {existsSync, readdirSync, readFileSync, statSync} from 'fs'
import {readFile, mkdir, writeFile} from 'fs/promises'
import {dirname, join, relative, resolve} from 'path'
import {runPool} from '../util.js'
import {createHash} from 'crypto'

export function sha256File(path: string) {
  const raw = readFileSync(path)

  return createHash('sha256').update(raw).digest('hex')
}

export default class Fetch extends Command {
  static override args = {}
  static override description = 'fetch latest remote artifacts'
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

    kind: Flags.string(),
    category: Flags.string(),
    type: Flags.string(),

    limit: Flags.integer({char: 'n'}),
  }

  artifact!: ArtifactStorage

  public async loadLocalIndex(path: string) {
    const content = await readFile(path, 'utf-8')
    return JSON.parse(content)
  }

  public async downloadArtifacts(cwd: string, pending: any[], dry?: boolean) {
    const successful = new Map<string, Artifact>()
    const started = Date.now()

    let completed = 0
    if (pending.length === 0) {
      this.log(`Nothing to download ...`)
      return
    }

    await runPool(pending, async (item: any, workerId: number, position: number) => {
      const output = join(cwd, item.key)

      if (dry !== true) {
        await mkdir(dirname(output), {recursive: true})
      }

      const action = dry === true ? 'will download' : 'downloading'

      const sizeMb = ((item.size ?? 0) / 1024 / 1024).toFixed(2)
      this.log(`[worker ${workerId}] (${position}/${pending.length}) ${action} ${item.key} (${sizeMb} MB)`)

      try {
        if (dry !== true) {
          await this.artifact.downloadFile(`crawldb:${item.key}`, output)
        }

        completed++
        successful.set(item.key, {
          ...item,
          checksum: dry !== true ? sha256File(output) : 'not calculated',
          path: relative(cwd, output),
        })

        this.log(`[worker ${workerId}] ✓ ${item.key} (${completed}/${pending.length})`)
      } catch (error: any) {
        this.log(`[worker ${workerId}] ✗ ${item.key} - ${error?.message ?? 'unknown error'}`)
      }
    })

    const duration = ((Date.now() - started) / 1000).toFixed(2)
    this.log(`Download complete (${successful.size}/${pending.length}) in ${duration}s`)

    return successful
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Fetch)

    const absoluteBasePath = resolve(flags.cwd)
    const artifact = new ArtifactStorage(flags.signUrl, flags.signToken)
    this.artifact = artifact

    const indexPath = join(absoluteBasePath, 'artifacts.index.json')

    if (!existsSync(indexPath)) {
      this.error(`Manifest not found, use "$ art init".`)
    }

    const index = artifact.toLocalIndex(absoluteBasePath, await this.loadLocalIndex(indexPath))

    const artifactPath = join(absoluteBasePath, 'artifacts')
    await mkdir(artifactPath, {recursive: true})

    const localFiles = new Set(
      readdirSync(artifactPath, {recursive: true})
        .map((p) => join(artifactPath, String(p)))
        .filter((p) => statSync(p).isFile())
        .map((p) => relative(absoluteBasePath, p).replace(/\\/g, '/')),
    )

    const pendingDownload = index
      .query((a, k) => {
        if (flags.category && a.category?.toLowerCase() !== flags.category?.toLowerCase()) return false
        if (flags.kind && a.kind?.toLowerCase() !== flags.kind?.toLowerCase()) return false
        if (flags.type && a.type?.toLowerCase() !== flags.type?.toLowerCase()) return false

        const artifactKey = k.replace(/\\/g, '/')
        return !localFiles.has(artifactKey)
      })
      .slice(0, flags.limit ?? undefined)

    if (pendingDownload.length === 0) {
      this.log(`Nothing to download!`)
      return
    }

    const downloadSize = Number(
      (pendingDownload.map((a) => a.size).reduce((p, c) => p + c + 0) / 1024 / 1024).toFixed(2),
    )

    this.log(`${pendingDownload.length} artifacts will be downloaded totalling ${downloadSize} MB.`)
    const successful = await this.downloadArtifacts(absoluteBasePath, pendingDownload, flags.dry)

    if (!successful || successful.size === 0) {
      this.error(`Something went wrong`)
    }

    for (const [key, artifact] of successful) {
      if (artifact) {
        index.set(key, artifact)
      }
    }

    this.log(`Updating manifest ...`)
    if (!flags.dry) {
      await index.save()
    }

    this.log(`Fetch complete!`)
  }
}
