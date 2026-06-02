import {Command, Flags} from '@oclif/core'
import {Artifact, ArtifactStorage} from '@xgsd/artifact-sdk'
import {existsSync, readdirSync, statSync} from 'fs'
import {mkdir, readFile, writeFile} from 'fs/promises'
import {dirname, join, relative, resolve} from 'path'
import {runPool} from '../util.js'
import {sha256File} from './fetch.js'

export default class Push extends Command {
  static override description = 'push local artifacts to remote'

  static override flags = {
    cwd: Flags.string({
      char: 'c',
      default: process.cwd(),
    }),

    dry: Flags.boolean({
      char: 'd',
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

  async loadLocalIndex(path: string) {
    return JSON.parse(await readFile(path, 'utf-8'))
  }

  async uploadArtifacts(cwd: string, pending: any[], dry?: boolean) {
    const successful = new Map<string, Artifact>()
    let completed = 0
    const started = Date.now()

    if (!pending.length) {
      this.log(`Nothing to upload ...`)
      return successful
    }

    console.log(cwd)

    await runPool(pending, async (item: any, workerId: any, position: any) => {
      const filePath = join(cwd, item.key)

      const sizeMb = ((item.size ?? 0) / 1024 / 1024).toFixed(2)
      this.log(`[worker ${workerId}] (${position}/${pending.length}) uploading ${item.key} (${sizeMb} MB)`)

      try {
        if (!dry) {
          await this.artifact.uploadFile(filePath, `crawldb:${item.key}`)
        }

        completed++

        successful.set(item.key, {
          ...item,
          remote: `crawldb:${item.key}`,
        })

        this.log(`[worker ${workerId}] ✓ ${item.key} (${completed}/${pending.length})`)
      } catch (err: any) {
        this.log(`[worker ${workerId}] ✗ ${item.key} - ${err?.message ?? 'error'}`)
      }
    })

    const duration = ((Date.now() - started) / 1000).toFixed(2)
    this.log(`Upload complete (${successful.size}/${pending.length}) in ${duration}s`)

    return successful
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Push)

    const cwd = resolve(flags.cwd)
    this.artifact = new ArtifactStorage(flags.signUrl, flags.signToken)

    const indexPath = join(cwd, 'artifacts.index.json')
    if (!existsSync(indexPath)) {
      this.error(`Index not found. Run init first.`)
    }

    const index = await this.loadLocalIndex(indexPath)
    const artifactDir = join(cwd, 'artifacts')

    const localFiles = readdirSync(artifactDir, {recursive: true})
      .map((p) => join(artifactDir, String(p)))
      .filter((p) => statSync(p).isFile())
      .map((p) => relative(cwd, p).replace(/\\/g, '/'))

    // --------------------------------------------------
    // BUILD PUSH LIST (INVERTED LOGIC)
    // --------------------------------------------------
    const pendingUpload = localFiles
      .map((key) => {
        const meta = index.artifacts?.[key]

        return {
          key,
          size: statSync(join(cwd, key)).size,
          checksum: sha256File(join(cwd, key)),
          meta,
        }
      })
      .filter((item) => {
        if (flags.category && item.meta?.category?.toLowerCase() !== flags.category.toLowerCase()) return false
        if (flags.kind && item.meta?.kind?.toLowerCase() !== flags.kind.toLowerCase()) return false
        if (flags.type && item.meta?.type?.toLowerCase() !== flags.type.toLowerCase()) return false

        if (item.checksum === item.meta?.checksum) return false

        return true
      })
      .slice(0, flags.limit ?? undefined)

    if (!pendingUpload.length) {
      this.log(`Nothing to push!`)
      return
    }

    const totalSize = pendingUpload.reduce((a, b) => a + (b.size ?? 0), 0) / 1024 / 1024

    this.log(`${pendingUpload.length} artifacts will be uploaded (${totalSize.toFixed(2)} MB)`)

    const successful = await this.uploadArtifacts(cwd, pendingUpload, flags.dry)

    // --------------------------------------------------
    // UPDATE INDEX AFTER SUCCESS
    // --------------------------------------------------

    for (const [key, item] of successful) {
      index.artifacts[key] = {
        ...index.artifacts?.[key],
        size: item.size,
        modified: new Date().toISOString(),
        kind: item?.kind ?? 'artifact',
        category: item?.category ?? 'unknown',
        type: item?.type ?? null,
      }
    }

    this.log(`Updating index ...`)
    if (!flags.dry) {
      await writeFile(indexPath, JSON.stringify(index, null, 2))
    }

    this.log(`Push complete!`)
  }
}
