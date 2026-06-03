import {Args, Command, Flags} from '@oclif/core'
import chalk from 'chalk'
import {BaseCommand} from '../base.js'
import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {mkdir} from 'node:fs/promises'

export default class Fetch extends BaseCommand {
  static override args = {}
  static override description = 'fetch latest remote artifacts'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    ...BaseCommand.flags,

    kind: Flags.string(),
    category: Flags.string(),
    type: Flags.string(),

    limit: Flags.integer({char: 'n'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Fetch)
    await this.initClient(flags)

    if (!existsSync(join(this.cwd, 'artifacts')) && !flags.dry) {
      await mkdir(join(this.cwd, 'artifacts'))
    }

    const started = Date.now()
    const index = await this.loadIndex()
    const localFiles = this.localFiles()

    const pendingDownload = index
      .query((a, k) => {
        if (flags.category && a.category?.toLowerCase() !== flags.category?.toLowerCase()) return false
        if (flags.kind && a.kind?.toLowerCase() !== flags.kind?.toLowerCase()) return false
        if (flags.type && a.type?.toLowerCase() !== flags.type?.toLowerCase()) return false

        const artifactKey = k.replace(/\\/g, '/')
        return !localFiles.includes(artifactKey)
      })
      .map((a) => {
        const {key, ...meta} = a
        return [key, meta]
      })
      .slice(0, flags.limit ?? undefined)

    if (!pendingDownload.length) {
      this.log(chalk.green(`up to date!`))
      return
    }

    const successful = await this.transferArtifacts({
      type: 'download',
      artifacts: Object.fromEntries(pendingDownload),
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
