import {Args, Command, Flags} from '@oclif/core'
import {BaseCommand} from '../../base.js'
import {ArtifactRegistryUploadClient, ArtifactResolver} from '@xgsd/registry-sdk'
import {AuthService} from '../../auth-util.js'
import ora from 'ora'
import chalk from 'chalk'
import {join, relative} from 'node:path'
import {cp, mkdir, rm} from 'node:fs/promises'
import {confirm} from '@inquirer/prompts'
import axios from 'axios'
import {createWriteStream} from 'node:fs'
import {pipeline} from 'node:stream/promises'
import * as tar from 'tar'

export default class ArtifactsDownload extends BaseCommand {
  static override args = {
    name: Args.string({required: true}),
  }
  static override description = 'download an artifact'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    ...BaseCommand.flags,
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ArtifactsDownload)
    await this.initClient(flags)

    if (!this.userConfig.exists('registry')) {
      this.error(`"registry" not configured, use "web config set registry {url}"`)
    }

    const [name, version] = args.name.split('@')
    if (!name || !version) {
      this.error(`name must be in ${name}@${version} form.`)
    }

    const spinner = ora()
    spinner.start(chalk.gray(`[1/4] finding artifact`))

    const auth = new AuthService(this.userConfig)

    const registry = new ArtifactRegistryUploadClient({
      url: this.userConfig.get('registry')!,
      accessToken: (await auth.getAccessToken()).accessToken,
    })

    const {ok, reason, data} = await registry.resolve(args.name)
    if (!ok) {
      // improve this later
      this.error(`can't obtain version data - ${reason}`)
    }

    const versionData: any = data
    const fullName = `${versionData.name}@${versionData.version}`
    const inputsDir = join(this.cwd, '.web', 'inputs')
    const buildDir = join(this.cwd, '.web', 'downloads', name, version)
    const filename = `${versionData.name}-${versionData.version}.tgz`
    const buildFilePath = join(buildDir, filename)

    spinner.succeed(chalk.gray(`[1/4] found ${fullName} (sha256:${versionData.sha256})`))

    if (!(await confirm({message: chalk.reset('download?')}))) {
      return
    }

    await mkdir(inputsDir, {recursive: true})
    await mkdir(buildDir, {recursive: true})

    spinner.start(chalk.gray(`[2/4] downloading ${fullName}`))

    // get download url
    try {
      const {ok, reason, data} = await registry.download(versionData.name, versionData.version)
      if (!ok || !data) {
        this.error(`failed to obtain download link - ${reason}`)
      }

      async function download(url: string, outputPath: string) {
        const response = await axios({
          url,
          method: 'GET',
          responseType: 'stream',
          timeout: 1000 * 60 * 60, // 1 hour
          maxRedirects: 5,
        })

        await pipeline(response.data, createWriteStream(outputPath))
      }

      await download(data.url, buildFilePath)
    } catch (error: any) {
      this.error(`failed to download ${error.message ?? 'unknown error'}`)
    }

    spinner.succeed(chalk.gray(`[2/4] downloaded ${fullName}`))

    spinner.start(chalk.gray(`[3/4] unpacking ${fullName}`))

    await tar.extract({
      file: buildFilePath,
      cwd: buildDir,
    })

    //  await rm(buildFilePath)

    spinner.succeed(chalk.gray(`[3/4] unpacked ${fullName}`))

    spinner.start(chalk.gray(`[4/4] moving files`))

    await mkdir(join(inputsDir, versionData.name, versionData.version), {recursive: true})
    await cp(buildDir, join(inputsDir, versionData.name, versionData.version), {recursive: true})

    await rm(buildDir, {recursive: true})

    spinner.succeed(chalk.gray(`[4/4] moved ${fullName} to ${relative(this.cwd, inputsDir)}`))
    this.log(chalk.green(`+ ${fullName}`))
  }
}
