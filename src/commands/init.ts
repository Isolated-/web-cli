import {existsSync, readFileSync} from 'fs'
import {Index} from '@xgsd/artifact-sdk'
import chalk from 'chalk'
import ora, {Ora} from 'ora'
import {BaseCommand} from '../base.js'

export default class Init extends BaseCommand {
  static override args = {}
  static enableJsonFlag: boolean = true
  static override description = 'initialise artifact storage in your cwd'
  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run() {
    const {flags} = await this.parse(Init)
    await this.initClient(flags)

    const started = Date.now()

    let index: Index | null = null
    const spinner = ora(chalk.gray('loading index ...')).start()
    if (existsSync(this.indexPath)) {
      index = await this.loadIndex()
    } else {
      index = await this.loadRemoteIndex()
    }

    if (!index) {
      spinner.fail()
      this.error(chalk.red(`unable to obtain local or remote index`))
    }

    spinner.succeed()
    if (!flags.dry) {
      await index.save(this.indexPath)
    }

    this.done(flags.dry, started)
  }
}
