import {Args, Command, Flags} from '@oclif/core'
import {ArtifactStorage} from '@xgsd/artifact-sdk'
import chalk from 'chalk'
import {existsSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import {join, resolve} from 'node:path'
import ora from 'ora'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'
import {BaseCommand} from '../base.js'

export default class Pull extends BaseCommand {
  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    ...BaseCommand.flags,

    kind: Flags.string(),
    category: Flags.string(),
    type: Flags.string(),

    limit: Flags.integer({char: 'n'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Pull)
    await this.initClient(flags)

    const started = Date.now()

    const loading = ora(chalk.gray('loading indexes ...'))

    const index = await this.loadIndex()

    const remote = await this.loadRemoteIndex()
    loading.succeed(chalk.gray('loaded local and remote indexes'))

    const diff = index.diff(remote)
    const stats = {
      added: Object.keys(diff.added).length,
      removed: Object.keys(diff.removed).length,
      changed: Object.keys(diff.changed).length,
    }

    if (stats.added === 0 && stats.removed === 0 && stats.changed === 0) {
      this.log(chalk.green(`up to date!`))
      return
    }

    for (const [key, entry] of Object.entries(diff.added)) {
      this.log(chalk.green(`+ ${key} (${prettyBytes(entry.size)})`))
      index.set(key, entry)
    }

    for (const [key, entry] of Object.entries(diff.removed)) {
      this.log(chalk.red(`- ${key} (${prettyBytes(entry.size)})`))
      index.delete(key)
    }

    for (const [key, change] of Object.entries(diff.changed)) {
      this.log(chalk.blue(`~ ${key}`))
      index.set(key, change.remote)
    }

    if (!flags.dry) {
      await index.save(this.indexPath)
    }

    this.log(chalk.green(`${stats.added} added, ${stats.removed} removed, ${stats.changed} changed`))
    this.done(flags.dry, started)
  }
}
