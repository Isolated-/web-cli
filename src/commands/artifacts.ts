import {Args, Command, Flags} from '@oclif/core'
import {BaseCommand} from '../base.js'
import {AuthService} from '../auth-util.js'
import Table from 'cli-table3'
import chalk from 'chalk'
import {checkbox, confirm} from '@inquirer/prompts'
import prettyBytes from 'pretty-bytes'
import ora from 'ora'

export default class Artifacts extends BaseCommand {
  static enableJsonFlag: boolean = true
  static override args = {
    name: Args.string({required: true}),
  }
  static override description = 'obtain information about an artifact'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    ...BaseCommand.flags,
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse()
    await this.initClient(flags)

    const auth = new AuthService(this.userConfig)
    const http = await auth.createHttpClient()

    if (!this.userConfig.exists('registry')) {
      this.error(`"registry" not configured, use "web config set registry {url}"`)
    }

    const spinner = ora()
    if (!flags.silent) spinner.start(chalk.gray('contacting registry'))

    const res = await http.get(`${this.userConfig.get('registry')!}/${args.name}`, {
      validateStatus: () => true,
    })

    if (!flags.silent) spinner.stop()

    if (res.status === 401 || res.status === 403) {
      this.error(`you are not authenticated, use "web auth login"`)
    }

    if (res.status === 404) {
      this.error(`"${args.name}" not found`)
    }

    if (res.status >= 400) {
      this.error(`failed to obtain version info`)
    }

    const [name, version] = args.name.split('@')
    const key = chalk.bold

    let versionData: any = res.data
    if (!version) {
      const table = new Table()
      table.push({Name: key(res.data.name)})
      table.push({Description: key(res.data.description)})
      table.push({'Latest version': key(res.data.latestVersion)})
      table.push({Versions: key(res.data.versions.length)})

      this.log(table.toString())

      const versions = res.data.versions

      if (flags.silent && flags.json) {
        return versions
      }

      const selectedVersion = (
        await checkbox({
          message: chalk.reset('select version'),
          choices: versions.map((i: any) => `${i.version}`),
        })
      ).pop() as any

      versionData = versions.find((r: any) => {
        return r.version === selectedVersion
      })

      if (!versionData) {
        return
      }
    }

    const table = new Table()

    table.push({Comment: key(versionData.comment ?? 'none')})
    table.push({Version: key(versionData.version)})
    table.push({Status: key(versionData.status)})
    table.push({Inputs: key(versionData.inputs.join(',') ?? 'none')})
    table.push({Tags: key(versionData.tags.join(',') ?? 'none')})
    table.push({Size: key(prettyBytes(versionData.size ?? 0))})
    table.push({SHA256: key(versionData.sha256)})

    this.log(table.toString())

    if (flags.silent) {
      return versionData
    }

    // download
    if (!(await confirm({message: chalk.reset('download?')}))) {
      return
    }

    spinner.start(chalk.gray(`downloading ${name}@${version}`))

    await new Promise((resolve) => setTimeout(resolve, 5000))

    spinner.stop()
  }
}
