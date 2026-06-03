import {Flags} from '@oclif/core'
import {statSync} from 'fs'
import {join} from 'path'
import chalk from 'chalk'
import {BaseCommand, sha256File} from '../base.js'
import {parseKey} from '@xgsd/artifact-sdk'

export default class Push extends BaseCommand {
  static override description = 'push local artifacts to remote'

  static override flags = {
    ...BaseCommand.flags,

    kind: Flags.string(),
    category: Flags.string(),
    type: Flags.string(),

    limit: Flags.integer({char: 'n'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Push)
    await this.initClient(flags)

    const started = Date.now()

    const index = await this.loadIndex()
    const localFiles = this.localFiles()

    const pendingUpload = localFiles
      .map((key) => {
        const parsed = parseKey(key)
        const meta = index.get(key)

        const header: any = {
          key,
          size: statSync(join(this.cwd, key)).size,
          checksum: sha256File(join(this.cwd, key)),
        }

        if (!meta) {
          return {
            ...header,
            checksum: null,
            meta: {
              kind: parsed.kind,
              category: parsed.category,
              modified: new Date(statSync(join(this.cwd, key)).mtimeMs).toISOString(),
              size: header.size,
              type: parsed.type,
              path: key,
              checksum: header.checksum,
            },
          }
        }

        return {
          key,
          size: statSync(join(this.cwd, key)).size,
          checksum: sha256File(join(this.cwd, key)),
          meta,
        }
      })
      .filter((item) => {
        if (!item) return false
        if (flags.category && item.meta?.category?.toLowerCase() !== flags.category.toLowerCase()) return false
        if (flags.kind && item.meta?.kind?.toLowerCase() !== flags.kind.toLowerCase()) return false
        if (flags.type && item.meta?.type?.toLowerCase() !== flags.type.toLowerCase()) return false

        if (item.checksum === item.meta?.checksum) return false

        return true
      })
      .slice(0, flags.limit ?? undefined) as any[]

    if (!pendingUpload.length) {
      this.log(chalk.green(`up to date!`))
      return
    }

    const successful = await this.transferArtifacts({
      type: 'upload',
      artifacts: Object.fromEntries(pendingUpload.map((a) => [a.key, a.meta])),
      dryRun: flags.dry,
      simple: flags.simple,
    })

    for (const [key, artifact] of successful) {
      index.set(key, artifact)
    }

    if (!flags.dry) {
      await index.save(this.indexPath)
    }

    this.done(flags.dry, started)
  }
}
